/**
 * YAPPING (VOICE ASSISTANT) ROUTES
 * 
 * Endpoints for voice conversation with AI.
 */

import express, { Request, Response } from 'express';
import { getChatbotResponse } from '../services/geminiService';
import { generateVoiceResponse } from '../mcp/tools/generateVoiceResponse';
import { buildUserContext } from '../mcp/contextBuilder';

const router = express.Router();

// POST /api/yap - Text-based voice assistant
router.post('/', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context if user is logged in
    let context = undefined;
    if (userId) {
      context = await buildUserContext(userId);
    }

    // Get AI response
    const responseText = await getChatbotResponse(message, context);

    res.json({
      text: responseText,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Yapping error:', error);
    res.status(500).json({ error: 'Failed to process message', message: error.message });
  }
});

// POST /api/yap/voice - Voice response
router.post('/voice', async (req: Request, res: Response) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build context
    let context = undefined;
    if (userId) {
      context = await buildUserContext(userId);
    }

    // Get AI text response
    const responseText = await getChatbotResponse(message, context);

    // Generate voice
    const voice = await generateVoiceResponse(responseText);

    // Send audio file
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': voice.audio.length
    });
    res.send(voice.audio);
  } catch (error: any) {
    console.error('Voice generation error:', error);
    res.status(500).json({ error: 'Failed to generate voice', message: error.message });
  }
});

// POST /api/yap/start - Start voice conversation session
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    const greeting = userId 
      ? "Hey! I'm your GirlBoss safety assistant. How can I help you stay safe today?"
      : "Hi! I'm here to help you travel safely. What's on your mind?";

    const voice = await generateVoiceResponse(greeting);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': voice.audio.length
    });
    res.send(voice.audio);
  } catch (error: any) {
    console.error('Session start error:', error);
    res.status(500).json({ error: 'Failed to start session', message: error.message });
  }
});

export default router;
