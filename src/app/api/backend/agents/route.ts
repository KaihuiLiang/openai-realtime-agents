// Agent-centric API proxy route
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      // Pass through direct array for strict consistency
      const agents = Array.isArray(data) ? data : [];
      return NextResponse.json(agents, { status: 200 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy GET /agents error:', error);
    return NextResponse.json({ detail: 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/agents/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy POST /agents error:', error);
    return NextResponse.json({ detail: 'Failed to create agent' }, { status: 500 });
  }
}
