import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Shop } from '../entities/Shop';
import { auth } from '../middleware/auth';

const router = Router();
const shopRepository = AppDataSource.getRepository(Shop);

// Get all shops
router.get('/', auth, async (req: Request, res: Response) => {
    try {
        const shops = await shopRepository.find({
            relations: ['employees']
        });
        res.json(shops);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

// Create shop
router.post('/', auth, async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const shop = shopRepository.create(req.body);
        await shopRepository.save(shop);
        res.status(201).json(shop);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create shop' });
    }
});

// Update shop
router.put('/:id', auth, async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await shopRepository.update(req.params.id, req.body);
        if (result.affected === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        res.json({ message: 'Shop updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update shop' });
    }
});

// Delete shop
router.delete('/:id', auth, async (req: Request, res: Response) => {
    try {
        if (req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const result = await shopRepository.delete(req.params.id);
        if (result.affected === 0) {
            return res.status(404).json({ error: 'Shop not found' });
        }
        res.json({ message: 'Shop deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete shop' });
    }
});

export default router;