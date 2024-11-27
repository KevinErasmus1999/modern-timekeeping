import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { Settings } from '../entities/Settings';
import { Between } from 'typeorm';
import { auth } from '../middleware/auth';
import { startOfDay, endOfDay, isWeekend, differenceInHours, format, parseISO, differenceInDays } from 'date-fns';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import type { default as PDFKit } from 'pdfkit';

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

// Generate Report Data
const generateReportData = async (filters: any) => {
    const { startDate, endDate, shopId, employeeId } = filters;
    const settings = await AppDataSource.getRepository(Settings).findOne({ where: { id: 1 } });

    if (!settings) {
        throw new Error('System settings not found');
    }

    const queryBuilder = AppDataSource
        .getRepository(TimeEntry)
        .createQueryBuilder('timeEntry')
        .leftJoinAndSelect('timeEntry.employee', 'employee')
        .where({
            clockIn: Between(
                startOfDay(new Date(startDate)),
                endOfDay(new Date(endDate))
            )
        });

    if (shopId) {
        queryBuilder.andWhere('employee.shopId = :shopId', { shopId });
    }

    if (employeeId) {
        queryBuilder.andWhere('employee.id = :employeeId', { employeeId });
    }

    const entries = await queryBuilder.getMany();

    const employeeEntries = entries.reduce((acc, entry) => {
        const empId = entry.employee.id;
        if (!acc[empId]) {
            acc[empId] = [];
        }
        acc[empId].push(entry);
        return acc;
    }, {} as Record<number, TimeEntry[]>);

    const employeeReports = await Promise.all(
        Object.entries(employeeEntries).map(async ([empId, entries]) => {
            const employee = entries[0].employee;
            const hours = await calculateHours(entries, settings);

            const regularPay = hours.regularHours * employee.hourlyRate;
            const overtimePay = hours.overtimeHours * employee.hourlyRate * settings.overtimeRate;
            const weekendPay = hours.weekendHours * employee.hourlyRate * settings.weekendRate;
            const holidayPay = hours.holidayHours * employee.hourlyRate * settings.holidayRate;

            const daysPresent = new Set(
                entries.map(e => format(new Date(e.clockIn), 'yyyy-MM-dd'))
            ).size;

            const totalDays = Math.ceil(
                differenceInDays(new Date(endDate), new Date(startDate))
            );

            const lateArrivals = entries.filter(entry => {
                const clockIn = new Date(entry.clockIn);
                const [hours, minutes] = settings.workDayStartTime.split(':');
                const workStart = new Date(clockIn.setHours(parseInt(hours), parseInt(minutes), 0, 0));
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

    return employeeReports;
};

// Generate Report
router.post('/', auth, async (req: Request, res: Response) => {
    try {
        const reportData = await generateReportData(req.body);
        const totals = reportData.reduce((acc, curr) => ({
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
            period: { startDate: req.body.startDate, endDate: req.body.endDate },
            employees: reportData,
            totals
        });
    } catch (error) {
        console.error('Failed to generate report:', error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

// Excel Report Generation
async function generateExcelReport(reportData: any, reportType: string, workbook: ExcelJS.Workbook) {
    const worksheet = workbook.addWorksheet(reportType.charAt(0).toUpperCase() + reportType.slice(1));

    if (reportType === 'payroll') {
        worksheet.columns = [
            { header: 'Employee', key: 'name', width: 30 },
            { header: 'Regular Hours', key: 'regularHours', width: 15 },
            { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
            { header: 'Regular Pay', key: 'regularPay', width: 15 },
            { header: 'Overtime Pay', key: 'overtimePay', width: 15 },
            { header: 'Total Pay', key: 'totalPay', width: 15 }
        ];
    } else if (reportType === 'attendance') {
        worksheet.columns = [
            { header: 'Employee', key: 'name', width: 30 },
            { header: 'Days Present', key: 'daysPresent', width: 15 },
            { header: 'Days Absent', key: 'daysAbsent', width: 15 },
            { header: 'Late Arrivals', key: 'lateArrivals', width: 15 },
            { header: 'Total Hours', key: 'totalHours', width: 15 }
        ];
    } else {
        worksheet.columns = [
            { header: 'Employee', key: 'name', width: 30 },
            { header: 'Regular Hours', key: 'regularHours', width: 15 },
            { header: 'Overtime Hours', key: 'overtimeHours', width: 15 },
            { header: 'Overtime Pay', key: 'overtimePay', width: 15 }
        ];
    }

    worksheet.getRow(1).font = { bold: true };
    worksheet.addRows(reportData.employees);
    worksheet.addRow({});
    worksheet.addRow({
        name: 'TOTALS',
        ...reportData.totals
    }).font = { bold: true };

    ['regularPay', 'overtimePay', 'totalPay'].forEach(col => {
        if (worksheet.getColumn(col)) {
            worksheet.getColumn(col).numFmt = 'R#,##0.00';
        }
    });
}

// PDF Report Generation
async function generatePDFReport(reportData: any, reportType: string, doc: PDFKit.PDFDocument) {
    doc.fontSize(16).text(`${reportType.toUpperCase()} REPORT`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${format(new Date(reportData.period.startDate), 'PP')} to ${format(new Date(reportData.period.endDate), 'PP')}`, { align: 'center' });
    doc.moveDown();

    const startY = 150;
    let currentY = startY;

    if (reportType === 'payroll') {
        reportData.employees.forEach((employee: any) => {
            if (currentY > 700) {
                doc.addPage();
                currentY = 50;
            }
            doc.fontSize(10)
               .text(employee.name, 50, currentY)
               .text(employee.regularHours.toFixed(2), 200, currentY)
               .text(employee.overtimeHours.toFixed(2), 300, currentY)
               .text(`R${employee.totalPay.toFixed(2)}`, 400, currentY);
            currentY += 20;
        });
    }

    // Add totals
    doc.moveDown()
       .fontSize(12)
       .text('TOTALS', { underline: true })
       .text(`Total Hours: ${reportData.totals.totalHours.toFixed(2)}`)
       .text(`Total Pay: R${reportData.totals.totalPay.toFixed(2)}`);
}

// Download Report
router.post('/download', auth, async (req: Request, res: Response) => {
    try {
        const { format, ...filters } = req.body;
        const reportData = await generateReportData(filters);

        if (format === 'excel') {
            const workbook = new ExcelJS.Workbook();
            await generateExcelReport(reportData, filters.reportType, workbook);

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=report-${filters.reportType}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

            await workbook.xlsx.write(res);
        } else if (format === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=report-${filters.reportType}-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

            doc.pipe(res);
            await generatePDFReport(reportData, filters.reportType, doc);
            doc.end();
        }
    } catch (error) {
        console.error('Failed to download report:', error);
        res.status(500).json({ error: 'Failed to download report' });
    }
});

export default router;