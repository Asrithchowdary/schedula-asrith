import {Injectable,BadRequestException,NotFoundException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike,} from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,
  ) {}

  // Create Doctor Profile
  async createProfile(
    data: any,
    user: any,
  ) {
    const existingProfile =
      await this.doctorRepo.findOne({
        where: {
          user: {
            id: user.userId,
          },
        },
        relations: {
          user: true,
        },
      });

    if (existingProfile) {
      throw new BadRequestException(
        'Doctor profile already exists',
      );
    }

    const profile =
      this.doctorRepo.create({
        ...data,
        user: {
          id: user.userId,
        },
      });

    return this.doctorRepo.save(profile);
  }

  // Get Logged In Doctor Profile
  async getProfile(user: any) {
    const profile =
      await this.doctorRepo.findOne({
        where: {
          user: {
            id: user.userId,
          },
        },
        relations: {
          user: true,
        },
      });

    if (!profile) {
      throw new NotFoundException(
        'Doctor profile not found',
      );
    }

    return profile;
  }

  // Update Doctor Profile
  async updateProfile(
    data: any,
    user: any,
  ) {
    const profile =
      await this.getProfile(user);

    Object.assign(
      profile,
      data,
    );

    return this.doctorRepo.save(
      profile,
    );
  }

  // Doctor Discovery API
  async getDoctors(
    specialization?: string,
    search?: string,
    availability?:string,
    page = 1,
    limit = 10,
  ) {
    if (
      page <= 0 ||
      limit <= 0
    ) {
      throw new BadRequestException(
        'Page and limit must be positive numbers',
      );
    }

    const where: any = {};

    if (specialization) {
      where.specialization =
        ILike(`%${specialization}%`);
    }

    if (search) {
      where.fullName =
        ILike(`%${search}%`);
    }

    const [
      doctors,
      total,
    ] =
      await this.doctorRepo.findAndCount({
        where,
        select: {
          id: true,
          fullName: true,
          specialization: true,
          experience: true,
          consultationFee: true,
          availabilityHours: true,
        },
        skip:
          (page - 1) * limit,
        take: limit,
      });

    if (
      doctors.length === 0
    ) {
      throw new NotFoundException(
        'No doctors found',
      );
    }

    return {
      total,
      page,
      limit,
      data: doctors,
    };
  }

  // Get Doctor By ID
  async getDoctorById(
    id: number,
  ) {
    const doctor =
      await this.doctorRepo.findOne({
        where: {
          id,
        },
        relations: {
          user: true,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        `Doctor with id ${id} not found`,
      );
    }

    return doctor;
  }
}