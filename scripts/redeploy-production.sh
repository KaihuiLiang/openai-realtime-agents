#!/usr/bin/env bash
set -euo pipefail

ENV_FILE=".env.production"
COMPOSE_FILE="docker-compose.prod.yml"
MAX_WAIT_SECONDS="${MAX_WAIT_SECONDS:-180}"
POLL_INTERVAL_SECONDS=3

DB_CONTAINER="realtime-agents-prod-db"
BACKEND_CONTAINER="realtime-agents-prod-backend"
FRONTEND_CONTAINER="realtime-agents-prod-frontend"

BACKEND_HEALTH_URL="http://127.0.0.1:8001/health"
FRONTEND_HEALTH_URL="http://127.0.0.1:3001/api/health"

require_file() {
  local file_path="$1"
  if [[ ! -f "$file_path" ]]; then
    echo "[ERROR] Missing required file: $file_path"
    exit 1
  fi
}

wait_for_container() {
  local container_name="$1"
  local target_state="$2"
  local waited=0

  echo "[INFO] Waiting for container '$container_name' to reach state '$target_state'..."
  while (( waited < MAX_WAIT_SECONDS )); do
    local state
    state="$(docker inspect -f '{{.State.Status}}' "$container_name" 2>/dev/null || true)"
    if [[ "$state" == "$target_state" ]]; then
      echo "[OK] Container '$container_name' is '$target_state'."
      return 0
    fi

    sleep "$POLL_INTERVAL_SECONDS"
    waited=$((waited + POLL_INTERVAL_SECONDS))
  done

  echo "[ERROR] Timeout waiting for '$container_name' to become '$target_state'."
  return 1
}

wait_for_db_healthy() {
  local waited=0

  echo "[INFO] Waiting for database health check to report healthy..."
  while (( waited < MAX_WAIT_SECONDS )); do
    local health
    health="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$DB_CONTAINER" 2>/dev/null || true)"
    if [[ "$health" == "healthy" ]]; then
      echo "[OK] Database is healthy."
      return 0
    fi

    sleep "$POLL_INTERVAL_SECONDS"
    waited=$((waited + POLL_INTERVAL_SECONDS))
  done

  echo "[ERROR] Timeout waiting for database health to become healthy."
  return 1
}

check_http() {
  local url="$1"
  local service_name="$2"
  local waited=0

  echo "[INFO] Checking $service_name endpoint: $url"
  while (( waited < MAX_WAIT_SECONDS )); do
    if curl -fsS "$url" >/dev/null; then
      echo "[OK] $service_name endpoint is reachable."
      return 0
    fi

    sleep "$POLL_INTERVAL_SECONDS"
    waited=$((waited + POLL_INTERVAL_SECONDS))
  done

  echo "[ERROR] Timeout waiting for $service_name endpoint: $url"
  return 1
}

show_diagnostics() {
  echo "[INFO] Collecting diagnostics..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps || true
  echo
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=80 backend || true
  echo
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs --tail=80 frontend || true
}

main() {
  require_file "$ENV_FILE"
  require_file "$COMPOSE_FILE"

  echo "[INFO] Redeploying production stack with rebuild..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build --force-recreate

  wait_for_db_healthy
  wait_for_container "$BACKEND_CONTAINER" "running"
  wait_for_container "$FRONTEND_CONTAINER" "running"

  check_http "$BACKEND_HEALTH_URL" "backend"
  check_http "$FRONTEND_HEALTH_URL" "frontend"

  echo "[SUCCESS] Production redeploy completed successfully."
}

trap 'show_diagnostics' ERR
main