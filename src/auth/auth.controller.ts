import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Req, Get, Param, Patch } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuthGuard, AuthenticatedUser } from './guards/auth.guard';
import { RegisterUserDto } from './register-user.dto';
import { LoginDto } from './login.dto';
import { ProfileUpdateDto } from './profile-update.dto';
import { ForgotPasswordDto } from './forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Freno a fuerza bruta: 10 intentos de login por IP cada 15 minutos.
  @Throttle({ default: { limit: 10, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  // El registro es mas costoso (bcrypt + escritura): 5 por IP cada hora.
  @Throttle({ default: { limit: 5, ttl: 60 * 60 * 1000 } })
  @Post('register')
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @SkipThrottle()
  @Get('me')
  @UseGuards(AuthGuard)
  getMe(@Req() req: Request & { user: AuthenticatedUser }) {
    return req.user;
  }

  @SkipThrottle()
  @Get('payment-alias')
  @UseGuards(AuthGuard)
  getOwnPaymentAlias(@Req() req: Request & { user: AuthenticatedUser }) {
    return this.authService.getOwnPaymentAlias(req.user.id);
  }

  @SkipThrottle()
  @Patch('profile')
  @UseGuards(AuthGuard)
  updateProfile(@Req() req: Request & { user: AuthenticatedUser }, @Body() profileData: ProfileUpdateDto) {
    return this.authService.updateProfile(req.user.id, profileData);
  }

  @SkipThrottle()
  @Get('profile/:id')
  getPublicProfile(@Param('id') id: string) {
    return this.authService.getPublicProfile(id);
  }

  // Máx 3 solicitudes de recuperación por IP cada 15 minutos (anti-spam)
  @Throttle({ default: { limit: 3, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    // Siempre devolvemos el mismo mensaje para no revelar si el email existe
    return { message: 'Si el email está registrado, recibirás un link para restablecer tu contraseña.' };
  }

  @Throttle({ default: { limit: 5, ttl: 15 * 60 * 1000 } })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Contraseña restablecida con éxito.' };
  }
}
