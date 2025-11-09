import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// POST /api/users - Create user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const response = await fetch(`${BACKEND_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('📦 Backend returned user data:', data);
    console.log('   _id:', data._id, 'type:', typeof data._id);
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

