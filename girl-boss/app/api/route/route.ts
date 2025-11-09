/**
 * 🛣️ ROUTE CALCULATION API
 * 
 * The brains behind finding the best path from A to B!
 * This uses OSRM (fancy routing software) to calculate distances,
 * travel times, and turn-by-turn directions.
 * 
 * What it does:
 * - POST: Calculate a route between two points
 * - Returns: Distance, time, and step-by-step directions
 */

import { NextRequest, NextResponse } from 'next/server';

interface RouteRequest {
  startLat: number;
  startLon: number;
  endLat: number;
  endLon: number;
  transportMode: 'driving' | 'walking' | 'public';
}

export async function POST(request: NextRequest) {
  try {
    const body: RouteRequest = await request.json();
    const { startLat, startLon, endLat, endLon, transportMode } = body;

    // Map transport modes to OSRM profiles
    const profileMap = {
      driving: 'car',
      walking: 'foot',
      public: 'car', // For public transport, we'll use car routing as approximation
    };

    const profile = profileMap[transportMode] || 'car';

    // Use OSRM (Open Source Routing Machine) for routing
    const osrmUrl = `https://router.project-osrm.org/route/v1/${profile}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(osrmUrl);
    const data = await response.json();

    if (data.code !== 'Ok') {
      return NextResponse.json(
        { error: 'Failed to calculate route' },
        { status: 400 }
      );
    }

    const route = data.routes[0];
    
    return NextResponse.json({
      distance: route.distance, // in meters
      duration: route.duration, // in seconds
      geometry: route.geometry, // GeoJSON geometry
      steps: route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction || `${step.maneuver.type} on ${step.name}`,
        distance: step.distance,
        duration: step.duration,
      })),
    });
  } catch (error) {
    console.error('Routing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
