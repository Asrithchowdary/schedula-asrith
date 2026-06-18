import { DataSource } from 'typeorm';
import { config } from 'dotenv';

import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { User } from '../users/entities/user.entity';

config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'schedula',

  entities: [
    User,
    DoctorProfile,
    PatientProfile,
  ],

  migrations: ['src/database/migrations/*.ts'],

  synchronize: false,
  logging: true,
});