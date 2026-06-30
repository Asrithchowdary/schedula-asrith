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
import { RecurringAvailability } from '../availability/recurring-availability.entity';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    @InjectRepository(DoctorProfile)
    private doctorRepository: Repository<DoctorProfile>,

    @InjectRepository(PatientProfile)
    private patientRepository: Repository<PatientProfile>,

    @InjectRepository(RecurringAvailability)
    private recurringRepository: Repository<RecurringAvailability>,
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
  const nextAvailable =
    await this.getNextAvailable(
      doctor.id,
    );

  return {
    success: false,
    message:
      'Selected day fully booked',
    nextAvailable,
  };
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
  const nextAvailable =
    await this.getNextAvailable(
      doctor.id,
    );

  return {
    success: false,
    message:
      'Selected slot unavailable',
    nextAvailable,
  };
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
async getNextAvailable(
  doctorId: number,
) {
  const doctor =
    await this.doctorRepository.findOne({
      where: { id: doctorId },
    });

  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }

  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const checkDate = new Date();
    checkDate.setDate(
      today.getDate() + i,
    );

    const dayName =
      checkDate.toLocaleDateString(
        'en-US',
        {
          weekday: 'long',
        },
      );

    const schedule =
      await this.recurringRepository.findOne({
        where: {
          doctor: {
            id: doctorId,
          },
          dayOfWeek: dayName,
        },
      });

    if (!schedule) {
      continue;
    }

    const bookedCount =
      await this.appointmentRepository.count({
        where: {
          doctor: {
            id: doctorId,
          },
          appointmentDate:
            checkDate
              .toISOString()
              .split('T')[0],
          status:
            AppointmentStatus.BOOKED,
        },
      });

    if (
      schedule.schedulingType ===
      'WAVE'
    ) {
      if (
        bookedCount <
        schedule.maxCapacity
      ) {
        return {
          success: true,
          availableDate:
            checkDate
              .toISOString()
              .split('T')[0],
          schedulingType: 'WAVE',
          availableSlots:
            schedule.maxCapacity -
            bookedCount,
          startTime:
            schedule.startTime,
          endTime:
            schedule.endTime,
        };
      }
    }

    if (
      schedule.schedulingType ===
      'STREAM'
    ) {
      const totalMinutes =
        this.calculateMinutes(
          schedule.startTime,
          schedule.endTime,
        );

      const slotCount =
        Math.floor(
          totalMinutes /
            ((schedule.slotDuration || 15) +
              (schedule.bufferTime || 0)),
        );

      if (
        bookedCount < slotCount
      ) {
        return {
          success: true,
          availableDate:
            checkDate
              .toISOString()
              .split('T')[0],
          schedulingType: 'STREAM',
          availableSlots:
            slotCount -
            bookedCount,
          startTime:
            schedule.startTime,
          endTime:
            schedule.endTime,
        };
      }
    }
  }

  return {
    success: false,
    message:
      'No appointments available in next 30 days',
  };
}
private calculateMinutes(
  start: string,
  end: string,
): number {
  const [startHour, startMinute] =
    start.split(':').map(Number);

  const [endHour, endMinute] =
    end.split(':').map(Number);

  return (
    endHour * 60 +
    endMinute -
    (startHour * 60 + startMinute)
  );
}
}