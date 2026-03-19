#!/bin/bash
set -e

echo "Running database migrations..."
alembic upgrade head

echo "Starting application..."
PORT="${BACKEND_PORT:-8000}"

UVICORN_ARGS=(main:app --host 0.0.0.0 --port "$PORT")
if [ "${UVICORN_RELOAD:-0}" = "1" ]; then
	UVICORN_ARGS+=(--reload)
fi

exec uvicorn "${UVICORN_ARGS[@]}"
