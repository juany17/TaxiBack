import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  PASAJERO = 'pasajero',
  CONDUCTOR = 'conductor',
  ADMIN = 'admin',
}

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Exclude()
  @Column()
  password?: string; // Es opcional porque el hash se maneja en el registro

  @Column()
  telefono: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PASAJERO,
  })
  rol: UserRole;

  @Column({ nullable: true })
  fotoPerfil?: string;

  @Column({ nullable: true })
  descripcion?: string;

  @Exclude()
  @Column({ type: 'varchar', nullable: true, length: 100 })
  mercadoPagoAlias?: string | null;

  // Información Profesional
  @Column({ nullable: true, type: 'int' })
  anosExperiencia?: number;

  @Column({ nullable: true, type: 'int', default: 0 })
  totalViajes?: number;

  @Column({ nullable: true, type: 'decimal', precision: 2, scale: 1, default: 0 })
  calificacionPromedio?: number;

  @Column({ nullable: true, type: 'simple-array' })
  certificaciones?: string[];

  // Información Personal
  @Column({ nullable: true, type: 'int' })
  edad?: number;

  @Column({ nullable: true, type: 'simple-array' })
  idiomas?: string[];

  @Column({ nullable: true, type: 'simple-array' })
  pasatiempos?: string[];

  @Column({ nullable: true })
  frasePersonal?: string;

  // Preferencias de Servicio
  @Column({ nullable: true })
  musicaPreferida?: string;

  @Column({ nullable: true, type: 'boolean', default: false })
  aceptaMascotas?: boolean;

  @Column({ nullable: true, type: 'boolean', default: false })
  tieneCascoExtra?: boolean;

  @Column({ nullable: true, type: 'enum', enum: ['tranquilo', 'rapido', 'intermedio'] })
  estiloConduccion?: 'tranquilo' | 'rapido' | 'intermedio';

  @Column({ nullable: true, type: 'boolean', default: false })
  ofreceChucherias?: boolean;

  // Disponibilidad
  @Column({ nullable: true, type: 'text' })
  horariosTrabajo?: string;

  @Column({ nullable: true, type: 'simple-array' })
  zonasPreferencia?: string[];

  // Información del Vehículo
  @Column({ nullable: true, type: 'simple-array' })
  accesoriosVehiculo?: string[];

  @Column({ nullable: true, type: 'simple-array' })
  fotosVehiculo?: string[];

  // Social
  @Column({ nullable: true, type: 'json' })
  redesSociales?: { instagram?: string; facebook?: string; whatsapp?: string };

  // Seguridad y Confianza
  @Column({ nullable: true, type: 'json' })
  documentosVerificados?: { licencia?: boolean; soat?: boolean; seguro?: boolean };

  @Column({ nullable: true, type: 'date' })
  fechaUltimaVerificacion?: Date;

  // Badges
  @Column({ nullable: true, type: 'simple-array' })
  badges?: string[];

  // Recuperación de contraseña
  @Exclude()
  @Column({ nullable: true })
  resetToken?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  resetTokenExpiry?: Date;

  @CreateDateColumn()
  createdAt: Date;
}
