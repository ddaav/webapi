import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import Booking from "@/lib/backend/models/Booking";
import Property from "@/lib/backend/models/Property";
import Message from "@/lib/backend/models/Message";
import { createNotification } from "@/lib/backend/services/createNotification";

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method === "POST") {
    const { propertyId, moveInDate, message } = req.body;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res
        .status(404)
        .json({ success: false, message: "Property not found" });
    }

    const booking = await Booking.create({
      propertyId,
      ownerId: property.ownerId,
      bookerId: req.user._id,
      status: "pending",
      moveInDate,
      message,
    });

    const bookingMsgText = message && message.trim()
      ? message.trim()
      : `Hello! I have requested to book this property${moveInDate ? ` (Target move-in date: ${new Date(moveInDate).toLocaleDateString()})` : ''}.`;

    await Message.create({
      propertyId: property._id,
      senderId: req.user._id,
      recipientId: property.ownerId,
      text: bookingMsgText,
    });

    await createNotification({
      userId: property.ownerId,
      type: "booking_requested",
      title: "New booking request",
      message: `${req.user.name} requested to book ${property.title}`,
      propertyId: property._id,
      bookingId: booking._id,
      fromUserId: req.user._id,
    });

    return res.status(201).json({ success: true, booking });
  }

 if (req.method === 'GET') {
  const bookings = await Booking.find({
    $or: [{ ownerId: req.user._id }, { bookerId: req.user._id }],
  })
    .populate('propertyId', 'title images price')
    .populate('bookerId', 'name email')
    .populate('ownerId', 'name email')
    .sort({ createdAt: -1 });

  return res.status(200).json({ success: true, bookings });
}

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
});
