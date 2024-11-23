import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { Shop } from '../entities/Shop';
import { Between, MoreThanOrEqual } from 'typeorm';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, async (req: Request, res: Response) => {
    try {
        const { range = 'week' } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate start date based on range
        const startDate = new Date(today);
        switch (range) {
            case 'week':
                startDate.setDate(today.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(today.getMonth() - 1);
                break;
            case 'year':
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            default:
                startDate.setDate(today.getDate() - 7);
        }

        // Get base repositories
        const employeeRepo = AppDataSource.getRepository(Employee);
        const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
        const shopRepo = AppDataSource.getRepository(Shop);

        // Get basic stats
        const [
            totalEmployees,
            activeEmployees,
            totalShops,
            todayEntries,
            rangeEntries
        ] = await Promise.all([
            employeeRepo.count(),
            employeeRepo.count({ where: { isActive: true } }),
            shopRepo.count(),
            timeEntryRepo.find({
                where: {
                    clockIn: MoreThanOrEqual(today)
                },
                relations: ['employee']
            }),
            timeEntryRepo.find({
                where: {
                    clockIn: Between(startDate, new Date())
                },
                relations: ['employee'],
                order: {
                    clockIn: 'ASC'
                }
            })
        ]);

        // Calculate today's stats
        const todayStats = todayEntries.reduce((acc, entry) => {
            const clockOut = entry.clockOut || new Date();
            const hours = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            const earnings = hours * entry.employee.hourlyRate;
            return {
                hours: acc.hours + hours,
                earnings: acc.earnings + earnings
            };
        }, { hours: 0, earnings: 0 });

        // Calculate average hourly rate
        const employees = await employeeRepo.find();
        const averageHourlyRate = employees.reduce((acc, emp) => acc + emp.hourlyRate, 0) /
            (employees.length || 1);

        // Process time entries by date
        const timeEntriesByDate = new Map();
        rangeEntries.forEach(entry => {
            const date = entry.clockIn.toISOString().split('T')[0];
            const clockOut = entry.clockOut || new Date();
            const hours = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            const earnings = hours * entry.employee.hourlyRate;

            if (timeEntriesByDate.has(date)) {
                const existing = timeEntriesByDate.get(date);
                timeEntriesByDate.set(date, {
                    date,
                    hours: existing.hours + hours,
                    earnings: existing.earnings + earnings
                });
            } else {
                timeEntriesByDate.set(date, { date, hours, earnings });
            }
        });

        // Get top performing employees
        const employeePerformance = new Map();
        rangeEntries.forEach(entry => {
            const clockOut = entry.clockOut || new Date();
            const hours = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
            const earnings = hours * entry.employee.hourlyRate;

            if (employeePerformance.has(entry.employee.id)) {
                const existing = employeePerformance.get(entry.employee.id);
                employeePerformance.set(entry.employee.id, {
                    name: entry.employee.name,
                    hours: existing.hours + hours,
                    earnings: existing.earnings + earnings
                });
            } else {
                employeePerformance.set(entry.employee.id, {
                    name: entry.employee.name,
                    hours,
                    earnings
                });
            }
        });

        const topEmployees = Array.from(employeePerformance.values())
            .sort((a, b) => b.hours - a.hours)
            .slice(0, 5);

        res.json({
            stats: {
                totalEmployees,
                activeEmployees,
                totalShops,
                totalHoursToday: todayStats.hours,
                totalEarningsToday: todayStats.earnings,
                averageHourlyRate
            },
            timeEntries: Array.from(timeEntriesByDate.values()),
            topEmployees
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;