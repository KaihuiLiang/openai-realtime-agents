"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Participant, Agent } from '@/types/api';

export default function NewAssignmentPage() {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState({
    participant_id: '',
    agent_id: '',
    is_active: true,
    order: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [partRes, promptRes] = await Promise.all([
        fetch(`/api/backend/participants`),
        fetch(`/api/backend/agents`),
      ]);
  const [partData, promptData] = await Promise.all([partRes.json(), promptRes.json()]);
      setParticipants(Array.isArray(partData) ? partData : (partData.participants ?? []));
      setAgents(Array.isArray(promptData) ? promptData : (promptData.agents ?? []));
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as any;
    const val = type === 'checkbox' ? (e.target as any).checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
  const selectedAgent = agents.find((agent) => agent.id === form.agent_id);
  if (!selectedAgent) throw new Error('Agent not selected');

      const body = {
        participant_id: form.participant_id,
        agent_id: form.agent_id,
  agent_config: selectedAgent.agent_config,
  agent_name: selectedAgent.agent_name,
        is_active: form.is_active,
        order: Number(form.order),
      };

      const res = await fetch(`/api/backend/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.detail || `Failed: ${res.status}`);
      }
      router.push('/experimenter/assignments');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">New Assignment</h2>
        <p className="text-slate-600 mt-1">Assign a prompt to a participant</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Participant</label>
          <select 
            name="participant_id" 
            value={form.participant_id} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white" 
            required
          >
            <option value="">Select participant…</option>
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
            name="agent_id" 
            value={form.agent_id} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none bg-white" 
            required
          >
            <option value="">Select agent…</option>
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
              className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none" 
            />
          </div>
          <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors mt-6">
            <input 
              type="checkbox" 
              name="is_active" 
              checked={form.is_active} 
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-200"
            />
            <span className="text-sm font-medium text-slate-700">Active</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4">
          <button 
            disabled={submitting} 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {submitting ? 'Creating…' : 'Create Assignment'}
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
