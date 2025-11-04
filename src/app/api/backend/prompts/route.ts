import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ detail: 'Deprecated: use /api/backend/agents' }, { status: 410 });
}

export async function POST() {
  return NextResponse.json({ detail: 'Deprecated: use /api/backend/agents' }, { status: 410 });
}
