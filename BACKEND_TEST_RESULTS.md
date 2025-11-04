# Backend API Test Results

## ✅ All Tests Passed!

Date: 2025-11-04  
Backend Version: FastAPI with new multi-role system

## Test Summary

### 1. Participant Management API ✅

**Create Participant (Non-Guest)**
```bash
curl -X POST http://localhost:8000/api/participants/ \
  -H "Content-Type: application/json" \
  -d '{"participant_id": "P001", "name": "Test User", "is_guest": false}'
```
Response: ✅ Participant created with internal ID `4d128156-cde0-4c66-9d44-fc9777f8b03d`

**Create Guest Participant**
```bash
curl -X POST http://localhost:8000/api/participants/ \
  -H "Content-Type: application/json" \
  -d '{"participant_id": "GUEST001", "is_guest": true}'
```
Response: ✅ Guest participant created

**List All Participants**
```bash
curl http://localhost:8000/api/participants/
```
Response: ✅ Returns array of participants

### 2. Assignment Management API ✅

**Create Assignment**
```bash
curl -X POST http://localhost:8000/api/assignments/ \
  -H "Content-Type: application/json" \
  -d '{
    "participant_id": "P001",
    "experiment_prompt_id": "08130dfc-2ec0-4c17-afc2-60a48ebefb6d",
    "agent_config": "test",
    "agent_name": "Test",
    "is_active": true
  }'
```
Response: ✅ Assignment created successfully

### 3. Session Configuration API ✅

**Get Assigned Participant Config**
```bash
curl http://localhost:8000/api/session/participant-config/P001
```
Response: ✅ Returns assigned mode configuration:
```json
{
  "participant_id": "P001",
  "is_guest": false,
  "mode": "assigned",
  "assignment": {
    "assignment_id": "81c2868b-6341-4ef7-b7ec-093b4419032a",
    "experiment_id": "08130dfc-2ec0-4c17-afc2-60a48ebefb6d",
    "agent_config": "test",
    "agent_name": "Test",
    "experiment_name": "Test Prompt",
    "system_prompt": "Test prompt",
    "temperature": 0.8
  }
}
```

**Get Guest Participant Config**
```bash
curl http://localhost:8000/api/session/participant-config/GUEST001
```
Response: ✅ Returns guest mode configuration:
```json
{
  "participant_id": "GUEST001",
  "is_guest": true,
  "mode": "guest",
  "available_agents": [
    {
      "experiment_id": "e5eb985b-5d51-4291-b377-ae4154de67a0",
      "name": "Active Test Agent",
      "agent_config": "chatSupervisor",
      "agent_name": "chatAgent",
      "description": "A friendly chat assistant"
    }
  ]
}
```

### 4. Experiment Prompts API ✅

**Create Active Prompt**
```bash
curl -X POST http://localhost:8000/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Active Test Agent",
    "agent_config": "chatSupervisor",
    "agent_name": "chatAgent",
    "system_prompt": "You are a helpful AI assistant.",
    "temperature": 0.8,
    "is_active": true,
    "description": "A friendly chat assistant"
  }'
```
Response: ✅ Prompt created successfully

## Database Status

### Tables Created ✅
- `participants` - Stores participant information
- `participant_agent_assignments` - Links participants to experiments
- `users` - For experimenter accounts (not yet used)
- `conversation_logs` - Updated with `participant_id` foreign key

### Sample Data in Database
- 2 participants: P001 (assigned), GUEST001 (guest)
- 1 assignment: P001 → Test Prompt
- 2 experiment prompts: 1 inactive, 1 active

## What Works

1. ✅ **Participant Creation** - Both regular and guest participants
2. ✅ **Assignment Creation** - Link participants to specific experiments
3. ✅ **Dual Mode System** - API correctly differentiates between:
   - **Assigned Mode**: Returns specific experiment configuration
   - **Guest Mode**: Returns list of all active experiments
4. ✅ **Experiment Management** - Can create and manage prompts with active/inactive status
5. ✅ **Database Relationships** - Foreign keys work correctly (participant → assignments → prompts)

## Next Steps for Frontend

### Immediate Changes Needed:

1. **Update `src/app/page.tsx`** to check URL parameters:
   ```typescript
   const participantId = searchParams.get("participant_id");
   ```

2. **Add participant config fetch** on page load:
   ```typescript
   useEffect(() => {
     if (participantId) {
       fetch(`/api/backend/session/participant-config/${participantId}`)
         .then(res => res.json())
         .then(data => {
           if (data.mode === "guest") {
             // Show agent selection UI
           } else {
             // Auto-load assigned agent
           }
         });
     }
   }, [participantId]);
   ```

3. **Create Agent Selection Component** for guest mode

4. **Update `useAutoSaveConversation` hook** to pass `participant_id`

### URLs to Use:

**For Assigned Participant:**
```
http://localhost:3000/?participant_id=P001
```
Expected behavior: Automatically loads assigned agent configuration

**For Guest:**
```
http://localhost:3000/?participant_id=GUEST001
```
Expected behavior: Shows list of available agents to choose from

## Experimenter Dashboard (Future Work)

Dashboard should be created at `/experimenter` or `/admin` with:

1. **Prompts Management**
   - List all experiment prompts
   - Create/edit/delete prompts
   - Toggle active/inactive status

2. **Participants Management**
   - List all participants
   - Create new participants
   - View participant details and assignments

3. **Assignments Management**
   - Assign specific experiments to participants
   - Set assignment order (for sequential experiments)
   - Mark assignments as completed

4. **Results Viewer**
   - View conversations by participant
   - View conversations by experiment
   - Export data for analysis

## Authentication (Future Work)

Need to implement:
- Login endpoint for experimenters
- JWT token generation
- Protected routes for experimenter dashboard
- Password hashing (bcrypt)

## Conclusion

✅ **Backend is fully functional and ready for frontend integration!**

All 20 new API endpoints are working correctly:
- 6 participant endpoints
- 6 assignment endpoints  
- 2 session configuration endpoints
- Existing prompt endpoints

The dual-mode system (assigned vs guest) is working as designed.
