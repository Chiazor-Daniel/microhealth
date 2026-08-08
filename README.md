# MicroHealth — Full-Stack Healthcare Dashboard

MicroHealth is a Point-of-Care (POC) network making primary healthcare close, affordable, and accessible. This repository contains the complete full-stack application:

- **Public marketing site** (landing, about, solution, pricing, partners, contact, pitch)
- **Staff / admin dashboard** (patients, appointments, vitals, labs, prescriptions, inventory, payments, referrals, reports, staff, messages)
- **Patient portal** (home, appointments, vitals, prescriptions, labs, family members, messages, profile)

Live code is at **https://github.com/Chiazor-Daniel/microhealth**.

---

## Tech stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Backend:** Express + TypeScript + Drizzle ORM + SQLite (`better-sqlite3`)
- **Real-time:** Socket.io (notifications & broadcasts)
- **Container:** Docker + Docker Compose

---

## Quick start (Docker)

The fastest way to run everything locally or on a cloud host that supports Docker Compose:

```bash
# 1. Clone
git clone https://github.com/Chiazor-Daniel/microhealth.git
cd microhealth

# 2. Copy environment defaults
cp .env.example .env

# 3. Build and start
docker compose up --build -d

# 4. Seed demo data (only needed the first time)
docker compose exec backend npm run db:seed
```

Open http://localhost:8080

Demo accounts (no OTP):

| Role | Login | Password / Action |
|---|---|---|
| Admin | `admin@microhealth.ng` | `admin123` |
| Staff / Doctor | `dr.okonkwo@microhealth.ng` | `staff123` |
| Patient | `+234 803 456 7890` | Tap **Sign In** |

The backend is available at http://localhost:3001 and proxied through `/api` by nginx.

---

## Manual development

### Frontend

```bash
npm install
npm run dev
```

Runs on http://localhost:5173 by default.

### Backend

```bash
cd backend
npm install
npm run db:migrate
npm run db:seed
npm start
```

Runs on http://localhost:3001.

Environment variables live in `backend/.env`:

```env
DATABASE_URL=./data/microhealth.db
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production
PORT=3001
CORS_ORIGIN=http://localhost:5173,http://localhost:8080
```

---

## Deployment options

### Render.com (recommended free/cheap path)

1. Create a **Web Service** from this GitHub repo.
2. Set the **Root Directory** to `backend`.
3. Set **Build Command** to `npm install && npm run db:migrate`.
4. Set **Start Command** to `npm start`.
5. Add environment variables (`DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`).
6. For the frontend, create a **Static Site** from the same repo with **Publish Directory** `dist` and **Build Command** `npm install && npm run build`. Set `VITE_API_URL` to your backend Render URL + `/api`.

### Google Cloud Run

1. Build and push the images to Google Artifact Registry.
2. Deploy the backend service with a persistent volume mounted at `/app/data`.
3. Deploy the frontend service and set `VITE_API_URL`.

### Any VPS / Droplet

Use the provided `docker-compose.yml`. The SQLite database is persisted in the `./data` folder, so make sure that folder is on a volume or backed up.

---

## Project structure

```
.
├── src/                  # React frontend
├── backend/src/          # Express backend
│   ├── db/schema.ts      # Drizzle ORM SQLite schema
│   ├── config/           # Database + env
│   ├── controllers/      # Route handlers
│   ├── routes/           # API route definitions
│   └── db/seed.ts        # Demo accounts + data
├── Dockerfile            # Frontend image
├── backend/Dockerfile    # Backend image
├── docker-compose.yml    # One-command full stack
└── nginx.conf            # SPA routing + /api proxy
```

---

## Notes

- The backend uses **SQLite** so no Postgres setup is required. The data folder is mounted as a volume in Docker.
- Demo data is created by `npm run db:seed`. Run it once after the first migration.
- All destructive / create actions show a SweetAlert confirmation before executing.
- Patient portal data is fetched through a shared context so appointments, vitals, labs, and prescriptions stay in sync across pages.
