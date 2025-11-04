from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ExperimentPrompt schemas
class ExperimentPromptBase(BaseModel):
    name: str
    agent_config: str
    agent_name: str
    system_prompt: str
    instructions: Optional[str] = None
    temperature: Optional[float] = 0.8
    max_tokens: Optional[int] = None
    voice: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    is_active: bool = False

class ExperimentPromptCreate(ExperimentPromptBase):
    pass

class ExperimentPromptUpdate(BaseModel):
    name: Optional[str] = None
    system_prompt: Optional[str] = None
    instructions: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    voice: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    is_active: Optional[bool] = None
    success_rate: Optional[float] = None
    avg_duration: Optional[float] = None

class ExperimentPrompt(ExperimentPromptBase):
    id: str
    success_rate: Optional[float] = None
    avg_duration: Optional[float] = None
    total_runs: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ConversationLog schemas
class ConversationLogBase(BaseModel):
    session_id: str
    agent_config: str
    agent_name: str
    transcript: Dict[str, Any]
    duration: float
    turn_count: int
    experiment_id: Optional[str] = None
    participant_id: Optional[str] = None
    user_satisfaction: Optional[int] = Field(None, ge=1, le=5)
    task_completed: Optional[bool] = None
    extra_metadata: Optional[Dict[str, Any]] = None

class ConversationLogCreate(ConversationLogBase):
    pass

class ConversationLog(ConversationLogBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Response models
class PromptsResponse(BaseModel):
    prompts: List[ExperimentPrompt]

class PromptResponse(BaseModel):
    prompt: ExperimentPrompt

class ConversationsResponse(BaseModel):
    conversations: List[ConversationLog]

class ConversationResponse(BaseModel):
    conversation: ConversationLog

class MessageResponse(BaseModel):
    message: str
    success: bool = True

# --- Participant schemas ---
class ParticipantBase(BaseModel):
    participant_id: str
    name: Optional[str] = None
    email: Optional[str] = None
    is_guest: bool = False
    extra_metadata: Optional[Dict[str, Any]] = None

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    extra_metadata: Optional[Dict[str, Any]] = None

class Participant(ParticipantBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- ParticipantAgentAssignment schemas ---
class AssignmentBase(BaseModel):
    participant_id: str
    experiment_prompt_id: str
    agent_config: str
    agent_name: str
    is_active: bool = True
    completed: bool = False
    order: int = 0
    notes: Optional[str] = None

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    is_active: Optional[bool] = None
    completed: Optional[bool] = None
    order: Optional[int] = None
    notes: Optional[str] = None

class Assignment(AssignmentBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- User schemas (experimenters) ---
class UserBase(BaseModel):
    username: str
    email: str
    role: str = "experimenter"

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Response models for new entities ---
class ParticipantsResponse(BaseModel):
    participants: List[Participant]

class ParticipantResponse(BaseModel):
    participant: Participant

class AssignmentsResponse(BaseModel):
    assignments: List[Assignment]

class AssignmentResponse(BaseModel):
    assignment: Assignment

class UsersResponse(BaseModel):
    users: List[User]

class UserResponse(BaseModel):
    user: User

class ParticipantWithAssignments(Participant):
    assignments: List[Assignment] = []

class ParticipantDetailResponse(BaseModel):
    participant: ParticipantWithAssignments

# --- Agent response models (alias for ExperimentPrompt with agent-centric naming) ---
class AgentsResponse(BaseModel):
    agents: List[ExperimentPrompt]

class AgentResponse(BaseModel):
    agent: ExperimentPrompt
