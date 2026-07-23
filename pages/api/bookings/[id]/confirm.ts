import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import Booking from "@/lib/backend/models/Booking";
import Property from "@/lib/backend/models/Property";
import { createNotification } from "@/lib/backend/services/createNotification";

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method !== "PATCH") {
    return res
      .status(405)
      .json({ success: false, message: "Method not allowed" });
  }

  const { id } = req.query;
  const { action } = req.body;
  const booking = await Booking.findById(id);
  if (!booking) {
    return res
      .status(404)
      .json({ success: false, message: "Booking not found" });
  }

  const isOwner = booking.ownerId.toString() === req.user._id.toString();
  const isBooker = booking.bookerId.toString() === req.user._id.toString();

  if (!isOwner && !isBooker) {
    return res
      .status(403)
      .json({ success: false, message: "Not authorized for this booking" });
  }

  const property = await Property.findById(booking.propertyId);

  if (action === "confirm" && isOwner) {
    booking.status = "confirmed";
    await booking.save();

    await createNotification({
      userId: booking.bookerId,
      type: "booking_confirmed",
      title: "Booking confirmed",
      message: `Your booking for ${property?.title ?? "the property"} is confirmed`,
      propertyId: booking.propertyId,
      bookingId: booking._id,
      fromUserId: req.user._id,
    });
  } else if (action === "reject" && isOwner) {
    booking.status = "rejected";
    await booking.save();

    await createNotification({
      userId: booking.bookerId,
      type: "booking_cancelled",
      title: "Booking declined",
      message: `Your booking request for ${property?.title ?? "the property"} was declined`,
      propertyId: booking.propertyId,
      bookingId: booking._id,
      fromUserId: req.user._id,
    });
  } else if (action === "cancel" && isBooker) {
    booking.status = "cancelled";
    await booking.save();

    await createNotification({
      userId: booking.ownerId,
      type: "booking_cancelled",
      title: "Booking cancelled",
      message: `${req.user.name} cancelled their booking for ${property?.title ?? "the property"}`,
      propertyId: booking.propertyId,
      bookingId: booking._id,
      fromUserId: req.user._id,
    });
  } else {
    return res
      .status(400)
      .json({ success: false, message: "Invalid action for this role" });
  }

  return res.status(200).json({ success: true, booking });
});
