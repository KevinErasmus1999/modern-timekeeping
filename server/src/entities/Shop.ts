import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Employee } from "./Employee";

@Entity("shops")
export class Shop {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column({ nullable: true })
    address!: string;

    @Column({ default: true })
    isActive!: boolean;

    @OneToMany(() => Employee, employee => employee.shop)
    employees!: Employee[];
}