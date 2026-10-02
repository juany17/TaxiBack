import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('vehicles')
export class VehicleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  placa: string;

  @Column()
  marca: string;

  @Column()
  modelo: string;

  @Column()
  color: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'conductor_id' })
  conductor: UserEntity;

  @CreateDateColumn()
  createdAt: Date;
}
