import EditParticipantForm, { Participant } from './EditParticipantForm';
import { notFound } from 'next/navigation';

async function fetchParticipant(id: string): Promise<Participant | null> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/participants/${id}/`, { cache: 'no-store' });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const data = await res.json();
    const p = (data?.participant && typeof data.participant === 'object') ? data.participant : data;
    return {
      id: p.id,
      participant_id: p.participant_id ?? '',
      name: p.name ?? '',
      email: p.email ?? '',
      is_guest: !!p.is_guest,
    } as Participant;
  } catch {
    return null;
  }
}

export default async function EditParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = await fetchParticipant(id);
  if (!participant) {
    notFound();
  }
  return <EditParticipantForm initial={participant!} />;
}
