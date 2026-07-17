export interface Landlord {
  id: string;
  name: string;
  phone: string;
  email: string;
  avatar: string; // URL or placeholder character
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
  city: 'Kathmandu' | 'Lalitpur';
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

export const INITIAL_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    title: 'Modern Luxury Villa',
    price: 45000000,
    priceFormatted: 'NPR 45,000,000',
    location: 'Bhaisepati, Lalitpur',
    city: 'Lalitpur',
    type: 'House',
    beds: 5,
    baths: 4,
    sqft: 3200,
    badges: [
      { text: 'For Sale', type: 'sale' },
      { text: 'AI Verified', type: 'ai' }
    ],
    matchScore: 98,
    image: '/assets/property_1.png',
    parking: true,
    security: true,
    balcony: true,
    waterBackup: true,
    description: 'This gorgeous luxury villa in the prime residential area of Bhaisepati, Lalitpur, features standard contemporary design, spacious bedrooms with attached restrooms, a beautifully landscaped lawn, and premium marble finishes. Safe neighborhood with elite community surroundings.',
    landlord: {
      id: 'landlord-1',
      name: 'Ramesh Bahadur Shrestha',
      phone: '+977 98510-12345',
      email: 'ramesh.shrestha@gmail.com',
      avatar: 'RS',
      rating: 4.8,
      propertiesCount: 4,
      responseTime: 'within 1 hour',
      joinedDate: 'Jan 2023'
    }
  },
  {
    id: 'prop-2',
    title: 'Contemporary Residential House',
    price: 32500000,
    priceFormatted: 'NPR 32,500,000',
    location: 'Budhanilkantha, Kathmandu',
    city: 'Kathmandu',
    type: 'House',
    beds: 4,
    baths: 3,
    sqft: 2800,
    badges: [
      { text: 'For Sale', type: 'sale' },
      { text: 'Value Pick', type: 'value' }
    ],
    matchScore: 85,
    image: '/assets/property_2.png',
    parking: true,
    security: true,
    balcony: false,
    waterBackup: true,
    description: 'A beautiful contemporary residential house situated in the serene environment of Budhanilkantha, Kathmandu. Fully earthquake-resistant structure with modern amenities, abundant natural lighting, and a modern modular kitchen.',
    landlord: {
      id: 'landlord-2',
      name: 'Pooja Karki',
      phone: '+977 98412-34567',
      email: 'pooja.karki@outlook.com',
      avatar: 'PK',
      rating: 4.9,
      propertiesCount: 2,
      responseTime: 'within 15 minutes',
      joinedDate: 'May 2024'
    }
  },
  {
    id: 'prop-3',
    title: 'Beautiful Modern House',
    price: 18000000,
    priceFormatted: 'NPR 18,000,000',
    location: 'Sanepa, Lalitpur',
    city: 'Lalitpur',
    type: 'House',
    beds: 2,
    baths: 2,
    sqft: 1400,
    badges: [
      { text: 'Just Listed', type: 'hot' },
      { text: 'Hot Listing', type: 'hot' }
    ],
    matchScore: 92,
    image: '/assets/property_3.png',
    parking: false,
    security: true,
    balcony: true,
    waterBackup: true,
    description: 'Cozy and stylish modern house ideal for a small family or working professionals. Situated in the heart of Sanepa, Lalitpur, close to international schools, cafes, and supermarkets. Excellent water supply and active neighborhood support.',
    landlord: {
      id: 'landlord-3',
      name: 'Anil Shakya',
      phone: '+977 98031-98765',
      email: 'anil.shakya@hotmail.com',
      avatar: 'AS',
      rating: 4.5,
      propertiesCount: 3,
      responseTime: 'within 2 hours',
      joinedDate: 'Nov 2022'
    }
  },
  {
    id: 'prop-4',
    title: 'Skyline Premium Apartment',
    price: 24000000,
    priceFormatted: 'NPR 24,000,000',
    location: 'Jhamsikhel, Lalitpur',
    city: 'Lalitpur',
    type: 'Apartment',
    beds: 3,
    baths: 2,
    sqft: 1650,
    badges: [
      { text: 'For Sale', type: 'sale' },
      { text: 'AI Verified', type: 'ai' }
    ],
    matchScore: 95,
    image: '/assets/kathmandu_sunset.png',
    parking: true,
    security: true,
    balcony: true,
    waterBackup: true,
    description: 'A luxurious apartment offering breathtaking panoramic sunset views of the valley. Nestled in Jhamsikhel, the premier hub of Lalitpur. Equipped with a central heating/cooling system, high-speed elevator access, fully functional gymnasium, swimming pool access, and robust round-the-clock security surveillance.',
    landlord: {
      id: 'landlord-4',
      name: 'Sunita Adhikari',
      phone: '+977 98123-45678',
      email: 'sunita.adhikari@yahoo.com',
      avatar: 'SA',
      rating: 4.7,
      propertiesCount: 5,
      responseTime: 'within 30 minutes',
      joinedDate: 'Feb 2023'
    }
  },
  {
    id: 'prop-5',
    title: 'Elite Residency Apartment',
    price: 19500000,
    priceFormatted: 'NPR 19,500,000',
    location: 'Baluwatar, Kathmandu',
    city: 'Kathmandu',
    type: 'Apartment',
    beds: 2,
    baths: 2,
    sqft: 1200,
    badges: [
      { text: 'Popular', type: 'popular' },
      { text: 'Value Pick', type: 'value' }
    ],
    matchScore: 91,
    image: '/assets/nepal_premium_building.png',
    parking: true,
    security: true,
    balcony: true,
    waterBackup: true,
    description: 'High-end contemporary apartment located in the prestigious neighborhood of Baluwatar. Walkable distance to major embassies and corporate offices. Exceptional community, underground designated parking space, and automated electricity backup.',
    landlord: {
      id: 'landlord-5',
      name: 'Bishal Thapa',
      phone: '+977 98511-99887',
      email: 'bishal.thapa@outlook.com',
      avatar: 'BT',
      rating: 4.9,
      propertiesCount: 3,
      responseTime: 'within 10 minutes',
      joinedDate: 'Aug 2024'
    }
  },
  {
    id: 'prop-6',
    title: 'Traditional style brick building',
    price: 28000000,
    priceFormatted: 'NPR 28,000,000',
    location: 'Kapan, Kathmandu',
    city: 'Kathmandu',
    type: 'House',
    beds: 3,
    baths: 3,
    sqft: 2100,
    badges: [
      { text: 'For Sale', type: 'sale' },
      { text: 'Popular', type: 'popular' }
    ],
    matchScore: 78,
    image: '/assets/property_4.png',
    parking: true,
    security: false,
    balcony: true,
    waterBackup: false,
    description: 'Beautiful traditional style brick building featuring classic design elements combined with modern amenities. Located in Kapan, Kathmandu. High-quality construction with natural lighting and solid woodwork throughout the house.',
    landlord: {
      id: 'landlord-6',
      name: 'Niranjan Shrestha',
      phone: '+977 98415-56789',
      email: 'niranjan.shrestha@gmail.com',
      avatar: 'NS',
      rating: 4.6,
      propertiesCount: 1,
      responseTime: 'within 3 hours',
      joinedDate: 'Oct 2023'
    }
  }
];

export function getLocalProperties(): Property[] {
  if (typeof window === 'undefined') return INITIAL_PROPERTIES;
  const stored = localStorage.getItem('gharpurja_properties');
  if (!stored) {
    localStorage.setItem('gharpurja_properties', JSON.stringify(INITIAL_PROPERTIES));
    return INITIAL_PROPERTIES;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return INITIAL_PROPERTIES;
  }
}

export function saveLocalProperty(property: Property): void {
  if (typeof window === 'undefined') return;
  const list = getLocalProperties();
  list.unshift(property);
  localStorage.setItem('gharpurja_properties', JSON.stringify(list));
}
