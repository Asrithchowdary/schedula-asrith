import {Injectable,NotFoundException,BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment } from './appointment.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { AppointmentStatus } from './appointment-status.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification-type.enum';
import { RecurringAvailability } from '../availability/recurring-availability.entity';


@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    private readonly notificationService: NotificationService,

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

  const appointmentDate = new Date(body.date);

if (isNaN(appointmentDate.getTime())) {
  throw new BadRequestException(
    'Invalid date format',
  );
}

const today = new Date();
today.setHours(0, 0, 0, 0);
appointmentDate.setHours(0, 0, 0, 0);

if (appointmentDate.getTime() < today.getTime()) {
  throw new BadRequestException(
    'Booking for past dates is not allowed',
  );
}
if (appointmentDate.getTime() > today.getTime()) {
  throw new BadRequestException(
    'Booking is allowed only for today',
  );
}

const appointmentDay = new Date(body.date)
  .toLocaleDateString('en-US', {
    weekday: 'long',
  })
  .toUpperCase();

  console.log('Request Body:', body);

console.log('Appointment Day:', appointmentDay);

const availability =
  await this.recurringRepository.findOne({
    where: {
      doctor: { id: doctor.id },
      dayOfWeek: appointmentDay,
    },
    order: {
      startTime: 'ASC',
    },
  });

  console.log('Availability:', availability);
 
if (!availability) {
  throw new BadRequestException(
    'Doctor is unavailable today',
  );
}

const toMinutes = (
  time: string,
): number => {
  const [hour, minute] = time
    .split(':')
    .map(Number);

  return hour * 60 + minute;
};

const consultationStart =
  toMinutes(availability.startTime);

const consultationEnd =
  toMinutes(availability.endTime);


const bookingOpen =
  consultationStart - 120;


const bookingClose =
  consultationEnd - 60;


const now = new Date();

const currentMinutes =
  now.getHours() * 60 +
  now.getMinutes();

if (currentMinutes < bookingOpen) {
  throw new BadRequestException(
    'Booking window has not opened yet',
  );
}

if (currentMinutes > bookingClose) {
  throw new BadRequestException(
    'Booking window has closed',
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
  newDate: string,
  startTime: string,
  endTime: string,
) {
  const appointment =
    await this.appointmentRepository.findOne({
      where: {
        id: appointmentId,
      },
      relations: {
        patient: true,
        doctor: true,
      },
    });

  if (!appointment) {
    throw new NotFoundException(
      'Appointment not found',
    );
  }

  if (
    appointment.status === 'CANCELLED'
  ) {
    throw new BadRequestException(
      'Cancelled appointment cannot be rescheduled',
    );
  }

  appointment.appointmentDate =
    newDate;

  appointment.startTime =
    startTime;

  appointment.endTime =
    endTime;

  const updatedAppointment =
    await this.appointmentRepository.save(
      appointment,
    );

  await this.notificationService.createNotification(
    appointment.patient.id,
    'Appointment Rescheduled',
    `Your appointment has been rescheduled to ${newDate} from ${startTime} to ${endTime}`,
    NotificationType.APPOINTMENT_RESCHEDULED,
  );

  return {
    success: true,
    message:
      'Appointment rescheduled successfully',
    appointment:
      updatedAppointment,
  };
}
}