# System Architecture for Research Experiment Platform

## Overview
This platform supports two types of users:
1. **Experimenters** - Design experiments, manage participants, view results
2. **Participants** - Chat with assigned agents

## Database Schema

### New Tables Added

#### 1. `participants` Table
- **participant_id** (unique): User-facing ID for participants
- **name**: Optional participant name
- **email**: Optional email
- **is_guest**: Boolean flag for guest mode
- **extra_metadata**: JSON field for additional data
- **created_at**, **updated_at**: Timestamps

#### 2. `participant_agent_assignments` Table
- **participant_id**: Foreign key to participants table
- **experiment_prompt_id**: Foreign key to experiment_prompts table
- **agent_config**: Agent configuration key (e.g., "customerServiceRetail")
- **agent_name**: Agent name (e.g., "Sales Agent")
- **is_active**: Whether assignment is currently active
- **completed**: Whether participant has completed this assignment
- **order**: Order for sequential assignments
- **notes**: Optional notes about the assignment

#### 3. `users` Table (Future: For experimenter login)
- **username**, **email**: Unique identifiers
- **password_hash**: Hashed password
- **role**: "experimenter" or "admin"
- **is_active**: Account status

#### 4. Updated `conversation_logs` Table
- Added **participant_id**: Links conversations to participants

## API Endpoints

### Participants Management
```
GET    /api/participants/                    # List all participants
POST   /api/participants/                    # Create new participant
GET    /api/participants/{id}                # Get participant details
PATCH  /api/participants/{id}                # Update participant
DELETE /api/participants/{id}                # Delete participant
GET    /api/participants/{id}/conversations  # Get participant's conversations
```

### Assignments Management
```
GET    /api/assignments/                     # List all assignments
POST   /api/assignments/                     # Create new assignment
GET    /api/assignments/{id}                 # Get assignment details
PATCH  /api/assignments/{id}                 # Update assignment
DELETE /api/assignments/{id}                 # Delete assignment
POST   /api/assignments/bulk                 # Bulk create assignments
```

### Session Management
```
GET    /api/session/participant-config/{participant_id}  # Get participant's agent config
POST   /api/session/complete-assignment/{participant_id} # Mark assignment completed
```

## User Flows

### Flow 1: Experimenter Creates Experiment

1. **Login to Admin Panel** (future feature)
   - Navigate to `/admin` or `/experimenter` dashboard

2. **Create Experiment Prompt**
   ```bash
   POST /api/prompts/
   {
     "name": "Friendly Sales Agent - Experiment A",
     "agent_config": "customerServiceRetail",
     "agent_name": "Sales Agent",
     "system_prompt": "You are a friendly sales agent...",
     "temperature": 0.8,
     "is_active": true
   }
   ```

3. **Create Participants**
   ```bash
   POST /api/participants/
   {
     "participant_id": "P001",
     "name": "John Doe",
     "email": "john@example.com",
     "is_guest": false
   }
   ```

4. **Assign Agent to Participant**
   ```bash
   POST /api/assignments/
   {
     "participant_id": "P001",
     "experiment_prompt_id": "<experiment_id>",
     "agent_config": "customerServiceRetail",
     "agent_name": "Sales Agent",
     "is_active": true,
     "order": 0
   }
   ```

5. **View Results**
   - List participants: `GET /api/participants/`
   - View conversations: `GET /api/participants/P001/conversations`
   - View all conversations: `GET /api/conversations/?participant_id=P001`

### Flow 2: Participant Uses System

#### For Assigned Participants (Non-Guest)

1. **Participant Visits URL**
   ```
   https://your-domain.com/?participant_id=P001
   ```

2. **Frontend Checks Configuration**
   ```bash
   GET /api/session/participant-config/P001
   ```
   
   Response:
   ```json
   {
     "participant_id": "P001",
     "is_guest": false,
     "mode": "assigned",
     "assignment": {
       "experiment_id": "...",
       "agent_config": "customerServiceRetail",
       "agent_name": "Sales Agent",
       "system_prompt": "...",
       "temperature": 0.8
     }
   }
   ```

3. **Chat Interface Loads**
   - System automatically loads assigned agent configuration
   - Participant cannot change agent
   - Conversation logged with participant_id

4. **Conversation Saved**
   ```bash
   POST /api/conversations/
   {
     "participant_id": "<internal_id>",
     "experiment_id": "<experiment_id>",
     "session_id": "...",
     "agent_config": "customerServiceRetail",
     "agent_name": "Sales Agent",
     "transcript": {...},
     "duration": 120,
     "turn_count": 5
   }
   ```

#### For Guest Mode

1. **Guest Visits URL**
   ```
   https://your-domain.com/?mode=guest
   OR
   https://your-domain.com/?participant_id=GUEST_001&guest=true
   ```

2. **Frontend Checks Configuration**
   ```bash
   GET /api/session/participant-config/GUEST_001
   ```
   
   Response:
   ```json
   {
     "participant_id": "GUEST_001",
     "is_guest": true,
     "mode": "guest",
     "available_agents": [
       {
         "experiment_id": "...",
         "name": "Friendly Sales Agent",
         "agent_config": "customerServiceRetail",
         "agent_name": "Sales Agent",
         "description": "..."
       },
       // ... more agents
     ]
   }
   ```

3. **Guest Selects Agent**
   - UI shows list of available agents
   - Guest clicks on desired agent
   - Chat interface loads with selected configuration

## Frontend Implementation

### Required Changes

#### 1. Update `App.tsx`

```typescript
// Add state for participant mode
const [participantId, setParticipantId] = useState<string | null>(null);
const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
const [assignedConfig, setAssignedConfig] = useState<any>(null);

useEffect(() => {
  // Check URL params
  const participantIdParam = searchParams.get("participant_id");
  const guestParam = searchParams.get("guest") === "true";
  
  if (participantIdParam) {
    setParticipantId(participantIdParam);
    
    // Fetch participant configuration
    fetch(`/api/backend/session/participant-config/${participantIdParam}`)
      .then(res => res.json())
      .then(data => {
        if (data.is_guest) {
          setIsGuestMode(true);
          // Show agent selection UI
        } else {
          setAssignedConfig(data.assignment);
          // Auto-load assigned agent
        }
      });
  }
}, [searchParams]);
```

#### 2. Create Agent Selection Component (for guests)

```typescript
// src/app/components/AgentSelection.tsx
export function AgentSelection({ availableAgents, onSelect }) {
  return (
    <div className="agent-selection">
      <h2>Select an Agent to Chat With</h2>
      <div className="agents-grid">
        {availableAgents.map(agent => (
          <div key={agent.experiment_id} className="agent-card">
            <h3>{agent.name}</h3>
            <p>{agent.description}</p>
            <button onClick={() => onSelect(agent)}>
              Start Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 3. Create Experimenter Dashboard

```typescript
// src/app/experimenter/page.tsx
export default function ExperimenterDashboard() {
  return (
    <div className="dashboard">
      <nav>
        <Link href="/experimenter/prompts">Experiment Prompts</Link>
        <Link href="/experimenter/participants">Participants</Link>
        <Link href="/experimenter/assignments">Assignments</Link>
        <Link href="/experimenter/results">Results</Link>
      </nav>
      {/* Dashboard content */}
    </div>
  );
}
```

#### 4. Update Auto-Save Hook

```typescript
// src/app/hooks/useAutoSaveConversation.ts
// Add participantId parameter
export function useAutoSaveConversation({
  transcriptItems,
  sessionStatus,
  agentConfig,
  agentName,
  sessionId,
  experimentId,
  participantId,  // NEW
}: SaveConversationParams) {
  // ... existing code ...
  
  const saveConversation = async () => {
    // ... existing code ...
    
    const response = await fetch(`${API_BASE}/conversations/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        experiment_id: experimentId,
        participant_id: participantId,  // NEW
        session_id: sessionId,
        agent_config: agentConfig,
        agent_name: agentName,
        transcript,
        duration,
        turn_count: turnCount,
        extra_metadata: {
          saved_at: new Date().toISOString(),
          auto_saved: true,
        },
      }),
    });
  };
}
```

## Testing the System

### 1. Setup Database
```bash
# Start backend
docker-compose -f docker-compose.dev.yml up -d

# Database will auto-create new tables
```

### 2. Create Test Data
```bash
# Create experiment prompt
curl -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Agent",
    "agent_config": "chatSupervisor",
    "agent_name": "chatAgent",
    "system_prompt": "You are a helpful assistant.",
    "is_active": true
  }'

# Create participant
curl -X POST http://localhost:8000/api/participants/ \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "P001",
    "name": "Test User",
    "is_guest": false
  }'

# Create assignment
curl -X POST http://localhost:8000/api/assignments/ \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "P001",
    "experiment_prompt_id": "<prompt_id_from_above>",
    "agent_config": "chatSupervisor",
    "agent_name": "chatAgent",
    "is_active": true
  }'
```

### 3. Test Participant Flow
```bash
# Check participant config
curl http://localhost:8000/api/session/participant-config/P001

# Visit frontend with participant ID
# http://localhost:3000/?participant_id=P001
```

### 4. Test Guest Flow
```bash
# Create guest participant
curl -X POST http://localhost:8000/api/participants/ \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "GUEST_001",
    "is_guest": true
  }'

# Check guest config
curl http://localhost:8000/api/session/participant-config/GUEST_001

# Visit frontend in guest mode
# http://localhost:3000/?participant_id=GUEST_001
```

## Next Steps

1. ✅ Backend API endpoints created
2. ✅ Database models defined
3. ⏳ Frontend participant flow implementation
4. ⏳ Experimenter dashboard UI
5. ⏳ Authentication for experimenters
6. ⏳ Results visualization

## Security Considerations

1. **Authentication**: Add JWT or session-based auth for experimenters
2. **Participant Privacy**: Hash or encrypt participant IDs in URLs
3. **Rate Limiting**: Prevent abuse of guest mode
4. **Data Export**: Add GDPR-compliant data export for participants
5. **Access Control**: Experimenters should only see their own experiments
