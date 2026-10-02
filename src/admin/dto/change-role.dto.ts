import { IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/entities/user.entity';

export class ChangeRoleDto {
  @IsEnum(UserRole, { message: 'El rol especificado no es válido' })
  @IsNotEmpty({ message: 'El rol es requerido' })
  rol: UserRole;
}
