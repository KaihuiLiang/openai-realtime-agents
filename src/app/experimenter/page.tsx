async function getCounts() {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  const [agentsRes, participantsRes, assignmentsRes] = await Promise.all([
    fetch(`${base}/api/agents/`, { next: { revalidate: 30 } }),
    fetch(`${base}/api/participants/`, { next: { revalidate: 30 } }),
    fetch(`${base}/api/assignments/`, { next: { revalidate: 30 } }),
  ]);
  const [agents, participants, assignments] = await Promise.all([
    agentsRes.json().catch(() => ([])),
    participantsRes.json().catch(() => ([])),
    assignmentsRes.json().catch(() => ([])),
  ]);
  return {
    agents: Array.isArray(agents) ? agents.length : 0,
    participants: Array.isArray(participants) ? participants.length : 0,
    assignments: Array.isArray(assignments) ? assignments.length : 0,
  };
}

export default async function ExperimenterHome() {
  const counts = await getCounts();
  return (
    <div className="space-y-8 max-w-6xl">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Overview</h2>
        <p className="text-slate-600 mt-1">Monitor your experiments at a glance</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card label="Agents" value={counts.agents} href="/experimenter/agents" color="blue" />
        <Card label="Participants" value={counts.participants} href="/experimenter/participants" color="purple" />
        <Card label="Assignments" value={counts.assignments} href="/experimenter/assignments" color="emerald" />
      </div>
    </div>
  );
}

function Card({ label, value, href, color }: { label: string; value: number; href: string; color: string }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    emerald: 'from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700',
  };
  return (
    <a 
      href={href} 
      className={`block rounded-2xl bg-gradient-to-br ${colors[color as keyof typeof colors]} p-6 hover:shadow-2xl hover:scale-105 transition-all duration-200 text-white group`}
    >
      <div className="text-sm opacity-90 font-medium mb-2">{label}</div>
      <div className="text-5xl font-bold tracking-tight">{value}</div>
      <div className="mt-4 text-xs opacity-75 group-hover:opacity-100 transition-opacity">View all →</div>
    </a>
  );
}
