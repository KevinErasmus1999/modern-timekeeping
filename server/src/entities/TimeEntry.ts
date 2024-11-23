import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Employee } from "./Employee";

@Entity("time_entries")
export class TimeEntry {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Employee, (employee) => employee.timeEntries, { eager: true })
    employee!: Employee;

    @Column()
    clockIn!: Date;

    @Column({ nullable: true })
    clockOut?: Date;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    earnings!: number;
}