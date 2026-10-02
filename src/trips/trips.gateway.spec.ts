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
