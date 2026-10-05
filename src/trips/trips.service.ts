import { forwardRef, Inject, Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TripEntity, TripPaymentMethod, TripPaymentStatus, TripStatus } from './entities/trip.entity';
import { CreateTripDto } from './dto/create-trip.dto';
import { UsersService } from '../users/users.service';
import { TripsGateway } from './trips.gateway';
import { UserEntity, UserRole } from '../users/entities/user.entity';

const FIXED_FARE = 2000;

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(TripEntity)
    private readonly tripsRepository: Repository<TripEntity>,
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => TripsGateway))
    private readonly tripsGateway: TripsGateway,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    passengerId: string,
    createTripDto: CreateTripDto,
  ): Promise<TripEntity> {
    const passenger = await this.usersService.findById(passengerId);
    if (!passenger) {
      throw new NotFoundException('Pasajero no encontrado');
    }

    const paymentMethod = createTripDto.payment_method ?? TripPaymentMethod.EFECTIVO;
    if (paymentMethod === TripPaymentMethod.EFECTIVO && createTripDto.cash_tendered != null && createTripDto.cash_tendered < FIXED_FARE) {
      throw new BadRequestException('El efectivo indicado no puede ser menor que la tarifa del viaje');
    }
    if (paymentMethod === TripPaymentMethod.MERCADOPAGO && createTripDto.cash_tendered != null) {
      throw new BadRequestException('El monto en efectivo solo corresponde a viajes pagados en efectivo');
    }

    const trip = this.tripsRepository.create({
      ...createTripDto,
      payment_method: paymentMethod,
      cash_tendered: paymentMethod === TripPaymentMethod.EFECTIVO ? createTripDto.cash_tendered ?? null : null,
      payment_status: TripPaymentStatus.PENDIENTE,
      payment_issue: null,
      passenger_id: passengerId,
      fare: FIXED_FARE,
      status: TripStatus.PENDIENTE,
      requested_at: new Date(),
    });

    const savedTrip = await this.tripsRepository.save(trip);
    savedTrip.passenger = passenger;

    // Notificar en tiempo real a los conductores conectados
    this.tripsGateway.notifyTripCreated(savedTrip);

    return savedTrip;
  }

  async findPending(): Promise<TripEntity[]> {
    return this.tripsRepository.find({
      where: { status: TripStatus.PENDIENTE },
      relations: { passenger: true },
      order: { requested_at: 'ASC' },
    });
  }

  async accept(
    tripId: string,
    driverId: string,
  ): Promise<TripEntity> {
    const savedTrip = await this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(UserEntity);
      const driver = await userRepository.findOne({
        where: { id: driverId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!driver) throw new NotFoundException('Conductor no encontrado');

      const tripsRepository = manager.getRepository(TripEntity);
      const activeTrip = await tripsRepository.findOne({
        where: { driver_id: driverId, status: TripStatus.ACEPTADO },
      });
      if (activeTrip) {
        throw new ConflictException('Ya tienes un viaje activo. Debes finalizarlo antes de aceptar otro.');
      }

      const trip = await tripsRepository.findOne({
        where: { id: tripId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!trip) throw new NotFoundException('Viaje no encontrado');
      if (trip.status !== TripStatus.PENDIENTE) {
        throw new BadRequestException('El viaje ya no está pendiente');
      }

      trip.driver_id = driverId;
      trip.driver = driver;
      trip.status = TripStatus.ACEPTADO;
      trip.accepted_at = new Date();

      return tripsRepository.save(trip);
    });

    const acceptedTrip = await this.tripsRepository.findOne({
      where: { id: savedTrip.id },
      relations: { passenger: true, driver: true, vehicle: true },
    });
    if (!acceptedTrip) {
      throw new NotFoundException('No se pudo recuperar el viaje aceptado');
    }

    this.attachDriverPaymentAlias(acceptedTrip, acceptedTrip.passenger_id);

    // Notificar en tiempo real al pasajero (y salas relevantes)
    this.tripsGateway.notifyTripAccepted(acceptedTrip);

    return acceptedTrip;
  }

  async complete(tripId: string, driverId: string): Promise<TripEntity> {
    const trip = await this.tripsRepository.findOne({
      where: { id: tripId },
      relations: { passenger: true, driver: true, vehicle: true },
    });

    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }

    if (trip.driver_id !== driverId) {
      throw new ForbiddenException('Solo el conductor asignado puede finalizar este viaje');
    }

    if (trip.status !== TripStatus.ACEPTADO) {
      throw new BadRequestException('El viaje no está aceptado');
    }

    trip.status = TripStatus.FINALIZADO;
    trip.finished_at = new Date();

    const savedTrip = await this.tripsRepository.save(trip);

    // Notificar en tiempo real al pasajero (y salas relevantes)
    this.tripsGateway.notifyTripCompleted(savedTrip);

    return savedTrip;
  }

  async confirmPayment(tripId: string, driverId: string): Promise<TripEntity> {
    const updatedTrip = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(TripEntity);
      const trip = await repository.findOne({
        where: { id: tripId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) throw new NotFoundException('Viaje no encontrado');
      if (trip.driver_id !== driverId) {
        throw new ForbiddenException('Solo el conductor asignado puede confirmar el pago');
      }
      if (trip.status !== TripStatus.FINALIZADO) {
        throw new BadRequestException('El pago solo puede confirmarse cuando el viaje finalizó');
      }
      if (trip.payment_status !== TripPaymentStatus.PENDIENTE) {
        throw new ConflictException('El pago ya fue confirmado o reportado');
      }

      trip.payment_status = TripPaymentStatus.PAGADO;
      trip.payment_issue = null;
      return repository.save(trip);
    });

    this.tripsGateway.notifyTripPaymentChanged(updatedTrip);
    return updatedTrip;
  }

  async reportPaymentIssue(
    tripId: string,
    passengerId: string,
    reason: string,
  ): Promise<TripEntity> {
    const updatedTrip = await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(TripEntity);
      const trip = await repository.findOne({
        where: { id: tripId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!trip) throw new NotFoundException('Viaje no encontrado');
      if (trip.passenger_id !== passengerId) {
        throw new ForbiddenException('Solo el pasajero puede reportar el pago');
      }
      if (trip.status !== TripStatus.FINALIZADO) {
        throw new BadRequestException('El pago solo puede reportarse cuando el viaje finalizó');
      }
      if (trip.payment_status !== TripPaymentStatus.PENDIENTE) {
        throw new ConflictException('El pago ya fue confirmado o reportado');
      }

      trip.payment_status = TripPaymentStatus.REPORTADO;
      trip.payment_issue = reason;
      trip.payment_reviewed_at = null;
      trip.payment_reviewed_by = null;
      trip.payment_review_action = null;
      return repository.save(trip);
    });

    this.tripsGateway.notifyTripPaymentChanged(updatedTrip);
    return updatedTrip;
  }

  async findById(id: string): Promise<TripEntity | null> {
    return this.tripsRepository.findOne({
      where: { id },
      relations: { passenger: true, driver: true, vehicle: true },
    });
  }

  /**
   * Lectura de un viaje sujeta a pertenencia (anti-IDOR).
   * Solo el pasajero, el conductor asignado o un administrador pueden leerlo.
   * Si el viaje no existe se responde 404 para no revelar su existencia.
   */
  async findByIdForUser(
    id: string,
    actor: { id: string; rol: UserRole },
  ): Promise<TripEntity> {
    const trip = await this.findById(id);
    if (!trip) {
      throw new NotFoundException('Viaje no encontrado');
    }

    const isParticipant = trip.passenger_id === actor.id || trip.driver_id === actor.id;
    if (!isParticipant && actor.rol !== UserRole.ADMIN) {
      throw new ForbiddenException('No tienes permiso para ver este viaje');
    }

    this.attachDriverPaymentAlias(trip, actor.id);
    return trip;
  }

  async findByPassenger(passengerId: string): Promise<TripEntity[]> {
    const trips = await this.tripsRepository.find({
      where: { passenger_id: passengerId },
      relations: { driver: true, vehicle: true },
      order: { createdAt: 'DESC' },
    });
    trips.forEach((trip) => this.attachDriverPaymentAlias(trip, passengerId));
    return trips;
  }

  async findByDriver(driverId: string): Promise<TripEntity[]> {
    return this.tripsRepository.find({
      where: { driver_id: driverId },
      relations: { passenger: true, vehicle: true },
      order: { createdAt: 'DESC' },
    });
  }

  private attachDriverPaymentAlias(trip: TripEntity, viewerId: string): void {
    trip.driver_payment_alias =
      (viewerId === trip.passenger_id || viewerId === trip.driver_id) &&
      trip.payment_method === TripPaymentMethod.MERCADOPAGO &&
      trip.status !== TripStatus.PENDIENTE
        ? trip.driver?.mercadoPagoAlias ?? null
        : null;
  }
}