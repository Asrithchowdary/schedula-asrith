import {Entity,PrimaryGeneratedColumn,Column,ManyToOne,CreateDateColumn,} from 'typeorm';
import { DoctorProfile } from '../doctor/doctor-profile.entity';
import { PatientProfile } from '../patient/patient-profile.entity';
import { AppointmentStatus } from './appointment-status.enum';

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => DoctorProfile)
  doctor: DoctorProfile;

  @ManyToOne(() => PatientProfile)
  patient: PatientProfile;

  @Column()
  appointmentDate: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({
    nullable: true,
  })
  tokenNumber: number;

  @Column({
    nullable: true,
  })
  schedulingType: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.BOOKED,
  })
  status: AppointmentStatus;

  @Column({
    default:false
  })
  reminderSent:boolean;
  
  @CreateDateColumn()
  createdAt: Date;
}