import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { TripsGateway } from './trips.gateway';
import { TripsService } from './trips.service';

describe('TripsGateway dependency injection', () => {
  it('resolves the circular TripsService and TripsGateway providers', async () => {
    const module = await Test.createTestingModule({
      providers: [
        TripsGateway,
        TripsService,
        { provide: JwtService, useValue: {} },
        { provide: Repository, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: DataSource, useValue: {} },
      ],
    }).compile();

    const gateway = module.get(TripsGateway);

    expect(gateway).toBeDefined();
    expect(module.get(TripsService)).toBeDefined();
  });
});

describe('TripsGateway payment alias privacy', () => {
  it('sends a driver payment alias only to the authorized trip room', () => {
    const roomEmit = jest.fn();
    const globalEmit = jest.fn();
    const gateway = new TripsGateway({} as never, {} as never);
    gateway.server = {
      to: jest.fn(() => ({ emit: roomEmit })),
      emit: globalEmit,
    } as never;
    const trip = {
      id: 'trip-1',
      driver_payment_alias: 'driver.alias.mp',
      driver: {
        id: 'driver-1',
        mercadoPagoAlias: 'driver.alias.mp',
      },
    };

    gateway.notifyTripAccepted(trip as never);

    expect(roomEmit).toHaveBeenCalledWith('tripStatusChanged', trip);
    const globalTrip = globalEmit.mock.calls[0][1];
    expect(globalTrip.driver_payment_alias).toBeUndefined();
    expect(globalTrip.driver.mercadoPagoAlias).toBeUndefined();
  });
});
