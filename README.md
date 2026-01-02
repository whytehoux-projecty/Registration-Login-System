# MIS System

This repository contains the MIS (Membership Initiation System) codebase, organized into multiple modules plus a production-ready Docker Compose stack.

## Structure

- `MIS_SYSTEM-ENGINE_[SE]/`
  - `central-auth-api/` (FastAPI backend)
  - `admin-ui/` (Vite/React admin portal)
- `MIS_REGISTRATION-SYSTEM_[RS]/` (registration portal)
- `MIS_LOGIN-SYSTEM_[LS]/` (login SDK + mobile app)
- `docker-compose.prod.yml` (production compose stack: `mis_system-engine`)

## Run (Production Compose)

From the repo root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

## Endpoints

- API: `http://localhost/` (reverse-proxied by `auth-nginx`)
- Admin UI: `http://localhost:3000/`

