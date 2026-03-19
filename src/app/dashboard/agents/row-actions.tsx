"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Using Next.js API proxy routes to avoid CORS

export default function RowActions({ id }: { id: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onDelete = async () => {
    if (!confirm('Delete this agent? This cannot be undone.')) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/agents/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        // Try to get detailed error from response
        let errorMsg = `Failed to delete agent (HTTP ${res.status})`;
        try {
          const data = await res.json();
          // Extract detail or message field
          if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          } else if (data.message) {
            errorMsg = data.message;
          } else if (data.error) {
            errorMsg = data.error;
          } else {
            // Show entire response if no known error field
            errorMsg = `Error ${res.status}: ${JSON.stringify(data)}`;
          }
        } catch {
          // If response is not JSON, get text
          const text = await res.text().catch(() => '');
          if (text) errorMsg = `Error ${res.status}: ${text.substring(0, 200)}`;
        }
        throw new Error(errorMsg);
      }
      router.refresh();
    } catch (e: any) {
      alert(e.message || 'Failed to delete agent');
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
