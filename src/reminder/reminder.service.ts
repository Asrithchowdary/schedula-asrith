import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Appointment } from '../appointment/appointment.entity';
import { AppointmentStatus } from '../appointment/appointment-status.enum';

import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notification-type.enum';

@Injectable()
export class ReminderService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepository: Repository<Appointment>,

    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sendReminders() {
    console.log('==============================');
    console.log('Running Reminder Cron');

    const appointments =
      await this.appointmentRepository.find({
        relations: {
          doctor: true,
          patient: true,
        },
      });

    console.log(
      `Appointments Found: ${appointments.length}`,
    );

    const today = new Date()
      .toISOString()
      .split('T')[0];

    console.log('Today:', today);

    for (const appointment of appointments) {
      console.log(
        `Checking Appointment ${appointment.id}`,
      );

      // Skip cancelled
      if (
        appointment.status ===
        AppointmentStatus.CANCELLED
      ) {
        console.log('Skipped : Cancelled');
        continue;
      }

      // Skip completed
      if (
        appointment.status ===
        AppointmentStatus.COMPLETED
      ) {
        console.log('Skipped : Completed');
        continue;
      }

      // Skip already reminded
      if (appointment.reminderSent) {
        console.log(
          'Skipped : Reminder already sent',
        );
        continue;
      }

      // Skip future appointments
      if (
        appointment.appointmentDate !== today
      ) {
        console.log(
          'Skipped : Not today appointment',
        );
        continue;
      }

      let message = '';

      if (
        appointment.schedulingType ===
        'STREAM'
      ) {
        message = `Reminder: You have an appointment with Dr. ${appointment.doctor.fullName}

Date: ${appointment.appointmentDate}

Time: ${appointment.startTime}`;
      } else {
        message = `Reminder: You have an appointment with Dr. ${appointment.doctor.fullName}

Reporting Time: ${appointment.startTime}

Token Number: ${appointment.tokenNumber}`;
      }

      console.log(
        `Sending reminder for Appointment ${appointment.id}`,
      );

      await this.notificationService.createNotification(
        appointment.patient.id,
        'Appointment Reminder',
        message,
        NotificationType.APPOINTMENT_REMINDER,
      );

      appointment.reminderSent = true;

      await this.appointmentRepository.save(
        appointment,
      );

      console.log(
        `Reminder Sent Successfully for Appointment ${appointment.id}`,
      );
    }

    console.log('Reminder Cron Finished');
    console.log('==============================');
  }
}