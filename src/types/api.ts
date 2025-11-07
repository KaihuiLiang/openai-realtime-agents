/**
 * API Types - Friendly exports from auto-generated OpenAPI types
 * 
 * This file re-exports types from api.generated.ts with more convenient names.
 * 
 * To regenerate types from backend:
 *   npm run generate:types
 * 
 * The generated file (api.generated.ts) should not be edited manually.
 */

import type { components } from './api.generated';

// ============================================================================
// Schema Types (from components.schemas)
// ============================================================================

export type Assignment = components['schemas']['Assignment'];
export type AssignmentCreate = components['schemas']['AssignmentCreate'];
export type AssignmentUpdate = components['schemas']['AssignmentUpdate'];

// ConversationLog with proper transcript type (backend uses Dict[str, Any])
export type ConversationLog = Omit<components['schemas']['ConversationLog'], 'transcript'> & {
  transcript: {
    messages?: Array<{
      role: string;
      content: string;
      timestamp?: string;
    }>;
    [key: string]: any;
  };
};
export type ConversationLogCreate = Omit<components['schemas']['ConversationLogCreate'], 'transcript'> & {
  transcript: Record<string, any>;
};

export type Agent = components['schemas']['Agent'];
export type AgentCreate = components['schemas']['AgentCreate'];
export type AgentUpdate = components['schemas']['AgentUpdate'];

export type MessageResponse = components['schemas']['MessageResponse'];

export type Participant = components['schemas']['Participant'];
export type ParticipantCreate = components['schemas']['ParticipantCreate'];
export type ParticipantUpdate = components['schemas']['ParticipantUpdate'];
export type ParticipantWithAssignments = components['schemas']['ParticipantWithAssignments'];


// ============================================================================
// Convenient Aliases
// ============================================================================

// Legacy aliases for backwards compatibility (deprecated, use Agent types directly)
export type ExperimentPrompt = Agent;
export type ExperimentPromptCreate = AgentCreate;
export type ExperimentPromptUpdate = AgentUpdate;

export type Conversation = ConversationLog;
export type ConversationCreate = ConversationLogCreate;

// ============================================================================
// Common Helper Types
// ============================================================================

export interface APIError {
  detail: string;
}

// ============================================================================
// Re-export generated types for advanced usage
// ============================================================================

export type { paths, components, operations } from './api.generated';
