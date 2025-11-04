from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

import sys
sys.path.append('..')
from database import get_db
import models
import schemas as schemas

router = APIRouter()

@router.get("/", response_model=schemas.ParticipantsResponse)
async def get_participants(
    is_guest: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all participants with optional filters"""
    query = db.query(models.Participant)
    
    if is_guest is not None:
        query = query.filter(models.Participant.is_guest == is_guest)
    
    participants = query.order_by(models.Participant.created_at.desc()).all()
    return {"participants": participants}

@router.get("/{participant_id}", response_model=schemas.ParticipantDetailResponse)
async def get_participant(participant_id: str, db: Session = Depends(get_db)):
    """Get a single participant with their agent assignments"""
    # Try by internal ID first
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()
    
    # If not found, try by participant_id (user-facing ID)
    if not participant:
        participant = db.query(models.Participant).filter(
            models.Participant.participant_id == participant_id
        ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    return {"participant": participant}

@router.post("/", response_model=schemas.ParticipantResponse, status_code=201)
async def create_participant(
    participant_data: schemas.ParticipantCreate,
    db: Session = Depends(get_db)
):
    """Create a new participant"""
    
    # Check if participant_id already exists
    existing = db.query(models.Participant).filter(
        models.Participant.participant_id == participant_data.participant_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Participant ID already exists")
    
    participant = models.Participant(**participant_data.model_dump())
    db.add(participant)
    try:
        db.commit()
        db.refresh(participant)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create participant: {str(e)}")
    
    return {"participant": participant}

@router.patch("/{participant_id}", response_model=schemas.ParticipantResponse)
async def update_participant(
    participant_id: str,
    participant_data: schemas.ParticipantUpdate,
    db: Session = Depends(get_db)
):
    """Update a participant"""
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    update_data = participant_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(participant, key, value)
    
    # Update the updated_at timestamp
    from datetime import datetime
    participant.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(participant)
    
    return {"participant": participant}

@router.delete("/{participant_id}")
async def delete_participant(participant_id: str, db: Session = Depends(get_db)):
    """Delete a participant"""
    participant = db.query(models.Participant).filter(
        models.Participant.id == participant_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    db.delete(participant)
    db.commit()
    
    return {"message": "Participant deleted successfully", "success": True}

# Get conversations for a specific participant
@router.get("/{participant_id}/conversations")
async def get_participant_conversations(
    participant_id: str,
    db: Session = Depends(get_db)
):
    """Get all conversations for a specific participant"""
    # Find participant
    participant = db.query(models.Participant).filter(
        (models.Participant.id == participant_id) |
        (models.Participant.participant_id == participant_id)
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Get conversations
    conversations = db.query(models.ConversationLog).filter(
        models.ConversationLog.participant_id == participant.id
    ).order_by(models.ConversationLog.created_at.desc()).all()
    
    return {"conversations": conversations}
