import Link from 'next/link';
import RowActions from './row-actions';
// Server-side can call backend directly; avoid relying on local API route path

type Agent = {
	id: string;
	name: string;
	agent_config: string;
	agent_name: string;
	is_active: boolean;
	updated_at?: string | null;
};

async function getAgents(): Promise<Agent[]> {
	const base = process.env.BACKEND_URL || 'http://localhost:8000';
			try {
				// Try new agents endpoint
				const res = await fetch(`${base}/api/agents/`, { next: { revalidate: 30 } });
				const text = await res.text();
				let data: any = {};
				try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
				if (res.ok) {
					// Accept common wrappers: agents | results | items | data | nested agents.results/data
					if (Array.isArray(data)) return data as Agent[];
					if (Array.isArray(data?.agents)) return data.agents as Agent[];
					if (Array.isArray(data?.results)) return data.results as Agent[];
					if (Array.isArray(data?.items)) return data.items as Agent[];
					if (Array.isArray(data?.data)) return data.data as Agent[];
					if (Array.isArray(data?.agents?.results)) return data.agents.results as Agent[];
					if (Array.isArray(data?.agents?.data)) return data.agents.data as Agent[];
					return [] as Agent[];
				}
				// No fallback to legacy prompts: migration is now agent-only
				return [];
			} catch {
				return [];
			}
}

export default async function AgentsPage() {
	const agents = await getAgents();
	return (
		<div className="space-y-6 max-w-7xl">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-3xl font-bold text-slate-800">Agents</h2>
					<p className="text-slate-600 mt-1">Manage experiment agents and configurations</p>
				</div>
				<Link 
					href="/experimenter/agents/new" 
					className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-medium shadow-lg hover:shadow-xl transition-all hover:scale-105"
				>
					+ New Agent
				</Link>
			</div>
			<div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
				<div className="overflow-x-auto">
					<table className="min-w-full">
						<thead className="bg-gradient-to-r from-slate-50 to-slate-100">
							<tr>
								<th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Agent Name</th>
								<th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Status</th>
								<th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Updated</th>
								<th className="text-right p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100">
							{agents.map((p) => (
								<tr key={p.id} className="hover:bg-blue-50/50 transition-colors">
									<td className="p-4 text-slate-700 text-sm font-medium">
										{p.agent_name}
									</td>
									<td className="p-4">
										<span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
											p.is_active 
												? 'bg-emerald-100 text-emerald-700' 
												: 'bg-slate-100 text-slate-600'
										}`}>
											{p.is_active ? '● Active' : '○ Inactive'}
										</span>
									</td>
									<td className="p-4 text-slate-500 text-sm">{p.updated_at ? new Date(p.updated_at).toLocaleString() : '-'}</td>
									<td className="p-4">
										<div className="flex items-center justify-end gap-2">
											<Link href={`/experimenter/agents/${p.id}/edit`} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors">Edit</Link>
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