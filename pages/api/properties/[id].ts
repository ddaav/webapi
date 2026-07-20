import { connectDB } from '@/lib/backend';
import Property from '@/lib/backend/models/Property';

export default async function handler(req, res) {
  await connectDB();

  if (req.method === 'GET') {
    const { id } = req.query;
    const property = await Property.findById(id).populate('ownerId', 'name email phone');
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }
    return res.status(200).json({ success: true, property });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}