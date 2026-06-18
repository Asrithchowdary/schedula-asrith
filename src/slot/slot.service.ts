import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { RecurringAvailability } from '../availability/recurring-availability.entity';
import { CustomAvailability } from '../availability/custom-availability.entity';

@Injectable()
export class SlotService {
  constructor(
    @InjectRepository(DoctorProfile)
    private doctorRepo: Repository<DoctorProfile>,

    @InjectRepository(RecurringAvailability)
    private recurringRepo: Repository<RecurringAvailability>,

    @InjectRepository(CustomAvailability)
    private customRepo: Repository<CustomAvailability>,
  ) {}

  async getSlots(
    doctorId: number,
    date: string,
    duration: number,
  ) {
    if (!date) {
      throw new BadRequestException(
        'Date is required',
      );
    }

    if (
      duration !== 10 &&
      duration !== 15 &&
      duration !== 30
    ) {
      throw new BadRequestException(
        'Duration must be 10, 15 or 30 minutes',
      );
    }

    const doctor =
      await this.doctorRepo.findOne({
        where: { id: doctorId },
      });

    if (!doctor) {
      throw new NotFoundException(
        'Doctor not found',
      );
    }

    const selectedDate =
      new Date(date);

    if (
      isNaN(selectedDate.getTime())
    ) {
      throw new BadRequestException(
        'Invalid date',
      );
    }

    const today = new Date();

    today.setHours(
      0,
      0,
      0,
      0,
    );

    if (selectedDate < today) {
      throw new BadRequestException(
        'Past date not allowed',
      );
    }

    const custom =
      await this.customRepo.find({
        where: {
          doctor: {
            id: doctorId,
          },
          date,
        },
      });

    let availability: any[] = [];

    if (custom.length > 0) {
      availability = custom;
    } else {
      const dayName =
        selectedDate
          .toLocaleDateString(
            'en-US',
            {
              weekday: 'long',
            },
          )
          .toUpperCase();

      availability =
        await this.recurringRepo.find({
          where: {
            doctor: {
              id: doctorId,
            },
            dayOfWeek: dayName,
          },
        });
    }

    if (
      availability.length === 0
    ) {
      throw new NotFoundException(
        'No availability found',
      );
    }

    const slots = [];

    const now = new Date();

    for (const item of availability) {
      const start =
        this.convertToMinutes(
          item.startTime,
        );

      const end =
        this.convertToMinutes(
          item.endTime,
        );

      let current = start;

      while (
        current + duration <= end
      ) {
        const slotStart =
          this.minutesToTime(
            current,
          );

        const slotEnd =
          this.minutesToTime(
            current +
              duration,
          );

        const slotDateTime =
          new Date(
            `${date}T${slotStart}:00`,
          );

        if (
          slotDateTime > now
        ) {
          slots.push({
            startTime:
              slotStart,
            endTime:
              slotEnd,
          });
        }

        current += duration;
      }
    }

    if (
      slots.length === 0
    ) {
      throw new NotFoundException(
        'No future slots available',
      );
    }

    return slots;
  }

  private convertToMinutes(
    time: string,
  ): number {
    const [h, m] =
      time
        .split(':')
        .map(Number);

    return h * 60 + m;
  }

  private minutesToTime(
    minutes: number,
  ): string {
    const h = Math.floor(
      minutes / 60,
    );

    const m = minutes % 60;

    return `${String(h).padStart(
      2,
      '0',
    )}:${String(m).padStart(
      2,
      '0',
    )}`;
  }
}