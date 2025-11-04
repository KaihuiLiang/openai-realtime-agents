"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Using Next.js API proxy routes to avoid CORS

type Participant = { id: string; participant_id: string; name?: string | null };
type Agent = { id: string; name?: string; agent_config: string; agent_name: string };
type Assignment = {
  id: string;
  participant_id: string;
  experiment_prompt_id: string;
  agent_config: string;
  agent_name: string;
  is_active: boolean;
  order: number;
};

export default function EditAssignmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id);
  const [form, setForm] = useState<Assignment | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [originalPromptId, setOriginalPromptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [aRes, partRes, promptRes] = await Promise.all([
          fetch(`/api/backend/assignments/${id}`),
          fetch(`/api/backend/participants`),
          fetch(`/api/backend/agents`),
        ]);
        const [a, partData, promptData] = await Promise.all([
          aRes.json(),
          partRes.json(),
          promptRes.json(),
        ]);
        setForm({
          id: a.id,
          participant_id: a.participant_id,
          experiment_prompt_id: a.experiment_prompt_id,
          agent_config: a.agent_config,
          agent_name: a.agent_name,
          is_active: !!a.is_active,
          order: a.order ?? 0,
        });
        setOriginalPromptId(a.experiment_prompt_id ?? null);
    setParticipants(partData.participants ?? []);
    setAgents(promptData.agents ?? []);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as any).checked : value;
    setForm((prev) => (prev ? { ...prev, [name]: val } as any : prev));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
  const selectedAgent = agents.find((agent) => agent.id === form.experiment_prompt_id);
  if (!selectedAgent) throw new Error('Agent not selected');

      // If prompt didn't change, do a simple PATCH for other fields
      if (!originalPromptId || form.experiment_prompt_id === originalPromptId) {
        const body = {
          // Do not attempt to update agent fields or experiment_prompt_id (backend ignores these)
          is_active: !!form.is_active,
          order: Number(form.order ?? 0),
        } as any;
        const res = await fetch(`/api/backend/assignments/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error((data as any)?.detail || `Failed: ${res.status}`);
        }
      } else {
        // Backend does not allow changing experiment_prompt_id; recreate assignment as fallback
        const createBody = {
          participant_id: form.participant_id,
          experiment_prompt_id: form.experiment_prompt_id,
          agent_config: selectedAgent.agent_config,
          agent_name: selectedAgent.agent_name,
          is_active: !!form.is_active,
          order: Number(form.order ?? 0),
        };
        const createRes = await fetch(`/api/backend/assignments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(createBody),
        });
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error((data as any)?.detail || `Failed to create new assignment: ${createRes.status}`);
        }
        // Delete the old assignment after creating the new one
        const delRes = await fetch(`/api/backend/assignments/${id}`, { method: 'DELETE' });
        if (!delRes.ok && delRes.status !== 204) {
          const data = await delRes.json().catch(() => ({}));
          throw new Error((data as any)?.detail || `Failed to delete old assignment: ${delRes.status}`);
        }
      }
      router.push('/experimenter/assignments');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-600">Loading…</div>;
  if (!form) return <div className="text-red-600">{error || 'Not found'}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Edit Assignment</h2>
        <p className="text-slate-600 mt-1">Update participant-agent assignment</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Participant</label>
          <select 
            name="participant_id" 
            value={form.participant_id} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white text-slate-800 placeholder-slate-500" 
            required
          >
            {participants.map((p) => (
              <option key={p.id} value={p.participant_id}>
                {p.participant_id} {p.name ? `(${p.name})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Agent</label>
          <select 
            name="experiment_prompt_id" 
            value={form.experiment_prompt_id} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white text-slate-800 placeholder-slate-500" 
            required
          >
            {agents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.agent_name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Order</label>
            <input 
              type="number" 
              name="order" 
              value={form.order} 
              onChange={handleChange} 
              className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-slate-800 placeholder-slate-500" 
            />
          </div>
          <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors mt-6">
            <input 
              type="checkbox" 
              name="is_active" 
              checked={!!form.is_active} 
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4">
          <button 
            disabled={saving} 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button 
            type="button" 
            className="px-6 py-3 rounded-xl border-2 border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors" 
            onClick={() => router.back()}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
