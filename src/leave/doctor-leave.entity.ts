import {Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn,} from 'typeorm';
import { DoctorProfile } from '../doctor/doctor-profile.entity';

@Entity('doctor_leave')
export class DoctorLeave{
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(
    () => DoctorProfile,
    {
        onDelete: 'CASCADE',
    },
    )
    doctor: DoctorProfile;

    @Column()
    leaveDate: string;

    @Column({
        nullable: true,
    })
    reason: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}