import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database';
import authRoutes from './routes/auth';
import employeeRoutes from './routes/employees';
import timeEntryRoutes from './routes/timeEntries';
import shopRoutes from './routes/shops';
import settingsRoutes from './routes/settings';
import dashboardRoutes from './routes/dashboard';
import reportsRoutes from './routes/reports';

import path from 'path';

const app = express();

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/time-entries', timeEntryRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await initializeDatabase();
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    } catch (error) {
        console.error('Server startup failed:', error);
        process.exit(1);
    }
};

startServer();

export default app;