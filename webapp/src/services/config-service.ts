interface TConfig {
  API: string;
  APP_NAME: string;
  APP_LOGO_URL: string;
  APP_FAVICON_URL: string;
  APP_VERSION: string;
}

class ConfigService {
  private config: TConfig;

  constructor() {
    this.config = {
      API: import.meta.env.VITE_API,
      APP_NAME: import.meta.env.VITE_APP_NAME,
      APP_LOGO_URL: "",
      APP_FAVICON_URL: "",
      APP_VERSION: import.meta.env.VITE_APP_VERSION,
    };
  }

  get<T extends keyof TConfig>(key: T): TConfig[T] {
    return this.config[key];
  }

  set<T extends keyof TConfig>(key: T, value: TConfig[T]): void {
    this.config[key] = value;
  }
}

const Config = new ConfigService();

export default Config;
