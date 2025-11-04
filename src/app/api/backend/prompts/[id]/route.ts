import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ detail: 'Deprecated: use /api/backend/agents/:id' }, { status: 410 });
}

export async function PATCH() {
  return NextResponse.json({ detail: 'Deprecated: use /api/backend/agents/:id' }, { status: 410 });
}

export async function DELETE() {
  return NextResponse.json({ detail: 'Deprecated: use /api/backend/agents/:id' }, { status: 410 });
}
