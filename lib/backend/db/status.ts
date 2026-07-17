import mongoose from 'mongoose';

// Mongoose readyState codes → human-readable labels
const STATE_LABELS: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

export interface DBStatus {
  state: string;
  stateCode: number;
  host: string | null;
  dbName: string | null;
  isConnected: boolean;
}

/**
 * Returns the current Mongoose connection status without making a new
 * connection.  Useful for a `/api/health` endpoint.
 */
export function getDBStatus(): DBStatus {
  const { readyState, host, name } = mongoose.connection;

  return {
    state: STATE_LABELS[readyState] ?? 'unknown',
    stateCode: readyState,
    host: host ?? null,
    dbName: name ?? null,
    isConnected: readyState === 1,
  };
}
