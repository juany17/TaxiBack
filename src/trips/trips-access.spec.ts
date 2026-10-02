import { ForbiddenException, NotFoundException } from '@nestjs/common';
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { TripsService } from './trips.service';
import { UserRole } from '../users/entities/user.entity';
import { TripStatus } from './entities/trip.entity';

const PASENGER_ID = 'passenger-1';
const DRIVER_ID = 'driver-1';
const ADMIN = { id: 'admin-1', rol: UserRole.ADMIN };

function buildService(trip: Record<string, unknown> | null) {
  const tripsRepository = { findOne: jest.fn().mockResolvedValue(trip) };
  const service = new TripsService(
    tripsRepository as never,
    {} as never,
    { notifyTripCreated: jest.fn() } as never,
    {} as never,
  );
  return { service, tripsRepository };
}

describe('TripsService.findByIdForUser', () => {
  it('lets the passenger of the trip read it', async () => {
    const trip = { id: 'trip-1', passenger_id: PASENGER_ID, driver_id: DRIVER_ID, status: TripStatus.ACEPTADO };
    const { service } = buildService(trip);

    await expect(
      service.findByIdForUser('trip-1', { id: PASENGER_ID, rol: UserRole.PASAJERO }),
    ).resolves.toMatchObject({ id: 'trip-1' });
  });

  it('lets the assigned driver read it', async () => {
    const trip = { id: 'trip-1', passenger_id: PASENGER_ID, driver_id: DRIVER_ID, status: TripStatus.ACEPTADO };
    const { service } = buildService(trip);

    await expect(
      service.findByIdForUser('trip-1', { id: DRIVER_ID, rol: UserRole.CONDUCTOR }),
    ).resolves.toMatchObject({ id: 'trip-1' });
  });

  it('blocks an unrelated authenticated user (IDOR)', async () => {
    const trip = { id: 'trip-1', passenger_id: PASENGER_ID, driver_id: DRIVER_ID, status: TripStatus.ACEPTADO };
    const { service } = buildService(trip);

    await expect(
      service.findByIdForUser('trip-1', { id: 'attacker', rol: UserRole.PASAJERO }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('blocks a driver who is not the assigned one', async () => {
    const trip = { id: 'trip-1', passenger_id: PASENGER_ID, driver_id: DRIVER_ID, status: TripStatus.ACEPTADO };
    const { service } = buildService(trip);

    await expect(
      service.findByIdForUser('trip-1', { id: 'other-driver', rol: UserRole.CONDUCTOR }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('lets an admin monitor any trip', async () => {
    const trip = { id: 'trip-1', passenger_id: PASENGER_ID, driver_id: DRIVER_ID, status: TripStatus.ACEPTADO };
    const { service } = buildService(trip);

    await expect(service.findByIdForUser('trip-1', ADMIN)).resolves.toMatchObject({ id: 'trip-1' });
  });

  it('reports a missing trip as not found', async () => {
    const { service } = buildService(null);

    await expect(
      service.findByIdForUser('missing', { id: PASENGER_ID, rol: UserRole.PASAJERO }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('does not leak trip existence to a non participant (404 instead of 403)', async () => {
    const { service } = buildService(null);

    await expect(
      service.findByIdForUser('missing', { id: 'attacker', rol: UserRole.PASAJERO }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
