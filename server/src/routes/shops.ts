import { Router } from 'express';
import { Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Shop } from '../entities/Shop';
import { auth } from '../middleware/auth';

const router = Router();
const shopRepository = AppDataSource.getRepository(Shop);

// Get all shops
router.get('/', auth, async (_req: Request, res: Response) => {
    try {
        const shops = await shopRepository
            .createQueryBuilder('shop')
            .leftJoinAndSelect('shop.employees', 'employee')
            .getMany();

        const shopsWithCount = shops.map(shop => ({
            id: shop.id,
            name: shop.name,
            address: shop.address,
            isActive: shop.isActive,
            employeeCount: shop.employees?.length || 0
        }));

        res.status(200).json(shopsWithCount);
    } catch (error) {
        console.error('Failed to fetch shops:', error);
        res.status(500).json({ error: 'Failed to fetch shops' });
    }
});

// Create shop
router.post('/', auth, async (req: Request, res: Response) => {
    try {
        const shop = shopRepository.create(req.body);
        const result = await shopRepository.save(shop);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create shop' });
    }
});

// Update shop
router.put('/:id', auth, async (req: Request, res: Response) => {
    try {
        const shop = await shopRepository.findOne({
            where: { id: parseInt(req.params.id) }
        });

        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        shopRepository.merge(shop, req.body);
        const result = await shopRepository.save(shop);
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update shop' });
    }
});

// Delete shop
router.delete('/:id', auth, async (req: Request, res: Response) => {
    try {
        const shop = await shopRepository.findOne({
            where: { id: parseInt(req.params.id) },
            relations: ['employees']
        });

        if (!shop) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shop.employees?.length > 0) {
            return res.status(400).json({ error: 'Cannot delete shop with employees' });
        }

        await shopRepository.remove(shop);
        res.status(200).json({ message: 'Shop deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete shop' });
    }
});

export default router;