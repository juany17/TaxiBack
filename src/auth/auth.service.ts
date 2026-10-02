import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UserEntity } from '../users/entities/user.entity';
import { ProfileUpdateDto } from './profile-update.dto';
import { MailerService } from './mailer.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  async register(userData: Partial<UserEntity>): Promise<{ user: UserEntity; token: string }> {
    const user = await this.usersService.create(userData);
    const payload = { email: user.email, sub: user.id, rol: user.rol };
    
    // Devolvemos el usuario y un token de sesión inmediato
    return {
      user,
      token: this.jwtService.sign(payload),
    };
  }

  async login(email: string, pass: string): Promise<{ token: string }> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user || !user.password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = { email: user.email, sub: user.id, rol: user.rol };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  async updateProfile(userId: string, profileData: ProfileUpdateDto): Promise<UserEntity> {
    const updatedUser = await this.usersService.update(userId, profileData);
    
    // Asignar badges automáticamente basado en las estadísticas
    const badges = this.calculateBadges(updatedUser);
    updatedUser.badges = badges;
    
    await this.usersService.update(userId, { badges });
    
    return updatedUser;
  }

  private calculateBadges(user: UserEntity): string[] {
    const badges: string[] = [];

    // Badge por experiencia
    const anosExp = user.anosExperiencia ?? 0;
    if (anosExp >= 5) {
      badges.push('Veterano 🏆');
    } else if (anosExp >= 2) {
      badges.push('Experimentado ⭐');
    }

    // Badge por viajes
    const totalViajes = user.totalViajes ?? 0;
    if (totalViajes >= 100) {
      badges.push('Conductor Estrella 🌟');
    } else if (totalViajes >= 50) {
      badges.push('Conductor Destacado 🎯');
    } else if (totalViajes >= 10) {
      badges.push('Conductor Activo 🚀');
    }

    // Badge por calificación
    const calificacion = user.calificacionPromedio ?? 0;
    if (calificacion >= 4.8) {
      badges.push('Excelente Servicio 💎');
    } else if (calificacion >= 4.5) {
      badges.push('Muy Buen Servicio 🌟');
    }

    // Badge por certificaciones
    if (user.certificaciones && user.certificaciones.length > 0) {
      badges.push('Certificado 📜');
    }

    // Badge por seguridad
    if (user.tieneCascoExtra) {
      badges.push('Seguridad Total ⛑️');
    }

    // Badge por servicio
    if (user.ofreceChucherias) {
      badges.push('Servicio Premium 🎁');
    }

    return badges;
  }

  async getPublicProfile(userId: string): Promise<UserEntity> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    
    // Asegurar que los badges estén actualizados
    const badges = this.calculateBadges(user);
    user.badges = badges;
    
    return user;
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    // Respuesta genérica para no revelar si el email existe o no
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    await this.usersService.saveResetToken(user.id, token, expiry);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    await this.mailerService.sendPasswordReset(user.email, resetLink);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.usersService.findByResetToken(token);

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('El token es inválido o ya expiró');
    }

    await this.usersService.updatePasswordAndClearToken(user.id, newPassword);
  }
}
