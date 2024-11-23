import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { TimeEntry } from "./TimeEntry";

@Entity("employees")
export class Employee {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    hourlyRate!: number;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => TimeEntry, (timeEntry) => timeEntry.employee)
    timeEntries!: TimeEntry[];
}