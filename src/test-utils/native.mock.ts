/**
 * Dobles de prueba para dependencias nativas o ESM que Jest (CommonJS) no carga.
 *
 * - `bcrypt` es un modulo nativo compilado.
 * - `@nestjs/throttler` se distribuye como ESM.
 *
 * Solo se reproducen las funciones que usa la aplicacion.
 */
export const hash = async (plain: string): Promise<string> => `hashed:${plain}`;
export const compare = async (plain: string, digest: string): Promise<boolean> =>
  digest === `hashed:${plain}`;
export const genSalt = async (): Promise<string> => 'salt';
export const hashSync = (plain: string): string => `hashed:${plain}`;
export const compareSync = (plain: string, digest: string): boolean => digest === `hashed:${plain}`;

export const Throttle = (): MethodDecorator => () => undefined;
export const SkipThrottle = (): MethodDecorator => () => undefined;
export class ThrottlerGuard {
  canActivate(): boolean {
    return true;
  }
}
export const ThrottlerModule = {
  forRoot: () => ({ module: class ThrottlerModule {} }),
};
