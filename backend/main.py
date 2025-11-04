from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from database import engine, Base
from routers import conversations, participants, assignments, session, agents

# Create tables on startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Realtime Agents Backend",
    description="Backend API for managing experiment agents and conversation logs",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - must be added before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://cbs-voicechatbot.duckdns.org",  # Production domain
        "http://cbs-voicechatbot.duckdns.org",   # HTTP fallback
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["Content-Type", "Authorization", "Accept", "Origin", "X-Requested-With"],
    expose_headers=["*"],
    max_age=3600,
)

# Include routers
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(conversations.router, prefix="/api/conversations", tags=["conversations"])
app.include_router(participants.router, prefix="/api/participants", tags=["participants"])
app.include_router(assignments.router, prefix="/api/assignments", tags=["assignments"])
app.include_router(session.router, prefix="/api/session", tags=["session"])

@app.get("/")
async def root():
    return {"message": "Realtime Agents Backend API", "status": "running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
