import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,CreateDateColumn,UpdateDateColumn,} from 'typeorm';
import { DoctorProfile } from '../doctor/doctor-profile.entity';

@Entity('custom_availability')
export class CustomAvailability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(
    () => DoctorProfile,
    { onDelete: 'CASCADE' },
  )
  doctor: DoctorProfile;

  @Column({
    type: 'date',
  })
  date: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}