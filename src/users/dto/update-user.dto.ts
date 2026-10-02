import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  IsInt,
  IsBoolean,
  IsEnum,
  IsArray,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class UpdateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(100)
  nombre?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsOptional()
  @IsEmail({}, { message: 'El formato del correo electrónico es inválido' })
  @IsNotEmpty({ message: 'El correo no puede estar vacío' })
  @MaxLength(254)
  email?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  @Matches(/^\+?[0-9\s-]{7,20}$/, {
    message: 'El teléfono debe contener entre 7 y 20 dígitos numéricos válidos',
  })
  telefono?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @MaxLength(100)
  password?: string;

  @IsOptional()
  @IsString()
  fotoPerfil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'La descripción no puede exceder 500 caracteres' })
  descripcion?: string;

  // Información Profesional
  @IsOptional()
  @IsInt()
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  @Max(50, { message: 'Los años de experiencia no pueden exceder 50' })
  anosExperiencia?: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El total de viajes no puede ser negativo' })
  totalViajes?: number;

  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? parseFloat(value) : value)
  @Min(0, { message: 'La calificación no puede ser negativa' })
  @Max(5, { message: 'La calificación no puede exceder 5' })
  calificacionPromedio?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificaciones?: string[];

  // Información Personal
  @IsOptional()
  @IsInt()
  @Min(18, { message: 'Debes ser mayor de 18 años' })
  @Max(100, { message: 'La edad no puede exceder 100' })
  edad?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  idiomas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pasatiempos?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200, { message: 'La frase personal no puede exceder 200 caracteres' })
  frasePersonal?: string;

  // Preferencias de Servicio
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'El tipo de música no puede exceder 100 caracteres' })
  musicaPreferida?: string;

  @IsOptional()
  @IsBoolean()
  aceptaMascotas?: boolean;

  @IsOptional()
  @IsBoolean()
  tieneCascoExtra?: boolean;

  @IsOptional()
  @IsEnum(['tranquilo', 'rapido', 'intermedio'], {
    message: 'El estilo de conducción debe ser tranquilo, rapido o intermedio'
  })
  estiloConduccion?: 'tranquilo' | 'rapido' | 'intermedio';

  @IsOptional()
  @IsBoolean()
  ofreceChucherias?: boolean;

  // Disponibilidad
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Los horarios de trabajo no pueden exceder 500 caracteres' })
  horariosTrabajo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  zonasPreferencia?: string[];

  // Información del Vehículo
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  accesoriosVehiculo?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotosVehiculo?: string[];

  // Social
  @IsOptional()
  redesSociales?: { instagram?: string; facebook?: string; whatsapp?: string };

  // Seguridad y Confianza
  @IsOptional()
  documentosVerificados?: { licencia?: boolean; soat?: boolean; seguro?: boolean };

  @IsOptional()
  @IsDateString()
  fechaUltimaVerificacion?: string;

  // Badges
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  badges?: string[];
}

