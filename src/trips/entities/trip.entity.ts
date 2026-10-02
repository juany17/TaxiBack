import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { VehicleEntity } from '../../vehicles/entities/vehicle.entity';

export enum TripStatus {
  PENDIENTE = 'pendiente',
  ACEPTADO = 'aceptado',
  FINALIZADO = 'finalizado',
}

@Entity('trips')
export class TripEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  passenger_id: string;

  @Column({ type: 'uuid', nullable: true })
  driver_id: string | null;

  @Column({ type: 'uuid', nullable: true })
  vehicle_id: string | null;

  @Column({
    type: 'enum',
    enum: TripStatus,
    default: TripStatus.PENDIENTE,
  })
  status: TripStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  fare: number;

@Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  origin_lat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  origin_lng?: number;

  @Column({ type: 'varchar', nullable: true })
  origin_address?: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  destination_lat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  destination_lng?: number;

  @Column({ type: 'varchar', nullable: true })
  destination_address?: string;

  @Column({ type: 'timestamp', nullable: true })
  requested_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  accepted_at?: Date;

  @Column({ type: 'timestamp', nullable: true })
  finished_at?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'passenger_id' })
  passenger: UserEntity;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: UserEntity | null;

  @ManyToOne(() => VehicleEntity, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: VehicleEntity | null;
}