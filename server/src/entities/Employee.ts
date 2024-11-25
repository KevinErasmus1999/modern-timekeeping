import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { TimeEntry } from "./TimeEntry";
import { Shop } from "./Shop";

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
    shopId!: number;

    @Column("simple-json", { nullable: true })
    additionalFields!: Record<string, string>;

    @Column("simple-array", { nullable: true })
    documents!: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @ManyToOne(() => Shop, shop => shop.employees)
    shop!: Shop;

    @OneToMany(() => TimeEntry, timeEntry => timeEntry.employee)
    timeEntries!: TimeEntry[];
}