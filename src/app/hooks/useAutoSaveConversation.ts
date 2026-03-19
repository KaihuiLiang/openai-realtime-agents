import { useEffect, useRef } from 'react';
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

  // Track session start time
  useEffect(() => {
    if (sessionStatus === 'CONNECTED' && !sessionStartTimeRef.current) {
      sessionStartTimeRef.current = Date.now();
      lastSavedCountRef.current = 0;
      console.log('🟢 Session started - Auto-save enabled');
    }
  }, [sessionStatus]);

  // Save conversation when session ends or periodically
  useEffect(() => {
    const saveConversation = async () => {
      console.log('💾 Attempting to save conversation...', {
        sessionId,
        agentConfig,
        agentName,
        messageCount: transcriptItems.filter(item => item.type === 'MESSAGE' && !item.isHidden).length
      });
      
      if (!sessionId || !agentConfig || !agentName) {
        console.warn('⚠️ Cannot save: missing required fields', { sessionId, agentConfig, agentName });
        return;
      }
      
      // Filter out breadcrumbs and hidden messages
      const messages = transcriptItems.filter(
        item => item.type === 'MESSAGE' && !item.isHidden
      );
      
      if (messages.length === 0) {
        console.log('ℹ️ No messages to save');
        return;
      }
      
      console.log(`📝 Saving ${messages.length} messages...`);
      
      // Calculate metrics
      const duration = sessionStartTimeRef.current 
        ? (Date.now() - sessionStartTimeRef.current) / 1000 
        : 0;
      
      const turnCount = messages.length;
      
      // Format transcript for backend
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
          body: JSON.stringify({
            session_id: sessionId,
            agent_id: agentId,
            agent_config: agentConfig,
            agent_name: agentName,
            transcript,
            duration,
            turn_count: turnCount,
            extra_metadata: {
              saved_at: new Date().toISOString(),
              auto_saved: true,
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
    };

    // Save when session disconnects
    if (sessionStatus === 'DISCONNECTED' && sessionStartTimeRef.current) {
      console.log('🔴 Session disconnected');
      saveConversation().finally(() => {
        sessionStartTimeRef.current = null;
        lastSavedCountRef.current = 0;
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
        saveConversation();
        return;
      }
      
      // Otherwise save after 30 seconds of inactivity
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      saveTimeoutRef.current = setTimeout(() => {
        if (newMessageCount > 0) {
          saveConversation();
        }
      }, 30000); // 30 seconds
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [transcriptItems, sessionStatus, sessionId, agentId, agentConfig, agentName]);

  return null;
}
