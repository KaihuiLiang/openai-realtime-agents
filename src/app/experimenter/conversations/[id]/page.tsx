import Link from 'next/link';
import { notFound } from 'next/navigation';

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
  extra_metadata?: any;
};

async function getConversation(id: string): Promise<Conversation | null> {
  const base = process.env.BACKEND_URL || 'http://localhost:8000';
  try {
  const res = await fetch(`${base}/api/conversations/${id}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
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
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export default async function ConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    notFound();
  }

  const messages = conversation.transcript?.messages || [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/experimenter/conversations"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600 hover:text-slate-900"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-slate-800">Conversation Details</h2>
          <p className="text-slate-600 mt-1">Session: {conversation.session_id.slice(0, 8)}</p>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Agent</div>
          <div className="font-semibold text-slate-900">{conversation.agent_name}</div>
          <div className="text-xs text-slate-500 mt-0.5">{conversation.agent_config}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Turns</div>
          <div className="font-semibold text-slate-900 text-2xl">{conversation.turn_count}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Duration</div>
          <div className="font-semibold text-slate-900 text-2xl">{formatDuration(conversation.duration)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Created</div>
          <div className="font-semibold text-slate-900 text-sm">{formatDate(conversation.created_at)}</div>
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Transcript</h3>
          <p className="text-sm text-slate-600 mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-6 space-y-4 max-h-[600px] overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              <p>No messages in this conversation</p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {message.role === 'user' ? 'U' : 'A'}
                </div>
                
                {/* Message bubble */}
                <div className={`flex-1 max-w-3xl ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 px-1">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Additional Info */}
      {(conversation.user_satisfaction !== null || conversation.task_completed !== null || conversation.extra_metadata) && (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {conversation.user_satisfaction !== null && (
              <div>
                <div className="text-sm text-slate-600 mb-1">User Satisfaction</div>
                <div className="font-semibold text-slate-900">{conversation.user_satisfaction}/5</div>
              </div>
            )}
            {conversation.task_completed !== null && (
              <div>
                <div className="text-sm text-slate-600 mb-1">Task Completed</div>
                <div className={`font-semibold ${conversation.task_completed ? 'text-green-600' : 'text-red-600'}`}>
                  {conversation.task_completed ? 'Yes' : 'No'}
                </div>
              </div>
            )}
            {conversation.participant_id && (
              <div>
                <div className="text-sm text-slate-600 mb-1">Participant ID</div>
                <div className="font-mono text-sm text-slate-900">{conversation.participant_id}</div>
              </div>
            )}
            {conversation.extra_metadata && (
              <div className="col-span-full">
                <div className="text-sm text-slate-600 mb-1">Metadata</div>
                <pre className="text-xs bg-slate-50 p-3 rounded-lg overflow-x-auto text-slate-700 border border-slate-200">
                  {JSON.stringify(conversation.extra_metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
