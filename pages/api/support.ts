import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import SupportRequest from "@/lib/backend/models/SupportRequest";

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method === "POST") {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const request = await SupportRequest.create({
      userId: req.user?._id,
      name,
      email,
      subject,
      message,
    });

    return res.status(201).json({ success: true, request });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
});