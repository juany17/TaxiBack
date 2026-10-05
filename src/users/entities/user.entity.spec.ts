import { getMetadataArgsStorage } from 'typeorm';
import { UserEntity } from './user.entity';

describe('UserEntity TypeORM metadata', () => {
  it('declares the nullable Mercado Pago alias as a varchar column', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadata) =>
        metadata.target === UserEntity &&
        metadata.propertyName === 'mercadoPagoAlias',
    );

    expect(column?.options.type).toBe('varchar');
  });
});
