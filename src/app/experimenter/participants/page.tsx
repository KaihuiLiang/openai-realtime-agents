import Link from 'next/link';
import RowActions from './row-actions';

type Participant = {
  id: string;
  participant_id: string;
  name?: string | null;
  email?: string | null;
  is_guest: boolean;
  created_at: string;
};

async function getParticipants(): Promise<Participant[]> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  const res = await fetch(`${base}/api/participants/`, { next: { revalidate: 30 } });
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export default async function ParticipantsPage() {
  const participants = await getParticipants();
  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Participants</h2>
          <p className="text-slate-600 mt-1">Manage study participants and guests</p>
        </div>
        <Link 
          href="/experimenter/participants/new" 
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          + New Participant
        </Link>
      </div>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
              <tr>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Participant ID</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Name</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Email</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Type</th>
                <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Created</th>
                <th className="text-right p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((p) => (
                <tr key={p.id} className="hover:bg-purple-50/50 transition-colors">
                  <td className="p-4 font-mono text-sm text-slate-900 font-medium">{p.participant_id}</td>
                  <td className="p-4 text-slate-700">{p.name || <span className="text-slate-400 italic">—</span>}</td>
                  <td className="p-4 text-slate-600 text-sm">{p.email || <span className="text-slate-400 italic">—</span>}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.is_guest 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {p.is_guest ? '👤 Guest' : '🔬 Participant'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-500 text-sm">{new Date(p.created_at).toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/experimenter/participants/${p.id}/edit`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Edit</Link>
                      <RowActions id={p.id} />
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
