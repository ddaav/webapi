import mongoose, { ConnectOptions } from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Extend NodeJS global so the cache survives Next.js hot-reloads in dev mode
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    '❌  Please define MONGODB_URI in your .env.local file.\n' +
      'Example: MONGODB_URI=mongodb://127.0.0.1:27017/ghar-purja'
  );
}

const connectionOptions: ConnectOptions = {
  // Disable buffering so operations fail fast when the DB is unreachable
  bufferCommands: false,
  // Connection pool settings
  maxPoolSize: 10,
  minPoolSize: 2,
  // Timeout settings (ms)
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
};

// ─────────────────────────────────────────────────────────────────────────────
// Cached connection (singleton pattern)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In development, Next.js clears the module cache on every hot-reload which
 * would otherwise create a new Mongoose connection on every request.
 * We store the connection on `global` to reuse it across reloads.
 */
const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

// ─────────────────────────────────────────────────────────────────────────────
// Connect function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a cached Mongoose connection, creating one if it doesn't exist yet.
 *
 * Usage in an API route:
 * ```ts
 * import connectDB from '@/lib/backend/db/connect';
 *
 * export default async function handler(req, res) {
 *   await connectDB();
 *   // ... your logic
 * }
 * ```
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection immediately
  if (cache.conn) {
    return cache.conn;
  }

  // Kick off a new connection if one isn't already pending
  if (!cache.promise) {
    console.log('🔌  Connecting to MongoDB Compass...');

    cache.promise = mongoose
      .connect(MONGODB_URI!, connectionOptions)
      .then((mongooseInstance) => {
        console.log(`✅  MongoDB connected → ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      });

    // Register lifecycle listeners once
    mongoose.connection.on('error', (err) => {
      console.error('❌  MongoDB connection error:', err);
      // Reset cache so the next request retries
      cache.conn = null;
      cache.promise = null;
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️   MongoDB disconnected. Connection will be retried on next request.');
      cache.conn = null;
      cache.promise = null;
    });
  }

  try {
    cache.conn = await cache.promise;
  } catch (err) {
    // Reset so subsequent requests can retry
    cache.promise = null;
    throw err;
  }

  return cache.conn;
}

export default connectDB;
