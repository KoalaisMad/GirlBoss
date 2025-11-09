/**
 * CHATBOT ROUTES
 * 
 * Endpoints for AI-powered safety chatbot interactions.
 * All routes are under /api/chatbot
 */

import express, { Request, Response } from 'express';
import { getChatbotResponse, getSafetyAdvice } from '../services/geminiService';
import { getOpenSafeSpaces } from '../mcp/tools/getOpenSafeSpaces';
import { getPlaceSafetyHistory } from '../mcp/tools/getPlaceSafetyHistory';
import { buildUserContext } from '../mcp/contextBuilder';

const router = express.Router();

// POST /api/chatbot - General chat with safety features
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, userId, location, lat, lon } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('💬 Chat message:', message);
    console.log('📍 Location:', location, lat, lon);

    // Build user context
    let context: any = {
      location: location || 'Unknown',
      lat,
      lon,
    };
    
    if (userId) {
      const userContext = await buildUserContext(userId);
      context = { ...context, ...userContext };
    }

    // Check if user is asking about safe spaces
    const lowerMessage = message.toLowerCase();
    const askingAboutSafeSpaces = 
      lowerMessage.includes('safe space') || 
      lowerMessage.includes('safe place') ||
      lowerMessage.includes('where can i go') ||
      lowerMessage.includes('nearby') ||
      lowerMessage.includes('find a place');

    // If asking about safe spaces and we have location, get nearby safe spaces
    if (askingAboutSafeSpaces && lat && lon) {
      try {
        const safeSpaces = await getOpenSafeSpaces(
          parseFloat(lat),
          parseFloat(lon),
          1000 // 1km radius
        );
        
        if (safeSpaces.length > 0) {
          const topSpaces = safeSpaces.slice(0, 3).map(s => s.name).join(', ');
          context.nearbySpaces = topSpaces;
          console.log('🏢 Found nearby safe spaces:', topSpaces);
        }
      } catch (err) {
        console.error('Error fetching safe spaces:', err);
      }
    }

    const response = await getChatbotResponse(message, context);

    res.json({
      message: response,
      timestamp: new Date().toISOString(),
      hasSafeSpaces: askingAboutSafeSpaces && context.nearbySpaces
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process chat', message: error.message });
  }
});

// GET /api/chatbot/safe-spaces - Find safe spaces nearby
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

// GET /api/chatbot/place-history - Get safety history for a location
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

// POST /api/chatbot/safety-advice - Get personalized safety advice
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
