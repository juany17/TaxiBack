import { ConflictException, ForbiddenException } from '@nestjs/common';
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
    expect(gateway.notifyTripCreated).toHaveBeenCalledWith(expect.objectContaining({
      id: 'trip-1',
      status: TripStatus.PENDIENTE,
    }));
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
