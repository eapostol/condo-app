import type { ReportProvider } from './reports.js';

export interface ClientImportMetaEnvContract {
  readonly VITE_API_URL?: string;
  readonly VITE_API_PROXY_TARGET?: string;
  readonly VITE_DEBUG_AUTH?: 'true' | 'false';
}

export interface ServerRuntimeEnvContract {
  PORT?: string;
  NODE_ENV?: 'development' | 'production' | 'test';
  CLIENT_URL?: string;
  JWT_SECRET?: string;
  MONGO_URI?: string;
  REPORTING_PROVIDER?: ReportProvider | string;
  MYSQL_HOST?: string;
  MYSQL_PORT?: string;
  MYSQL_DATABASE?: string;
  MYSQL_USER?: string;
  MYSQL_PASSWORD?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_CALLBACK_URL?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  MICROSOFT_CALLBACK_URL?: string;
  MICROSOFT_TENANT?: string;
  FORCE_IPV4?: 'true' | 'false';
  NODE_OPTIONS?: string;
}

export interface MongoConfigContract {
  uri: string;
  dbName: string;
}

export interface MySqlConfigContract {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}
