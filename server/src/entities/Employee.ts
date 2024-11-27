import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Shop } from "./Shop";
import { TimeEntry } from "./TimeEntry";

@Entity("employees")
export class Employee {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    surname!: string;

    @Column()
    email!: string;

    @Column()
    cellNumber!: string;

    @Column()
    idNumber!: string;

    @Column({ default: 'male' })
    gender!: string;

    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    hourlyRate!: number;

    @Column({ default: true })
    isActive!: boolean;

    @Column({ nullable: true })
    shopId?: number;

    @Column("simple-array", { nullable: true })
    documents?: string[];

    @Column("simple-json", { nullable: true })
    additionalFields?: Record<string, string>;

    @ManyToOne(() => Shop, shop => shop.employees, { nullable: true })
    shop?: Shop;

    @OneToMany(() => TimeEntry, timeEntry => timeEntry.employee)
    timeEntries!: TimeEntry[];
}