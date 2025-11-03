# Backend Setup Guide - FastAPI + PostgreSQL

This project uses FastAPI (Python) as the backend and PostgreSQL as the database to store experiment prompt configurations and conversation logs.

## 🏗️ Architecture

```
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI application entry point
│   ├── database.py         # Database configuration
│   ├── models.py           # SQLAlchemy data models
│   ├── schemas.py          # Pydantic schemas
│   ├── routers/            # API routes
│   │   ├── prompts.py      # Prompts CRUD
│   │   └── conversations.py # Conversations CRUD
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend Docker configuration
├── docker-compose.yml      # Production environment configuration
└── docker-compose.dev.yml  # Development environment configuration
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 20+ (for frontend)

### 1. Environment Variable Setup

```bash
cp .env.example .env
```

Edit the `.env` file and add your configuration:
```env
OPENAI_API_KEY=your-actual-api-key
```

### 2. Start Development Environment

Start only backend and database (recommended for frontend local development):

```bash
# Start database and backend API
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f backend

# Stop services
docker-compose -f docker-compose.dev.yml down
```

Backend API will run at `http://localhost:8000`

Then start Next.js frontend in another terminal:
```bash
npm run dev
```

### 3. Start Complete Production Environment

Start all services (database, backend, frontend):

```bash
docker-compose up -d

# View all service logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and delete data (Careful!)
docker-compose down -v
```

## 📊 Database Schema

### ExperimentPrompt Table
Stores different experiment prompt configurations:

| Field | Type | Description |
|------|------|------|
| id | String (UUID) | Primary key |
| name | String | Experiment name |
| agent_config | String | Agent configuration key |
| agent_name | String | Agent name |
| system_prompt | Text | System prompt |
| instructions | Text | Additional instructions |
| temperature | Float | Temperature parameter (default 0.8) |
| max_tokens | Integer | Maximum token count |
| voice | String | Voice model |
| description | Text | Experiment description |
| tags | Array[String] | Tags (for categorization) |
| is_active | Boolean | Whether activated |
| success_rate | Float | Success rate (%) |
| avg_duration | Float | Average conversation duration (seconds) |
| total_runs | Integer | Number of runs |
| created_at | DateTime | Creation time |
| updated_at | DateTime | Update time |

### ConversationLog Table
Records conversation history and evaluation metrics:

| Field | Type | Description |
|------|------|------|
| id | String (UUID) | Primary key |
| experiment_id | String (FK) | Associated experiment ID |
| session_id | String | Session ID |
| agent_config | String | Agent config used |
| agent_name | String | Agent name used |
| transcript | JSON | Complete conversation log |
| duration | Float | Conversation duration (seconds) |
| turn_count | Integer | Number of conversation turns |
| user_satisfaction | Integer | User satisfaction (1-5) |
| task_completed | Boolean | Whether task completed |
| metadata | JSON | Other metadata |
| created_at | DateTime | Creation time |

## 🔌 API Endpoints

### Health Check
```bash
GET http://localhost:8000/
GET http://localhost:8000/health
```

### Prompts Management

#### Get All Prompts
```bash
# Get all
GET /api/prompts

# Filter by conditions
GET /api/prompts?agent_config=customerServiceRetail
GET /api/prompts?agent_name=Sales%20Agent
GET /api/prompts?is_active=true
GET /api/prompts?tags=experiment-a,friendly
```

#### Get Single Prompt
```bash
GET /api/prompts/{prompt_id}
```

#### Create Prompt
```bash
POST /api/prompts
Content-Type: application/json

{
  "name": "Experiment A - Friendly Tone",
  "agent_config": "customerServiceRetail",
  "agent_name": "Sales Agent",
  "system_prompt": "You are a friendly sales agent...",
  "instructions": "Always be polite and helpful",
  "temperature": 0.8,
  "max_tokens": 1000,
  "voice": "alloy",
  "description": "Testing friendly tone approach",
  "tags": ["experiment-a", "friendly"],
  "is_active": true
}
```

#### Update Prompt
```bash
PATCH /api/prompts/{prompt_id}
Content-Type: application/json

{
  "system_prompt": "Updated prompt text...",
  "temperature": 0.9,
  "is_active": true
}
```

#### Delete Prompt
```bash
DELETE /api/prompts/{prompt_id}
```

### Conversations Management

#### Get Conversation Logs
```bash
# Get recent 50 entries
GET /api/conversations

# Filter by experiment
GET /api/conversations?experiment_id=abc123

# Filter by agent
GET /api/conversations?agent_config=customerServiceRetail

# Limit results
GET /api/conversations?limit=100
```

#### Get Single Conversation
```bash
GET /api/conversations/{conversation_id}
```

#### Create Conversation Log
```bash
POST /api/conversations
Content-Type: application/json

{
  "experiment_id": "abc123",
  "session_id": "session-456",
  "agent_config": "customerServiceRetail",
  "agent_name": "Sales Agent",
  "transcript": {
    "messages": [
      {"role": "user", "content": "Hello"},
      {"role": "assistant", "content": "Hi! How can I help?"}
    ]
  },
  "duration": 120.5,
  "turn_count": 10,
  "user_satisfaction": 5,
  "task_completed": true,
  "metadata": {
    "browser": "Chrome",
    "location": "US"
  }
}
```

#### Delete Conversation
```bash
DELETE /api/conversations/{conversation_id}
```

## 🛠️ Development Tools

### Run FastAPI Locally (without Docker)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Ensure PostgreSQL is running
docker-compose -f ../docker-compose.dev.yml up -d db

# Start FastAPI
uvicorn main:app --reload --port 8000
```

API documentation is auto-generated:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Database Management

```bash
# Enter PostgreSQL container
docker-compose exec db psql -U postgres -d realtime_agents

# View tables
\dt

# View table structure
\d experiment_prompts
\d conversation_logs

# Exit
\q
```

### Useful Commands

```bash
# View backend logs
docker-compose logs -f backend

# Restart backend service
docker-compose restart backend

# Rebuild backend image
docker-compose build backend

# Clean and restart
docker-compose down -v
docker-compose up -d

# Start database only
docker-compose up -d db
```

## 📝 Usage Examples

### Testing API with curl

```bash
# Create an experiment prompt
curl -X POST http://localhost:8000/api/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Friendly Sales Agent",
    "agent_config": "customerServiceRetail",
    "agent_name": "Sales Agent",
    "system_prompt": "You are a friendly and helpful sales agent.",
    "temperature": 0.8,
    "tags": ["friendly", "sales"],
    "is_active": true
  }'

# Get all active prompts
curl http://localhost:8000/api/prompts?is_active=true

# Record a conversation
curl -X POST http://localhost:8000/api/conversations \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "test-session-1",
    "agent_config": "customerServiceRetail",
    "agent_name": "Sales Agent",
    "transcript": {"messages": []},
    "duration": 120,
    "turn_count": 5,
    "task_completed": true
  }'
```

### Using Python Client

```python
import requests

# Create prompt
response = requests.post(
    "http://localhost:8000/api/prompts",
    json={
        "name": "Test Experiment",
        "agent_config": "customerServiceRetail",
        "agent_name": "Sales Agent",
        "system_prompt": "You are helpful.",
        "is_active": True
    }
)
prompt = response.json()["prompt"]
print(f"Created prompt: {prompt['id']}")

# Get active prompts
response = requests.get(
    "http://localhost:8000/api/prompts",
    params={"is_active": True}
)
prompts = response.json()["prompts"]
print(f"Found {len(prompts)} active prompts")
```

## 🚢 Production Deployment

### Deploy with Docker Compose

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### Environment Variables (Production)

Ensure these are set:
- `DATABASE_URL`: Production database connection string
- `OPENAI_API_KEY`: OpenAI API key
- Adjust CORS settings as needed

## 🔒 Security Recommendations

1. Use strong passwords for database credentials
2. Don't hardcode sensitive information in code
3. Restrict CORS origins in production environment
4. Consider adding API authentication (JWT, etc.)
5. Regular database backups

## 📚 More Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
