import type { NextApiRequest, NextApiResponse } from "next";
import { connectDB, getDBStatus, DBStatus } from "@/lib/backend";
export { default as connectDB } from './dbConnect';


interface HealthResponse {
  status: "ok" | "error";
  timestamp: string;
  database: DBStatus;
  message?: string;
}

/**
 * GET /api/health
 *
 * Returns the current health of the application and MongoDB connection.
 * Useful for checking that MongoDB Compass (local) is running and reachable.
 *
 * Example response (healthy):
 * {
 *   "status": "ok",
 *   "timestamp": "2025-01-01T00:00:00.000Z",
 *   "database": {
 *     "state": "connected",
 *     "stateCode": 1,
 *     "host": "127.0.0.1",
 *     "dbName": "ghar-purja",
 *     "isConnected": true
 *   }
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: getDBStatus(),
      message: `Method ${req.method} Not Allowed`,
    });
  }

  try {
    await connectDB();

    const dbStatus = getDBStatus();

    return res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      database: dbStatus,
    });
  } catch (error: any) {
    console.error("[Health Check] MongoDB connection failed:", error);

    return res.status(503).json({
      status: "error",
      timestamp: new Date().toISOString(),
      database: getDBStatus(),
      message: error?.message ?? "Could not connect to MongoDB",
    });
  }
}
