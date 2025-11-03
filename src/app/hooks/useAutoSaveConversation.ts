import { useEffect, useRef } from 'react';
import { TranscriptItem } from '@/app/types';

interface SaveConversationParams {
  transcriptItems: TranscriptItem[];
  sessionStatus: string;
  agentConfig: string | null;
  agentName: string | null;
  sessionId: string | null;
  experimentId?: string | null;
}

// Use Next.js API proxy in production, direct connection in development
const BACKEND_URL = typeof window !== 'undefined' && window.location.hostname !== 'localhost'
  ? '' // Use relative path for proxy in production
  : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000');

const API_BASE = BACKEND_URL ? `${BACKEND_URL}/api` : '/api/backend';

export function useAutoSaveConversation({
  transcriptItems,
  sessionStatus,
  agentConfig,
  agentName,
  sessionId,
  experimentId,
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
    
    if (sessionStatus === 'DISCONNECTED') {
      console.log('🔴 Session disconnected');
      sessionStartTimeRef.current = null;
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
            experiment_id: experimentId,
            session_id: sessionId,
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
      saveConversation();
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
  }, [transcriptItems, sessionStatus, sessionId, agentConfig, agentName, experimentId]);

  return null;
}
