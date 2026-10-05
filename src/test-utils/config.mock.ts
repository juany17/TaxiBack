export class ConfigService {
  get<T>(_key: string): T | undefined {
    return undefined;
  }
}

export class ConfigModule {
  static forRoot() {
    return { module: ConfigModule };
  }
}
