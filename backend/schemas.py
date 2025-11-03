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
