# Registration Portal

The centralized registration portal for the Central Auth System. This is the **ONLY** place where new users can register for membership.

## Purpose

This portal handles the complete user registration flow:

1. **Invitation Verification** - Validate invitation code and PIN
2. **Personal Information** - Collect user details (name, email, phone, DOB)
3. **Address Information** - Collect address and bio
4. **Account Credentials** - Create username and password
5. **Photo Upload** - Upload identification photos (1-5 photos)
6. **Oath Recording** - Record membership oath audio
7. **Policy Acceptance** - Accept terms, privacy, conduct, and ethics policies
8. **Submission** - Submit application for admin approval

## Why Separate from Login SDK?

- **Single Point of Control**: All registrations go through one platform
- **Quality Control**: Admins can enforce standards
- **Security**: Sensitive data collection is centralized
- **Consistency**: Uniform onboarding experience for all users

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running (see `central-auth-api`)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Create a `.env` file (copy from `.env.example`):

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# App Configuration
VITE_APP_NAME=Membership Registration Portal
VITE_APP_VERSION=1.0.0

# Session Configuration
VITE_SESSION_TIMEOUT_HOURS=3
```

## Project Structure

```
src/
├── components/         # Reusable UI components
│   └── index.tsx       # Button, Input, Card, Alert, etc.
├── hooks/              # Custom React hooks
│   └── index.ts        # useRegistrationSession, useRegistrationForm, etc.
├── pages/              # Page components
│   ├── LandingPage.tsx       # Welcome & how it works
│   ├── InvitationPage.tsx    # Invitation verification
│   ├── RegistrationPage.tsx  # Multi-step registration form
│   ├── OathPage.tsx          # Audio recording & policies
│   └── CompletePage.tsx      # Success confirmation
├── services/           # API services
│   └── api.ts          # HTTP client & API methods
├── types/              # TypeScript type definitions
│   └── index.ts        # All interfaces & types
├── styles/             # CSS styles
│   └── index.css       # Tailwind & custom styles
├── App.tsx             # Main app with routing
└── main.tsx            # Entry point
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Welcome page with features & how it works |
| `/invitation` | Invitation | Verify invitation code and PIN |
| `/register` | Registration | 4-step registration form |
| `/oath` | Oath | Record oath & accept policies |
| `/complete` | Complete | Submission confirmation |

## API Integration

The portal connects to the Central Auth API backend:

### Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/system/status` | Check if registration is open |
| POST | `/api/register/` | Submit user registration |
| GET | `/api/register/check-email` | Check email availability |
| GET | `/api/register/check-username` | Check username availability |

### Session Management

- 3-hour session timeout for registration
- Session data stored in browser sessionStorage
- Automatic session resumption on page refresh

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useRegistrationSession` | Manage registration session & timer |
| `useRegistrationForm` | Form state & validation |
| `usePhotoUpload` | Photo upload with progress |
| `useAudioRecording` | Audio recording for oath |
| `useSystemStatus` | Check backend system status |
| `usePolicyAcceptance` | Track policy checkboxes |

## UI Components

The portal includes reusable components:

- `Button` - Primary, secondary, outline, ghost variants
- `Input` - Text input with label, error, hint
- `Textarea` - Multi-line input
- `Checkbox` - Styled checkbox with label
- `Card` - Glass-effect container
- `ProgressBar` - Visual progress indicator
- `Alert` - Info, success, warning, error alerts
- `TimerDisplay` - Session countdown timer
- `StepIndicator` - Multi-step progress
- `SystemStatusBadge` - Online/offline indicator

## Deployment

This portal should be deployed to a single URL that you control:

- Example: `register.yourcompany.com`

### Recommended Platforms

- Netlify (zero config)
- Vercel
- AWS Amplify
- Your own server (Nginx/Apache)

### Build & Deploy

```bash
# Build production bundle
npm run build

# Output is in ./dist folder
# Deploy the dist folder to your hosting platform
```

## Security Features

- All API calls are made over HTTPS (in production)
- Session data is stored securely in sessionStorage
- 3-hour session timeout for registration
- No sensitive data is exposed in URLs
- Form validation on both client and server
- Rate limiting on API endpoints (backend)

## Flow Diagram

```
┌─────────────────┐
│   Landing Page  │
│                 │
│ - Features      │
│ - How it works  │
│ - CTA button    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Invitation    │
│   Verification  │
│                 │
│ - Code input    │
│ - PIN input     │
│ - Terms accept  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Registration   │
│   Form (4 steps)│
│                 │
│ Step 1: Personal│
│ Step 2: Address │
│ Step 3: Creds   │
│ Step 4: Photos  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Oath Page     │
│                 │
│ - Read oath     │
│ - Record audio  │
│ - Verify        │
│ - Accept terms  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Submission    │
│   Complete      │
│                 │
│ - Confirmation  │
│ - Reference #   │
│ - Next steps    │
└─────────────────┘
```

## Development

### Running Tests

```bash
npm run test
npm run test:ui  # With UI
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

## License

Private - All rights reserved.
