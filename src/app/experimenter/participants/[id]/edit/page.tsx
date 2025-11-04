"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Using Next.js API proxy routes to avoid CORS

type Participant = {
  id: string;
  participant_id: string;
  name?: string | null;
  email?: string | null;
  is_guest: boolean;
};

export default function EditParticipantPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id);
  const [form, setForm] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/backend/participants/${id}`);
        const data = await res.json();
        setForm({
          id: data.id,
          participant_id: data.participant_id ?? '',
          name: data.name ?? '',
          email: data.email ?? '',
          is_guest: !!data.is_guest,
        });
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => (prev ? { ...prev, [name]: type === 'checkbox' ? checked : value } as any : prev));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    try {
      const body: any = {
        name: form.name || '',
        email: form.email || '',
        is_guest: !!form.is_guest,
      };
      const res = await fetch(`/api/backend/participants/${id}`, {
        method: 'PATCH',
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
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-600">Loading…</div>;
  if (!form) return <div className="text-red-600">{error || 'Not found'}</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Edit Participant</h2>
        <p className="text-slate-600 mt-1">Update participant info</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-6 bg-white p-8 rounded-2xl shadow-lg border border-slate-200">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Participant ID</label>
          <input
            value={form.participant_id}
            disabled
            className="w-full border-2 border-slate-200 rounded-xl p-3 bg-slate-50 text-slate-700"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Name (optional)</label>
          <input 
            name="name" 
            value={form.name || ''} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-slate-800 placeholder-slate-500" 
            placeholder="John Doe"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email (optional)</label>
          <input 
            name="email" 
            type="email" 
            value={form.email || ''} 
            onChange={handleChange} 
            className="w-full border-2 border-slate-200 rounded-xl p-3 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-slate-800 placeholder-slate-500" 
            placeholder="john@example.com"
          />
        </div>
        <label className="inline-flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-xl hover:bg-slate-100 transition-colors">
          <input 
            type="checkbox" 
            name="is_guest" 
            checked={!!form.is_guest} 
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
            disabled={saving} 
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
