import { DataSource } from "typeorm";
import { User } from "./src/entities/User";
import { Employee } from "./src/entities/Employee";
import { TimeEntry } from "./src/entities/TimeEntry";
import { Shop } from "./src/entities/Shop";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const dataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "database.sqlite"),
    entities: [
        User,
        Employee,
        TimeEntry,
        Shop
    ],
    migrations: [path.join(__dirname, "src", "migrations", "*.{ts,js}")],
    synchronize: false,
    logging: true
});

export default dataSource;