import Link from 'next/link';
import RowActions from './row-actions';

type Assignment = {
  id: string;
  participant_id: string;
  experiment_prompt_id: string;
  agent_config: string;
  agent_name: string;
  is_active: boolean;
  completed: boolean;
  order: number;
  created_at: string;
};

async function getAssignments(): Promise<Assignment[]> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  const res = await fetch(`${base}/api/assignments/`, { cache: 'no-store' });
  const data = await res.json();
  return data.assignments ?? [];
}

export default async function AssignmentsPage() {
  const assignments = await getAssignments();
  // Fetch participants to map foreign/external IDs
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  const participantsRes = await fetch(`${base}/api/participants/`, { cache: 'no-store' });
  const participantsData = await participantsRes.json();
  const participants = participantsData.participants ?? [];
  // Helper to get display name or external ID
  function getParticipantDisplay(id: string) {
    const p = participants.find((p: any) => p.id === id || p.participant_id === id);
    if (!p) return id;
    // Show the participant_id (e.g., 'P001')
    return p.participant_id;
  }
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Assignments</h2>
          <p className="text-slate-600 mt-1">Manage participant-agent assignments</p>
        </div>
        <Link 
          href="/experimenter/assignments/new" 
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          + New Assignment
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Participant ID</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Agent</th>
                <th className="text-right p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-emerald-50/50 transition-colors">
                  <td className="p-4 font-mono text-xs text-slate-700">
                    <span className="bg-slate-100 px-2 py-1 rounded" title={a.participant_id}>{getParticipantDisplay(a.participant_id)}</span>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {a.agent_name}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/experimenter/assignments/${a.id}/edit`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Edit</Link>
                      <RowActions id={a.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
