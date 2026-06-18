import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Slot } from './slot.entity';
import { SlotService } from './slot.service';
import { SlotController } from './slot.controller';

import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { RecurringAvailability } from '../availability/recurring-availability.entity';
import { CustomAvailability } from '../availability/custom-availability.entity';
import { Appointment } from '../appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Slot,
      DoctorProfile,
      RecurringAvailability,
      CustomAvailability,
      Appointment,
    ]),
  ],
  controllers: [SlotController],
  providers: [SlotService],
})
export class SlotModule {}