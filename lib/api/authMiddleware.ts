import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import dbConnect from '../dbConnect';
import User, { IUserDocument } from '../../models/User';

export interface AuthenticatedRequest extends NextApiRequest {
  user: IUserDocument;
}

export type AuthenticatedHandler<T = any> = (
  req: AuthenticatedRequest,
  res: NextApiResponse<T>
) => void | Promise<void>;

/**
 * Higher-order function to protect API routes with authentication.
 * Verifies JWT token from cookies or Authorization Bearer header,
 * connects to database, fetches the user, and attaches it to the request.
 */
export function withAuth<T = any>(handler: AuthenticatedHandler<T>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1. Extract token from cookies or authorization header
      let token = req.cookies.token;

      if (!token && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
      }

      // 2. Verify token
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      let decoded: any;
      try {
        decoded = jwt.verify(token, jwtSecret);
      } catch (err) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
      }

      const userId = decoded.userId;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token payload' });
      }

      // 3. Connect to database and find user
      await dbConnect();
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // 4. Attach user to request and call the handler
      const authReq = req as AuthenticatedRequest;
      authReq.user = user;

      return handler(authReq, res);
    } catch (error: any) {
      console.error('Authentication middleware error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
    }
  };
}

/**
 * Higher-order function to protect API routes with admin authentication.
 * First verifies standard authentication, then checks if the user has the 'admin' role.
 */
export function withAdminAuth<T = any>(handler: AuthenticatedHandler<T>) {
  return withAuth(async (req, res) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admin access only' });
    }
    return handler(req, res);
  });
}

