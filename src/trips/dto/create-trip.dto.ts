import { Transform } from 'class-transformer';
import { IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { TripPaymentMethod } from '../entities/trip.entity';

export class CreateTripDto {
  @IsOptional()
  @IsIn(Object.values(TripPaymentMethod))
  payment_method?: TripPaymentMethod;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cash_tendered?: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'La dirección de origen es obligatoria' })
  @MaxLength(255)
  origin_address: string;

  @IsNumber({}, { message: 'La latitud de origen debe ser un número válido' })
  @Min(-90, { message: 'La latitud de origen debe ser >= -90' })
  @Max(90, { message: 'La latitud de origen debe ser <= 90' })
  origin_lat: number;

  @IsNumber({}, { message: 'La longitud de origen debe ser un número válido' })
  @Min(-180, { message: 'La longitud de origen debe ser >= -180' })
  @Max(180, { message: 'La longitud de origen debe ser <= 180' })
  origin_lng: number;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'La dirección de destino es obligatoria' })
  @MaxLength(255)
  destination_address: string;

  @IsNumber({}, { message: 'La latitud de destino debe ser un número válido' })
  @Min(-90, { message: 'La latitud de destino debe ser >= -90' })
  @Max(90, { message: 'La latitud de destino debe ser <= 90' })
  destination_lat: number;

  @IsNumber({}, { message: 'La longitud de destino debe ser un número válido' })
  @Min(-180, { message: 'La longitud de destino debe ser >= -180' })
  @Max(180, { message: 'La longitud de destino debe ser <= 180' })
  destination_lng: number;

  @IsOptional()
  @IsUUID('all', { message: 'El ID del vehículo debe ser un UUID válido' })
  vehicle_id?: string;
}