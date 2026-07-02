import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from './appointment.entity';
import { AppointmentController } from './appointment.controller';
import { AppointmentService } from './appointment.service';

import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { NotificationModule } from '../notification/notification.module';
import { RecurringAvailability } from '../availability/recurring-availability.entity';
import { DoctorLeave } from '../leave/doctor-leave.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      DoctorProfile,
      PatientProfile,
      RecurringAvailability,
      DoctorLeave,
    ]),
    NotificationModule,
  ],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}