// Conversations API proxy route
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

async function parseResponsePayload(res: Response) {
  const text = await res.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/conversations/`, { cache: 'no-store' });
    const data = await parseResponsePayload(res);
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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/conversations/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await parseResponsePayload(res);

    if (res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy POST /conversations error:', error);
    return NextResponse.json({ detail: 'Failed to save conversation' }, { status: 500 });
  }
}
