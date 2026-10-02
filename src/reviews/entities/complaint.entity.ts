import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TripEntity } from '../../trips/entities/trip.entity';
import { UserEntity } from '../../users/entities/user.entity';

export enum ComplaintStatus {
  PENDIENTE = 'pendiente',
  REVISADA = 'revisada',
  DESCARTADA = 'descartada',
}

@Entity('complaints')
export class ComplaintEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: true })
  trip_id: string | null;

  @Column({ type: 'uuid' })
  reporter_id: string;

  @Column({ type: 'uuid', nullable: true })
  reported_user_id: string | null;

  @Column({ type: 'varchar', length: 100 })
  reason: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'enum', enum: ComplaintStatus, default: ComplaintStatus.PENDIENTE })
  status: ComplaintStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => TripEntity, { nullable: true })
  @JoinColumn({ name: 'trip_id' })
  trip: TripEntity | null;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'reporter_id' })
  reporter: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser: UserEntity | null;
}
