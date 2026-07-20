import { withAuth } from '@/lib/api/authMiddleware';
import { connectDB } from '@/lib/backend';
import Message from '@/lib/backend/models/Message';
import mongoose from 'mongoose';

export default withAuth(async (req, res) => {
  await connectDB();

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const userId = new mongoose.Types.ObjectId(req.user._id);

  const conversations = await Message.aggregate([
    { $match: { $or: [{ senderId: userId }, { recipientId: userId }] } },
    {
      $addFields: {
        otherUserId: {
          $cond: [{ $eq: ['$senderId', userId] }, '$recipientId', '$senderId'],
        },
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { propertyId: '$propertyId', otherUserId: '$otherUserId' },
        lastMessage: { $first: '$text' },
        lastMessageAt: { $first: '$createdAt' },
        unreadCount: {
          $sum: {
            $cond: [{ $and: [{ $eq: ['$recipientId', userId] }, { $eq: ['$isRead', false] }] }, 1, 0],
          },
        },
      },
    },
    { $sort: { lastMessageAt: -1 } },
    {
      $lookup: {
        from: 'properties',
        localField: '_id.propertyId',
        foreignField: '_id',
        as: 'property',
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id.otherUserId',
        foreignField: '_id',
        as: 'otherUser',
      },
    },
    { $unwind: '$property' },
    { $unwind: '$otherUser' },
    {
      $project: {
        _id: 0,
        propertyId: '$_id.propertyId',
        propertyTitle: '$property.title',
        otherUserId: '$_id.otherUserId',
        otherUserName: '$otherUser.name',
        lastMessage: 1,
        lastMessageAt: 1,
        unreadCount: 1,
      },
    },
  ]);

  return res.status(200).json({ success: true, conversations });
});