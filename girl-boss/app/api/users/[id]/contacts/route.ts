import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// POST /api/users/:id/contacts - Add emergency contact
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const response = await fetch(`${BACKEND_URL}/api/users/${params.id}/contacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Add contact error:', error);
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}

