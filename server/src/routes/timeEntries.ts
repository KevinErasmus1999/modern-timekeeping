import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { auth } from '../middleware/auth';

const router = Router();
const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
const employeeRepo = AppDataSource.getRepository(Employee);

// ... other routes

// Clock out route
router.put('/:id/clock-out', auth, async (req: Request, res: Response) => {
    try {
        const entry = await timeEntryRepo.findOne({
            where: { id: parseInt(req.params.id) },
            relations: ['employee']
        });

        if (!entry) {
            return res.status(404).json({ error: 'Time entry not found' });
        }

        if (entry.clockOut) {
            return res.status(400).json({ error: 'Already clocked out' });
        }

        entry.clockOut = new Date();

        // Make sure we have the employee and hourlyRate
        if (!entry.employee || typeof entry.employee.hourlyRate !== 'number') {
            return res.status(400).json({ error: 'Invalid employee data' });
        }

        // Calculate hours worked
        const hoursWorked = (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);

        // Calculate earnings using null coalescing to ensure we have a number
        entry.earnings = hoursWorked * (entry.employee.hourlyRate ?? 0);

        await timeEntryRepo.save(entry);
        res.json(entry);
    } catch (error) {
        console.error('Clock out error:', error);
        res.status(500).json({ error: 'Failed to clock out' });
    }
});

export default router;