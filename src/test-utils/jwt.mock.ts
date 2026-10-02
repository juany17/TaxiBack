/**
 * Doble de prueba para `@nestjs/jwt`.
 *
 * El paquete real (v12) es ESM puro y Jest compila el proyecto a CommonJS,
 * por lo que no puede cargarse durante los tests unitarios. Este doble expone
 * solo la superficie que usa la aplicacion (verify / sign).
 */
export class JwtService {
  verify<T = unknown>(token: string): T {
    if (!token) {
      throw new Error('Token vacío');
    }
    return JSON.parse(Buffer.from(token, 'base64').toString('utf8')) as T;
  }

  sign(payload: unknown): string {
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }
}

export class JwtModule {}
export class TokenExpiredError extends Error {}
export class NotBeforeError extends Error {}
export class JsonWebTokenError extends Error {}
