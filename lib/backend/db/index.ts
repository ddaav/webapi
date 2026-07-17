/**
 * lib/backend/db/index.ts
 *
 * Barrel export for all database utilities.
 * Import from here to keep API routes clean:
 *
 *   import { connectDB, getDBStatus } from '@/lib/backend/db';
 */

export { default as connectDB } from './connect';
export { getDBStatus } from './status';
export type { DBStatus } from './status';
