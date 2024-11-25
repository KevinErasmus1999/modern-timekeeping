import { Router } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { TimeEntry } from '../entities/TimeEntry';
import { Shop } from '../entities/Shop';
import { Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { auth } from '../middleware/auth';

const router = Router();

router.get('/', auth, async (req, res) => {
    try {
        const { range = 'month' } = req.query;
        const now = new Date();
        let startDate = new Date();

        // Calculate date range
        switch (range) {
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setMonth(now.getMonth() - 1);
                break;
            case 'quarter':
                startDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                startDate.setFullYear(now.getFullYear() - 1);
                break;
            default:
                startDate.setMonth(now.getMonth() - 1);
        }

        const [
            employees,
            shops,
            timeEntries,
            documents
        ] = await Promise.all([
            AppDataSource.getRepository(Employee).find({ relations: ['shop'] }),
            AppDataSource.getRepository(Shop).find(),
            AppDataSource.getRepository(TimeEntry).find({
                where: {
                    clockIn: Between(startDate, now)
                },
                relations: ['employee', 'employee.shop']
            }),
            // Assuming you have a Document entity or using the documents field from Employee
            AppDataSource.getRepository(Employee)
                .createQueryBuilder('employee')
                .where('employee.documents IS NOT NULL')
                .orderBy('employee.updatedAt', 'DESC')
                .take(8)
                .getMany()
        ]);

        // Calculate attendance for today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayEntries = timeEntries.filter(entry =>
            entry.clockIn >= todayStart && entry.clockIn <= todayEnd
        );

        const attendanceStats = {
            present: new Set(todayEntries.map(entry => entry.employee.id)).size,
            absent: employees.length - new Set(todayEntries.map(entry => entry.employee.id)).size,
            late: todayEntries.filter(entry => {
                const clockInHour = new Date(entry.clockIn).getHours();
                return clockInHour >= 9; // Assuming 9 AM is the start time
            }).length
        };

        // Calculate shop performance
        const shopPerformance = shops.map(shop => {
            const shopEmployees = employees.filter(emp => emp.shopId === shop.id);
            const shopEntries = timeEntries.filter(entry => entry.employee.shopId === shop.id);

            const totalHours = shopEntries.reduce((sum, entry) => {
                const clockOut = entry.clockOut || new Date();
                const hours = (clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);
                return sum + hours;
            }, 0);

            return {
                shopName: shop.name,
                totalHours: Math.round(totalHours),
                employeeCount: shopEmployees.length,
                averageRate: shopEmployees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / shopEmployees.length || 0
            };
        });

        // Format recent documents
        const recentDocuments = documents.map(emp => ({
            employeeName: `${emp.name} ${emp.surname}`,
            documentType: 'Employee Document', // You might want to store document types
            uploadDate: emp.updatedAt
        }));

        res.json({
            totalEmployees: employees.length,
            activeEmployees: employees.filter(emp => emp.isActive).length,
            totalShops: shops.length,
            averageHourlyRate: employees.reduce((sum, emp) => sum + emp.hourlyRate, 0) / employees.length,
            employeesByShop: shops.map(shop => ({
                shopName: shop.name,
                employeeCount: employees.filter(emp => emp.shopId === shop.id).length
            })),
            attendanceStats,
            shopPerformance,
            recentDocuments
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

export default router;