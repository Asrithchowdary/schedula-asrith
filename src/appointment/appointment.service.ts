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
  date?: string,
) {
  const whereCondition: any = {
    doctor: {
      id: doctorId,
    },
    status: AppointmentStatus.BOOKED,
  };

  if (date) {
    whereCondition.appointmentDate = date;
  }

  const appointments =
    await this.appointmentRepository.find({
      where: whereCondition,
      relations: {
        patient: true,
        doctor: true,
      },
      order: {
        appointmentDate: 'ASC',
      },
    });

  if (!appointments.length) {
    throw new NotFoundException(
      'No appointments found',
    );
  }

  return appointments;
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
async getNextAvailable(
  doctorId: number,
) {
  const doctor =
    await this.doctorRepository.findOne({
      where: {
        id: doctorId,
      },
    });

  if (!doctor) {
    throw new NotFoundException(
      'Doctor not found',
    );
  }

  const schedules =
    await this.recurringRepository.find({
      where: {
        doctor: {
          id: doctorId,
        },
      },
    });

  if (schedules.length === 0) {
    throw new BadRequestException(
      'Doctor unavailable',
    );
  }

  for (
    let i = 0;
    i < 30;
    i++
  ) {
    const currentDate =
      new Date();

    currentDate.setDate(
      currentDate.getDate() + i,
    );

    const dayName =
      this.getDayName(
        currentDate,
      );

    const schedule =
      schedules.find(
        (s) =>
          s.dayOfWeek.toLowerCase() ===
          dayName.toLowerCase(),
      );

    if (!schedule) {
      continue;
    }

    const dateString =
      currentDate
        .toISOString()
        .split('T')[0];

    const bookedCount =
      await this.appointmentRepository.count({
        where: {
          doctor: {
            id: doctorId,
          },
          appointmentDate:
            dateString,
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
            dateString,
          schedulingType:
            'WAVE',
          availableTokens:
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

      const slotMinutes =
        schedule.slotDuration +
        schedule.bufferTime;

      const totalSlots =
        Math.floor(
          totalMinutes /
            slotMinutes,
        );

      if (
        bookedCount <
        totalSlots
      ) {
        return {
          success: true,
          availableDate:
            dateString,
          schedulingType:
            'STREAM',
          availableSlots:
            totalSlots -
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
      'No appointments available in the next 30 working days',
  };
}
private getDayName(
  date: Date,
): string {
  return date.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
    },
  );
}
private calculateMinutes(
  start: string,
  end: string,
): number {
  const [sh, sm] =
    start.split(':').map(Number);

  const [eh, em] =
    end.split(':').map(Number);

  return (
    eh * 60 +
    em -
    (sh * 60 + sm)
  );
}
}