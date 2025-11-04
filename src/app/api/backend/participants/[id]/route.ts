import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const res = await fetch(`${BACKEND_URL}/api/participants/${id}/`);
    const data = await res
      .json()
      .catch(async () => ({ detail: await res.text().catch(() => 'Unknown error') }));
    // If wrapped, unwrap to top-level fields
    if (data.participant && typeof data.participant === 'object') {
      return NextResponse.json(data.participant, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy GET /participants/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to fetch participant' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/participants/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res
      .json()
      .catch(async () => ({ detail: await res.text().catch(() => 'Unknown error') }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy PATCH /participants/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to update participant' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const res = await fetch(`${BACKEND_URL}/api/participants/${id}/`, { method: 'DELETE' });
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy DELETE /participants/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to delete participant' }, { status: 500 });
  }
}
