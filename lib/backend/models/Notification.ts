import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface INotification {
  userId: Types.ObjectId;
  type: 'booking_requested' | 'booking_confirmed' | 'booking_cancelled' | 'message' | 'property_interest';
  title: string;
  message: string;
  propertyId?: Types.ObjectId;
  bookingId?: Types.ObjectId;
  fromUserId?: Types.ObjectId;
  isRead: boolean;
}

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['booking_requested', 'booking_confirmed', 'booking_cancelled', 'message', 'property_interest'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    fromUserId: { type: Schema.Types.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default (models.Notification as mongoose.Model<INotificationDocument>) ||
  model<INotificationDocument>('Notification', NotificationSchema);