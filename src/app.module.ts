import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DoctorModule } from './doctor/doctor.module';
import { PatientModule } from './patient/patient.module';
import { User } from './users/entities/user.entity';
import { DoctorProfile } from './doctor/doctor-profile.entity';
import { PatientProfile } from './patient/patient-profile.entity';
import { RecurringAvailability } from './availability/recurring-availability.entity';
import { CustomAvailability } from './availability/custom-availability.entity';
import { AvailabilityModule } from './availability/availability.module';
import { SlotModule } from './slot/slot.module';
import { Slot } from './slot/slot.entity';
import { AppointmentModule } from './appointment/appointment.module';
import { Appointment } from './appointment/appointment.entity';

console.log(
  'DATABASE_URL = ',
  process.env.DATABASE_URL,
);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',

      url: process.env.DATABASE_URL,

      ssl: {
        rejectUnauthorized: false,
      },

      autoLoadEntities: true,

      entities: [
        User,
        DoctorProfile,
        PatientProfile,
        RecurringAvailability,
        CustomAvailability,
        Slot,
      ],

      synchronize: true,
    }),

    AuthModule,
    UsersModule,
    DoctorModule,
    PatientModule,
    AvailabilityModule,
    SlotModule,
    AppointmentModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}