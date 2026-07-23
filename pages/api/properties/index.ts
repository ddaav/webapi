import type { NextApiRequest, NextApiResponse } from 'next';
import { withAuth } from '@/lib/api/authMiddleware';
import { connectDB } from '@/lib/backend';
import Property from '@/lib/backend/models/Property';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await connectDB();

  if (req.method === 'GET') {
  const properties = await Property.find({ isActive: true })
    .populate('ownerId', 'name email phone')
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, properties });
}

  if (req.method === 'POST') {
    // Posting a property requires login — delegate to withAuth
    return withAuth(async (authedReq, authedRes) => {
      const { title, description, location, city, price, type, beds, baths, sqft, parking, security, balcony, waterBackup, images } = authedReq.body;

      const property = await Property.create({
        ownerId: authedReq.user._id,
        title, description, location, city, price, type,
        beds, baths, sqft, parking, security, balcony, waterBackup,
        images: images || [],
      });

      return authedRes.status(201).json({ success: true, property });
    })(req, res);
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}