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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await fetch(`${BACKEND_URL}/api/conversations/${id}`, {
      method: 'DELETE',
      cache: 'no-store',
    });

    const data = await parseResponsePayload(res);

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error('Proxy DELETE /conversations/:id error:', error);
    return NextResponse.json({ detail: 'Failed to delete conversation' }, { status: 500 });
  }
}