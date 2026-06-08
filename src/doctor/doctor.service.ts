import {Injectable,BadRequestException,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,
  ) {}

  async createProfile(data: any, user: any) {
    const existingProfile = await this.doctorRepo.findOne({
      where: {
        user: { id: user.userId },
      },
      relations: {user: true},
    });

    if (existingProfile) {
      throw new BadRequestException(
        'Doctor profile already exists',
      );
    }

    const profile = this.doctorRepo.create({
      ...data,
      user: { id: user.userId },
    });

    return this.doctorRepo.save(profile);
  }

  async getProfile(user: any) {
    const profile = await this.doctorRepo.findOne({
      where: {
        user: { id: user.userId },
      },
      relations: {user:true},
    });

    if (!profile) {
      throw new NotFoundException(
        'Doctor profile not found',
      );
    }

    return profile;
  }

  async updateProfile(data: any, user: any) {
    const profile = await this.getProfile(user);

    Object.assign(profile, data);

    return this.doctorRepo.save(profile);
  }
}