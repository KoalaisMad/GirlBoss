/**
 * CHATBOT ROUTES
 * 
 * Endpoints for text-based chat interactions.
 */

import express, { Request, Response } from 'express';
import { getChatbotResponse, getSafetyAdvice } from '../services/geminiService';
import { getOpenSafeSpaces } from '../mcp/tools/getOpenSafeSpaces';
import { getPlaceSafetyHistory } from '../mcp/tools/getPlaceSafetyHistory';
import { buildUserContext } from '../mcp/contextBuilder';

const router = express.Router();

// POST /api/chat - General chat
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build user context
    let context = undefined;
    if (userId) {
      context = await buildUserContext(userId);
    }

    const response = await getChatbotResponse(message, context);

    res.json({
      message: response,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat', message: error.message });
  }
});

// GET /api/chat/safe-spaces - Find safe spaces nearby
router.get('/safe-spaces', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const safeSpaces = await getOpenSafeSpaces(
      parseFloat(lat as string),
      parseFloat(lon as string),
      radius ? parseInt(radius as string) : 1000
    );

    res.json({
      spaces: safeSpaces,
      count: safeSpaces.length,
      location: { lat: parseFloat(lat as string), lon: parseFloat(lon as string) }
    });
  } catch (error: any) {
    console.error('Safe spaces error:', error);
    res.status(500).json({ error: 'Failed to find safe spaces', message: error.message });
  }
});

// GET /api/chat/place-history - Get safety history for a location
router.get('/place-history', async (req: Request, res: Response) => {
  try {
    const { lat, lon, radius } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const history = await getPlaceSafetyHistory(
      parseFloat(lat as string),
      parseFloat(lon as string),
      radius ? parseFloat(radius as string) : 0.5
    );

    res.json(history);
  } catch (error: any) {
    console.error('Place history error:', error);
    res.status(500).json({ error: 'Failed to get place history', message: error.message });
  }
});

// POST /api/chat/safety-advice - Get personalized safety advice
router.post('/safety-advice', async (req: Request, res: Response) => {
  try {
    const { location, timeOfDay, transportMode } = req.body;

    if (!location) {
      return res.status(400).json({ error: 'Location is required' });
    }

    const advice = await getSafetyAdvice(
      location,
      timeOfDay || 'evening',
      transportMode || 'walking'
    );

    res.json({
      advice,
      location,
      timeOfDay: timeOfDay || 'evening',
      transportMode: transportMode || 'walking'
    });
  } catch (error: any) {
    console.error('Safety advice error:', error);
    res.status(500).json({ error: 'Failed to get safety advice', message: error.message });
  }
});

export default router;
