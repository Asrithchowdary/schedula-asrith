import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from '../appointment/appointment.entity';
import { Notification } from '../notification/notification.entity';
import { AppointmentModule } from '../appointment/appointment.module';
import { NotificationModule } from '../notification/notification.module';
import { ReminderService } from './reminder.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Appointment,
      Notification,
    ]),
    AppointmentModule,
    NotificationModule,
  ],
  providers: [ReminderService],
})
export class ReminderModule {}