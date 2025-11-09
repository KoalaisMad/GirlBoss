/**
 * 🎤 GENERATE VOICE RESPONSE TOOL
 */

import { generateVoiceResponse as generateAudio } from '../../services/elevenLabsService';

export const generateVoiceResponse = async (text: string) => {
  const audioBuffer = await generateAudio(text);
  
  return {
    audio: audioBuffer,
    format: 'audio/mpeg',
    text: text,
    duration: Math.ceil(text.length / 15) // Rough estimate: 15 chars per second
  };
};
