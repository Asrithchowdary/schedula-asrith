import {Injectable,BadRequestException,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PatientProfile } from './patient-profile.entity';

@Injectable()
export class PatientService {
  constructor(
    @InjectRepository(PatientProfile)
    private patientRepo: Repository<PatientProfile>,
  ) {}

  async createProfile(data: any, user: any) {
    const existingProfile = await this.patientRepo.findOne({
      where: {
        user: { id: user.userId },
      },
      relations: {user:true},
    });

    if (existingProfile) {
      throw new BadRequestException(
        'Patient profile already exists',
      );
    }

    const profile = this.patientRepo.create({
      ...data,
      user: { id: user.userId },
    });

    return this.patientRepo.save(profile);
  }

  async getProfile(user: any) {
    const profile = await this.patientRepo.findOne({
      where: {
        user: { id: user.userId },
      },
      relations: {user: true},
    });

    if (!profile) {
      throw new NotFoundException(
        'Patient profile not found',
      );
    }

    return profile;
  }

  async updateProfile(data: any, user: any) {
    const profile = await this.getProfile(user);

    Object.assign(profile, data);

    return this.patientRepo.save(profile);
  }
}