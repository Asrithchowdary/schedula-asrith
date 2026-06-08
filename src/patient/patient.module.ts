import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientProfile } from './patient-profile.entity';
import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';


@Module({
  imports: [TypeOrmModule.forFeature([PatientProfile])],
  controllers: [PatientController],
  providers: [PatientService],
})
export class PatientModule {}