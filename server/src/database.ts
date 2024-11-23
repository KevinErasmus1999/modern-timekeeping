import { DataSource } from "typeorm";
import path from "path";
import { User } from "./entities/User";
import { Employee } from "./entities/Employee";
import { TimeEntry } from "./entities/TimeEntry";
require('dotenv').config();

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: path.join(__dirname, "../database.sqlite"),
    entities: [User, Employee, TimeEntry],
    synchronize: true,
    logging: true
});