import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'), // Contraseña de aplicación de Gmail
      },
    });
  }

  async sendPasswordReset(toEmail: string, resetLink: string): Promise<void> {
    const mailOptions = {
      from: `"MotoTaxi App" <${this.configService.get<string>('MAIL_USER')}>`,
      to: toEmail,
      subject: '🔐 Recuperá tu contraseña — MotoTaxi',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">
          <h2 style="color: #5b21b6;">MotoTaxi 🏍️</h2>
          <p>Recibimos una solicitud para restablecer tu contraseña.</p>
          <p>Hacé clic en el botón de abajo. El enlace es válido por <strong>1 hora</strong>.</p>
          <a href="${resetLink}"
             style="display: inline-block; margin: 16px 0; padding: 12px 24px; background: #5b21b6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Restablecer contraseña
          </a>
          <p style="color: #888; font-size: 13px;">
            Si no solicitaste esto, podés ignorar este email. Tu contraseña no va a cambiar.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 16px 0;" />
          <p style="color: #aaa; font-size: 12px;">MotoTaxi — Plataforma para conductores y pasajeros</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Email de recuperación enviado a: ${toEmail}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${toEmail}:`, error);
      throw error;
    }
  }
}
