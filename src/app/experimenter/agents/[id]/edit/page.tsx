import EditAgentForm, { Agent } from './EditAgentForm';
import { notFound } from 'next/navigation';

async function fetchAgent(id: string): Promise<Agent | null> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/backend/agents/${id}`, { cache: 'no-store' });
		if (res.status === 404) return null;
		if (!res.ok) return null;
		const agent = await res.json();
		return {
			id: agent.id,
			name: agent.name ?? '',
			agent_config: agent.agent_config ?? '',
			agent_name: agent.agent_name ?? '',
			system_prompt: agent.system_prompt ?? '',
			instructions: agent.instructions ?? '',
			temperature: agent.temperature ?? 0.8,
			is_active: !!agent.is_active,
		} as Agent;
	} catch {
		return null;
	}
}

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const agent = await fetchAgent(id);
	if (!agent) {
		notFound();
	}
	return <EditAgentForm initial={agent!} />;
}