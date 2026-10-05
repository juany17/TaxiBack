import { shouldSynchronizeDatabase } from './database.config';

describe('shouldSynchronizeDatabase', () => {
  it('synchronizes local development schemas by default', () => {
    expect(shouldSynchronizeDatabase('development')).toBe(true);
    expect(shouldSynchronizeDatabase(undefined)).toBe(true);
  });

  it('never synchronizes schemas in production', () => {
    expect(shouldSynchronizeDatabase('production')).toBe(false);
  });
});
