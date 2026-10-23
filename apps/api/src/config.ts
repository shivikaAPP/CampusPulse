import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('8787').transform((v) => parseInt(v, 10)),
  DATABASE_PATH: z.string().default('./campusplus.sqlite'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173,http://127.0.0.1:5173'),
  ADMIN_PASSWORD_HASH: z.string().default('$2a$10$losgyR8tXgP.jtwwoiHrwOEHvi8bapZ4.nuZ1zXKG4js0tkmXNw2G'), // default bcrypt hash for 'admin123'
  SESSION_SECRET: z.string().min(32).default('a_very_secure_secret_key_at_least_32_characters_long_12345'),
  LOG_LEVEL: z.string().default('info'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Config = z.infer<typeof envSchema>;

export function loadConfig(overrides?: Partial<Config>): Config {
  const parsed = envSchema.safeParse({
    PORT: process.env.PORT,
    DATABASE_PATH: process.env.DATABASE_PATH,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
    SESSION_SECRET: process.env.SESSION_SECRET,
    LOG_LEVEL: process.env.LOG_LEVEL,
    NODE_ENV: process.env.NODE_ENV,
    ...overrides,
  });

  if (!parsed.success) {
    console.error('Invalid environment variables:', parsed.error.format());
    throw new Error('Invalid configuration');
  }

  return parsed.data;
}

export const config = loadConfig();
