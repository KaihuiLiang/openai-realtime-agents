"use client";
import React, { useEffect, useRef, useState } from "react";

import { v4 as uuidv4 } from "uuid";

import Image from "next/image";

// UI components
import Transcript from "./components/Transcript";
import Events from "./components/Events";
import BottomToolbar from "./components/BottomToolbar";

// Types
import { SessionStatus } from "@/app/types";
import type { Agent } from "@/types/api";
import type { RealtimeAgent } from '@openai/agents/realtime';

// Context providers & hooks
import { useTranscript } from "@/app/contexts/TranscriptContext";
import { useEvent } from "@/app/contexts/EventContext";
import { useRealtimeSession } from "./hooks/useRealtimeSession";
import { createModerationGuardrail } from "@/app/agentConfigs/guardrails";
import { chatSupervisorScenario, defaultAgentName, defaultVoice, chatAgent } from "@/app/agentConfigs/chatSupervisor";

// Only using chatSupervisor config

import useAudioDownload from "./hooks/useAudioDownload";
import { useHandleSessionHistory } from "./hooks/useHandleSessionHistory";
import { useAutoSaveConversation } from "./hooks/useAutoSaveConversation";

// Voice mode
import VoiceModeSimple from './components/VoiceModeSimple';

type AgentSidebarMode = 'edit' | 'add';

function App() {
  // Removed: searchParams (no longer needed)

  // Codec is fixed; all codec selection logic removed.

  // Agents SDK doesn't currently support codec selection so it is now forced 
  // via global codecPatch at module load 

  const {
    transcriptItems,
    addTranscriptMessage,
    addTranscriptBreadcrumb,
  } = useTranscript();
  const { logClientEvent, logServerEvent } = useEvent();

  const [selectedAgentName, setSelectedAgentName] = useState<string>(chatSupervisorScenario[0]?.name || "");
  const [selectedAgentConfigSet, setSelectedAgentConfigSet] = useState<RealtimeAgent[] | null>(chatSupervisorScenario);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedBackendAgentId, setSelectedBackendAgentId] = useState<string | null>(null);
  const [promptDraft, setPromptDraft] = useState<string>("");
  const [temperatureDraft, setTemperatureDraft] = useState<string>("0.8");
  const [addDisplayNameDraft, setAddDisplayNameDraft] = useState<string>("");
  const [addPromptDraft, setAddPromptDraft] = useState<string>("");
  const [addTemperatureDraft, setAddTemperatureDraft] = useState<string>("0.8");
  const [sidebarMode, setSidebarMode] = useState<AgentSidebarMode>('edit');
  const [isSavingPrompt, setIsSavingPrompt] = useState<boolean>(false);
  const [isCreatingAgent, setIsCreatingAgent] = useState<boolean>(false);
  const [isSwitchingAgent, setIsSwitchingAgent] = useState<boolean>(false);
  const [agentUIError, setAgentUIError] = useState<string | null>(null);
  const [isPromptSidebarOpen, setIsPromptSidebarOpen] = useState<boolean>(false);
  const [promptSidebarWidth, setPromptSidebarWidth] = useState<number>(380);
  const isResizingPromptSidebarRef = useRef<boolean>(false);

  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  // Ref to identify whether the latest agent switch came from an automatic handoff
  const handoffTriggeredRef = useRef(false);

  const sdkAudioElement = React.useMemo(() => {
    if (typeof window === 'undefined') return undefined;
    const el = document.createElement('audio');
    el.autoplay = true;
    el.style.display = 'none';
    document.body.appendChild(el);
    return el;
  }, []);

  // Voice mode states
  const [voiceModeActive, setVoiceModeActive] = useState(false);

  const [isAISpeaking, setIsAISpeaking] = useState(false);

  const clampPromptSidebarWidth = (width: number) => {
    if (typeof window === 'undefined') return width;
    const minWidth = 280;
    const maxWidth = Math.floor(window.innerWidth / 2);
    return Math.max(minWidth, Math.min(maxWidth, width));
  };

  const handlePromptSidebarResizeStart = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    isResizingPromptSidebarRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizingPromptSidebarRef.current) return;
      const desiredWidth = window.innerWidth - event.clientX;
      setPromptSidebarWidth(clampPromptSidebarWidth(desiredWidth));
    };

    const handleMouseUp = () => {
      if (!isResizingPromptSidebarRef.current) return;
      isResizingPromptSidebarRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    const handleWindowResize = () => {
      setPromptSidebarWidth((prev) => clampPromptSidebarWidth(prev));
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleWindowResize);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);


  // Attach SDK audio element once it exists (after first render in browser)
  useEffect(() => {
    if (sdkAudioElement && !audioElementRef.current) {
      audioElementRef.current = sdkAudioElement;
    }
  }, [sdkAudioElement]);

  const {
    connect,
    disconnect,
    sendUserText,
    sendEvent,
    interrupt,
    mute,
  } = useRealtimeSession({
    onConnectionChange: (s) => setSessionStatus(s as SessionStatus),
    onAgentHandoff: (agentName: string) => {
      handoffTriggeredRef.current = true;
      setSelectedAgentName(agentName);
    },
    onAISpeakingChange: (isSpeaking: boolean) => {
      console.log('🎤 onAISpeakingChange called:', isSpeaking);
      setIsAISpeaking(isSpeaking);
    },
  });

  const [sessionStatus, setSessionStatus] =
    useState<SessionStatus>("DISCONNECTED");

  const [sessionId] = useState<string>(() => uuidv4()); // Generate unique session ID
  const [isEventsPaneExpanded, setIsEventsPaneExpanded] =
    useState<boolean>(true);
  const [userText, setUserText] = useState<string>("");
  const [isPTTActive, setIsPTTActive] = useState<boolean>(false);

  const [isAudioPlaybackEnabled, setIsAudioPlaybackEnabled] = useState<boolean>(
    () => {
      if (typeof window === 'undefined') return true;
      const stored = localStorage.getItem('audioPlaybackEnabled');
      return stored ? stored === 'true' : true;
    },
  );

  // Initialize the recording hook.
  const { startRecording, stopRecording, downloadRecording } =
    useAudioDownload();

  const sendClientEvent = (eventObj: any, eventNameSuffix = "") => {
    try {
      sendEvent(eventObj);
      logClientEvent(eventObj, eventNameSuffix);
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }
  };

  useHandleSessionHistory();

  // Auto-save conversation to backend database
  useAutoSaveConversation({
    transcriptItems,
    sessionStatus,
    agentConfig: "chatSupervisor",
    agentName: selectedAgentName || null, // Convert empty string to null
    sessionId,
    experimentId: null, // TODO: Link to experiment when implementing experiment selection
  });

  // Debug logging for agent name
  useEffect(() => {
    console.log('🏷️ Agent name changed:', selectedAgentName);
  }, [selectedAgentName]);

  const createRealtimeAgentFromBackendAgent = (agentData: Agent): RealtimeAgent => {
    return new (chatAgent.constructor as any)({
      name: agentData.agent_name,
      voice: agentData.voice || defaultVoice,
      instructions: agentData.system_prompt,
    });
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const buildAgentNameFromDisplayName = (displayName: string) => {
    const normalizedBase = displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    const suffix = Date.now().toString().slice(-6);
    return `${normalizedBase || 'chat_agent'}_${suffix}`;
  };

  const reconnectWithCurrentSelection = async (agentOverride?: Agent) => {
    const shouldReconnect = sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING";
    if (!shouldReconnect) return;

    disconnect();
    setSessionStatus("DISCONNECTED");
    await sleep(80);

    // If we have an updated backend agent (e.g. prompt changed), ensure SDK uses it.
    if (agentOverride) {
      const updatedRealtimeAgent = createRealtimeAgentFromBackendAgent(agentOverride);
      setSelectedAgentName(updatedRealtimeAgent.name);
      setSelectedAgentConfigSet([updatedRealtimeAgent]);
    }

    await connectToRealtime(true);
  };

  const handleAgentSelectionChange = async (agentId: string) => {
    const agentData = availableAgents.find((agent) => agent.id === agentId);
    if (!agentData) return;

    try {
      setAgentUIError(null);
      setIsSwitchingAgent(true);

      const activationResponse = await fetch(`/api/backend/agents/${agentData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: true }),
      });

      if (!activationResponse.ok) {
        const data = await activationResponse.json().catch(() => ({}));
        throw new Error((data as any)?.detail || `Failed to activate agent (HTTP ${activationResponse.status})`);
      }

      const activatedAgent = (await activationResponse.json()) as Agent;
      setAvailableAgents((prev) => prev.map((agent) => {
        if (agent.agent_config !== activatedAgent.agent_config) {
          return agent;
        }

        if (agent.id === activatedAgent.id) {
          return activatedAgent;
        }

        return { ...agent, is_active: false };
      }));

      const backendAgent = createRealtimeAgentFromBackendAgent(activatedAgent);
      setSelectedBackendAgentId(activatedAgent.id);
      setSelectedAgentName(backendAgent.name);
      setSelectedAgentConfigSet([backendAgent]);
      setPromptDraft(activatedAgent.system_prompt || "");
      setTemperatureDraft(String(activatedAgent.temperature ?? 0.8));
      setSidebarMode('edit');
      addTranscriptBreadcrumb(`Agent: ${backendAgent.name}`, {
        source: 'backend',
        agentId: activatedAgent.id,
        systemPrompt: activatedAgent.system_prompt,
      });

      await reconnectWithCurrentSelection(activatedAgent);
    } catch (error) {
      console.error('❌ Failed to switch agent:', error);
      setAgentUIError(error instanceof Error ? error.message : 'Failed to switch agent. Please try again.');
    } finally {
      setIsSwitchingAgent(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!selectedBackendAgentId) {
      setAgentUIError('Current agent is not persisted in backend, prompt cannot be saved.');
      return;
    }

    try {
      setAgentUIError(null);
      setIsSavingPrompt(true);

      const parsedTemperature = Number(temperatureDraft);
      if (Number.isNaN(parsedTemperature)) {
        throw new Error('Temperature must be a valid number.');
      }

      const res = await fetch(`/api/backend/agents/${selectedBackendAgentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: promptDraft, temperature: parsedTemperature }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.detail || `Failed to save prompt (HTTP ${res.status})`);
      }

      const updatedAgent = (await res.json()) as Agent;
      setAvailableAgents((prev) => prev.map((agent) => (
        agent.id === updatedAgent.id ? updatedAgent : agent
      )));

      const updatedRealtimeAgent = createRealtimeAgentFromBackendAgent(updatedAgent);
      setSelectedAgentName(updatedRealtimeAgent.name);
      setSelectedAgentConfigSet([updatedRealtimeAgent]);
      setPromptDraft(updatedAgent.system_prompt || "");
      setTemperatureDraft(String(updatedAgent.temperature ?? 0.8));
      addTranscriptBreadcrumb(`Agent prompt updated: ${updatedAgent.agent_name}`, {
        source: 'backend',
        agentId: updatedAgent.id,
      });

      await reconnectWithCurrentSelection(updatedAgent);
    } catch (error) {
      console.error('❌ Failed to save prompt:', error);
      setAgentUIError(error instanceof Error ? error.message : 'Failed to save prompt.');
    } finally {
      setIsSavingPrompt(false);
    }
  };

  const handleCreateAgent = async () => {
    try {
      setAgentUIError(null);
      setIsCreatingAgent(true);

      const parsedTemperature = Number(addTemperatureDraft);
      if (Number.isNaN(parsedTemperature)) {
        throw new Error('Temperature must be a valid number.');
      }

      const trimmedDisplayName = addDisplayNameDraft.trim();
      if (!trimmedDisplayName) {
        throw new Error('Display name cannot be empty.');
      }

      if (!addPromptDraft.trim()) {
        throw new Error('Prompt cannot be empty.');
      }

      const payload = {
        agent_name: buildAgentNameFromDisplayName(trimmedDisplayName),
        display_name: trimmedDisplayName,
        agent_config: 'chatSupervisor',
        system_prompt: addPromptDraft,
        instructions: '',
        temperature: parsedTemperature,
        is_active: true,
      };

      const res = await fetch('/api/backend/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as any)?.detail || `Failed to create agent (HTTP ${res.status})`);
      }

      const newAgent = (await res.json()) as Agent;
      setAvailableAgents((prev) => [
        newAgent,
        ...prev.map((agent) => (
          agent.agent_config === newAgent.agent_config
            ? { ...agent, is_active: false }
            : agent
        )),
      ]);

      const realtimeAgent = createRealtimeAgentFromBackendAgent(newAgent);
      setSelectedBackendAgentId(newAgent.id);
      setSelectedAgentName(realtimeAgent.name);
      setSelectedAgentConfigSet([realtimeAgent]);
      setPromptDraft(newAgent.system_prompt || '');
      setTemperatureDraft(String(newAgent.temperature ?? 0.8));
      setSidebarMode('edit');
      setAddDisplayNameDraft('');
      setAddPromptDraft('');
      setAddTemperatureDraft('0.8');

      addTranscriptBreadcrumb(`Agent created: ${newAgent.agent_name}`, {
        source: 'backend',
        agentId: newAgent.id,
      });

      await reconnectWithCurrentSelection(newAgent);
    } catch (error) {
      console.error('❌ Failed to create agent:', error);
      setAgentUIError(error instanceof Error ? error.message : 'Failed to create agent.');
    } finally {
      setIsCreatingAgent(false);
    }
  };

  // Load all backend agents for chat page switching/editing controls.
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setAgentUIError(null);
        const response = await fetch('/api/backend/agents', { cache: 'no-store' });

        if (!response.ok) {
          throw new Error(`Failed to load agents (HTTP ${response.status})`);
        }

        const allAgents = await response.json();
        const chatAgents = (Array.isArray(allAgents) ? allAgents : []).filter(
          (agent: Agent) => agent.agent_config === 'chatSupervisor'
        ) as Agent[];

        setAvailableAgents(chatAgents);

        const initialAgent =
          chatAgents.find((agent) => agent.agent_name === defaultAgentName && agent.is_active) ||
          chatAgents.find((agent) => agent.is_active) ||
          chatAgents[0];

        if (initialAgent) {
          const backendAgent = createRealtimeAgentFromBackendAgent(initialAgent);
          setSelectedBackendAgentId(initialAgent.id);
          setSelectedAgentName(backendAgent.name);
          setSelectedAgentConfigSet([backendAgent]);
          setPromptDraft(initialAgent.system_prompt || "");
          setTemperatureDraft(String(initialAgent.temperature ?? 0.8));
          setSidebarMode('edit');
          addTranscriptBreadcrumb(`Agent: ${backendAgent.name}`, {
            source: 'backend',
            agentId: initialAgent.id,
            systemPrompt: initialAgent.system_prompt,
          });
        } else {
          console.log('ℹ️ No backend chatSupervisor agents found, using hardcoded config');
          setSelectedBackendAgentId(null);
          setSelectedAgentName(chatSupervisorScenario[0]?.name || "");
          setSelectedAgentConfigSet(chatSupervisorScenario);
          setPromptDraft("");
          setTemperatureDraft("0.8");
          addTranscriptBreadcrumb(`Agent: ${chatSupervisorScenario[0]?.name}`, { source: 'hardcoded' });
        }
      } catch (error) {
        console.error('❌ Error loading backend agents:', error);
        setAgentUIError('Failed to load backend agents, using hardcoded agent.');
        // Fallback to hardcoded config on error
        setSelectedBackendAgentId(null);
        setSelectedAgentName(chatSupervisorScenario[0]?.name || "");
        setSelectedAgentConfigSet(chatSupervisorScenario);
        setPromptDraft("");
        setTemperatureDraft("0.8");
        addTranscriptBreadcrumb(`Agent: ${chatSupervisorScenario[0]?.name}`, { source: 'hardcoded', reason: 'backend_error', error: String(error) });
      }
    };

    loadAgents();
  }, []);



  useEffect(() => {
    if (
      sessionStatus === "CONNECTED" &&
      selectedAgentConfigSet &&
      selectedAgentName
    ) {
      const currentAgent = selectedAgentConfigSet.find(
        (a) => a.name === selectedAgentName
      );
      addTranscriptBreadcrumb(`Agent: ${selectedAgentName}`, currentAgent);
      updateSession(!handoffTriggeredRef.current);
      // Reset flag after handling so subsequent effects behave normally
      handoffTriggeredRef.current = false;
    }
  }, [selectedAgentConfigSet, selectedAgentName, sessionStatus]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED") {
      updateSession();
    }
  }, [isPTTActive]);

  const fetchEphemeralKey = async (): Promise<string | null> => {
    logClientEvent({ url: "/session" }, "fetch_session_token_request");
    const tokenResponse = await fetch("/api/session");
    const data = await tokenResponse.json();
    logServerEvent(data, "fetch_session_token_response");

    if (!data.client_secret?.value) {
      logClientEvent(data, "error.no_ephemeral_key");
      console.error("No ephemeral key provided by the server");
      setSessionStatus("DISCONNECTED");
      return null;
    }

    return data.client_secret.value;
  };

  const connectToRealtime = async (force = false) => {
    if (!force && sessionStatus !== "DISCONNECTED") return;
    setSessionStatus("CONNECTING");
    try {
      const EPHEMERAL_KEY = await fetchEphemeralKey();
      if (!EPHEMERAL_KEY) return;
      
      // Use the currently selected agent config set (from backend or hardcoded)
      if (!selectedAgentConfigSet || selectedAgentConfigSet.length === 0) {
        console.error('❌ No agent config available');
        setSessionStatus("DISCONNECTED");
        return;
      }
      
      // Ensure the selectedAgentName is first so that it becomes the root
      const reorderedAgents = [...selectedAgentConfigSet];
      const idx = reorderedAgents.findIndex((a) => a.name === selectedAgentName);
      if (idx > 0) {
        const [agent] = reorderedAgents.splice(idx, 1);
        reorderedAgents.unshift(agent);
      }
      const guardrail = createModerationGuardrail(); // General conversational AI moderation
      await connect({
        getEphemeralKey: async () => EPHEMERAL_KEY,
        initialAgents: reorderedAgents,
        audioElement: sdkAudioElement,
        outputGuardrails: [guardrail],
        extraContext: {
          addTranscriptBreadcrumb,
        },
      });
    } catch (err) {
      console.error("Error connecting via SDK:", err);
      setSessionStatus("DISCONNECTED");
    }
  };

  const disconnectFromRealtime = () => {
    disconnect();
    setSessionStatus("DISCONNECTED");
  };

  const sendSimulatedUserMessage = (text: string) => {
    const id = uuidv4().slice(0, 32);
    addTranscriptMessage(id, "user", text, true);

    sendClientEvent({
      type: 'conversation.item.create',
      item: {
        id,
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }],
      },
    });
    sendClientEvent({ type: 'response.create' }, '(simulated user text message)');
  };

  const updateSession = (shouldTriggerResponse: boolean = false) => {
    // Reflect Push-to-Talk UI state by (de)activating server VAD on the
    // backend. The Realtime SDK supports live session updates via the
    // `session.update` event.
    const turnDetection = isPTTActive
      ? null
      : {
          type: 'server_vad',
          threshold: 0.9,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
          create_response: true,
        };

    sendEvent({
      type: 'session.update',
      session: {
        turn_detection: turnDetection,
      },
    });

    // Send an initial 'hi' message to trigger the agent to greet the user
    if (shouldTriggerResponse) {
      sendSimulatedUserMessage('hi');
    }
    return;
  }

  const handleSendTextMessage = () => {
    if (!userText.trim()) return;
    interrupt();

    try {
      sendUserText(userText.trim());
    } catch (err) {
      console.error('Failed to send via SDK', err);
    }

    setUserText("");
  };



  const onToggleConnection = () => {
    if (sessionStatus === "CONNECTED" || sessionStatus === "CONNECTING") {
      disconnectFromRealtime();
      setSessionStatus("DISCONNECTED");
    } else {
      connectToRealtime();
    }
  // Reconnect behavior is handled explicitly when switching agent/prompt.
  };

  // Because we need a new connection, refresh the page when codec changes
  // Codec is fixed; handleCodecChange removed.

  useEffect(() => {
    const storedPushToTalkUI = localStorage.getItem("pushToTalkUI");
    if (storedPushToTalkUI) {
      setIsPTTActive(storedPushToTalkUI === "true");
    }
    const storedLogsExpanded = localStorage.getItem("logsExpanded");
    if (storedLogsExpanded) {
      setIsEventsPaneExpanded(storedLogsExpanded === "true");
    }
    const storedAudioPlaybackEnabled = localStorage.getItem(
      "audioPlaybackEnabled"
    );
    if (storedAudioPlaybackEnabled) {
      setIsAudioPlaybackEnabled(storedAudioPlaybackEnabled === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pushToTalkUI", isPTTActive.toString());
  }, [isPTTActive]);

  useEffect(() => {
    localStorage.setItem("logsExpanded", isEventsPaneExpanded.toString());
  }, [isEventsPaneExpanded]);

  useEffect(() => {
    localStorage.setItem(
      "audioPlaybackEnabled",
      isAudioPlaybackEnabled.toString()
    );
  }, [isAudioPlaybackEnabled]);

  useEffect(() => {
    if (audioElementRef.current) {
      if (isAudioPlaybackEnabled) {
        audioElementRef.current.muted = false;
        audioElementRef.current.play().catch((err) => {
          console.warn("Autoplay may be blocked by browser:", err);
        });
      } else {
        // Mute and pause to avoid brief audio blips before pause takes effect.
        audioElementRef.current.muted = true;
        audioElementRef.current.pause();
      }
    }

    // Toggle server-side audio stream mute so bandwidth is saved when the
    // user disables playback. 
    try {
      mute(!isAudioPlaybackEnabled);
    } catch (err) {
      console.warn('Failed to toggle SDK mute', err);
    }
  }, [isAudioPlaybackEnabled]);

  // Ensure mute state is propagated to transport right after we connect or
  // whenever the SDK client reference becomes available.
  useEffect(() => {
    if (sessionStatus === 'CONNECTED') {
      try {
        mute(!isAudioPlaybackEnabled);
      } catch (err) {
        console.warn('mute sync after connect failed', err);
      }
    }
  }, [sessionStatus, isAudioPlaybackEnabled]);

  useEffect(() => {
    if (sessionStatus === "CONNECTED" && audioElementRef.current?.srcObject) {
      // The remote audio stream from the audio element.
      const remoteStream = audioElementRef.current.srcObject as MediaStream;
      startRecording(remoteStream);
    }

    // Clean up on unmount or when sessionStatus is updated.
    return () => {
      stopRecording();
    };
  }, [sessionStatus]);

  // No scenario switching, always use chatSupervisor

  return (
    <div className="text-base flex flex-col h-screen bg-gray-100 text-gray-800 relative">
      <div className="p-5 text-lg font-semibold flex justify-between items-center">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => window.location.reload()}
        >
          <div>
            <Image
              src="/openai-logomark.svg"
              alt="OpenAI Logo"
              width={20}
              height={20}
              className="mr-2"
            />
          </div>
          <div>
            Realtime API <span className="text-gray-500">Agents</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label htmlFor="agent-selector" className="text-sm font-medium text-slate-600">
            Active Agent
          </label>
          <select
            id="agent-selector"
            value={selectedBackendAgentId || ""}
            disabled={availableAgents.length === 0 || isSwitchingAgent || isSavingPrompt}
            onChange={(e) => handleAgentSelectionChange(e.target.value)}
            className="w-[260px] rounded-md border border-slate-300 px-3 py-2 text-sm bg-white disabled:bg-slate-100 disabled:text-slate-400"
          >
            {availableAgents.length === 0 && <option value="">Hardcoded chat agent</option>}
            {availableAgents.map((agent) => (
              <option key={agent.id} value={agent.id}>
                {agent.display_name} ({agent.agent_name})
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setSidebarMode('edit');
              setIsPromptSidebarOpen((prev) => !prev);
            }}
            disabled={isSwitchingAgent || isCreatingAgent}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {isPromptSidebarOpen ? 'Close' : 'Edit'}
          </button>
          <button
            onClick={() => {
              setSidebarMode('add');
              setIsPromptSidebarOpen(true);
            }}
            disabled={isSavingPrompt || isSwitchingAgent || isCreatingAgent}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-base leading-none text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            title="Add agent"
          >
            +
          </button>
        </div>
      </div>

      {agentUIError && (
        <div className="px-5 pb-2 text-sm text-red-600">
          {agentUIError}
        </div>
      )}

      <div className="flex flex-1 gap-2 px-2 pb-24 overflow-hidden relative">
        <Transcript
          userText={userText}
          setUserText={setUserText}
          onSendMessage={handleSendTextMessage}
          downloadRecording={downloadRecording}
          canSend={
            sessionStatus === "CONNECTED"
          }
        />

        <Events isExpanded={isEventsPaneExpanded} />

        {isPromptSidebarOpen && (
          <aside
            style={{ width: `${promptSidebarWidth}px`, maxWidth: '50vw' }}
            className="relative shrink-0 min-w-[280px] bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden"
          >
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize prompt sidebar"
              onMouseDown={handlePromptSidebarResizeStart}
              className="absolute left-0 top-0 h-full w-2 cursor-col-resize bg-transparent hover:bg-slate-200/80"
            />
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="text-sm font-semibold text-slate-700">
                {sidebarMode === 'add' ? 'Add Agent' : 'Edit Agent'}
              </div>
              <button
                onClick={() => setIsPromptSidebarOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            <div className="p-4 flex-1 overflow-hidden flex flex-col gap-3">
              {sidebarMode === 'add' && (
                <>
                  <label htmlFor="agent-display-name" className="text-xs font-semibold text-slate-600">
                    Display Name
                  </label>
                  <input
                    id="agent-display-name"
                    type="text"
                    value={addDisplayNameDraft}
                    onChange={(e) => setAddDisplayNameDraft(e.target.value)}
                    disabled={isSwitchingAgent || isSavingPrompt || isCreatingAgent}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Customer Support Coach"
                  />
                </>
              )}

              <label htmlFor="agent-prompt" className="text-xs font-semibold text-slate-600">
                System Prompt
              </label>
              <textarea
                id="agent-prompt"
                value={sidebarMode === 'add' ? addPromptDraft : promptDraft}
                onChange={(e) => {
                  if (sidebarMode === 'add') {
                    setAddPromptDraft(e.target.value);
                  } else {
                    setPromptDraft(e.target.value);
                  }
                }}
                disabled={isSwitchingAgent || isSavingPrompt || isCreatingAgent || (sidebarMode === 'edit' && !selectedBackendAgentId)}
                className="w-full flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-mono resize-none disabled:bg-slate-100 disabled:text-slate-400"
              />

              <label htmlFor="agent-temperature" className="text-xs font-semibold text-slate-600">
                Temperature
              </label>
              <input
                id="agent-temperature"
                type="number"
                step="0.1"
                min="0"
                max="2"
                value={sidebarMode === 'add' ? addTemperatureDraft : temperatureDraft}
                onChange={(e) => {
                  if (sidebarMode === 'add') {
                    setAddTemperatureDraft(e.target.value);
                  } else {
                    setTemperatureDraft(e.target.value);
                  }
                }}
                disabled={isSwitchingAgent || isSavingPrompt || isCreatingAgent || (sidebarMode === 'edit' && !selectedBackendAgentId)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
              />

              <button
                onClick={sidebarMode === 'add' ? handleCreateAgent : handleSavePrompt}
                disabled={
                  isSwitchingAgent ||
                  isSavingPrompt ||
                  isCreatingAgent ||
                  (sidebarMode === 'edit' && !selectedBackendAgentId)
                }
                className="w-full h-10 rounded-md bg-black px-4 text-sm text-white disabled:bg-slate-300"
              >
                {sidebarMode === 'add'
                  ? (isCreatingAgent ? 'Creating...' : 'Create Agent')
                  : (isSavingPrompt ? 'Saving...' : 'Save Changes')}
              </button>

              {sidebarMode === 'add' || selectedBackendAgentId ? null : (
                <div className="text-xs text-slate-500">
                  Prompt editing is available for backend agents only.
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      <VoiceModeSimple
        isActive={voiceModeActive}
        onClose={() => setVoiceModeActive(false)}
        isSpeaking={isAISpeaking}
        isConnected={sessionStatus === "CONNECTED"}
      />

      {/* Always show toolbar at bottom, even in Voice Mode */}
      <div className="fixed left-0 right-0 bottom-0 z-[100] bg-white/80 backdrop-blur border-t border-slate-200">
        <BottomToolbar
          sessionStatus={sessionStatus}
          onToggleConnection={onToggleConnection}
          isEventsPaneExpanded={isEventsPaneExpanded}
          setIsEventsPaneExpanded={setIsEventsPaneExpanded}
          voiceModeActive={voiceModeActive}
          setVoiceModeActive={setVoiceModeActive}
        />
      </div>
    </div>
  );
}

export default App;
