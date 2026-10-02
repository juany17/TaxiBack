import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  const usersService = { findByEmail: jest.fn(), create: jest.fn(), update: jest.fn(), findById: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: UsersService, useValue: usersService }, JwtService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    // El doble de bcrypt en tests compara contra `hashed:<plain>`.
    const STORED_HASH = 'hashed:secreto123';

    it('returns a token for valid credentials', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: STORED_HASH, rol: UserRole.PASAJERO });

      await expect(service.login('a@b.com', 'secreto123')).resolves.toHaveProperty('token');
    });

    it('rejects a wrong password without revealing whether the user exists', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: STORED_HASH, rol: UserRole.PASAJERO });

      await expect(service.login('a@b.com', 'incorrecta')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('does not reveal whether the email exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login('nadie@x.com', 'secreto123')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects when the stored user has no password', async () => {
      usersService.findByEmail.mockResolvedValue({ id: 'u1', email: 'a@b.com', password: null });

      await expect(service.login('a@b.com', 'secreto123')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('getPublicProfile', () => {
    it('rejects an unknown user', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.getPublicProfile('ghost')).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
