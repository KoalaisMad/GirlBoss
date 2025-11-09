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
    const serverKey = process.env.GOOGLE_MAPS_API_KEY;
    
    // Log if we're missing the server key
    if (!serverKey) {
      console.warn('No GOOGLE_MAPS_API_KEY found in environment, will use OSRM fallback');
    }

    // Helper to strip HTML tags from Google instructions
    const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '');

    // If a server-side Google Maps key is present, prefer Google's Directions API
    if (serverKey) {
      const modeMap: { [k: string]: string } = {
        driving: 'driving',
        walking: 'walking',
        public: 'transit',
      };

      const mode = modeMap[transportMode] || 'driving';

      const params: any = {
        origin: `${startLat},${startLon}`,
        destination: `${endLat},${endLon}`,
        mode,
        key: serverKey,
      };

      // For driving we can request traffic-influenced durations
      if (mode === 'driving') {
        params.departure_time = 'now';
        params.traffic_model = 'best_guess';
      }

      // For transit, a departure_time is required to get realistic schedules
      if (mode === 'transit') {
        params.departure_time = 'now';
      }

      const url = `https://maps.googleapis.com/maps/api/directions/json?${new URLSearchParams(params).toString()}`;
      const gRes = await fetch(url);
      const gData = await gRes.json();

      if (gData.status !== 'OK' || !gData.routes || gData.routes.length === 0) {
        // If Google fails, fall back to OSRM below
        console.warn('Google Directions failed, falling back to OSRM:', gData.status, gData.error_message);
      } else {
        const route = gData.routes[0];
        const leg = route.legs && route.legs[0];

        return NextResponse.json({
          distance: leg ? leg.distance.value : null, // meters
          duration: leg ? (leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value) : null, // seconds (prefer traffic-aware)
          geometry: route.overview_polyline ? route.overview_polyline.points : null, // encoded polyline
          steps: (leg && leg.steps) ? leg.steps.map((s: any) => ({
            instruction: s.html_instructions ? stripHtml(s.html_instructions) : s.instructions || '',
            distance: s.distance ? s.distance.value : null,
            duration: s.duration ? s.duration.value : null,
          })) : [],
        });
      }
    }

    // Fallback: Use OSRM (public, no key) if Google wasn't used or failed
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
