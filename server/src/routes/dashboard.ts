import { Router } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { Shop } from '../entities/Shop';
import { Settings } from '../entities/Settings';
import { auth } from '../middleware/auth';
import { IsNull, Between, MoreThan } from 'typeorm';
import { startOfDay, endOfDay, parseISO, differenceInMinutes } from 'date-fns';

const router = Router();

router.get('/', auth, async (req, res) => {
    try {
        // Get date range from query parameters
        const startDate = req.query.start ?
            startOfDay(parseISO(req.query.start as string)) :
            startOfDay(new Date());

        const endDate = req.query.end ?
            endOfDay(parseISO(req.query.end as string)) :
            endOfDay(new Date());

        // Get settings for work hours
        const settings = await AppDataSource.getRepository(Settings).findOne({
            where: { id: 1 }
        });

        if (!settings) {
            throw new Error('System settings not found');
        }

        // Parse work start time for late calculation
        const [startHour, startMinute] = settings.workDayStartTime.split(':').map(Number);
        const workStartTime = new Date(startDate);
        workStartTime.setHours(startHour, startMinute, 0, 0);

        // Fetch all required data
        const [shops, employees, timeEntries, overtimeEntries] = await Promise.all([
            AppDataSource.getRepository(Shop).find(),
            AppDataSource.getRepository(Employee).find({
                relations: ['shop']
            }),
            AppDataSource.getRepository(TimeEntry).find({
                where: {
                    clockIn: Between(startDate, endDate),
                    clockOut: IsNull()
                },
                relations: ['employee', 'employee.shop']
            }),
            // Fetch completed entries for overtime calculation
            AppDataSource.getRepository(TimeEntry).find({
                where: {
                    clockIn: Between(startDate, endDate),
                    clockOut: MoreThan(workStartTime)
                },
                relations: ['employee']
            })
        ]);

        // Calculate overtime
        let totalOvertimeHours = 0;
        let totalOvertimeAmount = 0;

        overtimeEntries.forEach(entry => {
            if (entry.clockOut) {
                const clockOut = new Date(entry.clockOut);
                const expectedEndTime = new Date(entry.clockIn);
                expectedEndTime.setHours(startHour + 9); // Assuming 9-hour workday

                if (clockOut > expectedEndTime) {
                    const overtimeMinutes = differenceInMinutes(clockOut, expectedEndTime);
                    const overtimeHours = overtimeMinutes / 60;
                    totalOvertimeHours += overtimeHours;
                    totalOvertimeAmount += (overtimeHours * entry.employee.hourlyRate * settings.overtimeRate);
                }
            }
        });

        // Calculate late employees
        const lateEmployees = timeEntries
            .filter(entry => {
                const clockInTime = new Date(entry.clockIn);
                const entryWorkStartTime = new Date(clockInTime);
                entryWorkStartTime.setHours(startHour, startMinute, 0, 0);
                return clockInTime > entryWorkStartTime;
            })
            .map(entry => ({
                id: entry.employee.id,
                name: `${entry.employee.name} ${entry.employee.surname}`,
                shop: entry.employee.shop?.name || 'Unassigned',
                minutesLate: differenceInMinutes(
                    new Date(entry.clockIn),
                    new Date(entry.clockIn).setHours(startHour, startMinute, 0, 0)
                )
            }));

        // Calculate shop statistics
        const shopStats = await Promise.all(shops.map(async (shop) => {
            const shopEmployees = employees.filter(emp => emp.shopId === shop.id);
            const clockedInEmployees = timeEntries.filter(entry =>
                shopEmployees.some(emp => emp.id === entry.employee.id)
            );

            const averageWage = shopEmployees.length > 0
                ? Number((shopEmployees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / shopEmployees.length).toFixed(2))
                : 0;

            return {
                id: shop.id,
                name: shop.name,
                totalEmployees: shopEmployees.length,
                clockedInEmployees: clockedInEmployees.length,
                averageWage
            };
        }));

        // Calculate overall statistics
        const overallStats = {
            totalShops: shops.length,
            totalEmployees: employees.length,
            clockedInEmployees: timeEntries.length,
            overtimeHours: Number(totalOvertimeHours.toFixed(2)),
            overtimeAmount: Number(totalOvertimeAmount.toFixed(2)),
            averageHourlyWage: employees.length > 0
                ? Number((employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length).toFixed(2))
                : 0
        };

        res.json({
            shops: shopStats,
            overallStats,
            lateEmployees
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;