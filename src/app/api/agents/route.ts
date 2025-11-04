import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents/`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const d: any = data;
      const agents = Array.isArray(d)
        ? d
        : Array.isArray(d?.agents) ? d.agents
        : Array.isArray(d?.results) ? d.results
        : Array.isArray(d?.items) ? d.items
        : Array.isArray(d?.data) ? d.data
        : Array.isArray(d?.agents?.results) ? d.agents.results
        : Array.isArray(d?.agents?.data) ? d.agents.data
        : [];
      return NextResponse.json({ agents }, { status: 200 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy GET /api/agents error:', error);
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
    console.error('Proxy POST /api/agents error:', error);
    return NextResponse.json({ detail: 'Failed to create agent' }, { status: 500 });
  }
}
