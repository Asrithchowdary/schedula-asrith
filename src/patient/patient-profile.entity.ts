import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { User } from '../users/entities/user.entity';

@Entity('patient_profiles')
export class PatientProfile {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  fullName!: string;

  @Column()
  age!: number;

  @Column()
  gender!: string;

  @Column()
  contactDetails!: string;

  @Column()
  healthInformation!: string;
}