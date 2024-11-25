import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { auth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const employeeRepo = AppDataSource.getRepository(Employee);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadDir = './uploads/documents';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error as Error, uploadDir);
        }
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type'));
    }
});

// Get all employees
router.get('/', auth, async (req: Request, res: Response) => {
    try {
        const employees = await employeeRepo.find({
            relations: ['shop'],
            order: { name: 'ASC' }
        });
        res.json(employees);
    } catch (error) {
        console.error('Failed to fetch employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// Create new employee
router.post('/', auth, upload.array('documents'), async (req: Request, res: Response) => {
    try {
        const {
            name,
            surname,
            email,
            cellNumber,
            idNumber,
            gender,
            hourlyRate,
            additionalFields
        } = req.body;

        // Validate required fields
        if (!name || !surname || !email || !cellNumber || !idNumber) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        // Handle file uploads
        const files = req.files as Express.Multer.File[] || [];
        const documents = files.map(file => file.filename);

        // Create employee
        const employee = employeeRepo.create({
            name,
            surname,
            email,
            cellNumber,
            idNumber,
            gender: gender || 'male',
            hourlyRate: parseFloat(hourlyRate) || 0,
            documents,
            additionalFields: additionalFields ? JSON.parse(additionalFields) : {},
            isActive: true
        });

        console.log('Creating employee:', employee); // Debug log

        const savedEmployee = await employeeRepo.save(employee);
        console.log('Employee saved:', savedEmployee); // Debug log

        res.status(201).json(savedEmployee);
    } catch (error) {
        console.error('Failed to create employee:', error);
        // Delete uploaded files if employee creation fails
        if (req.files) {
            const files = req.files as Express.Multer.File[];
            for (const file of files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Failed to delete file:', unlinkError);
                }
            }
        }
        res.status(500).json({
            error: 'Failed to create employee',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Update employee
router.put('/:id', auth, upload.array('documents'), async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            surname,
            email,
            cellNumber,
            idNumber,
            gender,
            hourlyRate,
            additionalFields,
            isActive
        } = req.body;

        const employee = await employeeRepo.findOne({ where: { id: parseInt(id) } });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Handle new file uploads
        const files = req.files as Express.Multer.File[] || [];
        const newDocuments = files.map(file => file.filename);

        // Update employee
        Object.assign(employee, {
            name: name || employee.name,
            surname: surname || employee.surname,
            email: email || employee.email,
            cellNumber: cellNumber || employee.cellNumber,
            idNumber: idNumber || employee.idNumber,
            gender: gender || employee.gender,
            hourlyRate: hourlyRate ? parseFloat(hourlyRate) : employee.hourlyRate,
            documents: [...(employee.documents || []), ...newDocuments],
            additionalFields: additionalFields ? JSON.parse(additionalFields) : employee.additionalFields,
            isActive: isActive !== undefined ? isActive : employee.isActive
        });

        await employeeRepo.save(employee);
        res.json(employee);
    } catch (error) {
        console.error('Failed to update employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// Delete employee
router.delete('/:id', auth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const employee = await employeeRepo.findOne({ where: { id: parseInt(id) } });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        // Delete associated documents
        if (employee.documents) {
            for (const doc of employee.documents) {
                try {
                    await fs.unlink(path.join('./uploads/documents', doc));
                } catch (error) {
                    console.error('Failed to delete document:', error);
                }
            }
        }

        await employeeRepo.remove(employee);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Failed to delete employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

export default router;