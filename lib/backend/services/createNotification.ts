import { connectDB } from '@/lib/backend';
import Notification from '@/lib/backend/models/Notification';
import { Types } from 'mongoose';

interface CreateNotificationInput {
  userId: Types.ObjectId | string;
  type: 'booking_requested' | 'booking_confirmed' | 'booking_cancelled' | 'message' | 'property_interest';
  title: string;
  message: string;
  propertyId?: Types.ObjectId | string;
  bookingId?: Types.ObjectId | string;
  fromUserId?: Types.ObjectId | string;
}

export async function createNotification(input: CreateNotificationInput) {
  await connectDB();
  return Notification.create(input);
}