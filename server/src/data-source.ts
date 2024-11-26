import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Employee } from "./entities/Employee";
import { TimeEntry } from "./entities/TimeEntry";
import { Shop } from "./entities/Shop";
import { Settings } from "./entities/Settings";
import { config } from "./config";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: config.db.path,
    synchronize: config.db.synchronize,
    logging: true,
    entities: [User, Employee, TimeEntry, Shop, Settings],
    migrations: ["src/migrations/*.ts"]
});