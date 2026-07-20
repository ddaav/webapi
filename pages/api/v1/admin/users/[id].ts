import type { NextApiResponse } from "next";
import { z } from "zod";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
  withAdminAuth,
  AuthenticatedRequest,
} from "../../../../../lib/api/authMiddleware";
import User from "../../../../../lib/backend/models/User";

const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .optional(),
  email: z
    .string()
    .email({ message: "Invalid email address" })
    .toLowerCase()
    .trim()
    .optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long" })
    .optional(),
  role: z.enum(["user", "admin"]).optional(),
});

/**
 * Handler for /api/v1/admin/users/:id
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!mongoose.Types.ObjectId.isValid(id as string)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid User ID format" });
  }

  // GET: View one user data
  if (req.method === "GET") {
    try {
      const user = await User.findById(id).select("-password");
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      console.error("Error fetching user:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Internal server error while fetching user",
        });
    }
  }

  // PUT / PATCH: Update a selected user data
  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const validationResult = UpdateUserSchema.safeParse(req.body);
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
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (role !== undefined) updateData.role = role;

      if (email !== undefined) {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "A user with this email already exists",
          });
        }
        updateData.email = email;
      }

      if (password !== undefined) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true },
      ).select("-password");

      if (!updatedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: updatedUser,
      });
    } catch (error: any) {
      console.error("Error updating user:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Internal server error while updating user",
        });
    }
  }

  // DELETE: Delete a selected user data
  if (req.method === "DELETE") {
    try {
      const deletedUser = await User.findByIdAndDelete(id);
      if (!deletedUser) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Internal server error while deleting user",
        });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "PATCH", "DELETE"]);
  return res
    .status(405)
    .json({ success: false, message: `Method ${req.method} Not Allowed` });
}

export default withAdminAuth(handler);
