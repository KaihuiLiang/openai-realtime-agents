"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type Prompt = {
	id: string;
	name: string;
	agent_config: string;
	agent_name: string;
	system_prompt: string;
	instructions?: string | null;
	temperature?: number | null;
	is_active: boolean;
};

export default function EditAgentPage() {
	const router = useRouter();
	const params = useParams();
	const id = String(params?.id);
	const [form, setForm] = useState<Prompt | null>(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		(async () => {
			try {
				const res = await fetch(`/api/backend/agents/${id}`);
				const data = await res.json();
				setForm({
					id: data.id,
					name: data.name ?? '',
					agent_config: data.agent_config ?? '',
					agent_name: data.agent_name ?? '',
					system_prompt: data.system_prompt ?? '',
					instructions: data.instructions ?? '',
					temperature: data.temperature ?? 0.8,
					is_active: !!data.is_active,
				});
			} catch (e: any) {
				setError(e.message || 'Failed to load');
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
				name: form.name,
				agent_config: form.agent_config,
				agent_name: form.agent_name,
				system_prompt: form.system_prompt,
				instructions: form.instructions || '',
				temperature: form.temperature ?? 0.8,
				is_active: form.is_active,
			};
			const res = await fetch(`/api/backend/agents/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});
			if (!res.ok) {
				const data = await res.json().catch(() => ({}));
				throw new Error((data as any)?.detail || `Failed: ${res.status}`);
			}
			router.push('/experimenter/agents');
			router.refresh();
		} catch (err: any) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div className="text-slate-600">Loading…</div>;
	}
	if (!form) {
		return <div className="text-red-600">{error || 'Not found'}</div>;
	}

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