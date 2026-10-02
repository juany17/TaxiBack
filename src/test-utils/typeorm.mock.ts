/**
 * Doble de prueba para `@nestjs/typeorm`.
 *
 * Igual que `@nestjs/jwt`, el paquete real es ESM puro y Jest trabaja con
 * CommonJS. Solo se reproduce la superficie usada por los tests: el decorador
 * `InjectRepository` (que en tests se stubsea) y los tipos de repositorio.
 */
export function InjectRepository(): ParameterDecorator {
  return () => undefined;
}

export function InjectDataSource(): ParameterDecorator {
  return () => undefined;
}

export class Repository<T = unknown> {
  // Sustituido por dobles en cada test.
  findOne(_where?: unknown): Promise<T | null> {
    return Promise.resolve(null);
  }
  find(_where?: unknown): Promise<T[]> {
    return Promise.resolve([]);
  }
  save(entity: T): Promise<T> {
    return Promise.resolve(entity);
  }
  create(entity: Partial<T>): T {
    return entity as T;
  }
  count(): Promise<number> {
    return Promise.resolve(0);
  }
  update(): Promise<unknown> {
    return Promise.resolve(undefined);
  }
  remove(): Promise<unknown> {
    return Promise.resolve(undefined);
  }
  createQueryBuilder(): {
    select(): never;
    where(): never;
    andWhere(): never;
    getRawOne(): never;
  } {
    throw new Error('createQueryBuilder no soportado en tests unitarios');
  }
  exists(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

export class DataSource {
  transaction<T>(cb: (manager: unknown) => Promise<T>): Promise<T> {
    return cb(this);
  }
  getRepository<T>(): Repository<T> {
    return new Repository<T>();
  }
}
