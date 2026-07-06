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
import { DoctorLeave } from '../leave/doctor-leave.entity';

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

    @InjectRepository(DoctorLeave)
    private leaveRepository: Repository<DoctorLeave>,
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
    const doctorLeave =
  await this.leaveRepository.findOne({
    where: {
      doctor: {
        id: doctor.id,
      },
      leaveDate: body.date,
    },
  });
        console.log("Doctor ID:", doctor.id);
        console.log("Booking Date:", body.date);
        console.log("Doctor Leave:", doctorLeave);
  if (doctorLeave) {
    throw new BadRequestException(
      'Doctor is unavailable on this date. Please select another available date.',
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

console.log('Date:', body.date);

const appointmentDay = new Date(body.date)
  .toLocaleDateString('en-US', {
    weekday: 'long',
  })
  .toUpperCase();

  console.log('Day:', appointmentDay);

  const availabilities =
  await this.recurringRepository.find({
    where: {
      doctor: {
        id: doctor.id,
      },
      dayOfWeek: appointmentDay,
    },
    order: {
      startTime: 'ASC',
    },
  });

  console.log(availabilities.length);
console.log(availabilities);

if (availabilities.length === 0) {
  throw new BadRequestException(
    'Doctor is unavailable on this day',
  );
}

const availability =
  availabilities.find(
    slot =>
      slot.allowFutureBooking === true,
  ) ?? availabilities[0];

  console.log('========================');
console.log('CREATE APPOINTMENT API');
console.log(body);

  console.log('Appointment Day:', appointmentDay);
  console.log('Availabilities:', availabilities);
  console.log('Selected Availability:', availability);

if (
  availability.maxFutureBookingDays != null &&
  availability.maxFutureBookingDays < 0
) {
  throw new BadRequestException(
    'Invalid future booking configuration',
  );
}
console.log(
    'Selected',
    availability.id,
    availability.allowFutureBooking,
    availability.maxFutureBookingDays,
);

if (!availability.allowFutureBooking) {
  if (
    appointmentDate.getTime() !==
    today.getTime()
  ) {
    throw new BadRequestException(
      'Only today booking is allowed',
    );
  }
} else {
  const maxDays =
    availability.maxFutureBookingDays ?? 7;

  const lastBookingDate =
    new Date(today);

  lastBookingDate.setDate(
    today.getDate() + maxDays,
  );

  lastBookingDate.setHours(
    0,
    0,
    0,
    0,
  );

  if (
    appointmentDate.getTime() >
    lastBookingDate.getTime()
  ) {
    throw new BadRequestException(
      `Booking allowed only within ${maxDays} days`,
    );
  }
}

const toMinutes = (
  time: string,
): number => {
  const [hour, minute] =
    time.split(':').map(Number);

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

if (
  appointmentDate.getTime() ===
  today.getTime()
) {

  if(currentMinutes < bookingOpen){
      throw new BadRequestException(
          'Booking window has not opened yet'
      );
  }

  if(currentMinutes > bookingClose){
      throw new BadRequestException(
          'Booking window has closed'
      );
  }

}

let tokenNumber = null;

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