import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IMessage {
  propertyId: Types.ObjectId;
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  text: string;
  isRead: boolean;
}

export interface IMessageDocument extends IMessage, Document {}

const MessageSchema = new Schema<IMessageDocument>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    text: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default (models.Message as mongoose.Model<IMessageDocument>) ||
  model<IMessageDocument>('Message', MessageSchema);