import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/api/authMiddleware';

type ResponseData = {
  success: boolean;
  message?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    profilePicture?: string | null;
  };
};

/**
 * GET /api/v1/auth/whoami
 * Returns details of the currently logged in user.
 */
async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  const { user } = req;

  return res.status(200).json({
    success: true,
    user: {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || null,
    },
  });
}

export default withAuth(handler);
