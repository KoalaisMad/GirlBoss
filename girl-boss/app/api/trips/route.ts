import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// POST /api/trips - Create a new trip
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('🔄 Proxying trip creation request');
    console.log('   Backend URL:', `${BACKEND_URL}/api/trips`);
    console.log('   Body:', body);

    const response = await fetch(`${BACKEND_URL}/api/trips`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Backend error:', data);
    } else {
      console.log('✅ Trip created:', data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Create trip proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to create trip' },
      { status: 500 }
    );
  }
}

