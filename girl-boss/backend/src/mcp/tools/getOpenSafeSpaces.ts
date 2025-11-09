/**
 * 🏢 GET OPEN SAFE SPACES TOOL
 */

import axios from 'axios';

export interface SafeSpace {
  name: string;
  type: string;
  address: string;
  distance: number;
  isOpen: boolean;
  hours?: string;
  lat: number;
  lon: number;
}

export const getOpenSafeSpaces = async (
  lat: number,
  lon: number,
  radius: number = 1000 // meters
): Promise<SafeSpace[]> => {
  try {
    // Using Overpass API to find safe spaces (police stations, hospitals, fire stations, etc.)
    const query = `
      [out:json];
      (
        node["amenity"="police"](around:${radius},${lat},${lon});
        node["amenity"="hospital"](around:${radius},${lat},${lon});
        node["amenity"="fire_station"](around:${radius},${lat},${lon});
        node["shop"="convenience"](around:${radius},${lat},${lon});
        node["amenity"="cafe"](around:${radius},${lat},${lon});
      );
      out body;
    `;

    const response = await axios.post(
      'https://overpass-api.de/api/interpreter',
      `data=${encodeURIComponent(query)}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const elements = response.data.elements || [];
    
    return elements.slice(0, 10).map((place: any) => ({
      name: place.tags?.name || place.tags?.amenity || 'Unknown',
      type: place.tags?.amenity || place.tags?.shop || 'other',
      address: place.tags?.['addr:street'] || 'Address unavailable',
      distance: calculateDistance(lat, lon, place.lat, place.lon),
      isOpen: true, // Could be enhanced with opening hours
      lat: place.lat,
      lon: place.lon
    }));
  } catch (error) {
    console.error('Error fetching safe spaces:', error);
    return [];
  }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}
