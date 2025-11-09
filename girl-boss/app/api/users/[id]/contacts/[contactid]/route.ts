import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// PATCH /api/users/:id/contacts/:contactid
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactid: string }> }
) {
  try {
    const { id, contactid } = await params;
    const body = await req.json();
    const response = await fetch(
      `${BACKEND_URL}/api/users/${id}/contacts/${contactid}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Update contact error:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE /api/users/:id/contacts/:contactid
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactid: string }> }
) {
  try {
    const { id, contactid } = await params;
    const response = await fetch(
      `${BACKEND_URL}/api/users/${id}/contacts/${contactid}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}

