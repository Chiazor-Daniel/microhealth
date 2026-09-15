# MicroHealth Patient Experience Redesign — Refactor Plan

> Branch: `patient-redesign`
> Baseline commit: `00451103` — checkpoint before patient experience redesign

This document captures the full understanding of the existing codebase and the new product direction for transforming the patient-facing experience into a calm, intelligent, mobile-first health companion.

---

## 1. EXISTING CODEBASE UNDERSTANDING

### 1.1 Project Structure

```
/home/buzz/Downloads/MicroHealth Design System (1)
├── src/                        # Vite + React 18 + TypeScript frontend
│   ├── app/
│   │   ├── App.tsx             # All routes
│   │   ├── components/         # UI (shadcn/Radix), shared, figma helpers
│   │   ├── hooks/              # useAuth, usePatientData, useSocket
│   │   ├── layouts/            # AdminLayout, PatientLayout
│   │   ├── pages/              # public, auth, admin, patient, system
│   │   ├── providers/          # AppProviders (BrowserRouter + Auth + PatientData)
│   │   ├── services/           # API service layer
│   │   └── utils/              # csvExport, etc.
│   ├── data/mockData.ts
│   ├── imports/                # pasted reference material
│   ├── styles/                 # globals.css, theme.css, tailwind.css, index.css
│   └── main.tsx
├── backend/                    # Express + TypeScript + Drizzle ORM + SQLite
│   ├── src/
│   │   ├── app.ts              # Express app, routes, middleware
│   │   ├── index.ts            # server entry, auto-migration, auto-seed
│   │   ├── config/             # env, database.ts
│   │   ├── controllers/        # route handlers
│   │   ├── db/                 # schema.ts, seed.ts, migrate.ts
│   │   ├── middleware/         # auth.ts, errorHandler.ts, validate.ts
│   │   ├── routes/             # API route definitions
│   │   ├── services/           # auth.service.ts
│   │   ├── websocket/          # server.ts (Socket.io)
│   │   └── __tests__/          # Vitest + Supertest
│   ├── package.json
│   ├── drizzle.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.ts
├── index.html
└── pnpm-workspace.yaml
```

### 1.2 Tech Stack

- **Frontend:** Vite 6, React 18.3.1, TypeScript, Tailwind CSS v4.1.12, Radix/shadcn UI components, motion, lucide-react, recharts, react-router 7
- **Backend:** Express 4, TypeScript, Drizzle ORM, better-sqlite3, socket.io, JWT auth, bcryptjs
- **Container:** Docker + Docker Compose, single-image build (frontend → backend/frontend/dist)
- **Package manager:** pnpm workspace

### 1.3 Existing Routes

#### Public / Marketing
- `/` Landing page
- `/about`, `/solution`, `/pricing`, `/partners`, `/contact`, `/pitch`

#### Auth
- `/login` — staff/admin login
- `/patient/login` — patient phone login
- `/forgot-password`
- `/unauthorized`

#### Admin/staff dashboard
- `/admin/*` — dashboard, patients, appointments, consultations, vitals, labs, prescriptions, inventory, payments, referrals, reports, staff, messages, settings

#### Patient portal (current)
- `/patient/home`
- `/patient/appointments`
- `/patient/vitals`
- `/patient/prescriptions`
- `/patient/labs`
- `/patient/messages`
- `/patient/book`
- `/patient/family`
- `/patient/profile`

### 1.4 Existing Backend API Routes

| Route | Auth | Notes |
|-------|------|-------|
| `POST /api/auth/login` | public | email + password |
| `POST /api/auth/patient/login` | public | phone only, no password |
| `GET /api/auth/me` | auth | returns user + profile |
| `/api/patients/*` | auth | CRUD, family members |
| `/api/appointments/*` | auth | patients can create |
| `/api/vitals/*` | auth | staff record, patients read |
| `/api/prescriptions/*` | auth | refill endpoint |
| `/api/labs/*` | auth | lab results |
| `/api/messages/*` | auth | messages + notifications |
| `/api/dashboard/*` | auth | admin KPIs + `/patient-home` |
| `/api/reports/*` | auth | reports |

### 1.5 Existing Database Schema

Tables: `users`, `patients`, `staff`, `appointments`, `vitals`, `lab_tests`, `prescriptions`, `inventory`, `payments`, `referrals`, `messages`, `notifications`, `family_members`

Key relations:
- `users` → `patients` (one-to-one via `userId`)
- `users` → `staff` (one-to-one via `userId`)
- `patients` → appointments, vitals, labTests, prescriptions, payments, referrals, familyMembers
- `staff` → patients, appointments, vitals, labTests, prescriptions, referrals

### 1.6 Existing State & Data Flow

- `useAuth` — AuthContext: user, login, patientLogin, logout, role, isAuthenticated
- `usePatientData` — PatientDataContext: loads appointments, vitals, labs, prescriptions, family, notifications for the logged-in patient
- `useSocket` — global socket.io client, authenticates via JWT token
- `api.ts` — fetch wrapper with bearer token and credentials include

### 1.7 Existing Demo Accounts

From `backend/src/db/seed.ts`:

| Role | Login | Password / Action |
|------|-------|-------------------|
| Admin | `admin@microhealth.ng` | `admin123` |
| Staff / Doctor | `dr.okonkwo@microhealth.ng` | `staff123` |
| Patient | `+234 803 456 7890` | Tap Sign In |

### 1.8 Existing Socket.io

Backend (`backend/src/websocket/server.ts`):
- Authenticates socket via JWT
- Admins/staff join `admin:live` and `unit:all`
- Patients join `patient:${userId}`
- Emit helpers: `emitToAdmins`, `emitToPatient`, `emitToAll`

Frontend (`src/app/hooks/useSocket.tsx`):
- Global socket singleton
- Authenticates with token
- `useSocket()` returns `{ socket, on, emit }`

Current usage: mostly admin broadcasts (vital recorded, appointment created, message received). Patient-specific emits exist (`emitToPatient`) but are not heavily used by the patient UI yet.

---

## 2. NEW PRODUCT DIRECTION

### 2.1 Product Split

MicroHealth has two distinct products:

1. **Admin/staff healthcare dashboard** — KEEP existing functionality and workflows intact.
2. **Patient mobile experience** — REDESIGN substantially.

The patient app must NOT feel like a hospital admin dashboard squeezed onto a phone. It must feel like:

> A calm, intelligent health companion that continuously helps a patient understand what is happening with their health.

### 2.2 Central Experience

**Vitals + proactive AI + simple care management**

The AI is not a generic Q&A chatbot. It is a **persistent, proactive health agent** that:
- Observes patient information continuously
- Detects meaningful changes and trends
- Creates useful insights and reminders
- Communicates naturally with the patient

### 2.3 New Patient Information Architecture

Primary bottom navigation:

```
Home
Vitals
AI
Care
Profile
```

- **Home** — How am I doing? Greeting, overall status, key vitals, AI insight, today timeline, upcoming care.
- **Vitals** — Beautiful readable metrics, baselines, trends, history.
- **AI** — Active insights + interactive conversation with structured UI responses.
- **Care** — Appointments, prescriptions, labs, messages, family (reorganized from current dashboard pages).
- **Profile** — Personal info, wearable/devices, notifications, emergency, security, help.

### 2.4 Core Visual Direction: MicroHealth Calm Glass

References: Oura, WHOOP, Apple Health, modern liquid-glass mobile interfaces.

**Visual characteristics:**
- airy, premium but not flashy, clinical, trustworthy, human, modern, calm
- highly readable, subtle glassmorphism, restrained motion
- generous whitespace, rounded surfaces, excellent typography hierarchy

**Avoid:**
- heavy neumorphism, excessive gradients/transparency, dark futuristic dashboards
- giant glowing AI effects, overly colorful cards, generic “AI SaaS” aesthetics, dashboard clutter

### 2.5 Color System

```
Primary Green:      #16A34A
Primary Dark:       #15803D
Primary Soft:       #DCFCE7
Primary Pale:       #F0FDF4

Background:         #F7FAF8
Surface:            #FFFFFF
Glass Surface:      rgba(255,255,255,0.65)
Border:             rgba(16,24,40,0.08)

Text Primary:       #0F2418
Text Secondary:     #647067
Text Muted:         #8A968E

Success:            #16A34A
Warning:            #F59E0B
Error:              #EF4444
Info:               #3B82F6
AI Accent:          #7ABF8A
```

Use green strategically: active nav, primary actions, healthy states, AI activity, positive trends, selected controls, wearable connection. Keep the UI mostly neutral/off-white.

### 2.6 Typography

```
H1: 28–32px / bold
H2: 22–24px / semibold
H3: 18–20px / semibold
Body: 15–16px / regular
Secondary: 13–14px
Caption: 12px
Vital numbers: 30–40px / bold
```

Numbers for vitals should dominate. Example:
```
72 BPM
Heart rate
Within your usual range
```

Use existing Work Sans font setup.

### 2.7 Surfaces

- **Solid cards** — important health data (heart rate, BP, SpO2, temp, medications, appointments)
- **Soft glass cards** — AI insights, floating notifications, secondary info, contextual overlays

Glass properties:
```
background: rgba(255,255,255,0.60-0.80)
backdrop-filter: blur(16-24px)
border: 1px solid rgba(255,255,255,0.7)
soft shadow
border-radius: 20-28px
```

Do not make everything glass.

---

## 3. MOCK WEARABLE SYSTEM

There is no real wristband yet. Build a clean abstraction so the rest of the app doesn't care about the source.

### 3.1 Provider Abstraction

```
MockWearableProvider  → now
MicroHealthWearableProvider → later
```

### 3.2 Mock Vital Payload

```json
{
  "patientId": "patient_001",
  "timestamp": "2026-09-15T14:00:00Z",
  "heartRate": 72,
  "spo2": 98,
  "temperature": 36.6,
  "systolic": 118,
  "diastolic": 76
}
```

### 3.3 Realistic Patterns

The mock provider must generate realistic, non-random streams:
- stable periods
- gradual upward/downward trends
- temporary spikes
- recovery
- unusual but meaningful patterns

This is critical because the AI needs meaningful events to react to.

### 3.4 Where It Lives

- Frontend: `src/app/patient/wearable/` — mock provider, types, hooks
- Backend: new `POST /api/wearables/reading` route + controller to accept readings and store them in `vitals` table
- For demo purposes, the mock stream can run in the frontend or be driven by a backend cron/worker

---

## 4. PROACTIVE AI HEALTH AGENT

### 4.1 NOT a Chatbot

Do NOT implement:
```
User asks → LLM answers
```

Implement:
```
Patient data
      ↓
Event / trend detection
      ↓
Patient context
      ↓
Clinical rules
      ↓
AI reasoning
      ↓
Action / insight
      ↓
Notification / socket event
      ↓
Patient UI
```

### 4.2 Agent Behaviors

- **Trend detection** — resting heart rate elevated for 3 days
- **Medication reminders** — evening medication due soon
- **Appointment reminders** — Dr. Okonkwo tomorrow at 10:30 AM
- **New result alerts** — latest lab result available
- **Recovery updates** — heart rate back to baseline
- **Wearable disconnect** — no readings received recently
- **Care coordination** — help book/reschedule, send message to care team, create reminders

### 4.3 AI Personality

- calm, warm, concise, intelligent, reassuring, proactive
- never robotic, never alarmist, never overly verbose
- sounds like: “I noticed something.” not “ALERT: ABNORMAL BIOMETRIC EVENT DETECTED.”
- explains why it is bringing something to attention

### 4.4 Safety Architecture

LLM must NOT independently diagnose. Architecture:

```
Vitals
  ↓
Rule Engine
  ↓
Event classification
  ↓
AI interpretation
  ↓
Patient-friendly explanation
```

Deterministic rules classify events into:
```
INFO
WATCH
ATTENTION
URGENT
```

LLM handles interpretation, context, personalization, explanation, prioritization, natural language. Explicit rules handle urgent escalation.

### 4.5 RAG / Context Assembly

Patient context:
```
Patient profile
Baseline vitals
Recent vitals
Vital trends
Medications
Allergies
Lab results
Appointments
Recent messages
Previous AI insights
Clinician-provided information
```

Medical knowledge layer separate.

Architecture:
```
                 ┌─────────────────┐
                 │ Patient Context │
                 └────────┬────────┘
                          │
                          ▼
                    ┌───────────┐
                    │ AI Agent  │
                    └─────┬─────┘
                          ▲
                          │
                 ┌────────┴────────┐
                 │ Medical Knowledge │
                 └─────────────────┘
```

Use LangChain/LangGraph where helpful. Use local Ollama API. Start simple.

### 4.6 Agent Tools

```
get_patient_profile()
get_recent_vitals()
get_vital_trend()
get_medications()
get_lab_results()
get_appointments()
get_recent_messages()
get_previous_insights()

find_available_appointments()
book_appointment()
reschedule_appointment()
cancel_appointment()

create_reminder()
update_reminder()
delete_reminder()

send_notification()
prepare_message_to_care_team()
```

Tools are deterministic and permission-aware. Sensitive actions require confirmation UI.

### 4.7 Chat Must Be Interactive

Agent responses can include:
- text
- cards (vitals, appointments, medications, labs)
- buttons / quick actions
- charts / trend visualizations
- appointment selectors
- timeline cards
- confirmation cards
- expandable explanations

GenUI-style rendering. The LLM decides when a visual component is more useful than plain text.

### 4.8 Shared Brain

Proactive insights and conversation use the same:
- patient context
- memory
- tools
- medical knowledge
- rules
- agent state

A notification opened by the patient should transition naturally into conversation.

---

## 5. REAL-TIME ARCHITECTURE

Use existing Socket.io aggressively but intelligently.

```
mock wearable
     ↓
new vital
     ↓
event engine
     ↓
agent
     ↓
new insight
     ↓
socket.io
     ↓
patient app
```

Patient sees updates without refreshing. Key demo moment: new insight card arrives while app is open.

---

## 6. NEW COMPONENT SYSTEM

Create/reuse in `src/app/patient/components/`:

```
HealthStatusCard
VitalCard
VitalTrend
VitalDetailCard
HealthAgentCard
InsightCard
NotificationCard
Timeline
AppointmentCard
MedicationCard
LabResultCard
GlassCard
StatusBadge
SegmentedTabs
FloatingBottomNav
AIOrb / AIIndicator
WearableStatusCard
```

These share the same spacing, radius, typography, shadow, border, and motion tokens.

---

## 7. RESPONSIVE / MOBILE-FIRST

Primary breakpoints to optimize:
- 375px
- 390px
- 393px
- 430px

Do not merely narrow desktop components. Recompose layouts intentionally. Comfortable touch targets, bottom nav accessible, graceful text wrapping, readable charts.

---

## 8. IMPLEMENTATION PHASES

### Phase 1: Foundation
- Create design tokens file (`src/app/patient/theme.ts`)
- Create reusable patient components
- Replace `PatientLayout` with new shell + floating bottom nav
- Update `App.tsx` patient routes to: Home, Vitals, AI, Care, Profile
- Move existing pages under `/patient/care/*` if still needed

### Phase 2: Mock Wearable + Backend Vitals Stream
- Create mock wearable provider and abstraction
- Add `POST /api/wearables/reading` backend route
- Generate realistic vital streams

### Phase 3: Rule Engine + AI Agent
- Create `backend/src/agent/` module
- Add `ai_insights` table to schema
- Build deterministic rules
- Build patient context assembly (RAG)
- Integrate Ollama LLM
- Persist insights and emit via Socket.io

### Phase 4: Patient UI
- Build new Home
- Build new Vitals
- Build new AI screen
- Rework Care section
- Rework Profile

### Phase 5: Real-Time + Polish
- Wire Socket.io for live insight arrival
- Add subtle motion
- Test complete flow end-to-end
- Iterate based on feedback

---

## 9. BACKEND CHANGES REQUIRED

### 9.1 Schema Additions

New table(s):
```sql
ai_insights:
  id uuid primary key
  patientId references patients.id
  type: string (trend, reminder, result, recovery, wearable, system)
  priority: string (info, watch, attention, urgent)
  title: string
  message: string
  context: json
  sourceEvent: string
  isRead: boolean default false
  dismissedAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp

wearable_sessions:
  id uuid primary key
  patientId references patients.id
  deviceName: string
  connected: boolean
  batteryLevel: integer
  lastSyncedAt: timestamp
  createdAt: timestamp
```

### 9.2 New Routes

```
POST   /api/wearables/reading
GET    /api/wearables/status/:patientId
GET    /api/ai/insights
POST   /api/ai/insights/:id/read
POST   /api/ai/insights/:id/dismiss
POST   /api/ai/chat
GET    /api/ai/timeline/:patientId
```

### 9.3 New Controllers

- `backend/src/controllers/wearable.controller.ts`
- `backend/src/controllers/ai.controller.ts`

### 9.4 New Agent Module

```
backend/src/agent/
├── index.ts
├── rules.ts           # deterministic thresholds
├── engine.ts          # event processing loop
├── rag.ts             # patient context assembly
├── ollama.ts          # LLM client
├── tools.ts           # agent tool definitions
├── insights.ts        # insight creation / persistence
└── types.ts           # shared types
```

### 9.5 Existing Files to Leave Intact

All admin/staff controllers, routes, pages, and layouts remain unchanged unless absolutely necessary for shared utilities.

---

## 10. MVP SUCCESS CRITERIA

After this work, I should be able to:

1. Log into the patient account.
2. Open a polished mobile patient home screen.
3. See realistic mock wearable vitals.
4. Watch those vitals update.
5. See baseline/trend interpretation.
6. Have the system detect a meaningful simulated change.
7. Have the proactive AI agent generate an insight.
8. See that insight appear in real time through Socket.io.
9. Open the AI page and understand why the agent raised the insight.
10. Ask the agent a follow-up question.
11. Receive patient-specific context-aware answers.
12. View vitals history and trends.
13. View appointments, prescriptions and labs through the Care section.
14. See wearable connection status.
15. Have the whole patient interface feel like one coherent product.

---

## 11. OPEN QUESTIONS / DECISIONS

1. **Ollama model:** What local model is available? Suggest `llama3.1:8b` or `phi3` if none installed. Need to verify before agent work.
2. **Family members:** Should Family live under **Care** or **Profile** in the new nav?
3. **Booking flow:** Should the agent reuse the existing step booking UI, or build a new inline appointment selector in chat?
4. **Mock wearable driver:** Run in browser (frontend) or backend worker? Frontend is simpler for demo; backend is more realistic.
5. **Image mockups:** The user mentioned image mockups. This model cannot view images. Visual notes need to be added manually or described in follow-up messages.

---

## 13. ADDITIONAL PRODUCT DETAILS FROM LATEST SPEC

### 13.1 Medical Safety Architecture

```
Vitals
 ↓
Deterministic clinical/event rules
 ↓
Severity/event type
 ↓
Patient context
 ↓
Medical retrieval
 ↓
LLM explanation
 ↓
UI/action
```

The LLM must never invent clinical thresholds. It must not diagnose. It must clearly distinguish general guidance vs clinical diagnosis vs urgent escalation. Sensitive actions require explicit confirmation UI.

### 13.2 Knowledge Base Structure

```
knowledge/
├── vitals/
│   ├── heart-rate.md
│   ├── blood-pressure.md
│   ├── oxygen-saturation.md
│   └── temperature.md
├── medications/
│   └── demo-medications.md
├── labs/
│   └── common-labs.md
├── wellness/
│   ├── hydration.md
│   ├── sleep.md
│   └── activity.md
└── escalation/
    └── escalation-guidance.md
```

Knowledge records should include metadata:
```yaml
source:
title:
version:
reviewed_at:
reviewed_by:
topic:
```

### 13.3 GenUI / Structured UI Examples

The agent chat must render:
- text
- buttons / quick actions
- vital cards
- charts (Recharts)
- appointment selectors
- medication cards
- lab cards
- reminder confirmations
- timelines
- expandable explanations

Example user queries and expected UI:
- "How has my heart rate been this week?" → trend chart + average + baseline + status
- "Book me an appointment" → interactive appointment selector
- "When is my appointment?" → appointment card
- "What are my latest labs?" → lab result cards
- "Remind me tomorrow at 8" → reminder confirmation card

### 13.4 Demo Scenarios

- **A — stable patient:** Home shows stable status, normal vitals, timeline.
- **B — rising heart rate:** Mock wearable drives HR up, trend detected, WATCH insight created, appears via Socket.io.
- **C — recovery:** HR returns to baseline, agent creates positive update.
- **D — appointment booking:** Patient asks to book, agent shows choices, confirms, books, creates reminder.
- **E — can't see doctor yet:** Patient reports dizziness, agent asks severity/symptoms, provides safe interim guidance, escalates if rules trigger.
- **F — new lab:** Lab result inserted, agent creates insight, patient sees lab card and asks for explanation.

### 13.5 Event Types

```
VITAL_READING
VITAL_TREND_CHANGE
LAB_RESULT_AVAILABLE
APPOINTMENT_UPCOMING
APPOINTMENT_CHANGED
MEDICATION_DUE
WEARABLE_OFFLINE
HEALTH_TREND_RECOVERY
REMINDER_DUE
```

### 13.6 Final Design Target

Mobile-first, off-white background, white cards, green accent, generous whitespace, rounded surfaces, soft shadows, subtle glass for AI/floating elements. The patient should understand their health state within seconds. AI feels proactive and calm, not chatbot-like.

### 13.7 Implementation Order

1. Inspect architecture (done)
2. Create patient design tokens
3. Build mobile shell + bottom navigation
4. Rebuild Home
5. Rebuild Vitals
6. Build MockWearableProvider
7. Build event detection + trend system
8. Build proactive Health Agent
9. Add patient RAG
10. Add curated medical knowledge RAG
11. Add agent tools/actions
12. Connect Socket.io to proactive events
13. Build interactive AI/GenUI response rendering
14. Integrate appointments/reminders/labs/medications
15. Build Care and Profile
16. Run demo scenarios
17. Polish spacing, typography, motion, responsive, accessibility

### 13.8 Open Questions Answered

| Question | Decision |
|----------|----------|
| Ollama model | `gemma3:4b` is available locally. Use it as default with graceful fallback. |
| Family location | Move Family Members into **Profile** section, not primary nav. |
| Booking flow | Reuse existing multi-step booking, launch from agent quick action or confirmation card. |
| Mock wearable driver | Frontend `MockWearableProvider` for demo; backend `POST /api/wearables/reading` ready for real hardware. |
| Visual mockups | Cannot be viewed. Rely on written spec and section 13.6 description. |

## 14. FILES CREATED / MODIFIED SO FAR

- `refactor.md` (this file)

Next: Phase 1 implementation begins on this branch.
