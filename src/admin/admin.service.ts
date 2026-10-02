import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity, UserRole } from '../users/entities/user.entity';
import { VehicleEntity } from '../vehicles/entities/vehicle.entity';
import { TripEntity, TripStatus } from '../trips/entities/trip.entity';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(VehicleEntity)
    private readonly vehiclesRepository: Repository<VehicleEntity>,
    @InjectRepository(TripEntity)
    private readonly tripsRepository: Repository<TripEntity>,
    private readonly usersService: UsersService,
  ) {}

  async getStats() {
    const totalUsers = await this.usersRepository.count();
    const totalPassengers = await this.usersRepository.count({ where: { rol: UserRole.PASAJERO } });
    const totalDrivers = await this.usersRepository.count({ where: { rol: UserRole.CONDUCTOR } });
    const totalAdmins = await this.usersRepository.count({ where: { rol: UserRole.ADMIN } });
    
    const totalVehicles = await this.vehiclesRepository.count();
    const totalTrips = await this.tripsRepository.count();
    const pendingTrips = await this.tripsRepository.count({ where: { status: TripStatus.PENDIENTE } });
    const acceptedTrips = await this.tripsRepository.count({ where: { status: TripStatus.ACEPTADO } });
    const completedTrips = await this.tripsRepository.count({ where: { status: TripStatus.FINALIZADO } });

    const rawRevenue = await this.tripsRepository
      .createQueryBuilder('trip')
      .select('SUM(trip.fare)', 'sum')
      .where('trip.status = :status', { status: TripStatus.FINALIZADO })
      .getRawOne();

    const totalRevenue = rawRevenue && rawRevenue.sum ? parseFloat(rawRevenue.sum) : 0;

    return {
      users: {
        total: totalUsers,
        passengers: totalPassengers,
        drivers: totalDrivers,
        admins: totalAdmins,
      },
      vehicles: {
        total: totalVehicles,
      },
      trips: {
        total: totalTrips,
        pending: pendingTrips,
        accepted: acceptedTrips,
        completed: completedTrips,
      },
      financial: {
        totalRevenue,
      },
    };
  }

  async getAllUsers(): Promise<UserEntity[]> {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async changeUserRole(userId: string, newRole: UserRole): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado`);
    }

    user.rol = newRole;
    return this.usersRepository.save(user);
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.usersService.create(createUserDto);
  }

  async getAllVehicles(): Promise<VehicleEntity[]> {
    return this.vehiclesRepository.find({
      relations: { conductor: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllTrips(): Promise<TripEntity[]> {
    return this.tripsRepository.find({
      relations: { passenger: true, driver: true, vehicle: true },
      order: { createdAt: 'DESC' },
    });
  }
}
