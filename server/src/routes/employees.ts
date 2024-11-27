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
        cb(null, false);
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
            isActive
        } = req.body;

        // Validate required fields
        if (!name || !surname || !email || !cellNumber || !idNumber) {
            return res.status(400).json({ error: 'Required fields are missing' });
        }

        const files = (req as any).files as Express.Multer.File[] || [];
        const documents = files.map(file => file.filename);

        const employee = employeeRepo.create({
            name,
            surname,
            email,
            cellNumber,
            idNumber,
            gender: gender || 'male',
            hourlyRate: parseFloat(hourlyRate) || 0,
            isActive: isActive !== undefined ? isActive : true,
            documents
        });

        const savedEmployee = await employeeRepo.save(employee);
        res.status(201).json(savedEmployee);
    } catch (error) {
        // Clean up uploaded files if employee creation fails
        const files = (req as any).files as Express.Multer.File[] || [];
        for (const file of files) {
            try {
                await fs.unlink(file.path);
            } catch (unlinkError) {
                console.error('Failed to delete file:', unlinkError);
            }
        }

        console.error('Failed to create employee:', error);
        res.status(500).json({
            error: 'Failed to create employee',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get all employees
router.get('/', auth, async (_req: Request, res: Response) => {
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

// Update employee
router.put('/:id', auth, upload.array('documents'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await employeeRepo.findOne({
        where: { id: parseInt(id) }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const files = (req as any).files as Express.Multer.File[];
      const newDocuments = files?.map(file => file.filename) || [];

      const updatedEmployee = {
        ...employee,
        ...req.body,
        documents: [...(employee.documents || []), ...newDocuments],
        hourlyRate: parseFloat(req.body.hourlyRate),
        isActive: req.body.isActive === 'true',
        additionalFields: req.body.additionalFields ? JSON.parse(req.body.additionalFields) : {}
      };

      const savedEmployee = await employeeRepo.save(updatedEmployee);
      res.json(savedEmployee);
    } catch (error) {
      console.error('Update error:', error);
      res.status(500).json({ error: 'Failed to update employee' });
    }
  });

// Assign shop to employee
router.put('/:id/assign-shop', auth, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { shopId } = req.body;

        const employee = await employeeRepo.findOne({ where: { id: parseInt(id) } });

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        employee.shopId = shopId || null;
        await employeeRepo.save(employee);

        res.json({ message: 'Shop assigned successfully' });
    } catch (error) {
        console.error('Failed to assign shop:', error);
        res.status(500).json({ error: 'Failed to assign shop' });
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

router.post('/:id/documents', auth, upload.array('documents'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await employeeRepo.findOne({
        where: { id: parseInt(id) }
      });

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const files = (req as any).files as Express.Multer.File[];
      if (!files?.length) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const documents = files.map(file => file.filename);
      employee.documents = [...(employee.documents || []), ...documents];

      await employeeRepo.save(employee);

      res.json({
        message: 'Documents uploaded successfully',
        documents: employee.documents
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload documents' });
    }
  });

export default router;