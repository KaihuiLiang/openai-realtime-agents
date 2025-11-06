from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List

import sys
sys.path.append('..')
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.ConversationLog])
async def get_conversations(
    experiment_id: Optional[str] = Query(None),
    agent_config: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Get conversation logs with optional filters"""
    query = db.query(models.ConversationLog)
    
    if experiment_id:
        query = query.filter(models.ConversationLog.experiment_id == experiment_id)
    if agent_config:
        query = query.filter(models.ConversationLog.agent_config == agent_config)
    
    conversations = query.order_by(
        models.ConversationLog.created_at.desc()
    ).limit(limit).all()
    
    return conversations

@router.get("/{conversation_id}", response_model=schemas.ConversationLog)
async def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Get a single conversation log by ID"""
    conversation = db.query(models.ConversationLog).filter(
        models.ConversationLog.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation

@router.post("/", response_model=schemas.ConversationLog, status_code=201)
async def create_conversation(
    conversation_data: schemas.ConversationLogCreate,
    db: Session = Depends(get_db)
):
    """Create a new conversation log"""
    
    conversation = models.ConversationLog(**conversation_data.model_dump())
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Update experiment statistics if linked
    if conversation.experiment_id:
        experiment = db.query(models.ExperimentPrompt).filter(
            models.ExperimentPrompt.id == conversation.experiment_id
        ).first()
        
        if experiment:
            # Update total runs
            experiment.total_runs += 1
            
            # Calculate average duration
            avg_duration = db.query(
                func.avg(models.ConversationLog.duration)
            ).filter(
                models.ConversationLog.experiment_id == conversation.experiment_id
            ).scalar()
            
            if avg_duration:
                experiment.avg_duration = float(avg_duration)
            
            # Calculate success rate (based on task_completed)
            total = db.query(models.ConversationLog).filter(
                models.ConversationLog.experiment_id == conversation.experiment_id,
                models.ConversationLog.task_completed.isnot(None)
            ).count()
            
            if total > 0:
                completed = db.query(models.ConversationLog).filter(
                    models.ConversationLog.experiment_id == conversation.experiment_id,
                    models.ConversationLog.task_completed == True
                ).count()
                experiment.success_rate = (completed / total) * 100
            
            db.commit()
    
    return conversation

@router.delete("/{conversation_id}", response_model=schemas.MessageResponse)
async def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """Delete a conversation log"""
    conversation = db.query(models.ConversationLog).filter(
        models.ConversationLog.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {"message": "Conversation deleted successfully", "success": True}
