import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { RecurringAvailability } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { RolesGuard } from '../auth/roles.guard';
import { Appointment } from '../appointment/appointment.entity';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecurringAvailability,
      CustomAvailability,
      DoctorProfile,
      Appointment,
    ]),
    NotificationModule,
  ],
  controllers: [
    AvailabilityController,
  ],
  providers: [
    AvailabilityService,RolesGuard,
  ],
})
export class AvailabilityModule {}