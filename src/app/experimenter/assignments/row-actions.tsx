"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Using Next.js API proxy routes to avoid CORS

export default function RowActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const onDelete = async () => {
    if (!confirm('Delete this assignment?')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/assignments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data as any)?.detail || `Failed: ${res.status}`;
        throw new Error(msg);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete assignment');
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      onClick={onDelete}
      disabled={loading}
      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50"
      title="Delete"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  );
}
