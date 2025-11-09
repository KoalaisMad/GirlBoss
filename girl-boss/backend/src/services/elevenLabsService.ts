/**
 * ELEVENLABS VOICE SERVICE
 * 
 * Converts text to speech for the voice assistant feature.
 */

import axios from 'axios';

export const generateVoiceResponse = async (text: string): Promise<Buffer> => {
  try {
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', // Default voice
      {
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    return Buffer.from(response.data);
  } catch (error) {
    console.error('ElevenLabs API error:', error);
    throw new Error('Failed to generate voice response');
  }
};

export const streamVoiceResponse = async (text: string): Promise<any> => {
  // For streaming responses in real-time conversations
  return axios.post(
    'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM/stream',
    {
      text,
      model_id: 'eleven_monolingual_v1'
    },
    {
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json'
      },
      responseType: 'stream'
    }
  );
};
