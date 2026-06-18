import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

import { DoctorProfile } from './doctor-profile.entity';
import { RecurringAvailability } from '../availability/recurring-availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorProfile,
      RecurringAvailability,
    ]),
  ],
  controllers: [DoctorController],
  providers: [DoctorService],
})
export class DoctorModule {}