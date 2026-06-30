import {
  Controller,
  Get,
  Patch,
  Param,
} from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

  @Get(':patientId')
  getNotifications(
    @Param('patientId') patientId: number,
  ) {
    return this.notificationService.getNotifications(
      Number(patientId),
    );
  }

  @Patch(':id/read')
  markAsRead(
    @Param('id') id: number,
  ) {
    return this.notificationService.markAsRead(
      Number(id),
    );
  }

  @Patch(':patientId/read-all')
  markAllAsRead(
    @Param('patientId') patientId: number,
  ) {
    return this.notificationService.markAllAsRead(
      Number(patientId),
    );
  }

  @Get(':patientId/unread-count')
  getUnreadCount(
    @Param('patientId') patientId: number,
  ) {
    return this.notificationService.getUnreadCount(
      Number(patientId),
    );
  }
}