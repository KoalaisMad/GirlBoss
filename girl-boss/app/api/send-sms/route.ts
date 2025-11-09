import { NextRequest, NextResponse } from 'next/server';
import twilio, { Twilio } from 'twilio';

interface SmsRequestBody {
  to: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: SmsRequestBody = await req.json();

    if (!body.to || !body.message) {
      return NextResponse.json(
        { success: false, error: 'Missing "to" or "message" field' },
        { status: 400 }
      );
    }

    const client: Twilio = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const msg = await client.messages.create({
      body: body.message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: body.to,
    });

    return NextResponse.json({ success: true, sid: msg.sid });
  } catch (error: any) {
    console.error('Twilio Error:', error);
    return NextResponse.json(
      { success: false, error: error.message ?? 'Unknown error' },
      { status: 500 }
    );
  }
}
