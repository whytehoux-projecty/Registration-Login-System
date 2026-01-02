# MIS System (Membership Initiation System)

<div align="center">
  <img src="assets/readme/hero.svg" alt="MIS System banner" width="100%" />
</div>

<div align="center">
  <a href="#"><img alt="Build" src="https://img.shields.io/badge/build-passing-22c55e?style=flat&logo=checkmarx&logoColor=white"></a>
  <a href="#"><img alt="Backend" src="https://img.shields.io/badge/backend-FastAPI-2563eb?style=flat&logo=fastapi&logoColor=white"></a>
  <a href="#"><img alt="Frontend" src="https://img.shields.io/badge/frontend-React%20%7C%20Vite-0ea5e9?style=flat&logo=react&logoColor=white"></a>
  <a href="#"><img alt="Deploy" src="https://img.shields.io/badge/deploy-Docker-2496ED?style=flat&logo=docker&logoColor=white"></a>
</div>

<p align="center">
  MIS System is a modular platform for secure identity, administrative oversight, and guided onboarding across web, mobile, and API clients.
</p>

## Overview

MIS System brings three primary capabilities together:

- Central authentication and authorization (JWT, roles, audit-friendly flows)
- Administrative dashboard for invitations, member lifecycle, and operational visibility
- Public registration portal for guided onboarding and validation

## Contents

- [Architecture](#architecture)
- [Modules](#modules)
- [Production Deployment](#production-deployment)
- [Local Development](#local-development)
- [Configuration](#configuration)
- [Security](#security)
- [Media & Licensing](#media--licensing)

## Architecture

<div align="center">
  <img src="assets/readme/architecture.svg" alt="System architecture diagram showing clients routed through Nginx to Central Auth API and database" width="100%" />
</div>

GitHub also renders a live diagram below for quick scanning:

```mermaid
graph TD
  User((User))
  Admin((Admin))

  subgraph "Frontend Layer"
    RS[Registration Portal]
    UI[Admin Dashboard]
    Mobile[Mobile / SDK Clients]
  end

  subgraph "Gateway Layer"
    Nginx[Nginx Reverse Proxy]
  end

  subgraph "Backend Layer"
    API[Central Auth API]
    DB[(Database)]
  end

  User --> RS
  Admin --> UI
  User --> Mobile

  RS --> Nginx
  UI --> Nginx
  Mobile --> Nginx

  Nginx --> API
  API --> DB
```

## Modules

| Module | Path | Purpose | Tech |
| --- | --- | --- | --- |
| Central Auth API | `MIS_SYSTEM-ENGINE_[SE]/central-auth-api/` | Authentication, JWT issuance, admin workflows | FastAPI |
| Admin UI | `MIS_SYSTEM-ENGINE_[SE]/admin-ui/` | Admin dashboard and operational tools | React, Vite |
| Registration Portal | `MIS_REGISTRATION-SYSTEM_[RS]/` | Public onboarding and registration flow | React, Vite |
| Login System | `MIS_LOGIN-SYSTEM_[LS]/` | Client SDKs / mobile integrations | Client-side |

## Production Deployment

The production stack runs as a single compose project and includes:

- `central-auth-api` (backend)
- `admin-ui` (frontend)
- `auth-nginx` (gateway)

From the repository root:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Endpoints (default):

| Service | URL | Notes |
| --- | --- | --- |
| API (via gateway) | `http://localhost/` | Reverse-proxied by `auth-nginx` |
| Admin UI | `http://localhost:3000/` | Admin portal |
| API docs | `http://localhost/docs` | Swagger UI |

## Local Development

Common workflows:

- Registration Portal:
  - `cd MIS_REGISTRATION-SYSTEM_[RS]`
  - `npm install`
  - `npm run dev`
- Admin UI:
  - `cd MIS_SYSTEM-ENGINE_[SE]/admin-ui`
  - `npm install`
  - `npm run dev`
- Central Auth API:
  - `cd MIS_SYSTEM-ENGINE_[SE]/central-auth-api`
  - run via your Python environment (FastAPI)

<div align="center">
  <img src="assets/readme/ui-mock.svg" alt="UI preview mock showing dashboard layout and visual hierarchy" width="100%" />
</div>

## Configuration

Key configuration is managed via environment variables and compose configuration:

- Database: `DATABASE_URL` (SQLite or PostgreSQL)
- Production flags: `PRODUCTION`, `DEBUG_MODE`
- Frontend API base URL: `VITE_API_BASE_URL`

Refer to `docker-compose.prod.yml` for the production wiring.

## Security

Security posture and engineering practices:

- Password hashing with bcrypt
- Token-based auth (JWT)
- Input validation via strict schemas
- Separation of concerns between gateway, API, and UIs

## Media & Licensing

- Images in `assets/readme/` are generated SVGs included in this repository.
- Badge images are served by shields.io and are subject to their own terms.
