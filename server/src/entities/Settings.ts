import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("settings")
export class Settings {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'int', default: 25 })
    payrollStartDay!: number;

    @Column({ type: 'int', default: 24 })
    payrollEndDay!: number;

    @Column({ type: 'varchar', default: '08:00' })
    workDayStartTime!: string;

    @Column({ type: 'varchar', default: '17:00' })
    workDayEndTime!: string;

    @Column({ type: 'decimal', precision: 3, scale: 1, default: 1.5 })
    overtimeRate!: number;

    @Column({ type: 'decimal', precision: 3, scale: 1, default: 2.0 })
    weekendRate!: number;

    @Column({ type: 'decimal', precision: 3, scale: 1, default: 2.5 })
    holidayRate!: number;

    @Column({ type: 'simple-json', nullable: true })
    holidays?: { date: string; name: string }[];
}