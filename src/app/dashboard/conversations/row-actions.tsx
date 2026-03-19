"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

export default function RowActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm('Delete this conversation? This cannot be undone.')) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/backend/conversations/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as any)?.detail || `Failed: ${res.status}`;
        throw new Error(msg);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors disabled:opacity-50"
      title="Delete conversation"
      aria-label="Delete conversation"
    >
      <Trash2 size={14} />
    </button>
  );
}