import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const res = await fetch(`${BACKEND_URL}/api/assignments/${id}/`);
    const data = await res
      .json()
      .catch(async () => ({ detail: await res.text().catch(() => 'Unknown error') }));
    // If wrapped, unwrap to top-level fields
    if (data.assignment && typeof data.assignment === 'object') {
      return NextResponse.json(data.assignment, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy GET /assignments/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to fetch assignment' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const body = await request.json();

    // If client is attempting to change immutable fields on the backend,
    // emulate the change by creating a new assignment and deleting the old one.
    const wantsPromptChange =
      Object.prototype.hasOwnProperty.call(body, 'agent_id') ||
      Object.prototype.hasOwnProperty.call(body, 'agent_config') ||
      Object.prototype.hasOwnProperty.call(body, 'agent_name');

    if (wantsPromptChange) {
      // Get current assignment to fill in any missing fields
      const currentRes = await fetch(`${BACKEND_URL}/api/assignments/${id}/`);
      if (!currentRes.ok) {
        const errData = await currentRes
          .json()
          .catch(async () => ({ detail: await currentRes.text().catch(() => 'Unknown error') }));
        return NextResponse.json(errData, { status: currentRes.status });
      }
      const currentJson = await currentRes.json().catch(() => ({}));
      const current = currentJson.assignment || currentJson || {};

      const createBody = {
        participant_id: body.participant_id ?? current.participant_id,
        agent_id: body.agent_id ?? current.agent_id,
        agent_config: body.agent_config ?? current.agent_config,
        agent_name: body.agent_name ?? current.agent_name,
        is_active: body.is_active ?? current.is_active ?? false,
        order: body.order ?? current.order ?? 0,
      };

      const createRes = await fetch(`${BACKEND_URL}/api/assignments/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createBody),
      });
      const createdData = await createRes
        .json()
        .catch(async () => ({ detail: await createRes.text().catch(() => 'Unknown error') }));
      if (!createRes.ok) {
        return NextResponse.json(createdData, { status: createRes.status });
      }

      // Best-effort delete of previous assignment
      const delRes = await fetch(`${BACKEND_URL}/api/assignments/${id}/`, { method: 'DELETE' });
      if (!delRes.ok && delRes.status !== 204) {
        const delBody = await delRes.json().catch(() => ({}));
        // Return created assignment but indicate deletion failure
        return NextResponse.json(
          {
            ...((createdData.assignment && typeof createdData.assignment === 'object')
              ? createdData.assignment
              : createdData),
            warning: delBody.detail || `Old assignment (${id}) could not be deleted`,
          },
          { status: 200 }
        );
      }

      // Return unwrapped created assignment as update result
      if (createdData.assignment && typeof createdData.assignment === 'object') {
        return NextResponse.json(createdData.assignment, { status: 200 });
      }
      return NextResponse.json(createdData, { status: 200 });
    }

    // No immutable changes requested; forward PATCH as-is
    const res = await fetch(`${BACKEND_URL}/api/assignments/${id}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res
      .json()
      .catch(async () => ({ detail: await res.text().catch(() => 'Unknown error') }));
    // Unwrap if necessary
    if (data.assignment && typeof data.assignment === 'object') {
      return NextResponse.json(data.assignment, { status: res.status });
    }
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy PATCH /assignments/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to update assignment' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const p = await params;
  const id = p.id;
  try {
    const res = await fetch(`${BACKEND_URL}/api/assignments/${id}/`, { method: 'DELETE' });
    if (res.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error(`Proxy DELETE /assignments/${id} error:`, error);
    return NextResponse.json({ detail: 'Failed to delete assignment' }, { status: 500 });
  }
}
