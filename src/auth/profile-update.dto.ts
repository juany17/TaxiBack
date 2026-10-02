import { OmitType } from '@nestjs/mapped-types';
import { UpdateUserDto } from '../users/dto/update-user.dto';

export class ProfileUpdateDto extends OmitType(UpdateUserDto, [
  'totalViajes',
  'calificacionPromedio',
  'certificaciones',
  'documentosVerificados',
  'fechaUltimaVerificacion',
  'badges',
] as const) {}
