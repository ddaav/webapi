import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import Message from "@/backend/models/Message";
import Property from "@/backend/models/Property";
import { createNotification } from "@/lib/backend/services/createNotification";

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method === "POST") {
    const { propertyId, text } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const isOwner = property.ownerId.toString() === req.user._id.toString();
    const recipientId = isOwner ? req.body.recipientId : property.ownerId;

    const msg = await Message.create({
      propertyId,
      senderId: req.user._id,
      recipientId,
      text,
    });

    await createNotification({
      userId: recipientId,
      type: "message",
      title: `New message`,
      message: `${req.user.name}: ${text.slice(0, 60)}`,
      propertyId: property._id,
      fromUserId: req.user._id,
    });

    return res.status(201).json({ success: true, message: msg });
  }

  if (req.method === "GET") {
    const { propertyId, withUserId } = req.query;

    const messages = await Message.find({
      propertyId,
      $or: [
        { senderId: req.user._id, recipientId: withUserId },
        { senderId: withUserId, recipientId: req.user._id },
      ],
    }).sort({ createdAt: 1 });

    return res.status(200).json({ success: true, messages });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
});
