// Agent-centric API proxy route for single agent
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/${id}/`);
    const data = await res.json().catch(async () => ({ detail: await res.text().catch(() => 'Unknown error') }));
    if (data.agent && typeof data.agent === 'object') {
      return NextResponse.json(data.agent, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy GET /agents/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to fetch agent' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/agents/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(async () => ({ detail: await res.text().catch(() => 'Unknown error') }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy PATCH /agents/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/${id}/`, { method: 'DELETE' });
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy DELETE /agents/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to delete agent' }, { status: 500 });
  }
}
