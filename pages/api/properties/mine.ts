import { withAuth } from '@/lib/api/authMiddleware';
import { connectDB } from '@/lib/backend';
import Property from '@/lib/backend/models/Property';

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const properties = await Property.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, properties });
});