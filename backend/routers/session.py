from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import sys
sys.path.append('..')
from database import get_db
import models

router = APIRouter()

@router.get("/participant-config/{participant_id}")
async def get_participant_config(participant_id: str, db: Session = Depends(get_db)):
    """
    Get the agent configuration assigned to a participant.
    Returns the active agent assignment and experiment prompt details.
    """
    
    # Find participant by participant_id (user-facing ID)
    participant = db.query(models.Participant).filter(
        models.Participant.participant_id == participant_id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=404, detail="Participant not found")
    
    # Check if guest mode
    if participant.is_guest:
        # Guest can choose any active experiment prompt
        available_prompts = db.query(models.ExperimentPrompt).filter(
            models.ExperimentPrompt.is_active == True
        ).all()
        
        return {
            "participant_id": participant.participant_id,
            "is_guest": True,
            "mode": "guest",
            "available_agents": [
                {
                    "experiment_id": prompt.id,
                    "name": prompt.name,
                    "agent_config": prompt.agent_config,
                    "agent_name": prompt.agent_name,
                    "description": prompt.description
                }
                for prompt in available_prompts
            ]
        }
    
    # For non-guest, get active assignment
    assignment = db.query(models.ParticipantAgentAssignment).filter(
        models.ParticipantAgentAssignment.participant_id == participant.id,
        models.ParticipantAgentAssignment.is_active == True,
        models.ParticipantAgentAssignment.completed == False
    ).order_by(models.ParticipantAgentAssignment.order).first()
    
    if not assignment:
        raise HTTPException(
            status_code=404,
            detail="No active assignment found for this participant"
        )
    
    # Get experiment prompt details
    experiment = db.query(models.ExperimentPrompt).filter(
        models.ExperimentPrompt.id == assignment.experiment_prompt_id
    ).first()
    
    if not experiment:
        raise HTTPException(status_code=404, detail="Experiment prompt not found")
    
    return {
        "participant_id": participant.participant_id,
        "is_guest": False,
        "mode": "assigned",
        "assignment": {
            "assignment_id": assignment.id,
            "experiment_id": experiment.id,
            "agent_config": assignment.agent_config,
            "agent_name": assignment.agent_name,
            "experiment_name": experiment.name,
            "system_prompt": experiment.system_prompt,
            "instructions": experiment.instructions,
            "temperature": experiment.temperature,
            "max_tokens": experiment.max_tokens,
            "voice": experiment.voice,
            "order": assignment.order
        }
    }

from pydantic import BaseModel

class CompleteAssignmentRequest(BaseModel):
    assignment_id: str

@router.post("/complete-assignment/{participant_id}")
async def complete_assignment(
    participant_id: str,
    request: CompleteAssignmentRequest,
    db: Session = Depends(get_db)
):
    """
    Mark an assignment as completed for a participant.
    This moves the participant to the next assignment if available.
    """

    assignment = db.query(models.ParticipantAgentAssignment).filter(
        models.ParticipantAgentAssignment.id == request.assignment_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Mark as completed
    assignment.completed = True
    assignment.is_active = False
    try:
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete assignment: {str(e)}")

    # Check if there's a next assignment
    participant = db.query(models.Participant).filter(
        models.Participant.participant_id == participant_id
    ).first()

    if participant:
        next_assignment = db.query(models.ParticipantAgentAssignment).filter(
            models.ParticipantAgentAssignment.participant_id == participant.id,
            models.ParticipantAgentAssignment.completed == False,
            models.ParticipantAgentAssignment.order > assignment.order
        ).order_by(models.ParticipantAgentAssignment.order).first()

        if next_assignment:
            return {
                "success": True,
                "message": "Assignment completed",
                "has_next": True,
                "next_assignment_id": next_assignment.id
            }

    return {
        "success": True,
        "message": "Assignment completed. No more assignments.",
        "has_next": False
    }
