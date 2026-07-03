import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecurringAvailability } from './recurring-availability.entity';
import { CustomAvailability } from './custom-availability.entity';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { UpdateFutureBookingDto } from './dto/update-future-booking.dto';
import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification-type.enum';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,

    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,

    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    private readonly notificationService: NotificationService,
  ) {}

  private validateTimeRange(
    startTime: string,
    endTime: string,
  ) {
    if (startTime >= endTime) {
      throw new BadRequestException(
        'End time must be greater than start time',
      );
    }
  }

  private isOverlapping(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ): boolean {
    return start1 < end2 && end1 > start2;
  }

  async createRecurring(
    data: any,
    userId: number,
  ) {
    this.validateTimeRange(
      data.startTime,
      data.endTime,
    );

    const doctor =
      await this.doctorRepo.findOne({
        where: {
          user: {
            id: userId,
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

    const existing =
      await this.recurringRepo.find({
        where: {
          dayOfWeek: data.dayOfWeek,
          doctor: {
            id: doctor.id,
          },
        },
      });

    const duplicate =
      existing.find(
        slot =>
          slot.startTime ===
            data.startTime &&
          slot.endTime ===
            data.endTime,
      );

    if (duplicate) {
      throw new BadRequestException(
        'Duplicate availability exists',
      );
    }

    for (const slot of existing) {
      if (
        this.isOverlapping(
          data.startTime,
          data.endTime,
          slot.startTime,
          slot.endTime,
        )
      ) {
        throw new BadRequestException(
          'Time slot overlaps with existing availability',
        );
      }
    }

    const availability =
      this.recurringRepo.create({
        ...data,
        doctor,
      });

    return this.recurringRepo.save(
      availability,
    );
  }

  async getRecurring(
    userId: number,
  ) {
    const doctor =
      await this.doctorRepo.findOne({
        where: {
          user: {
            id: userId,
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

    return this.recurringRepo.find({
      where: {
        doctor: {
          id: doctor.id,
        },
      },
    });
  }

  async updateRecurring(
    id: number,
    data: any,
  ) {
    const availability =
      await this.recurringRepo.findOne({
        where: { id },
      });

    if (!availability) {
      throw new NotFoundException(
        'Availability not found',
      );
    }

    this.validateTimeRange(
      data.startTime ??
        availability.startTime,
      data.endTime ??
        availability.endTime,
    );

    Object.assign(
      availability,
      data,
    );

    return this.recurringRepo.save(
      availability,
    );
  }

  async deleteRecurring(
    id: number,
  ) {
    const availability =
      await this.recurringRepo.findOne({
        where: { id },
      });

    if (!availability) {
      throw new NotFoundException(
        'Availability not found',
      );
    }

    await this.recurringRepo.remove(
      availability,
    );

    return {
      message:
        'Availability deleted successfully',
    };
  }

  async createOverride(
    data: any,
    userId: number,
  ) {
    this.validateTimeRange(
      data.startTime,
      data.endTime,
    );

    const doctor =
      await this.doctorRepo.findOne({
        where: {
          user: {
            id: userId,
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

    const existing =
      await this.customRepo.find({
        where: {
          date: data.date,
          doctor: {
            id: doctor.id,
          },
        },
      });

    for (const slot of existing) {
      if (
        this.isOverlapping(
          data.startTime,
          data.endTime,
          slot.startTime,
          slot.endTime,
        )
      ) {
        throw new BadRequestException(
          'Override slot overlaps existing slot',
        );
      }
    }

  const availability =
  this.customRepo.create({
    ...data,
    doctor,
  });

const appointments =
  await this.appointmentRepo.find({
    where: {
      doctor: {
        id: doctor.id,
      },
      appointmentDate: data.date,
      status: AppointmentStatus.BOOKED,
    },
    relations: {
      patient: true,
    },
  });

const affectedAppointments =
  appointments.filter(
    appointment =>
      appointment.startTime <
        data.startTime ||
      appointment.endTime >
        data.endTime,
  );

await this.customRepo.save(
  availability,
);

for (const appointment of affectedAppointments) {

  appointment.status =
    AppointmentStatus.CANCELLED;

  await this.appointmentRepo.save(
    appointment,
  );

  await this.notificationService.createNotification(
    appointment.patient.id,
    'Appointment Cancelled',
    'Your appointment has been cancelled because the doctor updated their availability. Please book another appointment.',
    NotificationType.APPOINTMENT_CANCELLED,
  );
}

return {
  success: true,
  message:
    'Availability override created successfully.',
  cancelledAppointments:
    affectedAppointments.length,
};
  }
  async getAvailabilityByDate(
    date: string,
    userId: number,
  ) {
    const doctor =
      await this.doctorRepo.findOne({
        where: {
          user: {
            id: userId,
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

    const override =
      await this.customRepo.find({
        where: {
          date,
          doctor: {
            id: doctor.id,
          },
        },
      });

    if (override.length > 0) {
      return override;
    }

    const day =
      new Date(date)
        .toLocaleDateString(
          'en-US',
          {
            weekday: 'long',
          },
        )
        .toUpperCase();

    return this.recurringRepo.find({
      where: {
        dayOfWeek: day,
        doctor: {
          id: doctor.id,
        },
      },
    });
  }

  async updateFutureBooking(
  doctorId: number,
  dto: UpdateFutureBookingDto,
) {

  await this.recurringRepo.update(
    {
      doctor: {
        id: doctorId,
      },
    },
    {
      allowFutureBooking:
        dto.allowFutureBooking,
      maxFutureBookingDays:
        dto.maxFutureBookingDays,
    },
  );
  return this.recurringRepo.find({
    where: {
      doctor: {
        id: doctorId,
      },
    },
    order: {
      dayOfWeek: 'ASC',
      startTime: 'ASC',
    },
  });
}
}
