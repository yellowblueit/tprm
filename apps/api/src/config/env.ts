import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3000),
  API_HOST: z.string().default('0.0.0.0'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Database
  DATABASE_URL: z.string(),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),

  // MinIO
  MINIO_ENDPOINT: z.string().default('http://localhost:9000'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET_ARTIFACTS: z.string().default('tprm-artifacts'),
  MINIO_BUCKET_REPORTS: z.string().default('tprm-reports'),

  // Entra ID
  ENTRA_TENANT_ID: z.string(),
  ENTRA_CLIENT_ID: z.string(),

  // Claude API
  ANTHROPIC_API_KEY: z.string().optional(),

  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().default('noreply@tprm.local'),
  SENDGRID_FROM_NAME: z.string().default('TPRM Platform'),
});

export type EnvConfig = z.infer<typeof envSchema>;

let _env: EnvConfig | null = null;

export function getEnv(): EnvConfig {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('Invalid environment variables:');
      console.error(result.error.format());
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}
