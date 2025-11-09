/**
 * PLANNING ROUTES
 * 
 * Endpoints for route planning with safety scores.
 */

import express, { Request, Response } from 'express';
import { getRouteSafety } from '../mcp/tools/getRouteSafety';
import { createTrip } from '../services/mongoTripService';
import { buildRouteContext } from '../mcp/contextBuilder';
import safetyScoreService, { SafetyScoreInput } from '../services/safetyScoreService';

const router = express.Router();

// POST /api/plan/route - Plan a safe route
router.post('/route', async (req: Request, res: Response) => {
  try {
    const { startLat, startLon, endLat, endLon, transportMode, userId } = req.body;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({ error: 'Missing required coordinates' });
    }

    // Get safety information
    const safety = await getRouteSafety(
      parseFloat(startLat),
      parseFloat(startLon),
      parseFloat(endLat),
      parseFloat(endLon),
      transportMode || 'driving'
    );

    // Build context with all data sources
    const context = await buildRouteContext(
      parseFloat(startLat),
      parseFloat(startLon),
      parseFloat(endLat),
      parseFloat(endLon),
      transportMode || 'driving'
    );

    // Save trip if user is logged in
    let trip = null;
    if (userId) {
      trip = await createTrip({
        userId,
        startLocation: { lat: parseFloat(startLat), lon: parseFloat(startLon) },
        endLocation: { lat: parseFloat(endLat), lon: parseFloat(endLon) },
        transportMode: transportMode || 'driving',
        safetyScore: safety.finalScore,
        distance: 0, // Calculate from route service
        duration: 0, // Calculate from route service
        startTime: new Date(),
        status: 'planned'
      });
    }

    res.json({
      safety,
      context,
      trip: trip?._id,
      recommendation: safety.finalScore >= 75 ? 'safe' : safety.finalScore >= 50 ? 'caution' : 'risky'
    });
  } catch (error: any) {
    console.error('Route planning error:', error);
    res.status(500).json({ error: 'Failed to plan route', message: error.message });
  }
});

// POST /api/plan/safety-score - Calculate comprehensive safety score
router.post('/safety-score', async (req: Request, res: Response) => {
  try {
    const {
      crime,
      location,
      time,
      weather,
      battery,
      route_waypoints,
      transport_mode
    } = req.body as SafetyScoreInput;

    // Validate required fields
    if (!crime || !location || !time || !weather || !battery) {
      return res.status(400).json({ 
        error: 'Missing required fields: crime, location, time, weather, battery' 
      });
    }

    // Calculate safety score (now async with Databricks integration)
    const result = await safetyScoreService.calculateSafetyScore({
      crime,
      location,
      time,
      weather,
      battery,
      route_waypoints,
      transport_mode: transport_mode || 'walking'
    });

    // Get recommendations
    const recommendations = safetyScoreService.getRecommendations(result);
    const safety_level = safetyScoreService.getSafetyLevel(result.total_score);
    const safety_description = safetyScoreService.getSafetyDescription(result.total_score);

    res.json({
      score: result.total_score,
      risk: result.risk,
      level: safety_level,
      description: safety_description,
      breakdown: result.breakdown,
      weights: result.weights,
      recommendations,
      transport_mode: transport_mode || 'walking'
    });
  } catch (error: any) {
    console.error('Safety score calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate safety score', message: error.message });
  }
});

// POST /api/plan/route-safety-score - Get safety score for a specific route
router.post('/route-safety-score', async (req: Request, res: Response) => {
  try {
    const { 
      startLat, 
      startLon, 
      endLat, 
      endLon,
      waypoints, // Array of {lat, lon} for route segments
      battery_percent = 80,
      is_charging = false,
      transport_mode = 'walking'
    } = req.body;

    if (!startLat || !startLon || !endLat || !endLon) {
      return res.status(400).json({ error: 'Missing required coordinates' });
    }

    // Get current time
    const now = new Date();
    const hour = now.getHours();

    // Dynamic weather simulation based on real-world patterns
    const isNight = hour < 6 || hour > 20;
    const isDusk = (hour >= 17 && hour < 20) || (hour >= 5 && hour < 7);
    const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
    
    // Use latitude/longitude to vary conditions by location
    const lat = parseFloat(startLat);
    const lon = parseFloat(startLon);
    const locationSeed = Math.abs(Math.sin(lat * lon * 1000)) * 100; // Deterministic but varies by location
    
    // Weather varies by time and location
    const weather = {
      severe_alert: false,
      precipitation_probability: Math.round(20 + locationSeed % 40 + (isNight ? 15 : 0)), // 20-75%
      wind_speed: Math.round(8 + locationSeed % 15 + (isNight ? 8 : 0)), // 8-31 mph
      visibility_loss: (isNight ? 0.4 : 0.1) + (locationSeed % 30) / 100 // 0.1-0.7
    };

    // Crime data varies significantly by location and time
    // Use coordinates to generate location-specific crime patterns
    const areaRiskFactor = Math.abs(Math.sin(lat * 100) * Math.cos(lon * 100)); // 0-1
    const baseIncidents = 8 + Math.round(areaRiskFactor * 25); // 8-33 incidents per 1000
    const timeMultiplier = isNight ? 1.8 : (isDusk ? 1.3 : 1.0);
    
    const crime = {
      incidents_per_1000: Math.round(baseIncidents * timeMultiplier), // Realistic range: 8-60
      baseline: 10,
      scale: 15
    };

    // Location characteristics vary by area and time
    // Urban areas: higher population density, more services
    // Suburban: medium density
    // Rural: low density, more isolated
    const urbanScore = areaRiskFactor; // 0 = rural, 1 = urban
    
    const location = {
      latitude: lat,
      longitude: lon,
      population_density: Math.round(50 + urbanScore * 800 + (isNight ? -200 : 0)), // 50-850
      recent_incidents: Math.round((1 - urbanScore) * 6 + (isNight ? 3 : 0)), // 0-9, more in less urban areas at night
      safe_spaces_count: Math.round(urbanScore * 8 * (isNight ? 0.3 : 1.0)), // 0-8, fewer at night
      public_transport_stops: Math.round(urbanScore * 5), // 0-5
      is_isolated: urbanScore < 0.3 && isNight // Isolated if rural and nighttime
    };

    // Convert waypoints to LocationData format for route analysis
    let route_waypoints;
    let segments_analyzed = 0;
    
    if (waypoints && Array.isArray(waypoints) && waypoints.length > 0) {
      route_waypoints = waypoints.map((wp: any, index: number) => {
        const wpLat = parseFloat(wp.lat);
        const wpLon = parseFloat(wp.lon);
        
        // Each waypoint has location-specific characteristics
        const wpSeed = Math.abs(Math.sin(wpLat * wpLon * 1000)) * 100;
        const wpUrbanScore = Math.abs(Math.sin(wpLat * 100) * Math.cos(wpLon * 100));
        const progressAlongRoute = index / waypoints.length; // 0 to 1
        
        // Safety degrades or improves along route based on destination area
        const endUrbanScore = Math.abs(Math.sin(parseFloat(endLat) * 100) * Math.cos(parseFloat(endLon) * 100));
        const interpolatedUrban = urbanScore + (endUrbanScore - urbanScore) * progressAlongRoute;
        
        return {
          latitude: wpLat,
          longitude: wpLon,
          population_density: Math.round(50 + interpolatedUrban * 800 + (isNight ? -200 : 0)),
          recent_incidents: Math.round((1 - interpolatedUrban) * 6 + (isNight ? 2 : 0)),
          safe_spaces_count: Math.round(interpolatedUrban * 8 * (isNight ? 0.3 : 1.0)),
          public_transport_stops: Math.round(interpolatedUrban * 5),
          is_isolated: interpolatedUrban < 0.3 && isNight
        };
      });
      
      // Add end location as final waypoint with its own characteristics
      const endUrbanScore = Math.abs(Math.sin(parseFloat(endLat) * 100) * Math.cos(parseFloat(endLon) * 100));
      route_waypoints.push({
        latitude: parseFloat(endLat),
        longitude: parseFloat(endLon),
        population_density: Math.round(50 + endUrbanScore * 800 + (isNight ? -200 : 0)),
        recent_incidents: Math.round((1 - endUrbanScore) * 6 + (isNight ? 3 : 0)),
        safe_spaces_count: Math.round(endUrbanScore * 8 * (isNight ? 0.3 : 1.0)),
        public_transport_stops: Math.round(endUrbanScore * 5),
        is_isolated: endUrbanScore < 0.3 && isNight
      });
      
      segments_analyzed = route_waypoints.length;
      console.log(`Analyzing route with ${segments_analyzed} waypoints using Databricks ML`);
    }

    // Calculate safety score with transport mode and route waypoints (uses Databricks ML)
    const result = await safetyScoreService.calculateSafetyScore({
      crime,
      location,
      time: { hour },
      weather,
      battery: {
        battery_percent,
        is_charging
      },
      route_waypoints,
      transport_mode: transport_mode as 'walking' | 'driving' | 'transit' | 'bicycling'
    });

    const recommendations = safetyScoreService.getRecommendations(result);
    const safety_level = safetyScoreService.getSafetyLevel(result.total_score);
    const safety_description = safetyScoreService.getSafetyDescription(result.total_score);

    res.json({
      score: result.total_score,
      risk: result.risk,
      level: safety_level,
      description: safety_description,
      breakdown: result.breakdown,
      weights: result.weights,
      recommendations,
      transport_mode,
      route_segments_analyzed: segments_analyzed,
      metadata: {
        time: { hour },
        weather,
        crime,
        location
      }
    });
  } catch (error: any) {
    console.error('Route safety score error:', error);
    res.status(500).json({ error: 'Failed to calculate route safety score', message: error.message });
  }
});

export default router;
