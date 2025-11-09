import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    console.log("🗣️ Received text:", text);

    if (!text) {
      return NextResponse.json({ success: false, error: 'No text provided' }, { status: 400 });
    }

    // Check for API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY not configured' }, { status: 500 });
    }

    // Get Gemini AI response
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent(text);
    const reply = result.response.text() ?? "Sorry, I didn't catch that.";
    console.log("💬 Gemini reply:", reply);

    // Return text response (browser will speak it)
    return NextResponse.json({ 
      success: true, 
      text: reply 
    });

  } catch (err) {
    console.error("❌ Chat route error:", err);
    const errorMessage = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ 
      success: false, 
      error: errorMessage 
    }, { status: 500 });
  }
}