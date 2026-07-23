import { withAuth } from "@/lib/api/authMiddleware";
import { connectDB } from "@/lib/backend";
import Property from "@/lib/backend/models/Property";

// GET /api/valuation?city=Kathmandu&type=Apartment&sqft=1500&beds=3
export default withAuth(async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await connectDB();

  const { city, type, sqft, beds } = req.query;
  const targetSqft = Number(sqft);

  if (!city || !type || !targetSqft || targetSqft <= 0) {
    return res.status(400).json({
      success: false,
      message: "city, type, and sqft are required",
    });
  }

  const propertyType = String(type);

  const filter: Record<string, any> = {
    isActive: true,
    city: new RegExp(String(city), "i"),
    type: propertyType,
    sqft: { $gt: 0 },
  };

  if (beds) {
    // Allow +/- 1 bedroom as a comparable
    const bedsNum = Number(beds);
    filter.beds = { $gte: Math.max(0, bedsNum - 1), $lte: bedsNum + 1 };
  }

  const comparables = await Property.find(filter)
    .select("price sqft beds baths location")
    .lean();

  if (comparables.length < 2) {
    // Not enough exact matches — widen search to just city + type
    const widerFilter: Record<string, any> = {
      isActive: true,
      city: new RegExp(String(city), "i"),
      type: propertyType,
      sqft: { $gt: 0 },
    };
    const wider = await Property.find(widerFilter)
      .select("price sqft")
      .lean();

    if (wider.length === 0) {
      return res.status(200).json({
        success: true,
        comparablesCount: 0,
        message: "Not enough listing data in this area yet to generate an estimate.",
      });
    }

    const avgPricePerSqft =
      wider.reduce((sum, p) => sum + p.price / p.sqft, 0) / wider.length;

    const estimate = avgPricePerSqft * targetSqft;

    return res.status(200).json({
      success: true,
      comparablesCount: wider.length,
      avgPricePerSqft: Math.round(avgPricePerSqft),
      estimateLow: Math.round(estimate * 0.9),
      estimateMid: Math.round(estimate),
      estimateHigh: Math.round(estimate * 1.1),
      note: "Estimate based on limited data (widened to city + type only).",
    });
  }

  const avgPricePerSqft =
    comparables.reduce((sum, p) => sum + p.price / p.sqft, 0) / comparables.length;

  const estimate = avgPricePerSqft * targetSqft;

  return res.status(200).json({
    success: true,
    comparablesCount: comparables.length,
    avgPricePerSqft: Math.round(avgPricePerSqft),
    estimateLow: Math.round(estimate * 0.9),
    estimateMid: Math.round(estimate),
    estimateHigh: Math.round(estimate * 1.1),
  });
});