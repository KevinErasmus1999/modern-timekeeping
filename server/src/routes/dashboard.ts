import { Router } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { Shop } from '../entities/Shop';
import { auth } from '../middleware/auth';
import { IsNull } from 'typeorm';

const router = Router();

router.get('/', auth, async (req, res) => {
    try {
        const [shops, employees, timeEntries] = await Promise.all([
            AppDataSource.getRepository(Shop).find(),
            AppDataSource.getRepository(Employee).find({ relations: ['shop'] }),
            AppDataSource.getRepository(TimeEntry).find({
                where: { clockOut: IsNull() },
                relations: ['employee']
            })
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate shop statistics
        const shopStats = await Promise.all(shops.map(async (shop) => {
            const shopEmployees = employees.filter(emp => emp.shopId === shop.id);
            const clockedInEmployees = timeEntries.filter(entry =>
                shopEmployees.some(emp => emp.id === entry.employee.id)
            );

            // Get monthly hours using query builder
            const monthlyHours = await AppDataSource
                .createQueryBuilder()
                .select([
                    "DATE(timeEntry.clockIn) as date",
                    "COUNT(DISTINCT employee.id) as employeeCount",
                    "SUM(CASE WHEN timeEntry.clockOut IS NOT NULL THEN ROUND((julianday(timeEntry.clockOut) - julianday(timeEntry.clockIn)) * 24, 2) ELSE 0 END) as hours",
                    "SUM(timeEntry.earnings) as wages"
                ])
                .from(TimeEntry, "timeEntry")
                .leftJoin("timeEntry.employee", "employee")
                .where("employee.shopId = :shopId", { shopId: shop.id })
                .andWhere("timeEntry.clockIn >= :startDate", {
                    startDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate())
                })
                .groupBy("DATE(timeEntry.clockIn)")
                .getRawMany();

            const averageWage = shopEmployees.length > 0
                ? Number((shopEmployees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / shopEmployees.length).toFixed(2))
                : 0;

            return {
                id: shop.id,
                name: shop.name,
                totalEmployees: shopEmployees.length,
                clockedInEmployees: clockedInEmployees.length,
                averageWage,
                monthlyHours: monthlyHours.map(mh => ({
                    date: mh.date,
                    hours: Number(mh.hours) || 0,
                    wages: Number(mh.wages) || 0,
                    employeeCount: Number(mh.employeeCount)
                }))
            };
        }));

        // Calculate wage distribution
        const wageRanges = [
            { min: 0, max: 50, label: 'R0-R50' },
            { min: 50, max: 100, label: 'R50-R100' },
            { min: 100, max: 150, label: 'R100-R150' },
            { min: 150, max: 200, label: 'R150-R200' },
            { min: 200, max: null, label: 'R200+' }
        ];

        const wageDistribution = wageRanges.map(({ min, max, label }) => ({
            range: label,
            count: employees.filter(emp =>
                max ? (emp.hourlyRate >= min && emp.hourlyRate < max) : emp.hourlyRate >= min
            ).length
        }));

        // Calculate overall statistics
        const overallStats = {
            totalShops: shops.length,
            totalEmployees: employees.length,
            clockedInEmployees: timeEntries.length,
            averageHourlyWage: employees.length > 0
                ? Number((employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length).toFixed(2))
                : 0
        };

        res.json({
            shops: shopStats,
            overallStats,
            wageDistribution
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;