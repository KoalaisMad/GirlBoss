/**
 * 📍 LOCATION API
 * 
 * This handles storing where the user is and how they want to travel.
 * It's like a little memory bank for their preferences!
 * 
 * What it does:
 * - POST: Save user's location and transport choice
 * - GET: Retrieve that saved info later
 */

import { NextRequest, NextResponse } from 'next/server';

// In a real app, you'd store this in a database
// For now, we'll use in-memory storage (resets on server restart)
const userLocations = new Map<string, {
  currentLocation: { lat: number; lon: number; timestamp: Date };
  preferredTransport: string;
  tripHistory: Array<{
    destination: string;
    transportMode: string;
    timestamp: Date;
  }>;
}>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, lat, lon, preferredTransport } = body;

    if (!userId || lat === undefined || lon === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create user data
    let userData = userLocations.get(userId) || {
      currentLocation: { lat: 0, lon: 0, timestamp: new Date() },
      preferredTransport: 'driving',
      tripHistory: [],
    };

    // Update user's current location and preferences
    userData.currentLocation = {
      lat,
      lon,
      timestamp: new Date(),
    };

    if (preferredTransport) {
      userData.preferredTransport = preferredTransport;
    }

    userLocations.set(userId, userData);

    return NextResponse.json({
      success: true,
      location: userData.currentLocation,
      preferredTransport: userData.preferredTransport,
    });
  } catch (error) {
    console.error('Location storage error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json(
      { error: 'userId is required' },
      { status: 400 }
    );
  }

  const userData = userLocations.get(userId);

  if (!userData) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(userData);
}
