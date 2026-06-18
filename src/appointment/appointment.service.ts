import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from './appointment.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { AppointmentStatus } from './appointment-status.enum';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(DoctorProfile)
    private doctorRepository: Repository<DoctorProfile>,

    @InjectRepository(PatientProfile)
    private patientRepository: Repository<PatientProfile>,
  ) {}

  async createAppointment(
    patientId: number,
    body: any,
  ) {
    const doctor =
      await this.doctorRepository.findOne({
        where: {
          id: body.doctorId,
        },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor not found',
      );
    }

    const patient =
      await this.patientRepository.findOne({
        where: {
          id: patientId,
        },
      });

    if (!patient) {
      throw new NotFoundException(
        'Patient not found',
      );
    }

    const appointmentDate =
      new Date(body.date);

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (appointmentDate < today) {
      throw new BadRequestException(
        'Past date not allowed',
      );
    }

    let tokenNumber = null;

    if (
      doctor.schedulingType === 'WAVE'
    ) {
      const bookingCount =
        await this.appointmentRepository.count({
          where: {
            doctor: {
              id: doctor.id,
            },
            appointmentDate: body.date,
            status:
              AppointmentStatus.BOOKED,
          },
        });

      if (
        bookingCount >=
        doctor.waveCapacity
      ) {
        throw new BadRequestException(
          'Wave capacity reached',
        );
      }

      tokenNumber = bookingCount + 1;
    }

    const existingAppointment =
      await this.appointmentRepository.findOne({
        where: {
          doctor: {
            id: doctor.id,
          },
          appointmentDate: body.date,
          startTime: body.startTime,
          endTime: body.endTime,
          status:
            AppointmentStatus.BOOKED,
        },
      });

    if (
      doctor.schedulingType ===
        'STREAM' &&
      existingAppointment
    ) {
      throw new BadRequestException(
        'Slot already booked',
      );
    }

    const appointment =
      this.appointmentRepository.create({
        doctor,
        patient,
        appointmentDate: body.date,
        startTime: body.startTime,
        endTime: body.endTime,
        schedulingType:
          doctor.schedulingType,
        tokenNumber,
        status:
          AppointmentStatus.BOOKED,
      });

    await this.appointmentRepository.save(
      appointment,
    );

    return {
      success: true,
      appointmentId: appointment.id,
      date:
        appointment.appointmentDate,
      startTime:
        appointment.startTime,
      endTime:
        appointment.endTime,
      schedulingType:
        appointment.schedulingType,
      tokenNumber:
        appointment.tokenNumber,
    };
  }

  async getMyAppointments(
    patientId: number,
  ) {
    return this.appointmentRepository.find({
      where: {
        patient: {
          id: patientId,
        },
      },
      relations: {
        doctor: true,
      },
      order: {
        appointmentDate: 'ASC',
      },
    });
  }

  async getDoctorAppointments(
    doctorId: number,
  ) {
    return this.appointmentRepository.find({
      where: {
        doctor: {
          id: doctorId,
        },
      },
      relations: {
        patient: true,
      },
      order: {
        appointmentDate: 'ASC',
      },
    });
  }

  async cancelAppointment(
    appointmentId: number,
  ) {
    const appointment =
      await this.appointmentRepository.findOne({
        where: {
          id: appointmentId,
        },
      });

    if (!appointment) {
      throw new NotFoundException(
        'Appointment not found',
      );
    }

    if (
      appointment.status ===
      AppointmentStatus.CANCELLED
    ) {
      throw new BadRequestException(
        'Appointment already cancelled',
      );
    }

    appointment.status =
      AppointmentStatus.CANCELLED;

    return await this.appointmentRepository.save(
      appointment,
    );
  }
  async rescheduleAppointment(
  appointmentId: number,
  body: any,
) {
  const appointment =
    await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
      },
      relations: {
        doctor: true,
        patient: true,
      },
    });

  if (!appointment) {
    throw new NotFoundException(
      'Appointment not found',
    );
  }

  if (
    appointment.status ===
    AppointmentStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Cannot reschedule cancelled appointment',
    );
  }

  const newDate =
    new Date(body.newDate);

  const today = new Date();

  if (newDate < today) {
    throw new BadRequestException(
      'Cannot reschedule to past date',
    );
  }

  if (
    appointment.appointmentDate ===
      body.newDate &&
    appointment.startTime ===
      body.startTime &&
    appointment.endTime ===
      body.endTime
  ) {
    throw new BadRequestException(
      'Cannot reschedule to same slot'
    );
  }

  const existing =
    await this.appointmentRepository.findOne({
      where: {
        doctor: {
          id: appointment.doctor.id,
        },
        appointmentDate:
          body.newDate,
        startTime:
          body.startTime,
        endTime:
          body.endTime,
        status:
          AppointmentStatus.BOOKED,
      },
    });

  if (
    appointment.schedulingType ===
      'STREAM' &&
    existing
  ) {
    throw new BadRequestException(
      'Requested slot unavailable'
    );
  }

  if (
    appointment.schedulingType ===
    'WAVE'
  ) {
    const count =
      await this.appointmentRepository.count({
        where: {
          doctor: {
            id: appointment.doctor.id,
          },
          appointmentDate:
            body.newDate,
          status:
            AppointmentStatus.BOOKED,
        },
      });

    if (
      count >=
      appointment.doctor.waveCapacity
    ) {
      throw new BadRequestException(
        'Wave capacity full'
      );
    }

    appointment.tokenNumber =
      count + 1;
  }

  appointment.appointmentDate =
    body.newDate;

  appointment.startTime =
    body.startTime;

  appointment.endTime =
    body.endTime;

  await this.appointmentRepository.save(
    appointment,
  );

  return {
    message:
      'Appointment rescheduled successfully',
    appointmentId:
      appointment.id,
    date:
      appointment.appointmentDate,
    startTime:
      appointment.startTime,
    endTime:
      appointment.endTime,
    tokenNumber:
      appointment.tokenNumber,
  };
}
}