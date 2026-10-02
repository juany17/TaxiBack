import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
jest.mock('@nestjs/typeorm', () => ({
  InjectRepository: () => () => undefined,
}));

import { VehiclesService } from './vehicles.service';
import { UserRole } from '../users/entities/user.entity';

const CONDUCTOR = { id: 'driver-1', rol: UserRole.CONDUCTOR };
const PASSEENGER = { id: 'passenger-1', rol: UserRole.PASAJERO };
const ADMIN = { id: 'admin-1', rol: UserRole.ADMIN };

function buildService(overrides: { users?: Record<string, jest.Mock>; repo?: Record<string, jest.Mock> } = {}) {
  const usersService = {
    findById: overrides.users?.findById ?? jest.fn().mockResolvedValue(CONDUCTOR),
  };
  const vehiclesRepository = {
    find: overrides.repo?.find ?? jest.fn().mockResolvedValue([]),
    create: jest.fn((data) => data),
    save: jest.fn(async (vehicle) => ({ id: 'vehicle-1', ...vehicle })),
  };
  const service = new VehiclesService(vehiclesRepository as never, usersService as never);
  return { service, usersService, vehiclesRepository };
}

describe('VehiclesService.create authorization', () => {
  it('allows a conductor to register their own vehicle', async () => {
    const { service } = buildService();

    await expect(
      service.create('driver-1', { placa: 'ABC123', marca: 'Honda', modelo: 'CB', color: 'Negro' }, CONDUCTOR),
    ).resolves.toMatchObject({ id: 'vehicle-1' });
  });

  it('rejects a passenger registering a vehicle for themselves', async () => {
    // El usuario existe pero no es conductor: el rol del actor no alcanza.
    const { service } = buildService({ users: { findById: jest.fn().mockResolvedValue(PASSEENGER) } });

    await expect(
      service.create('passenger-1', { placa: 'ABC123', marca: 'Honda', modelo: 'CB', color: 'Negro' }, PASSEENGER),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a passenger registering a vehicle for another driver', async () => {
    const { service } = buildService();

    await expect(
      service.create('driver-1', { placa: 'ABC123', marca: 'Honda', modelo: 'CB', color: 'Negro' }, PASSEENGER),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a conductor registering a vehicle for another driver', async () => {
    const { service } = buildService();

    await expect(
      service.create('driver-2', { placa: 'ABC123', marca: 'Honda', modelo: 'CB', color: 'Negro' }, CONDUCTOR),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects an unknown conductor id', async () => {
    const { service } = buildService({ users: { findById: jest.fn().mockResolvedValue(null) } });

    await expect(
      service.create('ghost', { placa: 'ABC123', marca: 'Honda', modelo: 'CB', color: 'Negro' }, ADMIN),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects when the target user exists but is not a driver', async () => {
    const { service } = buildService({ users: { findById: jest.fn().mockResolvedValue(PASSEENGER) } });

    await expect(
      service.create('passenger-1', { placa: 'ABC123', marca: 'Honda', modelo: 'CB', color: 'Negro' }, ADMIN),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('VehiclesService.findAllFor', () => {
  it('returns only the vehicles of the requesting driver', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const { service, vehiclesRepository } = buildService({ repo: { find } });

    await service.findAllFor(CONDUCTOR);

    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { conductor: { id: 'driver-1' } } }),
    );
    expect(vehiclesRepository.find).toHaveBeenCalledTimes(1);
  });

  it('returns the whole fleet for an admin', async () => {
    const find = jest.fn().mockResolvedValue([]);
    const { service } = buildService({ repo: { find } });

    await service.findAllFor(ADMIN);

    expect(find).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });
});
