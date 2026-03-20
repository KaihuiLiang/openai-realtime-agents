import { useEffect, useRef, useCallback } from 'react';
import { TranscriptItem } from '@/app/types';

interface SaveConversationParams {
  transcriptItems: TranscriptItem[];
  sessionStatus: string;
  agentId?: string | null;
  agentConfig: string | null;
  agentName: string | null;
  sessionId: string | null;
}

// This hook runs in the browser, so always use the Next.js proxy route.
const API_BASE = '/api/backend';

export function useAutoSaveConversation({
  transcriptItems,
  sessionStatus,
  agentId,
  agentConfig,
  agentName,
  sessionId,
}: SaveConversationParams) {
  const sessionStartTimeRef = useRef<number | null>(null);
  const lastSavedCountRef = useRef<number>(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const latestParamsRef = useRef<SaveConversationParams>({
    transcriptItems,
    sessionStatus,
    agentId,
    agentConfig,
    agentName,
    sessionId,
  });
  const activeSessionMetaRef = useRef<{
    sessionId: string;
    agentId: string | null;
    agentConfig: string;
    agentName: string;
  } | null>(null);

  useEffect(() => {
    latestParamsRef.current = {
      transcriptItems,
      sessionStatus,
      agentId,
      agentConfig,
      agentName,
      sessionId,
    };
  }, [transcriptItems, sessionStatus, agentId, agentConfig, agentName, sessionId]);

  const saveConversation = useCallback(async (source: 'disconnect' | 'periodic' | 'unmount') => {
    const latestParams = latestParamsRef.current;
    const activeSessionMeta = activeSessionMetaRef.current;
    const resolvedSessionId = activeSessionMeta?.sessionId ?? latestParams.sessionId;
    const resolvedAgentId = activeSessionMeta?.agentId ?? latestParams.agentId ?? null;
    const resolvedAgentConfig = activeSessionMeta?.agentConfig ?? latestParams.agentConfig;
    const resolvedAgentName = activeSessionMeta?.agentName ?? latestParams.agentName;

    const messages = latestParams.transcriptItems.filter(
      item => item.type === 'MESSAGE' && !item.isHidden
    );

    console.log('💾 Attempting to save conversation...', {
      source,
      sessionId: resolvedSessionId,
      agentId: resolvedAgentId,
      agentConfig: resolvedAgentConfig,
      agentName: resolvedAgentName,
      messageCount: messages.length,
    });

    if (!resolvedSessionId || !resolvedAgentConfig || !resolvedAgentName) {
      console.warn('⚠️ Cannot save: missing required fields', {
        source,
        sessionId: resolvedSessionId,
        agentId: resolvedAgentId,
        agentConfig: resolvedAgentConfig,
        agentName: resolvedAgentName,
      });
      return;
    }

    if (messages.length === 0) {
      console.log('ℹ️ No messages to save');
      return;
    }

    console.log(`📝 Saving ${messages.length} messages...`);

    const duration = sessionStartTimeRef.current
      ? (Date.now() - sessionStartTimeRef.current) / 1000
      : 0;

    const turnCount = messages.length;

    const transcript = {
      messages: messages.map(item => ({
        role: item.role,
        content: item.title || '',
        timestamp: item.timestamp,
      })),
    };

    try {
      const response = await fetch(`${API_BASE}/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        keepalive: true,
        body: JSON.stringify({
          session_id: resolvedSessionId,
          agent_id: resolvedAgentId,
          agent_config: resolvedAgentConfig,
          agent_name: resolvedAgentName,
          transcript,
          duration,
          turn_count: turnCount,
          extra_metadata: {
            saved_at: new Date().toISOString(),
            auto_saved: true,
            save_source: source,
          },
        }),
      });

      if (response.ok) {
        console.log('✅ Conversation saved to database');
        lastSavedCountRef.current = messages.length;
      } else {
        console.error('❌ Failed to save conversation:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error saving conversation:', error);
    }
  }, []);

  // Track session start time
  useEffect(() => {
    if (sessionStatus === 'CONNECTED' && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
      lastSavedCountRef.current = 0;
      if (sessionId && agentConfig && agentName) {
        activeSessionMetaRef.current = {
          sessionId,
          agentId: agentId ?? null,
          agentConfig,
          agentName,
        };
      }
      console.log('🟢 Session started - Auto-save enabled');
    }
  }, [sessionStatus, sessionId, agentId, agentConfig, agentName]);

  // Save conversation when session ends or periodically
  useEffect(() => {
    // Save when session disconnects
    if (sessionStatus === 'DISCONNECTED' && sessionStartTimeRef.current) {
      console.log('🔴 Session disconnected');
      saveConversation('disconnect').finally(() => {
        sessionStartTimeRef.current = null;
        lastSavedCountRef.current = 0;
        activeSessionMetaRef.current = null;
      });
      return;
    }

    // Auto-save periodically during active session (every 30 seconds or 10 new messages)
    if (sessionStatus === 'CONNECTED') {
      const messages = transcriptItems.filter(
        item => item.type === 'MESSAGE' && !item.isHidden
      );
      
      const newMessageCount = messages.length - lastSavedCountRef.current;
      
      // Save if 10 or more new messages
      if (newMessageCount >= 10) {
        saveConversation('periodic');
        return;
      }
      
      // Otherwise save after 30 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (newMessageCount > 0) {
          saveConversation('periodic');
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [transcriptItems, sessionStatus, saveConversation]);

  // Persist one final time when leaving the chat page without explicitly disconnecting.
  useEffect(() => {
    return () => {
      if (sessionStartTimeRef.current) {
        void saveConversation('unmount');
        sessionStartTimeRef.current = null;
        lastSavedCountRef.current = 0;
        activeSessionMetaRef.current = null;
      }
    };
  }, [saveConversation]);

  return null;
}
