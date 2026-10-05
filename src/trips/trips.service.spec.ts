import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { TripsService } from './trips.service';
import { TripStatus } from './entities/trip.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateTripDto } from './dto/create-trip.dto';

describe('TripsService.create', () => {
  it('creates a requested trip as pending', async () => {
    const tripRepository = {
      create: jest.fn((trip) => trip),
      save: jest.fn(async (trip) => ({ id: 'trip-1', ...trip })),
    };
    const passenger = { id: 'passenger-1' };
    const gateway = { notifyTripCreated: jest.fn() };
    const service = new TripsService(
      tripRepository as never,
      { findById: jest.fn().mockResolvedValue(passenger) } as never,
      gateway as never,
      {} as never,
    );

    const trip = await service.create('passenger-1', {
      origin_address: 'Origen',
      origin_lat: -24.18,
      origin_lng: -65.3,
      destination_address: 'Destino',
      destination_lat: -24.17,
      destination_lng: -65.29,
    } as CreateTripDto);

    expect(trip.status).toBe(TripStatus.PENDIENTE);
    expect(trip).toMatchObject({
      payment_method: 'efectivo',
      payment_status: 'pendiente',
      cash_tendered: null,
    });
    expect(gateway.notifyTripCreated).toHaveBeenCalledWith(expect.objectContaining({
      id: 'trip-1',
      status: TripStatus.PENDIENTE,
    }));
  });

  it('stores Mercado Pago as selected and does not retain a cash amount', async () => {
    const tripRepository = {
      create: jest.fn((trip) => trip),
      save: jest.fn(async (trip) => ({ id: 'trip-2', ...trip })),
    };
    const service = new TripsService(
      tripRepository as never,
      { findById: jest.fn().mockResolvedValue({ id: 'passenger-1' }) } as never,
      { notifyTripCreated: jest.fn() } as never,
      {} as never,
    );

    const trip = await service.create('passenger-1', {
      origin_address: 'Origen',
      origin_lat: -24.18,
      origin_lng: -65.3,
      destination_address: 'Destino',
      destination_lat: -24.17,
      destination_lng: -65.29,
      payment_method: 'mercadopago',
    } as CreateTripDto);

    expect(trip).toMatchObject({
      payment_method: 'mercadopago',
      cash_tendered: null,
      payment_status: 'pendiente',
    });
  });

  it('rejects a cash tender amount below the fixed fare', async () => {
    const service = new TripsService(
      { create: jest.fn(), save: jest.fn() } as never,
      { findById: jest.fn().mockResolvedValue({ id: 'passenger-1' }) } as never,
      { notifyTripCreated: jest.fn() } as never,
      {} as never,
    );

    await expect(service.create('passenger-1', {
      origin_address: 'Origen',
      origin_lat: -24.18,
      origin_lng: -65.3,
      destination_address: 'Destino',
      destination_lat: -24.17,
      destination_lng: -65.29,
      payment_method: 'efectivo',
      cash_tendered: 1000,
    } as CreateTripDto)).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('TripsService payment alias visibility', () => {
  it('returns the driver payment alias only for an accepted Mercado Pago trip', async () => {
    const trip = {
      id: 'trip-1',
      passenger_id: 'passenger-1',
      driver_id: 'driver-1',
      status: TripStatus.ACEPTADO,
      payment_method: 'mercadopago',
      driver: { id: 'driver-1', mercadoPagoAlias: 'driver.alias.mp' },
    };
    const service = new TripsService({
      findOne: jest.fn().mockResolvedValue(trip),
    } as never, {} as never, {} as never, {} as never);

    await expect(service.findByIdForUser('trip-1', { id: 'passenger-1', rol: 'pasajero' as never }))
      .resolves.toMatchObject({ driver_payment_alias: 'driver.alias.mp' });

    await expect(service.findByIdForUser('trip-1', { id: 'admin-1', rol: 'admin' as never }))
      .resolves.toMatchObject({ driver_payment_alias: null });

    trip.status = TripStatus.PENDIENTE;
    await expect(service.findByIdForUser('trip-1', { id: 'passenger-1', rol: 'pasajero' as never }))
      .resolves.toMatchObject({ driver_payment_alias: null });
  });
});

describe('TripsService.accept', () => {
  it('rejects accepting another trip when the driver already has an accepted trip', async () => {
    const activeTrip = { id: 'active-trip', driver_id: 'driver-1', status: TripStatus.ACEPTADO };
    const tripRepository = {
      findOne: jest.fn().mockResolvedValue(activeTrip),
      save: jest.fn(),
    };
    const userRepository = { findOne: jest.fn().mockResolvedValue({ id: 'driver-1' }) };
    const dataSource = {
      transaction: jest.fn((callback: (manager: { getRepository: (entity: unknown) => unknown }) => unknown) =>
        callback({
          getRepository: (entity: unknown) => entity === UserEntity ? userRepository : tripRepository,
        }),
      ),
    };
    const usersService = { findById: jest.fn() };
    const tripsGateway = { notifyTripAccepted: jest.fn() };
    const service = new TripsService(
      { create: jest.fn() } as never,
      usersService as never,
      tripsGateway as never,
      dataSource as never,
    );

    await expect(service.accept('requested-trip', 'driver-1')).rejects.toBeInstanceOf(ConflictException);
    expect(tripRepository.save).not.toHaveBeenCalled();
  });

  describe('TripsService payment flow', () => {
    it('keeps payment pending when a trip is completed', async () => {
      const trip = {
        id: 'trip-1',
        driver_id: 'driver-1',
        status: TripStatus.ACEPTADO,
        payment_status: 'pendiente',
      };
      const repository = {
        findOne: jest.fn().mockResolvedValue(trip),
        save: jest.fn(async (value) => value),
      };
      const service = new TripsService(
        repository as never,
        {} as never,
        { notifyTripCompleted: jest.fn(), notifyTripPaymentChanged: jest.fn() } as never,
        {} as never,
      );

      await service.complete('trip-1', 'driver-1');

      expect(trip).toMatchObject({
        status: TripStatus.FINALIZADO,
        payment_status: 'pendiente',
      });
    });

    it('allows only the assigned driver to confirm payment after trip completion', async () => {
      const trip = {
        id: 'trip-1',
        driver_id: 'driver-1',
        status: TripStatus.FINALIZADO,
        payment_status: 'pendiente',
      };
      const repository = {
        findOne: jest.fn().mockResolvedValue(trip),
        save: jest.fn(async (value) => value),
      };
      const dataSource = {
        transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
      };
      const gateway = { notifyTripPaymentChanged: jest.fn() };
      const service = new TripsService(repository as never, {} as never, gateway as never, dataSource as never);

      await expect(service.confirmPayment('trip-1', 'driver-1')).resolves.toMatchObject({
        payment_status: 'pagado',
      });
      await expect(service.confirmPayment('trip-1', 'other-driver')).rejects.toBeInstanceOf(ForbiddenException);
      expect(gateway.notifyTripPaymentChanged).toHaveBeenCalledWith(expect.objectContaining({ id: 'trip-1' }));
    });

    it('allows the passenger to report a payment issue only while payment is pending', async () => {
      const trip = {
        id: 'trip-1',
        passenger_id: 'passenger-1',
        driver_id: 'driver-1',
        status: TripStatus.FINALIZADO,
        payment_status: 'pendiente',
      };
      const repository = {
        findOne: jest.fn().mockResolvedValue(trip),
        save: jest.fn(async (value) => value),
      };
      const dataSource = {
        transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
      };
      const service = new TripsService(
        repository as never,
        {} as never,
        { notifyTripPaymentChanged: jest.fn() } as never,
        dataSource as never,
      );

      await expect(service.reportPaymentIssue('trip-1', 'passenger-1', 'No llegó la transferencia'))
        .resolves.toMatchObject({ payment_status: 'reportado' });
      await expect(service.reportPaymentIssue('trip-1', 'other-passenger', 'Motivo'))
        .rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.confirmPayment('trip-1', 'driver-1'))
        .rejects.toBeInstanceOf(ConflictException);
    });

    it('does not allow payment confirmation before the trip is finalized', async () => {
      const trip = {
        id: 'trip-1',
        driver_id: 'driver-1',
        status: TripStatus.ACEPTADO,
        payment_status: 'pendiente',
      };
      const repository = {
        findOne: jest.fn().mockResolvedValue(trip),
        save: jest.fn(),
      };
      const dataSource = {
        transaction: jest.fn((callback) => callback({ getRepository: () => repository })),
      };
      const service = new TripsService(repository as never, {} as never, {} as never, dataSource as never);

      await expect(service.confirmPayment('trip-1', 'driver-1')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('TripsService.complete', () => {
    it('does not allow a different driver to finish another driver trip', async () => {
      const tripsRepository = {
        findOne: jest.fn().mockResolvedValue({
          id: 'active-trip',
          driver_id: 'assigned-driver',
          status: TripStatus.ACEPTADO,
        }),
        save: jest.fn(),
      };
      const service = new TripsService(
        tripsRepository as never,
        {} as never,
        { notifyTripCompleted: jest.fn() } as never,
        {} as never,
      );

      await expect(service.complete('active-trip', 'different-driver')).rejects.toBeInstanceOf(ForbiddenException);
      expect(tripsRepository.save).not.toHaveBeenCalled();
    });

    it('accepts a pending trip without locking nullable joined relations', async () => {
      const pendingTrip = {
        id: 'requested-trip',
        status: TripStatus.PENDIENTE,
        passenger_id: 'passenger-1',
      };
      const hydratedTrip = { ...pendingTrip, driver_id: 'driver-1', status: TripStatus.ACEPTADO };
      const transactionTripRepository = {
        findOne: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(pendingTrip),
        save: jest.fn(async (trip) => trip),
      };
      const userRepository = {
        findOne: jest.fn().mockResolvedValue({ id: 'driver-1' }),
      };
      const tripsRepository = {
        create: jest.fn(),
        findOne: jest.fn().mockResolvedValue(hydratedTrip),
      };
      const dataSource = {
        transaction: jest.fn(async (callback) => callback({
          getRepository: (entity: unknown) => entity === UserEntity ? userRepository : transactionTripRepository,
        })),
      };
      const gateway = { notifyTripAccepted: jest.fn() };
      const service = new TripsService(
        tripsRepository as never,
        {} as never,
        gateway as never,
        dataSource as never,
      );

      await expect(service.accept('requested-trip', 'driver-1')).resolves.toMatchObject({
        id: 'requested-trip',
        driver_id: 'driver-1',
        status: TripStatus.ACEPTADO,
      });
      expect(transactionTripRepository.findOne.mock.calls[1][0]).not.toHaveProperty('relations');
      expect(gateway.notifyTripAccepted).toHaveBeenCalledWith(hydratedTrip);
    });
  });
});
