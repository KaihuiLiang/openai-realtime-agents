from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, Text, ARRAY, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class ExperimentPrompt(Base):
    __tablename__ = "experiment_prompts"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, index=True)
    agent_config = Column(String, nullable=False, index=True)
    agent_name = Column(String, nullable=False, index=True)
    
    # Prompt content
    system_prompt = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    
    # Experiment parameters
    temperature = Column(Float, default=0.8)
    max_tokens = Column(Integer, nullable=True)
    voice = Column(String, nullable=True)
    
    # Metadata
    description = Column(Text, nullable=True)
    tags = Column(ARRAY(String), default=list)
    is_active = Column(Boolean, default=False, index=True)
    
    # Experiment results tracking
    success_rate = Column(Float, nullable=True)
    avg_duration = Column(Float, nullable=True)
    total_runs = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    conversations = relationship("ConversationLog", back_populates="experiment")

class ConversationLog(Base):
    __tablename__ = "conversation_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    experiment_id = Column(String, ForeignKey("experiment_prompts.id", ondelete="SET NULL"), nullable=True, index=True)
    participant_id = Column(String, ForeignKey("participants.id", ondelete="SET NULL"), nullable=True, index=True)  # NEW: Link to participant
    
    session_id = Column(String, nullable=False, index=True)
    agent_config = Column(String, nullable=False, index=True)
    agent_name = Column(String, nullable=False)
    
    # Conversation data
    transcript = Column(JSON, nullable=False)
    duration = Column(Float, nullable=False)
    turn_count = Column(Integer, nullable=False)
    
    # Evaluation metrics
    user_satisfaction = Column(Integer, nullable=True)
    task_completed = Column(Boolean, nullable=True)
    
    extra_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    experiment = relationship("ExperimentPrompt", back_populates="conversations")
    participant = relationship("Participant")  # NEW

class Participant(Base):
    __tablename__ = "participants"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    participant_id = Column(String, unique=True, nullable=False, index=True)  # User-facing ID
    
    # Participant info
    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    
    # Participant type
    is_guest = Column(Boolean, default=False, index=True)
    
    # Metadata
    extra_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    assignments = relationship("ParticipantAgentAssignment", back_populates="participant", cascade="all, delete-orphan")

class ParticipantAgentAssignment(Base):
    __tablename__ = "participant_agent_assignments"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    participant_id = Column(String, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    experiment_prompt_id = Column(String, ForeignKey("experiment_prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Assignment config
    agent_config = Column(String, nullable=False)  # e.g., "customerServiceRetail"
    agent_name = Column(String, nullable=False)    # e.g., "Sales Agent"
    
    # Assignment status
    is_active = Column(Boolean, default=True, index=True)
    completed = Column(Boolean, default=False)
    
    # Order for multiple assignments
    order = Column(Integer, default=0)
    
    # Metadata
    notes = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    participant = relationship("Participant", back_populates="assignments")
    experiment_prompt = relationship("ExperimentPrompt")

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    
    # Authentication (passwords must be hashed before storing; see UserCreate endpoint for hashing implementation)
    password_hash = Column(String, nullable=False)
    
    # User role
    role = Column(String, nullable=False, default="experimenter", index=True)  # "experimenter" or "admin"
    
    # Status
    is_active = Column(Boolean, default=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
