import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Settings } from '../entities/Settings';
import { auth } from '../middleware/auth';

const router = Router();
const settingsRepo = AppDataSource.getRepository(Settings);

// Get settings
router.get('/', auth, async (_req: Request, res: Response) => {
    try {
        let settings = await settingsRepo.findOne({ where: { id: 1 } });

        if (!settings) {
            // Create default settings if none exist
            settings = await settingsRepo.save(settingsRepo.create({
                payrollStartDay: 25,
                payrollEndDay: 24,
                workDayStartTime: '08:00',
                workDayEndTime: '17:00',
                overtimeRate: 1.5,
                weekendRate: 2.0,
                holidayRate: 2.5,
                holidays: [
                    { date: '2024-01-01', name: "New Year's Day" },
                    { date: '2024-03-21', name: 'Human Rights Day' },
                    { date: '2024-04-19', name: 'Good Friday' },
                    { date: '2024-04-22', name: 'Family Day' },
                    { date: '2024-04-27', name: 'Freedom Day' },
                    { date: '2024-05-01', name: 'Workers Day' },
                    { date: '2024-06-16', name: 'Youth Day' },
                    { date: '2024-08-09', name: 'National Women\'s Day' },
                    { date: '2024-09-24', name: 'Heritage Day' },
                    { date: '2024-12-16', name: 'Day of Reconciliation' },
                    { date: '2024-12-25', name: 'Christmas Day' },
                    { date: '2024-12-26', name: 'Day of Goodwill' }
                ]
            }));
        }

        res.json(settings);
    } catch (error) {
        console.error('Failed to fetch settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// Update settings
router.put('/', auth, async (req: Request, res: Response) => {
    try {
        let settings = await settingsRepo.findOne({ where: { id: 1 } });
        if (!settings) {
            settings = settingsRepo.create({});
        }

        // Validate payroll days
        if (req.body.payrollStartDay < 1 || req.body.payrollStartDay > 31) {
            return res.status(400).json({ error: 'Invalid payroll start day' });
        }
        if (req.body.payrollEndDay < 1 || req.body.payrollEndDay > 31) {
            return res.status(400).json({ error: 'Invalid payroll end day' });
        }

        // Validate rates
        if (req.body.overtimeRate < 1) {
            return res.status(400).json({ error: 'Overtime rate must be at least 1' });
        }
        if (req.body.weekendRate < 1) {
            return res.status(400).json({ error: 'Weekend rate must be at least 1' });
        }
        if (req.body.holidayRate < 1) {
            return res.status(400).json({ error: 'Holiday rate must be at least 1' });
        }

        // Validate time format
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(req.body.workDayStartTime) || !timeRegex.test(req.body.workDayEndTime)) {
            return res.status(400).json({ error: 'Invalid time format. Use HH:mm' });
        }

        Object.assign(settings, req.body);
        await settingsRepo.save(settings);

        res.json(settings);
    } catch (error) {
        console.error('Failed to update settings:', error);
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

export default router;