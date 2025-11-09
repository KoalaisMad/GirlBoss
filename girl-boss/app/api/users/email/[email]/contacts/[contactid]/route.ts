import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

// DELETE /api/users/email/:email/contacts/:contactid
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ email: string; contactid: string }> }
) {
  try {
    const params = await context.params; // Next.js 15+ requires await
    const response = await fetch(
      `${BACKEND_URL}/api/users/email/${params.email}/contacts/${params.contactid}`,
      { method: 'DELETE' }
    );
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Delete contact by email error:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}

