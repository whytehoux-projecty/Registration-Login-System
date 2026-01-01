# Complete Deployment Guide

## Overview

This guide covers deploying the complete Central-Auth-API ecosystem:

1. **Backend API** → Local machine with Docker + Nginx (exposed via ngrok)
2. **Admin Portal** → Netlify
3. **Client Portal** → Local development or SDK distribution

---

## Part 1: Backend API Deployment (Docker + Nginx)

### Prerequisites

- Docker Desktop installed
- Docker Compose installed
- ngrok account (free tier works)

### Step 1: Prepare Production Environment

```bash
# Navigate to backend directory
cd central-auth-api

# Create data directory for persistent storage
mkdir -p data logs/nginx

# Copy production environment template
cp .env.production.example .env.production

# Edit production environment
nano .env.production
```

**Important settings to change:**

```env
SECRET_KEY=<generate-a-strong-random-key>
ALLOWED_ORIGINS=https://your-admin.netlify.app,https://your-client.netlify.app
SMTP_USER=your-real-email@gmail.com
SMTP_PASSWORD=your-app-password
ADMIN_EMAIL=your-real-admin@company.com
```

### Step 2: Build and Start Docker Containers

```bash
# Build the Docker images
docker-compose -f docker-compose.prod.yml build

# Start the containers
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 3: Verify the API is Running

```bash
# Check health endpoint
curl http://localhost/health

# Expected response:
# {"status":"healthy","timestamp":"...","system_open":true}

# Check API docs
open http://localhost/docs
```

### Step 4: Expose to Internet with ngrok

```bash
# Install ngrok (if not installed)
brew install ngrok

# Authenticate ngrok (one-time setup)
ngrok config add-authtoken <your-ngrok-auth-token>

# Start ngrok tunnel
ngrok http 80

# You'll see output like:
# Forwarding: https://abc123.ngrok.io -> http://localhost:80

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

**Important:** Save this ngrok URL! You'll need it for the admin portal.

### Step 5: Update CORS for ngrok

Edit `.env.production`:

```env
ALLOWED_ORIGINS=https://abc123.ngrok.io,https://your-admin.netlify.app
```

Restart containers:

```bash
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d
```

---

## Part 2: Admin Portal Deployment (Netlify)

### Prerequisites

- Node.js 18+ installed
- Netlify account (free tier works)
- Git repository for the project

### Step 1: Prepare the Project

```bash
# Navigate to admin control
cd admin_control

# Install dependencies
npm install

# Create production environment
cp .env.example .env.production

# Edit with your API URL (the ngrok URL from Part 1)
nano .env.production
```

Set the API URL:

```env
VITE_API_BASE_URL=https://abc123.ngrok.io
```

### Step 2: Test Build Locally

```bash
# Build the project
npm run build

# Preview the build
npm run preview

# Open http://localhost:4173 to verify
```

### Step 3: Deploy to Netlify (Option A: CLI)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize the site
netlify init

# Deploy
netlify deploy --prod
```

### Step 4: Deploy to Netlify (Option B: Web UI)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your Git provider (GitHub/GitLab/Bitbucket)
4. Select your repository
5. Configure build settings:
   - **Base directory:** `admin_control`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
6. Click "Deploy site"

### Step 5: Set Environment Variables on Netlify

1. Go to Site Settings → Environment Variables
2. Add variable:
   - Key: `VITE_API_BASE_URL`
   - Value: `https://abc123.ngrok.io` (your ngrok URL)
3. Trigger a new deploy for changes to take effect

---

## Part 3: Connecting Everything

### Update CORS on Backend

Once you have your Netlify URL, update the backend:

```bash
cd central-auth-api

# Edit production environment
nano .env.production
```

Add your Netlify URL:

```env
ALLOWED_ORIGINS=https://abc123.ngrok.io,https://your-site-name.netlify.app
```

Restart:

```bash
docker-compose -f docker-compose.prod.yml restart
```

### Test the Connection

1. Open your Netlify admin portal URL
2. Try to log in with admin credentials
3. If there are CORS errors, check:
   - Nginx is running (`docker-compose ps`)
   - ALLOWED_ORIGINS includes your Netlify domain
   - ngrok is still running

---

## Part 4: Creating an Admin Account

Before you can log into the admin portal, you need an admin account.

### Option A: Use the Script

```bash
# First, access the Docker container
docker exec -it central-auth-api bash

# Run the admin creation script
python scripts/create_admin.py

# Follow the prompts to create an admin
```

### Option B: Use the API Directly

```bash
# You'll need to create a custom script or use the database directly
# This is intentionally not exposed via API for security
```

---

## Part 5: Troubleshooting

### Problem: CORS Errors

**Symptoms:** Browser console shows "Access-Control-Allow-Origin" errors

**Solutions:**

1. Check `ALLOWED_ORIGINS` in `.env.production` includes your domain
2. Restart Docker containers after changing env
3. Verify Nginx is running: `docker-compose ps`
4. Check Nginx logs: `docker-compose logs nginx`

### Problem: Connection Refused

**Symptoms:** "Failed to fetch" or "Connection refused"

**Solutions:**

1. Verify Docker containers are running: `docker-compose ps`
2. Check if ngrok is still running (free accounts timeout after 8 hours)
3. Restart ngrok and update Netlify env vars with new URL

### Problem: Login Fails

**Symptoms:** "Incorrect username or password"

**Solutions:**

1. Verify admin account was created
2. Check the username (not email) is being used
3. Check API logs: `docker-compose logs auth-api`

### Problem: System Closed

**Symptoms:** "System is currently closed"

**Solutions:**

1. Check operating hours in `.env.production`
2. Verify your server time is correct
3. Temporarily set hours to 0-24 for testing

---

## Part 6: Making ngrok Persistent

Free ngrok URLs change every time you restart. For stability:

### Option A: ngrok Pro Account

Pay for a reserved domain that never changes.

### Option B: Keep ngrok Running

Use a process manager:

```bash
# Install pm2
npm install -g pm2

# Start ngrok with pm2
pm2 start "ngrok http 80" --name ngrok

# Save for restart
pm2 save
```

### Option C: Use a VPS

Deploy to a VPS (DigitalOcean, AWS, etc.) with a real domain and skip ngrok entirely.

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        INTERNET                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│    Netlify    │   │    ngrok      │   │   Client      │
│  Admin Portal │   │   Tunnel      │   │   (SDK)       │
│               │   │               │   │               │
│ React App     │   │ HTTPS:443     │   │ React App     │
└───────┬───────┘   └───────┬───────┘   └───────┬───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                   ┌───────────────┐
                   │    Nginx      │
                   │ Reverse Proxy │
                   │  Port: 80     │
                   └───────┬───────┘
                            │
                            ▼
                   ┌───────────────┐
                   │   FastAPI     │
                   │   Backend     │
                   │  Port: 8000   │
                   └───────┬───────┘
                            │
                            ▼
                   ┌───────────────┐
                   │   SQLite/     │
                   │  PostgreSQL   │
                   │   Database    │
                   └───────────────┘
```

---

## Quick Reference Commands

```bash
# Start everything
docker-compose -f docker-compose.prod.yml up -d
ngrok http 80

# Stop everything
docker-compose -f docker-compose.prod.yml down

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart after config change
docker-compose -f docker-compose.prod.yml restart

# Rebuild after code change
docker-compose -f docker-compose.prod.yml up -d --build

# Access container shell
docker exec -it central-auth-api bash
```
