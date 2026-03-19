# Environment Switching Guide (Dev <-> Prod)

This project currently runs on this machine with systemd `dev` services:
- `realtime-dev-frontend.service`
- `realtime-dev-backend.service`

## 1) Environment Files

Use separate files by environment:
- `.env.development` (from `.env.development.example`)
- `.env.production` (from `.env.production.example`)

Recommended copy commands:

```bash
cp .env.development.example .env.development
cp .env.production.example .env.production
```

## 2) Current Dev Port Mapping

Current dev mapping is:
- Frontend: `3000`
- Backend: `8000`

You can verify:

```bash
ss -ltnp | grep -E ':3000|:8000'
curl -sS http://127.0.0.1:8000/health
curl -I http://127.0.0.1:3000
```

## 3) Suggested systemd split

Keep separate unit names for each environment.

Example naming:
- `realtime-dev-frontend.service`
- `realtime-dev-backend.service`
- `realtime-prod-frontend.service`
- `realtime-prod-backend.service`

For each unit, set `EnvironmentFile` to the matching env file.

Example snippet for frontend:

```ini
[Service]
WorkingDirectory=/home/ubuntu/openai-realtime-agents
EnvironmentFile=-/home/ubuntu/openai-realtime-agents/.env.production
ExecStart=/home/ubuntu/.nvm/versions/node/v22.20.0/bin/node /home/ubuntu/openai-realtime-agents/node_modules/.bin/next start -p 3001 -H 0.0.0.0
Restart=always
RestartSec=3
```

Example snippet for backend (prod, no reload):

```ini
[Service]
WorkingDirectory=/home/ubuntu/openai-realtime-agents/backend
EnvironmentFile=-/home/ubuntu/openai-realtime-agents/.env.production
ExecStart=/usr/local/bin/python3.11 -m uvicorn main:app --host 127.0.0.1 --port 8001
Restart=always
RestartSec=3
```

## 4) Switching commands

Switch to dev:

```bash
sudo systemctl disable --now realtime-prod-frontend.service realtime-prod-backend.service
sudo systemctl enable --now realtime-dev-backend.service realtime-dev-frontend.service
```

Switch to prod:

```bash
sudo systemctl disable --now realtime-dev-frontend.service realtime-dev-backend.service
sudo systemctl enable --now realtime-prod-backend.service realtime-prod-frontend.service
```

Check status:

```bash
systemctl is-enabled realtime-dev-frontend.service realtime-dev-backend.service realtime-prod-frontend.service realtime-prod-backend.service
systemctl is-active realtime-dev-frontend.service realtime-dev-backend.service realtime-prod-frontend.service realtime-prod-backend.service
```

## 5) Notes

- This guide avoids changing app code and focuses on operational separation.
- Keep secrets only in real env files (`.env.development`, `.env.production`), not in example files.
- If a production service file does not exist yet, create it first before running `enable --now`.
