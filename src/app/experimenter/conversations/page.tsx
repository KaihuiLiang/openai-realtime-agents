import Link from 'next/link';

type Message = {
  role: string;
  content: string;
  timestamp: string;
};

type Conversation = {
  id: string;
  session_id: string;
  agent_config: string;
  agent_name: string;
  transcript: {
    messages: Message[];
  };
  duration: number;
  turn_count: number;
  participant_id: string | null;
  created_at: string;
  user_satisfaction: number | null;
  task_completed: boolean | null;
};

async function getConversations(): Promise<Conversation[]> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
    const res = await fetch(`${base}/api/conversations/`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    const data = await res.json();
    return data.conversations ?? [];
  } catch {
    return [];
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function ConversationsPage() {
  const conversations = await getConversations();

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Conversations</h2>
          <p className="text-slate-600 mt-1">View conversation history and transcripts</p>
        </div>
        <div className="text-sm text-slate-500">
          {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
        {conversations.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <svg className="mx-auto h-12 w-12 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Conversations will appear here after users interact with agents</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Agent</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Preview</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Turns</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Duration</th>
                  <th className="text-left p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Created</th>
                  <th className="text-right p-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {conversations.map((conv) => {
                  const firstMessage = conv.transcript?.messages?.[0];
                  const preview = firstMessage?.content 
                    ? firstMessage.content.slice(0, 80) + (firstMessage.content.length > 80 ? '...' : '')
                    : 'No messages';
                  
                  return (
                    <tr key={conv.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-900 text-sm">{conv.agent_name}</div>
                        <div className="text-xs text-slate-500">{conv.agent_config}</div>
                      </td>
                      <td className="p-4 max-w-md">
                        <div className="text-sm text-slate-700 truncate">{preview}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                          {conv.turn_count} {conv.turn_count === 1 ? 'turn' : 'turns'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {formatDuration(conv.duration)}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {formatDate(conv.created_at)}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/experimenter/conversations/${conv.id}`}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                          >
                            View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
