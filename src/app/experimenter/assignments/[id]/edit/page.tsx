import EditAssignmentForm, { Assignment, Participant, Agent } from './EditAssignmentForm';
import { notFound } from 'next/navigation';

async function fetchAssignment(id: string): Promise<Assignment | null> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/assignments/${id}/`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    // Backend now returns unwrapped object directly
    const a = data;
    return {
      id: a.id,
      participant_id: a.participant_id,
      experiment_prompt_id: a.experiment_prompt_id ?? '',
      agent_config: a.agent_config ?? '',
      agent_name: a.agent_name ?? '',
      is_active: !!a.is_active,
      order: a.order ?? 0,
    } as Assignment;
  } catch {
    return null;
  }
}

async function fetchParticipants(): Promise<Participant[]> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/participants/`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function fetchAgents(): Promise<Agent[]> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/agents/`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [assignment, participants, agents] = await Promise.all([
    fetchAssignment(id),
    fetchParticipants(),
    fetchAgents(),
  ]);
  if (!assignment) notFound();
  return (
    <EditAssignmentForm
      initial={assignment}
      participants={participants}
      agents={agents}
      originalPromptId={assignment.experiment_prompt_id ?? null}
    />
  );
}
