import type { NextApiResponse } from "next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import {
  withAdminAuth,
  AuthenticatedRequest,
} from "../../../../../lib/api/authMiddleware";
import User from "../../../../../lib/backend/models/User";

const CreateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" }),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" }),
  role: z.enum(["user", "admin"]).optional(),
});

/**
 * Handler for /api/v1/admin/users
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    try {
      const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
      const limit = Math.max(
        1,
        Math.min(100, parseInt((req.query.limit as string) || "10", 10)),
      );
      const search = (req.query.search as string) || "";

      const query: any = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      const users = await User.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-password");

      return res.status(200).json({
        data: users,
        meta: {
          page,
          limit,
          total,
          totalPages,
        },
      });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Internal server error while fetching users",
        });
    }
  }

  if (req.method === "POST") {
    try {
      const validationResult = CreateUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.issues[0]?.message || "Validation failed";
        return res.status(400).json({
          success: false,
          message: firstError,
          errors: validationResult.error.format(),
        });
      }

      const { name, email, password, role } = validationResult.data;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "A user with this email already exists",
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: role || "user",
      });

      const userObj = newUser.toObject();
      delete userObj.password;

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userObj,
      });
    } catch (error: any) {
      console.error("Error creating user:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Internal server error while creating user",
        });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res
    .status(405)
    .json({ success: false, message: `Method ${req.method} Not Allowed` });
}

export default withAdminAuth(handler);
