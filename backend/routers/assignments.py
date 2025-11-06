from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

import sys
sys.path.append('..')
from database import get_db
import models
import schemas as schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Assignment])
async def get_assignments(
    participant_id: Optional[str] = Query(None),
    experiment_prompt_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    """Get all participant-agent assignments with optional filters"""
    query = db.query(models.ParticipantAgentAssignment)
    
    if participant_id:
        # Support both internal ID and participant_id
        participant = db.query(models.Participant).filter(
            (models.Participant.id == participant_id) |
            (models.Participant.participant_id == participant_id)
        ).first()
        if participant:
            query = query.filter(models.ParticipantAgentAssignment.participant_id == participant.id)
    
    if experiment_prompt_id:
        query = query.filter(models.ParticipantAgentAssignment.experiment_prompt_id == experiment_prompt_id)
    
    if is_active is not None:
        query = query.filter(models.ParticipantAgentAssignment.is_active == is_active)
    
    assignments = query.order_by(
        models.ParticipantAgentAssignment.order,
        models.ParticipantAgentAssignment.created_at
    ).all()
    
    return assignments

@router.get("/{assignment_id}", response_model=schemas.Assignment)
async def get_assignment(assignment_id: str, db: Session = Depends(get_db)):
    """Get a single assignment by ID"""
    assignment = db.query(models.ParticipantAgentAssignment).filter(
        models.ParticipantAgentAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    return assignment

@router.post("/", response_model=schemas.Assignment, status_code=201)
async def create_assignment(
    assignment_data: schemas.AssignmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new participant-agent assignment"""
    
    # Verify participant exists
    participant = db.query(models.Participant).filter(
        (models.Participant.id == assignment_data.participant_id) |
        (models.Participant.participant_id == assignment_data.participant_id)
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Verify experiment prompt exists
    experiment = db.query(models.ExperimentPrompt).filter(
        models.ExperimentPrompt.id == assignment_data.experiment_prompt_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment prompt not found")
    
    # Create assignment with internal participant ID
    assignment_dict = assignment_data.model_dump()
    assignment_dict['participant_id'] = participant.id  # Use internal ID
    
    assignment = models.ParticipantAgentAssignment(**assignment_dict)
    db.add(assignment)
    try:
        db.commit()
        db.refresh(assignment)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create assignment: {str(e)}")
    
    return assignment

@router.patch("/{assignment_id}", response_model=schemas.Assignment)
async def update_assignment(
    assignment_id: str,
    assignment_data: schemas.AssignmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an assignment"""
    assignment = db.query(models.ParticipantAgentAssignment).filter(
        models.ParticipantAgentAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    update_data = assignment_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(assignment, key, value)
    
    db.commit()
    db.refresh(assignment)
    
    return assignment

@router.delete("/{assignment_id}")
async def delete_assignment(assignment_id: str, db: Session = Depends(get_db)):
    """Delete an assignment"""
    assignment = db.query(models.ParticipantAgentAssignment).filter(
        models.ParticipantAgentAssignment.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    
    db.delete(assignment)
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete assignment: {str(e)}")
    
    return {"message": "Assignment deleted successfully", "success": True}

# Bulk create assignments
@router.post("/bulk", response_model=List[schemas.Assignment])
async def create_bulk_assignments(
    assignments: list[schemas.AssignmentCreate],
    db: Session = Depends(get_db)
):
    """Create multiple assignments at once"""
    created = []
    failed = []
    
    for assignment_data in assignments:
        # Verify participant exists
        participant = db.query(models.Participant).filter(
            (models.Participant.id == assignment_data.participant_id) |
            (models.Participant.participant_id == assignment_data.participant_id)
        ).first()
        
        if not participant:
            failed.append({
                "assignment_data": assignment_data.model_dump(),
                "error": "Participant not found"
            })
            continue  # Skip if participant not found
        
        # Create assignment with internal participant ID
        assignment_dict = assignment_data.model_dump()
        assignment_dict['participant_id'] = participant.id
        
        try:
            assignment = models.ParticipantAgentAssignment(**assignment_dict)
            db.add(assignment)
            created.append(assignment)
        except Exception as e:
            failed.append({
                "assignment_data": assignment_dict,
                "error": f"Failed to create assignment: {str(e)}"
            })
    
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create bulk assignments: {str(e)}")
    
    for assignment in created:
        db.refresh(assignment)
    
    return created
