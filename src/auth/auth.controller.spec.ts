import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
    login: jest.fn(),
    updateProfile: jest.fn(),
    getPublicProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: authService },
        // El AuthGuard se instancia al compilar el controlador.
        AuthGuard,
        JwtService,
        { provide: UsersService, useValue: { findById: jest.fn() } },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates login to the service', async () => {
    authService.login.mockResolvedValue({ token: 't' });

    await expect(controller.login({ email: 'a@b.com', password: 'x' } as never)).resolves.toEqual({ token: 't' });
    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'x');
  });

  it('updates the profile of the user in the token, not of a body field', () => {
    const req = { user: { id: 'user-1' } } as never;

    controller.updateProfile(req, { descripcion: 'hola' });

    expect(authService.updateProfile).toHaveBeenCalledWith('user-1', { descripcion: 'hola' });
  });
});
