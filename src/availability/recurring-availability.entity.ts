import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { SchedulingType } from './enums/scheduling-type.enum';

@Entity('recurring_availability')
export class RecurringAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => DoctorProfile,
    { onDelete: 'CASCADE' },
  )
  doctor: DoctorProfile;

  @Column()
  dayOfWeek: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({
    type: 'enum',
    enum: SchedulingType,
    default: SchedulingType.STREAM,
  })
  schedulingType: SchedulingType;

  @Column({
    nullable: true,
    default: 15,
  })
  slotDuration: number;

  @Column({
    nullable: true,
    default: 0,
  })
  bufferTime: number;

  @Column({
    nullable: true,
    default: 5,
  })
  maxCapacity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}