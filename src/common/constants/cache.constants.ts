// Cache time-to-live constants
export const CACHE_TTL = 3600; // 1 hour in seconds
export const CACHE_TTL_MILLISECONDS = CACHE_TTL * 1000;

// Cache key prefixes
export const CACHE_PREFIXES = {
  ROLE: 'role',
  USER: 'user',
} as const;

// Time constants
export const ONE_MONTH = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds
