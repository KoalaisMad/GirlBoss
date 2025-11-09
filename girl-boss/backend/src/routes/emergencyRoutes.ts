/**
 * EMERGENCY ROUTES
 * 
 * Endpoints for emergency situations and SOS alerts.
 */

import express, { Request, Response } from 'express';
import { notifyEmergencyContacts } from '../mcp/tools/notifyEmergencyContacts';
import { triggerEmergency } from '../services/mongoTripService';
import { getOpenSafeSpaces } from '../mcp/tools/getOpenSafeSpaces';
import { getUserById } from '../services/mongoUserService';

const router = express.Router();

// POST /api/emergency/trigger - Trigger emergency alert
router.post('/trigger', async (req: Request, res: Response) => {
  try {
    const { userId, tripId, lat, lon, message } = req.body;

    if (!userId || !lat || !lon) {
      return res.status(400).json({ error: 'userId, lat, and lon are required' });
    }

    // Get user details
    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Mark trip as emergency if provided
    if (tripId) {
      await triggerEmergency(tripId);
    }

    // Send notifications
    const notifications = await notifyEmergencyContacts(
      userId,
      { lat: parseFloat(lat), lon: parseFloat(lon) }
    );

    // Find nearby safe spaces
    const safeSpaces = await getOpenSafeSpaces(
      parseFloat(lat),
      parseFloat(lon),
      500 // 500m radius for emergencies
    );

    res.json({
      success: true,
      notifications,
      safeSpaces: safeSpaces.slice(0, 5), // Top 5 nearest
      location: { lat: parseFloat(lat), lon: parseFloat(lon) }
    });
  } catch (error: any) {
    console.error('Emergency trigger error:', error);
    res.status(500).json({ error: 'Failed to trigger emergency', message: error.message });
  }
});

// GET /api/emergency/safe-spaces - Get nearest safe spaces (emergency priority)
router.get('/safe-spaces', async (req: Request, res: Response) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Find safe spaces with smaller radius for emergencies
    const safeSpaces = await getOpenSafeSpaces(
      parseFloat(lat as string),
      parseFloat(lon as string),
      500
    );

    // Prioritize police stations and hospitals
    const priority = safeSpaces.sort((a, b) => {
      const priorityOrder = ['police', 'hospital', 'fire_station', 'cafe'];
      const aPriority = priorityOrder.indexOf(a.type);
      const bPriority = priorityOrder.indexOf(b.type);
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      return a.distance - b.distance;
    });

    res.json({
      spaces: priority.slice(0, 10),
      emergencyMode: true,
      location: { lat: parseFloat(lat as string), lon: parseFloat(lon as string) }
    });
  } catch (error: any) {
    console.error('Safe spaces error:', error);
    res.status(500).json({ error: 'Failed to find safe spaces', message: error.message });
  }
});

export default router;
