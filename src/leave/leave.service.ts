import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';

import { DoctorLeave } from './doctor-leave.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';

import { CreateLeaveDto } from './dto/create-leave.dto';
import { UpdateLeaveDto } from './dto/update-leave.dto';

@Injectable()
export class LeaveService {
  constructor(
    @InjectRepository(DoctorLeave)
    private leaveRepository: Repository<DoctorLeave>,

    @InjectRepository(DoctorProfile)
    private doctorRepository: Repository<DoctorProfile>,

    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,
  ) {}

  async createLeave(
    doctorId: number,
    dto: CreateLeaveDto,
  ) {
    const doctor =
      await this.doctorRepository.findOne({
        where: {
          user: {
            id: doctorId,
          },
        },
        relations: {
          user: true,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor profile not found',
      );
    }

    const leaveDate = new Date(dto.leaveDate);

    if (isNaN(leaveDate.getTime())) {
      throw new BadRequestException(
        'Invalid leave date',
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    leaveDate.setHours(0, 0, 0, 0);

    if (leaveDate < today) {
      throw new BadRequestException(
        'Past leave date is not allowed',
      );
    }

    const duplicate =
      await this.leaveRepository.findOne({
        where: {
          doctor: {
            id: doctor.id,
          },
          leaveDate: dto.leaveDate,
        },
      });

    if (duplicate) {
      throw new BadRequestException(
        'Leave already exists for this date',
      );
    }

    const appointments =
      await this.appointmentRepository.count({
        where: {
          doctor: {
            id: doctor.id,
          },
          appointmentDate: dto.leaveDate,
          status: Not(
            AppointmentStatus.CANCELLED,
          ),
        },
      });

    if (appointments > 0) {
      throw new BadRequestException(
        'Appointments are already scheduled on this date. Please cancel or reschedule them first.',
      );
    }

    const leave =
      this.leaveRepository.create({
        doctor,
        leaveDate: dto.leaveDate,
        reason: dto.reason,
      });

    return this.leaveRepository.save(
      leave,
    );
  }

  async getMyLeaves(
    doctorId: number,
  ) {
    const doctor =
      await this.doctorRepository.findOne({
        where: {
          user: {
            id: doctorId,
          },
        },
        relations: {
          user: true,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor profile not found',
      );
    }

    return this.leaveRepository.find({
      where: {
        doctor: {
          id: doctor.id,
        },
      },
      order: {
        leaveDate: 'ASC',
      },
    });
  }

  async updateLeave(
    leaveId: number,
    doctorId: number,
    dto: UpdateLeaveDto,
  ) {
    const leave =
      await this.leaveRepository.findOne({
        where: {
          id: leaveId,
        },
        relations: {
          doctor: true,
        },
      });

    if (!leave) {
      throw new NotFoundException(
        'Leave not found',
      );
    }

    const doctor =
      await this.doctorRepository.findOne({
        where: {
          user: {
            id: doctorId,
          },
        },
        relations: {
          user: true,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor profile not found',
      );
    }

    if (leave.doctor.id !== doctor.id) {
      throw new BadRequestException(
        'You can update only your own leave',
      );
    }

    if (dto.leaveDate) {
      const duplicate =
        await this.leaveRepository.findOne({
          where: {
            doctor: {
              id: doctor.id,
            },
            leaveDate: dto.leaveDate,
            id: Not(leaveId),
          },
        });

      if (duplicate) {
        throw new BadRequestException(
          'Leave already exists for this date',
        );
      }

      leave.leaveDate =
        dto.leaveDate;
    }

    if (dto.reason !== undefined) {
      leave.reason = dto.reason;
    }

    return this.leaveRepository.save(
      leave,
    );
  }

  async deleteLeave(
    leaveId: number,
    doctorId: number,
  ) {
    const leave =
      await this.leaveRepository.findOne({
        where: {
          id: leaveId,
        },
        relations: {
          doctor: true,
        },
      });

    if (!leave) {
      throw new NotFoundException(
        'Leave not found',
      );
    }

    const doctor =
      await this.doctorRepository.findOne({
        where: {
          user: {
            id: doctorId,
          },
        },
        relations: {
          user: true,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor profile not found',
      );
    }

    if (leave.doctor.id !== doctor.id) {
      throw new BadRequestException(
        'You can delete only your own leave',
      );
    }

    await this.leaveRepository.remove(
      leave,
    );

    return {
      success: true,
      message:
        'Doctor leave deleted successfully',
    };
  }
}