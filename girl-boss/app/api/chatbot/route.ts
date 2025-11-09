import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * POST /api/chatbot - Unified Gemini AI endpoint
 * 
 * This is the ONLY route for Gemini API calls in the app.
 * Used by:
 * - Chat Assistant page (text-based chat)
 * - Voice Control page (speech-to-text then AI response)
 * 
 * Features:
 * - Safety-focused AI responses
 * - Location-based context
 * - Time-aware advice
 * - Personalized for women's safety
 */
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

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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
- Use plain text only - NO markdown formatting (no bold **, italic *, headers #, code blocks, etc.)
- Write naturally as if speaking to someone`;

    // Add current context
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: true 
    });
    const currentDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });

    const contextInfo = `
Current Context:
- Location: ${location || 'Unknown'}
${lat && lon ? `- Coordinates: ${lat}, ${lon}` : ''}
- Time: ${currentTime} on ${currentDate}
`;

    const fullPrompt = `${systemPrompt}\n\n${contextInfo}\n\nUser: ${message}\n\nAssistant:`;

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
        message: errorMessage
      },
      { status: 500 }
    );
  }
}

