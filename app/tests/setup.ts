/**
 * Vitest global setup.
 * Se ejecuta antes de cada archivo de test.
 */

// Mock env vars para tests
// NODE_ENV is read-only in Next.js TypeScript config
process.env.DATABASE_URL = "postgresql://opsmanager:opsmanager@localhost:6100/opsmanager_test";
process.env.REDIS_URL = "redis://localhost:6101/1";
process.env.AUTH_SECRET = "test-secret-minimum-32-characters-long";
process.env.AUTH_URL = "http://localhost:3100";
