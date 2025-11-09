/**
 * PLANNING ROUTES
 * 
 * Endpoints for route planning with safety scores.
 */

import express, { Request, Response } from 'express';
import { getRouteSafety } from '../mcp/tools/getRouteSafety';
import { createTrip } from '../services/mongoTripService';
import { buildRouteContext } from '../mcp/contextBuilder';

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

export default router;
