import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface DecodedToken {
    userId: number;
    role: string;
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (!token) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret') as DecodedToken;
        req.user = { userId: decoded.userId, role: decoded.role };
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
        return;
    }
};