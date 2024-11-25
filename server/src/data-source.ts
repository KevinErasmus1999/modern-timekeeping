import { DataSource } from "typeorm";
import { User } from "./entities/User";
import { Employee } from "./entities/Employee";
import { TimeEntry } from "./entities/TimeEntry";
import { Shop } from "./entities/Shop";
import { config } from "./config";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: config.db.path,
    synchronize: config.db.synchronize,
    logging: true,
    entities: [User, Employee, TimeEntry, Shop],
    migrations: ["src/migrations/*.ts"]
});