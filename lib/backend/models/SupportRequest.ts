import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface ISupportRequest {
  userId?: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
}

export interface ISupportRequestDocument extends ISupportRequest, Document {}

const SupportRequestSchema = new Schema<ISupportRequestDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true },
    email: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

export default (models.SupportRequest as mongoose.Model<ISupportRequestDocument>) ||
  model<ISupportRequestDocument>('SupportRequest', SupportRequestSchema);