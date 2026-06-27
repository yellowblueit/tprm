import pino from 'pino';
import { getEnv } from '../config/env.js';

let logger: pino.Logger | null = null;

export function getLogger(): pino.Logger {
  if (!logger) {
    const env = getEnv();
    logger = pino({
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    });
  }
  return logger;
}
