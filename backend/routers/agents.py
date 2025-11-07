from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

import sys
sys.path.append('..')
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("/", response_model=List[schemas.Agent])
async def get_agents(
    agent_config: Optional[str] = Query(None),
    agent_name: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated
    db: Session = Depends(get_db)
):
    """Get all agents with optional filters"""
    query = db.query(models.Agent)
    
    if agent_config:
        query = query.filter(models.Agent.agent_config == agent_config)
    if agent_name:
        query = query.filter(models.Agent.agent_name == agent_name)
    if is_active is not None:
        query = query.filter(models.Agent.is_active == is_active)
    if tags:
        tag_list = tags.split(',')
        # Filter agents that have any of the specified tags
        query = query.filter(models.Agent.tags.overlap(tag_list))
    
    agents = query.order_by(models.Agent.updated_at.desc()).all()
    return agents

@router.get("/by-name/{agent_name}", response_model=schemas.Agent)
async def get_active_agent_by_name(
    agent_name: str,
    agent_config: Optional[str] = Query("chatSupervisor"),
    db: Session = Depends(get_db)
):
    """Get the active agent configuration by agent name and config"""
    agent = db.query(models.Agent).filter(
        models.Agent.agent_name == agent_name,
        models.Agent.agent_config == agent_config,
        models.Agent.is_active == True
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail=f"No active agent found with name '{agent_name}' in config '{agent_config}'")
    
    return agent

@router.get("/{agent_id}", response_model=schemas.Agent)
async def get_agent(agent_id: str, db: Session = Depends(get_db)):
    """Get a single agent by ID"""
    agent = db.query(models.Agent).filter(
        models.Agent.id == agent_id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent

@router.post("/", response_model=schemas.Agent, status_code=201)
async def create_agent(
    agent_data: schemas.AgentCreate,
    db: Session = Depends(get_db)
):
    """Create a new agent"""
    
    # If setting as active, deactivate others for the same agent
    if agent_data.is_active:
        db.query(models.Agent).filter(
            models.Agent.agent_config == agent_data.agent_config,
            models.Agent.agent_name == agent_data.agent_name,
            models.Agent.is_active == True
        ).update({"is_active": False})
    
    agent = models.Agent(**agent_data.model_dump())
    db.add(agent)
    db.commit()
    db.refresh(agent)
    
    return agent

@router.patch("/{agent_id}", response_model=schemas.Agent)
async def update_agent(
    agent_id: str,
    agent_data: schemas.AgentUpdate,
    db: Session = Depends(get_db)
):
    """Update an agent"""
    agent = db.query(models.Agent).filter(
        models.Agent.id == agent_id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # If setting as active, deactivate others for the same agent
    if agent_data.is_active:
        db.query(models.Agent).filter(
            models.Agent.agent_config == agent.agent_config,
            models.Agent.agent_name == agent.agent_name,
            models.Agent.is_active == True,
            models.Agent.id != agent_id
        ).update({"is_active": False})
    
    # Update fields
    update_data = agent_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(agent, key, value)
    
    db.commit()
    db.refresh(agent)
    
    return agent

@router.delete("/{agent_id}", response_model=schemas.MessageResponse)
async def delete_agent(agent_id: str, db: Session = Depends(get_db)):
    """Delete an agent"""
    agent = db.query(models.Agent).filter(
        models.Agent.id == agent_id
    ).first()
    
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Check if agent is used in any assignments
    assignment_count = db.query(models.ParticipantAgentAssignment).filter(
        models.ParticipantAgentAssignment.agent_id == agent_id
    ).count()
    
    if assignment_count > 0:
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot delete agent. It is currently used in {assignment_count} assignment(s). Please delete or reassign those assignments first."
        )
    
    db.delete(agent)
    db.commit()
    
    return {"message": "Agent deleted successfully", "success": True}
