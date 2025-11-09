import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// POST /api/users/email/:email/contacts - Add emergency contact by email
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const params = await context.params; // Next.js 15+ requires await
    const body = await req.json();
    const backendUrl = `${BACKEND_URL}/api/users/email/${params.email}/contacts`;
    console.log('🔄 Proxying add contact request');
    console.log('   Email param:', params.email);
    console.log('   Backend URL:', backendUrl);
    console.log('   Body:', body);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Add contact by email error:', error);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}

