import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '../../../lib/dbConnect';
import User from '../../../models/User';
import { RegisterInputSchema } from '../../../types/auth';
import bcrypt from 'bcryptjs';

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, message: `Method ${req.method} Not Allowed` });
  }

  try {
    // 1. Database Connection
    await dbConnect();

    // 2. Input Validation (DTO)
    const validationResult = RegisterInputSchema.safeParse(req.body);
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]?.message || 'Validation failed';
      return res.status(400).json({
        success: false,
        message: firstError,
        errors: validationResult.error.format(),
      });
    }

    const { name, email, password } = validationResult.data;

    // 3. Email Duplicate Checking
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // 4. Password Hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Create User
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        profilePicture: newUser.profilePicture,
      },
    });
  } catch (error: any) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
    });
  }
}
