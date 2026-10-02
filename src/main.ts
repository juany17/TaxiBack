import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const DEFAULT_ORIGINS = ['http://localhost:4200'];

function allowedOrigins(configService: ConfigService): string[] {
  const configured = configService.get<string>('CORS_ORIGIN');
  if (!configured) {
    return DEFAULT_ORIGINS;
  }
  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Lista explicícita de orígenes: nunca comodín, para que un sitio externo
  // no pueda invocar la API con la sesión del usuario.
  app.enableCors({ origin: allowedOrigins(configService), credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
