import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IBooking {
  propertyId: Types.ObjectId;
  ownerId: Types.ObjectId;  
  bookerId: Types.ObjectId;  
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  moveInDate?: Date;
  message?: string;
}

export interface IBookingDocument extends IBooking, Document {}

const BookingSchema = new Schema<IBookingDocument>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    bookerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'rejected'], default: 'pending' },
    moveInDate: Date,
    message: String,
  },
  { timestamps: true }
);

export default (models.Booking as mongoose.Model<IBookingDocument>) ||
  model<IBookingDocument>('Booking', BookingSchema);