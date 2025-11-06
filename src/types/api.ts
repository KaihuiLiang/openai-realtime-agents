/**
 * API Type Definitions
 * 
 * These types mirror the Pydantic schemas from backend/schemas.py
 * to ensure type safety across frontend and backend.
 * 
 * When backend schemas change, update these types accordingly.
 */

// ============================================================================
// Common Types
// ============================================================================

export interface Message {
  role: string;
  content: string;
  timestamp: string;
}

export interface Transcript {
  messages: Message[];
}

// ============================================================================
// ExperimentPrompt (Agent) Schemas
// ============================================================================

export interface ExperimentPrompt {
  id: string;
  name: string;
  agent_config: string;
  agent_name: string;
  system_prompt: string;
  instructions: string | null;
  temperature: number;
  max_tokens: number | null;
  voice: string | null;
  description: string | null;
  tags: string[];
  is_active: boolean;
  success_rate: number | null;
  avg_duration: number | null;
  total_runs: number;
  created_at: string;
  updated_at: string | null;
}

export interface ExperimentPromptCreate {
  name: string;
  agent_config: string;
  agent_name: string;
  system_prompt: string;
  instructions?: string | null;
  temperature?: number;
  max_tokens?: number | null;
  voice?: string | null;
  description?: string | null;
  tags?: string[];
  is_active?: boolean;
}

export interface ExperimentPromptUpdate {
  name?: string;
  system_prompt?: string;
  instructions?: string | null;
  temperature?: number;
  max_tokens?: number | null;
  voice?: string | null;
  description?: string | null;
  tags?: string[];
  is_active?: boolean;
  success_rate?: number | null;
  avg_duration?: number | null;
}

// Alias for backward compatibility
export type Agent = ExperimentPrompt;
export type AgentCreate = ExperimentPromptCreate;
export type AgentUpdate = ExperimentPromptUpdate;

// ============================================================================
// ConversationLog Schemas
// ============================================================================

export interface ConversationLog {
  id: string;
  session_id: string;
  agent_config: string;
  agent_name: string;
  transcript: Record<string, any>;  // More flexible - backend uses Dict[str, Any]
  duration: number;
  turn_count: number;
  experiment_id: string | null;
  participant_id: string | null;
  user_satisfaction: number | null;
  task_completed: boolean | null;
  extra_metadata: Record<string, any> | null;
  created_at: string;
}

export interface ConversationLogCreate {
  session_id: string;
  agent_config: string;
  agent_name: string;
  transcript: Record<string, any>;  // More flexible - backend uses Dict[str, Any]
  duration: number;
  turn_count: number;
  experiment_id?: string | null;
  participant_id?: string | null;
  user_satisfaction?: number | null;
  task_completed?: boolean | null;
  extra_metadata?: Record<string, any> | null;
}

// Alias for backward compatibility
export type Conversation = ConversationLog;
export type ConversationCreate = ConversationLogCreate;

// ============================================================================
// Participant Schemas
// ============================================================================

export interface Participant {
  id: string;
  participant_id: string;
  name: string | null;
  email: string | null;
  is_guest: boolean;
  extra_metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string | null;
}

export interface ParticipantCreate {
  participant_id: string;
  name?: string | null;
  email?: string | null;
  is_guest?: boolean;
  extra_metadata?: Record<string, any> | null;
}

export interface ParticipantUpdate {
  name?: string | null;
  email?: string | null;
  extra_metadata?: Record<string, any> | null;
}

export interface ParticipantWithAssignments extends Participant {
  assignments: Assignment[];
}

// ============================================================================
// ParticipantAgentAssignment Schemas
// ============================================================================

export interface Assignment {
  id: string;
  participant_id: string;
  experiment_prompt_id: string;
  agent_config: string;
  agent_name: string;
  is_active: boolean;
  completed: boolean;
  order: number;
  notes: string | null;
  created_at: string;
}

export interface AssignmentCreate {
  participant_id: string;
  experiment_prompt_id: string;
  agent_config: string;
  agent_name: string;
  is_active?: boolean;
  completed?: boolean;
  order?: number;
  notes?: string | null;
}

export interface AssignmentUpdate {
  is_active?: boolean;
  completed?: boolean;
  order?: number;
  notes?: string | null;
}

// ============================================================================
// User (Experimenter) Schemas
// ============================================================================

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface UserCreate {
  username: string;
  email: string;
  password: string;
  role?: string;
}

export interface UserUpdate {
  email?: string;
  role?: string;
  is_active?: boolean;
}

// ============================================================================
// Response Models
// ============================================================================

export interface MessageResponse {
  message: string;
  success: boolean;
}

// ============================================================================
// API Error Response
// ============================================================================

export interface APIError {
  detail: string;
}
