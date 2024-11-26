import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Employee } from "./Employee";

@Entity("time_entries")
export class TimeEntry {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Employee, (employee) => employee.timeEntries, { eager: true })
    employee!: Employee;

    @CreateDateColumn()
    clockIn!: Date;

    @Column({ type: 'datetime', nullable: true })
    clockOut?: Date;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    earnings!: number;
}