import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agent_name: string }> }
) {
  try {
    const { agent_name } = await params;
    const { searchParams } = new URL(request.url);
    const agentConfig = searchParams.get('agent_config');
    
    const queryString = agentConfig ? `?agent_config=${agentConfig}` : '';
    const res = await fetch(`${BACKEND_URL}/api/agents/by-name/${agent_name}${queryString}`);
    
    if (!res.ok) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching agent by name:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent' },
      { status: 500 }
    );
  }
}
