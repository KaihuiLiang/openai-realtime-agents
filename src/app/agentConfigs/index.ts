import { chatSupervisorScenario } from './chatSupervisor';

import type { RealtimeAgent } from '@openai/agents/realtime';

// Currently using only chatAgent in chatSupervisor scenario
// The supervisorAgent.ts file is preserved for future use if needed
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  chatSupervisor: chatSupervisorScenario,
};

export const defaultAgentSetKey = 'chatSupervisor';
