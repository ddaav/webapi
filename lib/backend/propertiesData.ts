export interface Landlord {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string;
  rating: number;
  propertiesCount: number;
  responseTime: string;
  joinedDate: string;
}

export interface Property {
  id: string;
  title: string;
  price: number;
  priceFormatted: string;
  location: string;
  city: string;
  type: 'House' | 'Apartment' | 'Land' | 'Commercial';
  beds: number;
  baths: number;
  sqft: number;
  badges: { text: string; type: 'sale' | 'ai' | 'value' | 'hot' | 'popular' }[];
  matchScore: number;
  image: string;
  parking: boolean;
  security: boolean;
  balcony: boolean;
  waterBackup: boolean;
  landlord: Landlord;
  description: string;
}

// Raw shape returned by the API (mirrors backend/models/Property.ts + populated owner)
interface RawApiProperty {
  _id: string;
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
  isAiVerified?: boolean;
  isValuePick?: boolean;
  isHotListing?: boolean;
  matchScore?: number;
  createdAt?: string;
  ownerId?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    phone?: string;
  };
}

const FALLBACK_IMAGE = '/assets/property_1.png';

function getInitials(name: string): string {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return parts[0][0]?.toUpperCase() || 'U';
}

// Turns a raw DB property into the shape the UI already expects
function mapApiProperty(raw: RawApiProperty): Property {
  const badges: Property['badges'] = [];
  badges.push({
    text: raw.isHotListing ? 'Just Listed' : 'For Sale',
    type: raw.isHotListing ? 'hot' : 'sale',
  });
  if (raw.isAiVerified) badges.push({ text: 'AI Verified', type: 'ai' });
  if (raw.isValuePick) badges.push({ text: 'Value Pick', type: 'value' });

  const owner = raw.ownerId;

  return {
    id: raw._id,
    title: raw.title,
    price: raw.price,
    priceFormatted: `NPR ${raw.price.toLocaleString()}`,
    location: raw.location ? `${raw.location}, ${raw.city}` : raw.city,
    city: raw.city,
    type: raw.type,
    beds: raw.beds || 0,
    baths: raw.baths || 0,
    sqft: raw.sqft || 0,
    badges,
    matchScore: raw.matchScore ?? 85,
    image: raw.images?.[0] || FALLBACK_IMAGE,
    parking: !!raw.parking,
    security: !!raw.security,
    balcony: !!raw.balcony,
    waterBackup: !!raw.waterBackup,
    description: raw.description,
    landlord: {
      id: owner?._id || 'unknown',
      name: owner?.name || 'Landlord',
      phone: owner?.phone || 'Not provided',
      email: owner?.email || '',
      avatar: getInitials(owner?.name || 'U'),
      rating: 4.8,
      propertiesCount: 1,
      responseTime: 'usually within a few hours',
      joinedDate: raw.createdAt
        ? new Date(raw.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })
        : '',
    },
  };
}

export interface PropertyFilters {
  city?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  parking?: boolean;
  security?: boolean;
  balcony?: boolean;
  waterBackup?: boolean;
  aiMatchOnly?: boolean;
  search?: string;
}

export async function fetchProperties(filters: PropertyFilters = {}): Promise<Property[]> {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== false) {
      params.set(key, String(value));
    }
  });

  const res = await fetch(`/api/properties?${params.toString()}`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to fetch properties');
  const data = await res.json();
  return (data.properties as RawApiProperty[]).map(mapApiProperty);
}

export async function fetchPropertyById(id: string): Promise<Property | null> {
  const res = await fetch(`/api/properties/${id}`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = await res.json();
  return mapApiProperty(data.property as RawApiProperty);
}

export interface CreatePropertyPayload {
  title: string;
  description: string;
  location: string;
  city: string;
  price: number;
  type: 'House' | 'Apartment' | 'Land' | 'Commercial';
  beds?: number;
  baths?: number;
  sqft: number;
  parking: boolean;
  security: boolean;
  balcony: boolean;
  waterBackup: boolean;
  images: string[];
  isAiVerified: boolean;
  isValuePick: boolean;
  isHotListing: boolean;
}

export async function createProperty(payload: CreatePropertyPayload): Promise<Property> {
  const res = await fetch('/api/properties', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create property');
  }
  const data = await res.json();
  return mapApiProperty(data.property as RawApiProperty);
}