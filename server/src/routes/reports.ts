import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { Settings } from '../entities/Settings';
import { Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { auth } from '../middleware/auth';
import { startOfDay, endOfDay, isWeekend, differenceInHours, format, parseISO } from 'date-fns';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

const router = Router();

interface Holiday {
    date: string;
    name: string;
}

// Helper function to check if a date is a holiday
const isHoliday = (date: Date, holidays: Holiday[] = []) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return holidays.some(holiday => holiday.date === dateStr);
};

// Helper function to calculate hours based on settings
const calculateHours = async (entries: TimeEntry[], settings: Settings) => {
    const workStart = parseISO(`2000-01-01T${settings.workDayStartTime}`);
    const workEnd = parseISO(`2000-01-01T${settings.workDayEndTime}`);
    const standardHours = differenceInHours(workEnd, workStart);

    let regularHours = 0;
    let overtimeHours = 0;
    let weekendHours = 0;
    let holidayHours = 0;

    for (const entry of entries) {
        const clockIn = new Date(entry.clockIn);
        const clockOut = entry.clockOut ? new Date(entry.clockOut) : new Date();
        const totalHours = differenceInHours(clockOut, clockIn);

        if (isWeekend(clockIn)) {
            weekendHours += totalHours;
        } else if (settings.holidays && isHoliday(clockIn, settings.holidays)) {
            holidayHours += totalHours;
        } else {
            if (totalHours > standardHours) {
                regularHours += standardHours;
                overtimeHours += (totalHours - standardHours);
            } else {
                regularHours += totalHours;
            }
        }
    }

    return {
        regularHours,
        overtimeHours,
        weekendHours,
        holidayHours,
        totalHours: regularHours + overtimeHours + weekendHours + holidayHours
    };
};

// Generate Report
router.post('/', auth, async (req: Request, res: Response) => {
    try {
        const { startDate, endDate, shopId, employeeId, reportType } = req.body;
        const settings = await AppDataSource.getRepository(Settings).findOne({ where: { id: 1 } });

        if (!settings) {
            throw new Error('System settings not found');
        }

        // Build query
        const queryBuilder = AppDataSource
            .getRepository(TimeEntry)
            .createQueryBuilder('timeEntry')
            .leftJoinAndSelect('timeEntry.employee', 'employee')
            .where('timeEntry.clockIn BETWEEN :startDate AND :endDate', {
                startDate: startOfDay(new Date(startDate)),
                endDate: endOfDay(new Date(endDate))
            });

        if (shopId) {
            queryBuilder.andWhere('employee.shopId = :shopId', { shopId });
        }

        if (employeeId) {
            queryBuilder.andWhere('employee.id = :employeeId', { employeeId });
        }

        const entries = await queryBuilder.getMany();

        // Group entries by employee
        const employeeEntries = entries.reduce((acc, entry) => {
            const empId = entry.employee.id;
            if (!acc[empId]) {
                acc[empId] = [];
            }
            acc[empId].push(entry);
            return acc;
        }, {} as Record<number, TimeEntry[]>);

        // Calculate statistics for each employee
        const employeeReports = await Promise.all(
            Object.entries(employeeEntries).map(async ([empId, entries]) => {
                const employee = entries[0].employee;
                const hours = await calculateHours(entries, settings);

                const regularPay = hours.regularHours * employee.hourlyRate;
                const overtimePay = hours.overtimeHours * employee.hourlyRate * settings.overtimeRate;
                const weekendPay = hours.weekendHours * employee.hourlyRate * settings.weekendRate;
                const holidayPay = hours.holidayHours * employee.hourlyRate * settings.holidayRate;

                // Calculate attendance stats
                const daysPresent = new Set(entries.map(e =>
                    format(new Date(e.clockIn), 'yyyy-MM-dd')
                )).size;

                const totalDays = differenceInHours(
                    parseISO(endDate),
                    parseISO(startDate)
                ) / 24;

                const lateArrivals = entries.filter(entry => {
                    const clockIn = new Date(entry.clockIn);
                    const workStart = new Date(clockIn);
                    const [hours, minutes] = settings.workDayStartTime.split(':');
                    workStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                    return clockIn > workStart;
                }).length;

                return {
                    id: Number(empId),
                    name: `${employee.name} ${employee.surname}`,
                    ...hours,
                    regularPay,
                    overtimePay,
                    weekendPay,
                    holidayPay,
                    totalPay: regularPay + overtimePay + weekendPay + holidayPay,
                    daysPresent,
                    daysAbsent: Math.max(0, totalDays - daysPresent),
                    lateArrivals
                };
            })
        );

        // Calculate totals
        const totals = employeeReports.reduce((acc, curr) => ({
            regularHours: acc.regularHours + curr.regularHours,
            overtimeHours: acc.overtimeHours + curr.overtimeHours,
            weekendHours: acc.weekendHours + curr.weekendHours,
            holidayHours: acc.holidayHours + curr.holidayHours,
            totalHours: acc.totalHours + curr.totalHours,
            regularPay: acc.regularPay + curr.regularPay,
            overtimePay: acc.overtimePay + curr.overtimePay,
            weekendPay: acc.weekendPay + curr.weekendPay,
            holidayPay: acc.holidayPay + curr.holidayPay,
            totalPay: acc.totalPay + curr.totalPay
        }), {
            regularHours: 0,
            overtimeHours: 0,
            weekendHours: 0,
            holidayHours: 0,
            totalHours: 0,
            regularPay: 0,
            overtimePay: 0,
            weekendPay: 0,
            holidayPay: 0,
            totalPay: 0
        });

        res.json({
            period: { startDate, endDate },
            employees: employeeReports,
            totals
        });
    } catch (error) {
        console.error('Failed to generate report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Download Report
router.post('/download', auth, async (req: Request, res: Response) => {
    try {
        const { format, ...filters } = req.body;

        // First get the report data using the existing endpoint
        const response = await fetch(`${req.protocol}://${req.get('host')}/api/reports`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            },
            body: JSON.stringify(filters)
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        const reportData = await response.json();

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Report');

            // Add headers and data based on report type
            // ... Excel generation code ...

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report-${filters.reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

            await workbook.xlsx.write(res);
            res.end();
        } else if (format === 'pdf') {
            const doc = new PDFDocument();

            // Add content based on report type
            // ... PDF generation code ...

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report-${filters.reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            doc.pipe(res);
            doc.end();
        }
    } catch (error) {
        console.error('Failed to download report:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

export default router;