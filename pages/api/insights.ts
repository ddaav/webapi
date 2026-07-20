import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import Property from "@/lib/backend/models/Property";

export default withAuth(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await connectDB();

  const [byType, byCity, totalStats, monthly] = await Promise.all([
    Property.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$type", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
      { $sort: { count: -1 } },
    ]),
    Property.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$city", count: { $sum: 1 }, avgPrice: { $avg: "$price" } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    Property.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          avgPrice: { $avg: "$price" },
          minPrice: { $min: "$price" },
          maxPrice: { $max: "$price" },
        },
      },
    ]),
    Property.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      { $limit: 12 },
    ]),
  ]);

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return res.status(200).json({
    success: true,
    summary: totalStats[0] || { totalListings: 0, avgPrice: 0, minPrice: 0, maxPrice: 0 },
    byType: byType.map((t) => ({
      type: t._id,
      count: t.count,
      avgPrice: Math.round(t.avgPrice),
    })),
    byCity: byCity.map((c) => ({
      city: c._id,
      count: c.count,
      avgPrice: Math.round(c.avgPrice),
    })),
    monthlyListings: monthly.map((m) => ({
      label: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      count: m.count,
    })),
  });
});