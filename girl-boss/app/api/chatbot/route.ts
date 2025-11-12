import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// --- Helper: Calculate distance between two coordinates (Haversine formula) ---
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// --- NEW: Internal Helper Function ---
/**
 * Generic helper to search Google Places API with specific filters.
 */
async function searchPlaces(
  lat: number,
  lon: number,
  apiKey: string,
  includedTypes: string[],
  openNow: boolean = false // Filter for 'openNow'
): Promise<{ name: string; address: string; lat?: number; lon?: number }[]> {
  const url = 'https://places.googleapis.com/v1/places:searchNearby';

  // Define the request body
  interface PlacesRequestBody {
    includedTypes: string[];
    maxResultCount: number;
    locationRestriction: {
      circle: {
        center: {
          latitude: number;
          longitude: number;
        };
        radius: number;
      };
    };
    openNow?: boolean;
  }

  const requestBody: PlacesRequestBody = {
    includedTypes: includedTypes,
    maxResultCount: 10,
    locationRestriction: {
      circle: {
        center: {
          latitude: lat,
          longitude: lon,
        },
        radius: 1500.0, // 1500 meters
      },
    },
  };

  // --- THIS IS THE KEY ---
  // Conditionally add the openNow filter
  if (openNow) {
    requestBody.openNow = true;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(
        `Google Places API Error (types: ${includedTypes.join(', ')}):`,
        await response.text()
      );
      return []; // Return empty on failure
    }

    interface PlaceData {
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
    }

    const data = await response.json();

    // Parse the places data with location coordinates
    const places =
      data.places?.map((place: PlaceData) => ({
        name: place.displayName?.text || 'Unknown Name',
        address: place.formattedAddress || 'Unknown Address',
        lat: place.location?.latitude,
        lon: place.location?.longitude,
      })) || [];

    return places;
  } catch (error) {
    console.error(
      `Failed to fetch from Google Places (types: ${includedTypes.join(', ')}):`,
      error
    );
    return []; // Return empty on error
  }
}

// --- NEW: Main Wrapper Function (replaces fetchNearbyPlaces) ---
/**
 * Fetches nearby safe spaces using a two-call strategy:
 * 1. Emergency services (police, hospital) - always returned
 * 2. Public businesses (cafe, drugstore) - must be open now
 */
async function fetchAllSafeSpaces(
  lat: number,
  lon: number,
  apiKey: string
): Promise<{ name: string; address: string; distance?: number }[]> {
  // Define our two categories
  const emergencyTypes = ['police', 'hospital', 'fire_station'];
  const publicTypes = [
    'cafe',
    'restaurant',
    'university',
    'school',
    'library',
    'pharmacy',
    'church',
    'mosque',
    'synagogue',
    'shopping_mall',
    'bus_station',
    'train_station',
    'supermarket',
    'hotel',
    'convention_center',
  ];

  // Run both searches in parallel for speed
  const [emergencyPlaces, publicPlaces] = await Promise.all([
    // Call 1: Emergency (NEVER filter by 'openNow')
    searchPlaces(lat, lon, apiKey, emergencyTypes, false),
    // Call 2: Public (MUST be 'openNow')
    searchPlaces(lat, lon, apiKey, publicTypes, true),
  ]);

  // Combine and deduplicate the lists
  // We use a Map with the address as the key to prevent duplicates
  const allPlacesMap = new Map<string, { name: string; address: string; lat?: number; lon?: number; distance?: number }>();

  // Add emergency places first (they are high priority)
  for (const place of emergencyPlaces) {
    // Calculate distance if coordinates are available
    if (place.lat && place.lon) {
      const distance = calculateDistance(lat, lon, place.lat, place.lon);
      allPlacesMap.set(place.address, { ...place, distance });
    } else {
      allPlacesMap.set(place.address, place);
    }
  }

  // Add public places
  for (const place of publicPlaces) {
    if (!allPlacesMap.has(place.address)) {
      // Calculate distance if coordinates are available
      if (place.lat && place.lon) {
        const distance = calculateDistance(lat, lon, place.lat, place.lon);
        allPlacesMap.set(place.address, { ...place, distance });
      } else {
        allPlacesMap.set(place.address, place);
      }
    }
  }

  // Convert the Map values back into an array and sort by distance
  const allPlaces = Array.from(allPlacesMap.values());
  
  // Sort by distance (closest first)
  allPlaces.sort((a, b) => {
    // If both have distance, compare
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    // Places with distance come before places without
    if (a.distance !== undefined) return -1;
    if (b.distance !== undefined) return 1;
    return 0;
  });

  return allPlaces;
}

// --- YOUR MODIFIED POST FUNCTION ---
export async function POST(req: NextRequest) {
  try {
    const { message, location, lat, lon } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('💬 Chat message:', message);
    console.log('📍 Location:', location, lat, lon);

    // Check for BOTH API keys
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const mapsApiKey = process.env.GOOGLE_PLACES_API_KEY;

    if (!geminiApiKey || !mapsApiKey) {
      return NextResponse.json(
        { error: 'API_KEYS not configured' },
        { status: 500 }
      );
    }

    // --- MODIFIED: Step 1 - Fetch real-world data (using new function) ---
    let nearbyPlacesString = 'No specific safe spaces were found nearby.';
    if (lat && lon) {
      console.log('Fetching all nearby safe spaces...');
      // Call our new wrapper function
      const places = await fetchAllSafeSpaces(lat, lon, mapsApiKey);

      if (places.length > 0) {
        nearbyPlacesString = places
          .map((p) => {
            const distanceStr = p.distance 
              ? ` (${p.distance.toFixed(2)} km away)`
              : '';
            return `• ${p.name} at ${p.address}${distanceStr}  `;
          })
          .join('\n');
      } else {
        console.log('No safe spaces found by Google Places API.');
      }
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Build context-aware prompt
    const systemPrompt = `You are a helpful safety assistant for GirlBoss, an app that helps women travel safely. 

Your capabilities:
- Provide personalized safety advice based on location and time of day
- Suggest well-lit routes and safe spaces
- Give tips for different transport modes (walking, driving, public transit)
- Help users identify and avoid potentially unsafe situations
- Provide emergency guidance and self-defense tips
- Answer questions about travel safety, nighttime safety, and situational awareness

Keep responses:
- Concise (under 150 words)
- Empathetic and supportive
- Actionable with specific steps
- Focused on personal safety
- Use markdown formatting: **bold** for key points, bullet points (•) for lists
- Always use bullet points (•) not dashes (-) or numbers
- Put each bullet point on a new line by adding two spaces at the end of each line before the newline
- Write naturally as if speaking to someone`;

    // Add current context
    const currentTime = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    // --- MODIFIED: Context now includes real, filtered places ---
    const contextInfo = `
Current Context:
- Location: ${location || 'Unknown'}
${lat && lon ? `- Coordinates: ${lat}, ${lon}` : ''}
- Time: ${currentTime} on ${currentDate}

Nearby Safe Spaces I Found:
${nearbyPlacesString}
`;

    const fullPrompt = `${systemPrompt}\n\n${contextInfo}\n\nUser: ${message}\n\nAssistant:`;

    console.log('--- Sending Prompt to Gemini ---', fullPrompt); // Uncomment to debug

    // Get AI response
    const result = await model.generateContent(fullPrompt);
    const response = result.response;
    const aiMessage = response.text();

    console.log('✅ Got Gemini response');

    return NextResponse.json({
      message: aiMessage,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Gemini error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to get chatbot response',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
}

