import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty({ message: 'La placa es obligatoria' })
  @Matches(/^[A-Z0-9-]{5,10}$/, {
    message: 'La placa debe ser alfanumérica válida (entre 5 y 10 caracteres)',
  })
  placa: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'La marca es obligatoria' })
  @MinLength(2, { message: 'La marca debe tener al menos 2 caracteres' })
  @MaxLength(50)
  marca: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El modelo es obligatorio' })
  @MinLength(2, { message: 'El modelo debe tener al menos 2 caracteres' })
  @MaxLength(50)
  modelo: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'El color es obligatorio' })
  @MinLength(3, { message: 'El color debe tener al menos 3 caracteres' })
  @MaxLength(50)
  color: string;
}

