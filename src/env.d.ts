declare namespace NodeJS {
  export interface ProcessEnv {
    MONGO_DB_URL: string;
    DATABASE_URL: string;
    REDIS_URL: string;
    PORT: string;
    SESSION_SECRET: string;
    CORS_ORIGIN: string;
    SENDGRID_API_KEY: string;
    SENDGRID_FROM_ADDRESS: string;
  }
}
