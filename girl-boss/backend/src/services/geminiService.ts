// Gemini AI service - this is what powers the chatbot
// using Google's Gemini API for the AI responses
// pretty straightforward once you get the API key set up

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// main function to get chatbot responses
export const getChatbotResponse = async (
  message: string,
  context?: any
): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    // tell the AI what kind of assistant it should be
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
- Focused on personal safety`;
    
    // add any context we have about the user
    const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    
    const contextInfo = context ? `
Current Context:
- Location: ${context.location || 'Unknown'}
- Coordinates: ${context.lat && context.lon ? `${context.lat}, ${context.lon}` : 'Not available'}
- Time: ${currentTime} on ${currentDate}
- Previous trips: ${context.tripCount || 0}
${context.nearbySpaces ? `- Nearby safe spaces: ${context.nearbySpaces}` : ''}
    ` : `
Current Context:
- Time: ${currentTime} on ${currentDate}
`;
    
    const fullPrompt = `${systemPrompt}\n\n${contextInfo}\n\nUser: ${message}\n\nAssistant:`;
    
    // call the API
    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API error:', error);
    // fallback message if API fails
    return "I'm here to help with your safety! Could you please rephrase your question?";
  }
};

// get safety tips for a specific trip
export const getSafetyAdvice = async (
  location: string,
  timeOfDay: string,
  transportMode: string
): Promise<string> => {
  const prompt = `Provide 3 brief safety tips for someone traveling by ${transportMode} 
  in ${location} at ${timeOfDay}. Keep each tip to one sentence.`;
  
  return getChatbotResponse(prompt);
};
