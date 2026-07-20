import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import Notification from "@/lib/backend/models/Notification";

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method === "GET") {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    return res.status(200).json({ success: true, notifications, unreadCount });
  }

  if (req.method === "PATCH") {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true },
    );
    return res.status(200).json({ success: true });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
});
