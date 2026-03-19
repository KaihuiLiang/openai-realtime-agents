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

## 3) Production All-Docker

Production can run fully in Docker (db + backend + frontend) via:
- `docker-compose.prod.yml`

Start production stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

View logs:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
```

Stop production stack:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

In this mode:
- Frontend maps to `127.0.0.1:3001`
- Backend maps to `127.0.0.1:8001`
- DB maps to `127.0.0.1:5433`

## 4) Switching commands

Switch to dev:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml down
sudo systemctl enable --now realtime-dev-backend.service realtime-dev-frontend.service
```

Switch to prod:

```bash
sudo systemctl disable --now realtime-dev-frontend.service realtime-dev-backend.service
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
```

Check status:

```bash
systemctl is-enabled realtime-dev-frontend.service realtime-dev-backend.service
systemctl is-active realtime-dev-frontend.service realtime-dev-backend.service
docker compose --env-file .env.production -f docker-compose.prod.yml ps
```

## 5) Notes

- This guide avoids changing app code and focuses on operational separation.
- Keep secrets only in real env files (`.env.development`, `.env.production`), not in example files.
- In docker production mode, set `NEXT_PUBLIC_BACKEND_URL` and `NEXT_PUBLIC_APP_URL` in `.env.production` to your public domain.
