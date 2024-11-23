import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { auth } from '../middleware/auth';

const router = Router();
const employeeRepo = AppDataSource.getRepository(Employee);

router.post('/', auth, async (req: Request, res: Response) => {
    try {
        const employee = employeeRepo.create(req.body);
        await employeeRepo.save(employee);
        res.status(201).json(employee);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

router.get('/', auth, async (req: Request, res: Response) => {
    try {
        const employees = await employeeRepo.find();
        res.json(employees);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

export default router;