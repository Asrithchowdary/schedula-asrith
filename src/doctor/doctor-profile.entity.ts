import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  fullName!: string;

  @Column()
  specialization!: string;

  @Column()
  experience!: number;

  @Column()
  qualification!: string;

  @Column('decimal')
  consultationFee!: number;

  @Column({ default: true })
  isAvailable!: boolean;

  @Column({ nullable: true })
  availabilityHours!: string;

  @Column({ nullable: true })
  profileDetails!: string;

  @Column({
  default: 'STREAM',
})
schedulingType: string;

@Column({
  nullable: true,
})
slotDuration: number;

@Column({
  nullable: true,
})
bufferTime: number;

@Column({
  nullable: true,
})
waveCapacity: number;

}