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
    
    # Relationship
    experiment = relationship("ExperimentPrompt", back_populates="conversations")
