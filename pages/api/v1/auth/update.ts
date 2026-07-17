import type { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '../../../../lib/api/authMiddleware';
import { upload, runMiddleware } from '../../../../lib/api/multer';
import User from '../../../../models/User';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

// Disable standard Next.js body parser so multer can parse raw multipart stream
export const config = {
  api: {
    bodyParser: false,
  },
};

// Interface extending AuthenticatedRequest with multer's file property
interface UpdateProfileRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
}

// Validation schema for optional update fields (including password fields)
const UpdateProfileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).optional(),
  email: z.string().email({ message: 'Invalid email address' }).toLowerCase().trim().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, { message: 'New password must be at least 6 characters long' }).optional(),
});

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
  errors?: any;
};

/**
 * PUT/POST /api/v1/auth/update
 * Updates name, email, profilePicture, and/or password of the currently authenticated user.
 */
async function handler(
  req: UpdateProfileRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'PUT' && req.method !== 'POST') {
    res.setHeader('Allow', ['PUT', 'POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Run the multer middleware to parse file and fields
    try {
      await runMiddleware(req, res, upload.single('profilePicture'));
    } catch (err: any) {
      return res.status(400).json({ success: false, message: err.message || 'File upload failed' });
    }

    // 2. Validate body fields
    const validationResult = UpdateProfileSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        message: firstError,
        errors: validationResult.error.format(),
      });
    }

    const { name, email, currentPassword, newPassword } = validationResult.data;
    const { user } = req; // Injected by withAuth middleware

    // 3. Prepare the update fields payload
    const updateData: any = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    
    if (email !== undefined) {
      // Check if email is already taken by another user
      if (email !== user.email) {
        const emailExists = await User.findOne({ email });
        if (emailExists) {
          return res.status(400).json({ success: false, message: 'Email is already in use by another account' });
        }
        updateData.email = email;
      }
    }

    // If a new password is provided, verify current password and hash the new one
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to change your password' });
      }

      // Fetch user with explicit password selection
      const userWithPass = await User.findById(user._id).select('+password');
      if (!userWithPass || !userWithPass.password) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      // Verify current password match
      const isMatch = await bcrypt.compare(currentPassword, userWithPass.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Incorrect current password' });
      }

      // Hash the new password
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    // If file was successfully uploaded by multer, set the profilePicture path
    if (req.file) {
      // Store public URL relative path
      const relativePath = `/uploads/${req.file.filename}`;
      updateData.profilePicture = relativePath;
    }

    // Check if there is anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No profile details or file provided to update' });
    }

    // 4. Update user in the database
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture || null,
      },
    });
  } catch (error: any) {
    console.error('Update Profile Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during profile update',
    });
  }
}

export default withAuth(handler as any);
