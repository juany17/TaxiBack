import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleEntity } from './entities/vehicle.entity';
import { UsersService } from '../users/users.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UserRole } from '../users/entities/user.entity';

export interface RequestActor {
  id: string;
  rol: UserRole;
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
    private readonly usersService: UsersService,
  ) {}

  /**
   * Registra una moto. Solo el propio conductor puede hacerlo sobre su cuenta;
   * un administrador puede hacerlo sobre cualquier conductor. Nunca un pasajero.
   */
  async create(
    conductorId: string,
    vehicleData: CreateVehicleDto,
    actor: RequestActor,
  ): Promise<VehicleEntity> {
    const isSelf = actor.id === conductorId;
    if (!isSelf && actor.rol !== UserRole.ADMIN) {
      throw new ForbiddenException('No puedes registrar una moto a nombre de otro usuario');
    }

    const conductor = await this.usersService.findById(conductorId);
    if (!conductor) {
      throw new NotFoundException('Conductor no encontrado');
    }
    if (conductor.rol !== UserRole.CONDUCTOR) {
      throw new BadRequestException('El usuario indicado no tiene el rol de conductor');
    }

    const newVehicle = this.vehiclesRepository.create({
      ...vehicleData,
      conductor,
    });

    return this.vehiclesRepository.save(newVehicle);
  }

  /**
   * Lista acotada por rol: el conductor solo ve su propia flota,
   * el administrador ve la flota completa.
   */
  async findAllFor(actor: RequestActor): Promise<VehicleEntity[]> {
    const where = actor.rol === UserRole.ADMIN ? {} : { conductor: { id: actor.id } };
    return this.vehiclesRepository.find({ where, relations: { conductor: true } });
  }
}
