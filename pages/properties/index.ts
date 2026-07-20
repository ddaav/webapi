import mongoose, { Schema, model, models, Document, Types } from 'mongoose';

export interface IProperty {
  ownerId: Types.ObjectId;
  title: string;
  description: string;
  location: string;
  city: string;
  price: number;
  type: 'House' | 'Apartment' | 'Land' | 'Commercial';
  beds?: number;
  baths?: number;
  sqft?: number;
  parking?: boolean;
  security?: boolean;
  balcony?: boolean;
  waterBackup?: boolean;
  images: string[];
  isActive: boolean;
  isAiVerified?: boolean;
  isValuePick?: boolean;
  isHotListing?: boolean;
  matchScore?: number;
}

export interface IPropertyDocument extends IProperty, Document {}

const PropertySchema = new Schema<IPropertyDocument>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    city: { type: String, required: true },
    price: { type: Number, required: true },
    type: { type: String, enum: ['House', 'Apartment', 'Land', 'Commercial'], required: true },
    beds: Number,
    baths: Number,
    sqft: Number,
    parking: { type: Boolean, default: false },
    security: { type: Boolean, default: false },
    balcony: { type: Boolean, default: false },
    waterBackup: { type: Boolean, default: false },
    images: [{ type: String }],
    isActive: { type: Boolean, default: true },
    isAiVerified: { type: Boolean, default: false },
    isValuePick: { type: Boolean, default: false },
    isHotListing: { type: Boolean, default: false },
    matchScore: { type: Number, default: 85 },
  },
  { timestamps: true }
);


PropertySchema.index({ title: 'text', location: 'text', city: 'text' });

export default (models.Property as mongoose.Model<IPropertyDocument>) ||
  model<IPropertyDocument>('Property', PropertySchema);