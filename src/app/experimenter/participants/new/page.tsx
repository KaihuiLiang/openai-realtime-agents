"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Using Next.js API proxy routes to avoid CORS

export default function NewParticipantPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    participant_id: '',
    name: '',
    email: '',
    is_guest: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body: any = {
        participant_id: form.participant_id.trim(),
        is_guest: form.is_guest,
      };
      if (form.name) body.name = form.name;
      if (form.email) body.email = form.email;

      const res = await fetch(`/api/backend/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.detail || `Failed: ${res.status}`);
      }
      router.push('/experimenter/participants');
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
        <h2 className="text-3xl font-bold text-slate-800">New Participant</h2>
        <p className="text-slate-600 mt-1">Add a new participant to your study</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Participant ID</label>
          <input 
            name="participant_id" 
            value={form.participant_id} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none font-mono" 
            placeholder="e.g., P001"
            required 
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Name (optional)</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none" 
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email (optional)</label>
          <input 
            name="email" 
            type="email" 
            value={form.email} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none" 
            placeholder="john@example.com"
          />
        </div>
        <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <input 
            type="checkbox" 
            name="is_guest" 
            checked={form.is_guest} 
            onChange={handleChange}
            className="w-5 h-5 rounded border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-200"
          />
          <div>
            <span className="text-sm font-medium text-slate-700 block">Guest Mode</span>
            <span className="text-xs text-slate-500">Allow participant to choose their own agent</span>
          </div>
        </label>
        <div className="flex gap-3 pt-4">
          <button 
            disabled={submitting} 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {submitting ? 'Creating…' : 'Create Participant'}
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
