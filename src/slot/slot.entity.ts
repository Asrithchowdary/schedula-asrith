import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,} from 'typeorm';
import { DoctorProfile } from '../doctor/doctor-profile.entity';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DoctorProfile)
  doctor: DoctorProfile;

  @Column()
  date: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({
    default: true,
  })
  isAvailable: boolean;
}