import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LeaveController } from './leave.controller';
import { LeaveService } from './leave.service';

import { DoctorLeave } from './doctor-leave.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { Appointment } from '../appointment/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DoctorLeave,
      DoctorProfile,
      Appointment,
    ]),
  ],
  controllers: [
    LeaveController,
  ],
  providers: [
    LeaveService,
  ],
  exports: [
    LeaveService,
    TypeOrmModule,
  ],
})
export class LeaveModule {}