# Central Auth System - Complete Architecture Overview

## Project Structure

The Central Auth System consists of **four** distinct components:

```
Central-Auth-API/
├── central-auth-api/          # Backend API (FastAPI + Python)
├── admin_control/             # Admin Portal (React - Netlify)
├── registration-portal/       # Registration Website (React - Single Deployment)
├── auth-sdk/                  # Login SDK (npm package)
└── client/                    # DEPRECATED: Legacy code - will be removed
```

---

## Component Overview

| Component | Purpose | Deployment | Technology |
|-----------|---------|------------|------------|
| **central-auth-api** | Backend API | Docker + Nginx | Python, FastAPI |
| **admin_control** | Admin dashboard | Netlify | React, TypeScript |
| **registration-portal** | User registration | Single website | React, TypeScript |
| **auth-sdk** | Login for 3rd parties | npm package | React, TypeScript |

---

## 1. Registration Portal (NEW)

**Purpose:** The ONLY place where new users can register.

**Deployment:** Single website (e.g., `register.yourcompany.com`)

**Contains:**

- Invitation verification page
- Registration form (personal info, photos)
- Oath recording page
- Submission confirmation
- All invitation-flow components

**Who uses it:**

- New users who receive an invitation
- Only accessed through invitation links
- One deployment, full control

---

## 2. Auth SDK

**Purpose:** Login functionality that ANY service can integrate.

**Distribution:** npm package (`@yourcompany/auth-sdk`)

**Contains:**

- `AuthProvider` - Configuration context
- `LoginPage` - Complete drop-in login page
- `QRScanner` - Camera-based QR code scanner
- `PinEntry` - PIN verification component
- `useAuth` hook - Auth state management
- `useSession` hook - Session management
- Theming system

**Who uses it:**

- Third-party developers
- Your own services
- Any website/app that wants to authenticate users

---

## Flow Diagram

```
                    ┌─────────────────────────────────┐
                    │     REGISTRATION FLOW           │
                    │   (Single Centralized Portal)   │
                    └─────────────────┬───────────────┘
                                      │
                    ┌─────────────────▼───────────────┐
                    │    register.yourcompany.com     │
                    │                                 │
                    │  1. Invitation Verification     │
                    │  2. Personal Info Form          │
                    │  3. Photo Upload                │
                    │  4. Oath Recording              │
                    │  5. Submit for Approval         │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
                    ┌─────────────────────────────────┐
                    │      ADMIN APPROVAL             │
                    │   (admin_control portal)        │
                    │                                 │
                    │  Admin reviews and approves     │
                    │  User receives auth_key         │
                    └─────────────────┬───────────────┘
                                      │
                                      ▼
        ┌─────────────────────────────┴─────────────────────────────┐
        │                     LOGIN FLOW                            │
        │              (Distributed Auth SDK)                       │
        └───────────────────────────────────────────────────────────┘
                    │                │                │
        ┌───────────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
        │   ServiceA.com   │  │ ServiceB.com│  │  MobileApp  │
        │                  │  │             │  │             │
        │ Uses auth-sdk    │  │ Uses auth-  │  │ Uses auth-  │
        │ to show login    │  │ sdk login   │  │ sdk login   │
        │                  │  │             │  │             │
        │ npm install      │  │ npm install │  │ npm install │
        │ @company/auth-sdk│  │ same pkg    │  │ same pkg    │
        └──────────────────┘  └─────────────┘  └─────────────┘
```

---

## User Journey

### New User Registration

1. **Receives invitation** via email/direct link
2. **Visits registration portal** (the ONLY registration website)
3. **Completes full flow:** verification → form → oath → submit
4. **Waits for approval** from admin
5. **Receives confirmation** with login instructions

### Existing User Login (on ANY integrated service)

1. **Visits any service** using the auth-sdk (ServiceA, ServiceB, etc.)
2. **Sees login page** rendered by auth-sdk components
3. **Scans QR code** with mobile app containing their auth_key
4. **Enters PIN** displayed on mobile
5. **Logged in!** to that specific service

---

## Why This Separation?

| Aspect | Registration Portal | Auth SDK |
|--------|---------------------|----------|
| **Control** | Full control, one deployment | Third parties deploy it |
| **Updates** | You update anytime | npm versioning |
| **Branding** | Your branding only | Customizable by services |
| **Security** | You control security | Standard security, users authorize |
| **Data** | Collects sensitive data | Only authenticates |
