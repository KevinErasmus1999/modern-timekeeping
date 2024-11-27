import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Employee } from "./entities/Employee";
import { TimeEntry } from "./entities/TimeEntry";
import { Shop } from "./entities/Shop";
import { Settings } from "./entities/Settings";
import path from "path";
import bcrypt from 'bcrypt';

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "..", "database.sqlite"),
    synchronize: true,
    logging: true,
    entities: [User, Employee, TimeEntry, Shop, Settings],
    migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
});

export const initializeDatabase = async (): Promise<boolean> => {
    try {
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log("Database initialized successfully");

            // Check and create admin user
            const userRepo = AppDataSource.getRepository(User);
            let adminUser = await userRepo.findOne({
                where: { email: 'kevin@cybercorelabs.co.za' }
            });

            if (!adminUser) {
                const hashedPassword = await bcrypt.hash('990309@Kevin', 10);
                adminUser = userRepo.create({
                    email: 'kevin@cybercorelabs.co.za',
                    password: hashedPassword,
                    role: 'admin'
                });
                await userRepo.save(adminUser);
                console.log('Admin user created successfully');
            }
        }
        return true;
    } catch (error) {
        console.error("Database initialization error:", error);
        return false;
    }
};