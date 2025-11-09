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
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
    // tell the AI what kind of assistant it should be
    const systemPrompt = `You are a helpful safety assistant for GirlBoss, 
    an app that helps women travel safely. Provide concise, empathetic, 
    and actionable safety advice. Keep responses under 150 words.`;
    
    // add any context we have about the user
    const contextInfo = context ? `
    User context:
    - Current location: ${context.location || 'Unknown'}
    - Time: ${context.time || 'Unknown'}
    - Previous trips: ${context.tripCount || 0}
    ` : '';
    
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
