from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

import sys
sys.path.append('..')
from database import get_db
import models
import schemas

router = APIRouter()

@router.get("/", response_model=schemas.PromptsResponse)
async def get_prompts(
    agent_config: Optional[str] = Query(None),
    agent_name: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    tags: Optional[str] = Query(None),  # Comma-separated
    db: Session = Depends(get_db)
):
    """Get all experiment prompts with optional filters"""
    query = db.query(models.ExperimentPrompt)
    
    if agent_config:
        query = query.filter(models.ExperimentPrompt.agent_config == agent_config)
    if agent_name:
        query = query.filter(models.ExperimentPrompt.agent_name == agent_name)
    if is_active is not None:
        query = query.filter(models.ExperimentPrompt.is_active == is_active)
    if tags:
        tag_list = tags.split(',')
        # Filter prompts that have any of the specified tags
        query = query.filter(models.ExperimentPrompt.tags.overlap(tag_list))
    
    prompts = query.order_by(models.ExperimentPrompt.updated_at.desc()).all()
    return {"prompts": prompts}

@router.get("/{prompt_id}", response_model=schemas.PromptResponse)
async def get_prompt(prompt_id: str, db: Session = Depends(get_db)):
    """Get a single experiment prompt by ID"""
    prompt = db.query(models.ExperimentPrompt).filter(
        models.ExperimentPrompt.id == prompt_id
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    return {"prompt": prompt}

@router.post("/", response_model=schemas.PromptResponse, status_code=201)
async def create_prompt(
    prompt_data: schemas.ExperimentPromptCreate,
    db: Session = Depends(get_db)
):
    """Create a new experiment prompt"""
    
    # If setting as active, deactivate others for the same agent
    if prompt_data.is_active:
        db.query(models.ExperimentPrompt).filter(
            models.ExperimentPrompt.agent_config == prompt_data.agent_config,
            models.ExperimentPrompt.agent_name == prompt_data.agent_name,
            models.ExperimentPrompt.is_active == True
        ).update({"is_active": False})
    
    prompt = models.ExperimentPrompt(**prompt_data.model_dump())
    db.add(prompt)
    db.commit()
    db.refresh(prompt)
    
    return {"prompt": prompt}

@router.patch("/{prompt_id}", response_model=schemas.PromptResponse)
async def update_prompt(
    prompt_id: str,
    prompt_data: schemas.ExperimentPromptUpdate,
    db: Session = Depends(get_db)
):
    """Update an experiment prompt"""
    prompt = db.query(models.ExperimentPrompt).filter(
        models.ExperimentPrompt.id == prompt_id
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # If setting as active, deactivate others for the same agent
    if prompt_data.is_active:
        db.query(models.ExperimentPrompt).filter(
            models.ExperimentPrompt.agent_config == prompt.agent_config,
            models.ExperimentPrompt.agent_name == prompt.agent_name,
            models.ExperimentPrompt.is_active == True,
            models.ExperimentPrompt.id != prompt_id
        ).update({"is_active": False})
    
    # Update fields
    update_data = prompt_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(prompt, key, value)
    
    db.commit()
    db.refresh(prompt)
    
    return {"prompt": prompt}

@router.delete("/{prompt_id}", response_model=schemas.MessageResponse)
async def delete_prompt(prompt_id: str, db: Session = Depends(get_db)):
    """Delete an experiment prompt"""
    prompt = db.query(models.ExperimentPrompt).filter(
        models.ExperimentPrompt.id == prompt_id
    ).first()
    
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    db.delete(prompt)
    db.commit()
    
    return {"message": "Prompt deleted successfully", "success": True}
