export const JWT_EXPIRATION = {
  ACCESS_TOKEN: '3h',
  REFRESH_TOKEN: '1d',
} as const;

export const JWT_CONFIG = {
  SECRET_KEY: 'SECRET_KEY',
  JWT_SECRET: 'JWT_SECRET',
  JWT_EXPIRATION: 'JWT_EXPIRATION',
} as const;
