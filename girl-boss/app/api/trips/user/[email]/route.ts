import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// GET /api/trips/user/:email - Get user's recent trips
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ email: string }> }
) {
  try {
    const params = await context.params; // Next.js 15+ requires await
    const email = decodeURIComponent(params.email);
    const limit = req.nextUrl.searchParams.get('limit') || '3';

    console.log('🔄 Proxying get trips request');
    console.log('   Email:', email);
    console.log('   Limit:', limit);

    const response = await fetch(
      `${BACKEND_URL}/api/trips/user/${encodeURIComponent(email)}?limit=${limit}`,
      {
        method: 'GET',
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Backend error:', data);
    } else {
      console.log('✅ Fetched', data.trips?.length || 0, 'trips');
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('❌ Get trips proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to get trips' },
      { status: 500 }
    );
  }
}

