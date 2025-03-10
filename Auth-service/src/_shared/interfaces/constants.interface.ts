export interface IConstants {
  port?: number;
  databaseUrl?: string;
  env?: any;
  jwt?: IJwtConfig;
  allowedOrigins?: string[];
  adminEmail?: string;
  adminPassword?: string;
  serverUrl: string;
  brokerUrl?: string;
}

interface IJwtConfig {
  secret: string;
  expiresIn: string | number;
}
