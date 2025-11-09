export const runtime = 'nodejs'; // REQUIRED for ElevenLabs
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ElevenLabsClient } from 'elevenlabs';

export async function POST(req: NextRequest) {
    try {
      const { text } = await req.json();
      console.log("🗣️ Received text:", text);
  
      if (!text) {
        return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
      }
  
      // Init Gemini
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
  
      // Generate response
      const result = await model.generateContent(text);
      const reply = result.response.text() ?? "Sorry, I didn’t catch that.";
      console.log("💬 Gemini reply:", reply);
  
      // Init ElevenLabs
      const elevenlabs = new ElevenLabsClient({ apiKey: process.env.ELEVENLABS_API_KEY! });
      const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM"; // default voice Rachel
  
      // Generate speech
      const audioResponse = await elevenlabs.textToSpeech.convert(voiceId, {
        model_id: "eleven_monolingual_v1",
        text: reply,
      });
  
      // Convert to buffer
      const buffer = Buffer.from(await audioResponse.arrayBuffer());
      console.log("🔊 Generated audio, size:", buffer.length);
  
      // Return audio/mpeg
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Length": buffer.length.toString(),
        },
      });
  
    } catch (err: any) {
      console.error("❌ Chat route error:", err);
      return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
    }
  }