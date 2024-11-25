import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    jwt: {
        secret: process.env.JWT_SECRET || 'default-secret-key',
        expiry: process.env.JWT_EXPIRY || '24h'
    },
    db: {
        path: process.env.DB_PATH || path.join(__dirname, '..', 'database.sqlite'),
        synchronize: process.env.NODE_ENV === 'development'
    },
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173'
    }
};