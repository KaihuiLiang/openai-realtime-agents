// Conversations API proxy route
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/conversations/`, { cache: 'no-store' });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      const conversations = Array.isArray(data) ? data : [];
      return NextResponse.json(conversations, { status: 200 });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy GET /conversations error:', error);
    return NextResponse.json({ detail: 'Failed to fetch conversations' }, { status: 500 });
  }
}
