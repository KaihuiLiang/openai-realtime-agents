# Auto-Save Conversation Feature

✅ **Auto-save conversations to database implemented!**

## Feature Description

The system now automatically saves conversation logs to the PostgreSQL database.

### Auto-Save Triggers

1. **Session End** - When user disconnects, automatically saves complete conversation
2. **Every 10 New Messages** - When conversation has 10 or more new messages, auto-saves
3. **30 Seconds Inactive** - If no new messages for 30 seconds, auto-saves current conversation

### Saved Data

- **session_id** - Unique session identifier
- **agent_config** - Agent configuration used (e.g., `customerServiceRetail`)
- **agent_name** - Specific agent name (e.g., `Sales Agent`)
- **transcript** - Complete conversation log (JSON format)
- **duration** - Conversation duration (seconds)
- **turn_count** - Number of conversation turns
- **extra_metadata** - Additional metadata (save time, etc.)

### How to View Saved Conversations

#### Method 1: Using API

```bash
# Get all conversations
curl http://localhost:8000/api/conversations/

# Filter by agent config
curl http://localhost:8000/api/conversations/?agent_config=customerServiceRetail

# Limit returned results
curl http://localhost:8000/api/conversations/?limit=10
```

#### Method 2: Direct Database Query

```bash
# Enter database
docker-compose -f docker-compose.dev.yml exec db psql -U postgres -d realtime_agents

# View all conversations
SELECT id, session_id, agent_name, turn_count, duration, created_at 
FROM conversation_logs 
ORDER BY created_at DESC 
LIMIT 10;

# View specific conversation details
SELECT transcript FROM conversation_logs WHERE id = 'your-conversation-id';
```

#### Method 3: Using API Documentation Interface

Visit http://localhost:8000/docs to view and test all APIs through Swagger UI.

## Configuration

You can modify parameters in `src/app/hooks/useAutoSaveConversation.ts`:

```typescript
// Auto-save every N messages
if (newMessageCount >= 10) {  // Change this number
  saveConversation();
}

// Auto-save after N seconds of inactivity
saveTimeoutRef.current = setTimeout(() => {
  if (newMessageCount > 0) {
    saveConversation();
  }
}, 30000); // Change this number (milliseconds)
```

## Linking with Experiment Prompts

Future feature to link conversations with specific experiment prompts:

1. Select or create an experiment prompt in frontend
2. Set `experimentId` 
3. Conversation will automatically link to that experiment
4. System will automatically calculate experiment statistics (success rate, average duration, etc.)

## Notes

- ✅ Conversations automatically filter out hidden messages and breadcrumbs
- ✅ Each session has a unique session_id
- ✅ If backend is not running, shows error in console but doesn't affect normal usage
- ✅ Save failures don't interrupt user experience

## Testing

Start a conversation session:

1. Ensure backend is running: `docker-compose -f docker-compose.dev.yml up -d`
2. Start frontend: `npm run dev`
3. Connect and have a conversation
4. Disconnect or wait for auto-save
5. Verify in database: `curl http://localhost:8000/api/conversations/`

## Implementation Files

- `src/app/hooks/useAutoSaveConversation.ts` - Auto-save logic
- `src/app/App.tsx` - Auto-save hook integration
- `backend/routers/conversations.py` - Backend API endpoints
