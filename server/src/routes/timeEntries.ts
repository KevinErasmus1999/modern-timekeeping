import { Router } from 'express';
import { AppDataSource } from '../database';
import { TimeEntry } from '../entities/TimeEntry';
import { Employee } from '../entities/Employee';
import { auth } from '../middleware/auth';
import { IsNull } from 'typeorm';

const router = Router();
const timeEntryRepo = AppDataSource.getRepository(TimeEntry);
const employeeRepo = AppDataSource.getRepository(Employee);

// Get all time entries
router.get('/', auth, async (_req, res) => {
    try {
        const entries = await timeEntryRepo.find({
            relations: ['employee'],
            order: { clockIn: 'DESC' }
        });

        const formattedEntries = entries.map(entry => ({
            id: entry.id,
            employeeId: entry.employee.id,
            employeeName: `${entry.employee.name} ${entry.employee.surname}`,
            clockIn: entry.clockIn,
            clockOut: entry.clockOut,
            earnings: entry.earnings
        }));

        res.json(formattedEntries);
    } catch (error) {
        console.error('Failed to fetch time entries:', error);
        res.status(500).json({ error: 'Failed to fetch time entries' });
    }
});

// Clock in
router.post('/', auth, async (req, res) => {
    try {
        const { employeeId } = req.body;

        const employee = await employeeRepo.findOne({
            where: { id: employeeId }
        });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        if (!employee.isActive) {
            return res.status(400).json({ error: 'Inactive employees cannot clock in' });
        }

        // Check if already clocked in
        const existingEntry = await timeEntryRepo.findOne({
            where: {
                employee: { id: employeeId },
                clockOut: IsNull()
            }
        });

        if (existingEntry) {
            return res.status(400).json({ error: 'Employee is already clocked in' });
        }

        const timeEntry = timeEntryRepo.create({
            employee,
            clockIn: new Date(),
            earnings: 0
        });

        await timeEntryRepo.save(timeEntry);
        res.status(201).json(timeEntry);
    } catch (error) {
        console.error('Failed to clock in:', error);
        res.status(500).json({ error: 'Failed to clock in' });
    }
});

// Clock out
router.put('/:id/clock-out', auth, async (req, res) => {
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

        // Calculate hours worked and earnings
        const hoursWorked =
            (entry.clockOut.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);

        entry.earnings = hoursWorked * entry.employee.hourlyRate;

        await timeEntryRepo.save(entry);
        res.json(entry);
    } catch (error) {
        console.error('Failed to clock out:', error);
        res.status(500).json({ error: 'Failed to clock out' });
    }
});

export default router;