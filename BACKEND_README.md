# Realtime Agents - FastAPI Backend

✅ **Backend setup complete!**

## Architecture Overview

```
├── backend/                    # FastAPI backend (Python)
│   ├── main.py                 # API entry point
│   ├── database.py             # Database configuration
│   ├── models.py               # SQLAlchemy models
│   ├── schemas.py              # Pydantic schemas
│   └── routers/                # API routes
│       ├── prompts.py          # Prompt management
│       └── conversations.py    # Conversation logs
├── docker-compose.dev.yml      # Development environment (recommended)
├── docker-compose.yml          # Production environment
└── BACKEND_SETUP.md            # Detailed documentation
```

## Quick Start

### 1. Start Backend and Database

```bash
# Start development environment (backend + database only)
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

### 2. Start Frontend Development Server

```bash
npm run dev
```

Frontend: http://localhost:3000  
Backend API: http://localhost:8000  
API Documentation: http://localhost:8000/docs

### 3. Test Backend API

```bash
# Run test script
./test-backend.sh

# Or test manually
curl http://localhost:8000/health
```

## API Endpoints

### Prompts
- `GET /api/prompts/` - Get all prompts
- `POST /api/prompts/` - Create prompt
- `GET /api/prompts/{id}` - Get single prompt
- `PATCH /api/prompts/{id}` - Update prompt
- `DELETE /api/prompts/{id}` - Delete prompt

### Conversations
- `GET /api/conversations/` - Get conversation logs
- `POST /api/conversations/` - Record conversation
- `GET /api/conversations/{id}` - Get single conversation
- `DELETE /api/conversations/{id}` - Delete conversation

## Database

- **Type**: PostgreSQL 16
- **Connection**: `postgresql://postgres:postgres@localhost:5432/realtime_agents`
- **Tools**: 
  - Access database: `docker-compose exec db psql -U postgres -d realtime_agents`
  - View tables: `\dt`

## Example: Create Experiment Prompt

```bash
curl -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Friendly Agent v1",
    "agent_config": "customerServiceRetail",
    "agent_name": "Sales Agent",
    "system_prompt": "You are a friendly sales agent.",
    "temperature": 0.8,
    "tags": ["friendly", "v1"],
    "is_active": true
  }'
```

## Example: Record Conversation

```bash
curl -X POST http://localhost:8000/api/conversations/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session-123",
    "agent_config": "customerServiceRetail",
    "agent_name": "Sales Agent",
    "transcript": {"messages": []},
    "duration": 120,
    "turn_count": 5,
    "task_completed": true
  }'
```

## Features

✅ RESTful API (FastAPI)  
✅ PostgreSQL Database  
✅ SQLAlchemy ORM  
✅ Pydantic Validation  
✅ Docker Containerization  
✅ Auto-generated API Documentation (Swagger)  
✅ CORS Support  
✅ Hot Reload Development Mode  

## Next Steps

1. View detailed documentation: [BACKEND_SETUP.md](./BACKEND_SETUP.md)
2. Explore API documentation: http://localhost:8000/docs
3. Connect frontend application to backend API
4. Start creating experiment prompts!

## Common Commands

```bash
# View service status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Restart backend
docker-compose -f docker-compose.dev.yml restart backend

# Stop all services
docker-compose -f docker-compose.dev.yml down

# Clean database (Careful!)
docker-compose -f docker-compose.dev.yml down -v
```

## Tech Stack

- **Backend**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 16
- **ORM**: SQLAlchemy 2.0
- **Validation**: Pydantic
- **Container**: Docker & Docker Compose
- **Frontend**: Next.js (running on :3000)
