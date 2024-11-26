import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Employee } from '../entities/Employee';
import { auth } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

const router = Router();
const employeeRepo = AppDataSource.getRepository(Employee);

// TypeScript type declarations
type RequestWithFiles = Request & {
    files: Express.Multer.File[];
};

// Configure multer storage
const storage = multer.diskStorage({
    destination: async (_req, _file, cb) => {
        const uploadDir = './uploads/documents';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error as Error, uploadDir);
        }
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
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
router.post('/',
    auth,
    upload.array('documents'),
    (req: Request, res: Response) => {
        const request = req as RequestWithFiles;
        handleCreateEmployee(request, res).catch(error => {
            console.error('Failed to create employee:', error);
            res.status(500).json({ error: 'Failed to create employee' });
        });
    }
);

// Update employee
router.put('/:id',
    auth,
    upload.array('documents'),
    (req: Request, res: Response) => {
        const request = req as RequestWithFiles;
        handleUpdateEmployee(request, res).catch(error => {
            console.error('Failed to update employee:', error);
            res.status(500).json({ error: 'Failed to update employee' });
        });
    }
);

// Delete employee
router.delete('/:id', auth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const employee = await employeeRepo.findOne({ where: { id: parseInt(id) } });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

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

// Handler functions
async function handleCreateEmployee(req: RequestWithFiles, res: Response) {
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

        if (!name || !surname || !email || !cellNumber || !idNumber) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const documents = req.files.map(file => file.filename);

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

        const savedEmployee = await employeeRepo.save(employee);
        return res.status(201).json(savedEmployee);
    } catch (error) {
        // Clean up uploaded files on error
        if (req.files?.length) {
            await Promise.all(
                req.files.map(file =>
                    fs.unlink(file.path).catch(err =>
                        console.error('Failed to delete file:', err)
                    )
                )
            );
        }
        throw error;
    }
}

async function handleUpdateEmployee(req: RequestWithFiles, res: Response) {
    const { id } = req.params;
    const employee = await employeeRepo.findOne({ where: { id: parseInt(id) } });

    if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
    }

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

    const newDocuments = req.files.map(file => file.filename);

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
    return res.json(employee);
}

export default router;