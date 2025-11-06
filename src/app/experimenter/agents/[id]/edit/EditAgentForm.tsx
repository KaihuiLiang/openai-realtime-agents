"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Agent } from '@/types/api';

export type { Agent };

export default function EditAgentForm({ initial }: { initial: Agent }) {
  const router = useRouter();
  const [form, setForm] = useState<Agent>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value } as any));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body: any = {
        name: form.name,
        agent_config: form.agent_config,
        agent_name: form.agent_name,
        system_prompt: form.system_prompt,
        instructions: form.instructions || '',
        temperature: form.temperature ?? 0.8,
        is_active: form.is_active,
      };
      const res = await fetch(`/api/backend/agents/${form.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let errorMsg = `Failed to update agent (HTTP ${res.status})`;
        try {
          const data = await res.json();
          if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          } else if (data.message) {
            errorMsg = data.message;
          } else if (data.error) {
            errorMsg = data.error;
          } else {
            errorMsg = `Error ${res.status}: ${JSON.stringify(data)}`;
          }
        } catch {
          const text = await res.text().catch(() => '');
          if (text) errorMsg = `Error ${res.status}: ${text.substring(0, 200)}`;
        }
        throw new Error(errorMsg);
      }
      router.push('/experimenter/agents');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Edit Agent</h2>
        <p className="text-slate-600 mt-1">Update the agent configuration</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Agent Name</label>
          <input
            name="agent_name"
            value={form.agent_name}
            onChange={handleChange}
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-slate-800 placeholder-slate-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">System Prompt</label>
          <textarea
            name="system_prompt"
            value={form.system_prompt}
            onChange={handleChange}
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none font-mono text-sm text-slate-800 placeholder-slate-500"
            rows={8}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Instructions (optional)</label>
          <textarea
            name="instructions"
            value={form.instructions || ''}
            onChange={handleChange}
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-slate-800 placeholder-slate-500"
            rows={4}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Temperature</label>
            <input
              type="number"
              step="0.1"
              name="temperature"
              value={(form.temperature ?? 0.8) as any}
              onChange={handleChange}
              className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none text-slate-800 placeholder-slate-500"
            />
          </div>
          <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors mt-6">
            <input
              type="checkbox"
              name="is_active"
              checked={!!form.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
            />
            <span className="text-sm font-medium text-slate-700">Set as active</span>
          </label>
        </div>
        <div className="flex gap-3 pt-4">
          <button
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
