#!/bin/bash

# Backend API Test Script

BASE_URL="http://localhost:8000"

echo "========================================="
echo "Testing Realtime Agents Backend API"
echo "========================================="
echo ""

# 1. Health Check
echo "1. Health Check"
echo "GET $BASE_URL/health"
curl -s $BASE_URL/health
echo -e "\n"

# 2. Create Experiment Prompt
echo "2. Create Experiment Prompt"
echo "POST $BASE_URL/api/prompts/"
PROMPT_RESPONSE=$(curl -s -X POST $BASE_URL/api/prompts/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Friendly Sales Agent - Experiment A",
    "agent_config": "customerServiceRetail",
    "agent_name": "Sales Agent",
    "system_prompt": "You are a friendly and enthusiastic sales agent. Always greet customers warmly.",
    "instructions": "Focus on building rapport before selling.",
    "temperature": 0.9,
    "tags": ["experiment-a", "friendly", "enthusiastic"],
    "description": "Testing a very friendly approach",
    "is_active": true
  }')
echo $PROMPT_RESPONSE
PROMPT_ID=$(echo $PROMPT_RESPONSE | grep -o '"id":"[^"]*' | grep -o '[^"]*$')
echo "Created Prompt ID: $PROMPT_ID"
echo ""

# 3. Get All Prompts
echo "3. Get All Prompts"
echo "GET $BASE_URL/api/prompts/"
curl -s $BASE_URL/api/prompts/
echo -e "\n"

# 4. Get Active Prompts
echo "4. Get Active Prompts"
echo "GET $BASE_URL/api/prompts/?is_active=true"
curl -s "$BASE_URL/api/prompts/?is_active=true"
echo -e "\n"

# 5. Create Conversation Log
echo "5. Create Conversation Log"
echo "POST $BASE_URL/api/conversations/"
CONV_RESPONSE=$(curl -s -X POST $BASE_URL/api/conversations/ \
  -H "Content-Type: application/json" \
  -d "{
    \"experiment_id\": \"$PROMPT_ID\",
    \"session_id\": \"test-session-001\",
    \"agent_config\": \"customerServiceRetail\",
    \"agent_name\": \"Sales Agent\",
    \"transcript\": {
      \"messages\": [
        {\"role\": \"user\", \"content\": \"Hello\"},
        {\"role\": \"assistant\", \"content\": \"Hi! How can I help you today?\"},
        {\"role\": \"user\", \"content\": \"I want to buy a product\"},
        {\"role\": \"assistant\", \"content\": \"Great! Let me show you our products.\"}
      ]
    },
    \"duration\": 120.5,
    \"turn_count\": 4,
    \"user_satisfaction\": 5,
    \"task_completed\": true,
    \"extra_metadata\": {
      \"browser\": \"Chrome\",
      \"location\": \"Taiwan\"
    }
  }")
echo $CONV_RESPONSE
echo ""

# 6. Get Conversations
echo "6. Get Conversations"
echo "GET $BASE_URL/api/conversations/"
curl -s $BASE_URL/api/conversations/
echo -e "\n"

# 7. Get Updated Prompt Statistics
if [ ! -z "$PROMPT_ID" ]; then
  echo "7. Get Updated Prompt Statistics"
  echo "GET $BASE_URL/api/prompts/$PROMPT_ID"
  curl -s $BASE_URL/api/prompts/$PROMPT_ID
  echo -e "\n"
fi

echo "========================================="
echo "Test Complete!"
echo "========================================="
