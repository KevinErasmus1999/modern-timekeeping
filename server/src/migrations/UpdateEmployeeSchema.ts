import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class UpdateEmployeeSchema1732528257138 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new columns with nullable true first
        await queryRunner.addColumns("employees", [
            new TableColumn({
                name: "surname",
                type: "varchar",
                isNullable: true,  // Important: Start as nullable
                default: "''"
            }),
            new TableColumn({
                name: "email",
                type: "varchar",
                isNullable: true,
                default: "''"
            }),
            new TableColumn({
                name: "cellNumber",
                type: "varchar",
                isNullable: true,
                default: "''"
            }),
            new TableColumn({
                name: "idNumber",
                type: "varchar",
                isNullable: true,
                default: "''"
            }),
            new TableColumn({
                name: "gender",
                type: "varchar",
                isNullable: true,
                default: "'male'"
            }),
            new TableColumn({
                name: "additionalFields",
                type: "text",
                isNullable: true,
            }),
            new TableColumn({
                name: "documents",
                type: "text",
                isNullable: true,
            })
        ]);

        // Update existing records with default values
        await queryRunner.query(`
            UPDATE employees
            SET surname = '',
                email = '',
                cellNumber = '',
                idNumber = '',
                gender = 'male',
                additionalFields = '{}',
                documents = '[]'
            WHERE surname IS NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop columns in reverse order
        const columns = [
            "documents",
            "additionalFields",
            "gender",
            "idNumber",
            "cellNumber",
            "email",
            "surname"
        ];

        for (const column of columns) {
            if (await queryRunner.hasColumn("employees", column)) {
                await queryRunner.dropColumn("employees", column);
            }
        }
    }
}