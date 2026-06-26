import {Injectable,NotFoundException,BadRequestException,} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationType } from './notification-type.enum';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async createNotification(
    patientId: number,
    title: string,
    message: string,
    type: NotificationType,
  ) {
    const notification =
      this.notificationRepository.create({
        patientId,
        title,
        message,
        type,
        isRead: false,
      });

    return await this.notificationRepository.save(
      notification,
    );
  }

  async getNotifications(
    patientId: number,
  ) {
    const notifications =
      await this.notificationRepository.find({
        where: {
          patientId,
        },
        order: {
          createdAt: 'DESC',
        },
      });

    if (!notifications.length) {
      return {
        success: false,
        message:
          'No notifications available',
      };
    }

    return {
      success: true,
      notifications,
    };
  }

  async markAsRead(
    notificationId: number,
  ) {
    const notification =
      await this.notificationRepository.findOne({
        where: {
          id: notificationId,
        },
      });

    if (!notification) {
      throw new NotFoundException(
        'Notification not found',
      );
    }

    if (notification.isRead) {
      throw new BadRequestException(
        'Notification already marked as read',
      );
    }

    notification.isRead = true;

    await this.notificationRepository.save(
      notification,
    );

    return {
      success: true,
      message:
        'Notification marked as read',
      notification,
    };
  }

  async markAllAsRead(
    patientId: number,
  ) {
    const notifications =
      await this.notificationRepository.find({
        where: {
          patientId,
          isRead: false,
        },
      });

    if (
      notifications.length === 0
    ) {
      return {
        success: false,
        message:
          'No unread notifications found',
      };
    }

    for (const notification of notifications) {
      notification.isRead = true;
    }

    await this.notificationRepository.save(
      notifications,
    );

    return {
      success: true,
      message:
        'All notifications marked as read',
      updatedCount:
        notifications.length,
    };
  }

  async getUnreadCount(
    patientId: number,
  ) {
    const count =
      await this.notificationRepository.count({
        where: {
          patientId,
          isRead: false,
        },
      });

    return {
      success: true,
      patientId,
      unreadCount: count,
    };
  }
}