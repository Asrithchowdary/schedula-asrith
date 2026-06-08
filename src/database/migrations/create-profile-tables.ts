import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileTables1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    await queryRunner.query(`
      CREATE TABLE "doctor_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "fullName" varchar(100) NOT NULL,
        "specialization" varchar(100) NOT NULL,
        "experience" integer NOT NULL,
        "qualification" varchar(200) NOT NULL,
        "consultationFee" numeric(10,2) NOT NULL,
        "availabilityHours" varchar(300),
        "profileDetails" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_doctor_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_doctor_profiles_user_id" UNIQUE ("user_id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "patient_profiles" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "fullName" varchar(100) NOT NULL,
        "age" integer NOT NULL,
        "gender" varchar(20) NOT NULL,
        "phone" varchar(20) NOT NULL,
        "address" varchar(300),
        "bloodGroup" varchar(20),
        "allergies" text,
        "medicalHistory" text,
        "emergencyContact" varchar(100),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_patient_profiles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_patient_profiles_user_id" UNIQUE ("user_id")
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      ADD CONSTRAINT "FK_doctor_profiles_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "patient_profiles"
      ADD CONSTRAINT "FK_patient_profiles_user"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "patient_profiles"
      DROP CONSTRAINT "FK_patient_profiles_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "doctor_profiles"
      DROP CONSTRAINT "FK_doctor_profiles_user"
    `);

    await queryRunner.query(`DROP TABLE "patient_profiles"`);
    await queryRunner.query(`DROP TABLE "doctor_profiles"`);
  }
}