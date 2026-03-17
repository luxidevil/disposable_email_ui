# Email Viewer Dashboard

## Project Overview
A monorepo email viewing application. Users pick a streaming service from a card grid, go through a verification page, then see emails for that service address. Admin panel at `/admin` manages which services appear. MongoDB stores services persistently across all browsers.

## Architecture

### Frontend (`/frontend`)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite (with SWC)
- **UI:** Tailwind CSS + shadcn/ui (Radix UI components)
- **Routing:** React Router v6
- **State:** ServicesContext (custom) + TanStack Query
- **Port:** 5000 (dev), served from `frontend/dist` by Express in production

### Backend API (`/api`)
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express
- **Auth:** Google OAuth2 via `googleapis` (for Gmail)
- **Database:** MongoDB Atlas via Mongoose
- **Port:** 3001 (dev), 8080 (production/Docker)
- **Key endpoints:**
  - `GET /api/services` — list services (no-cache)
  - `POST /api/services` — add service
  - `PATCH /api/services/:id` — toggle/update service
  - `DELETE /api/services/:id` — remove service
  - `GET /api/services/events` — SSE stream for real-time updates
  - `GET /api?to=<email>` — fetch Gmail emails (rate-limited, validated)

### Root (`/`)
- Monorepo root with build + start scripts
- `npm start` → runs `node api/index.js` (serves API + built frontend)
- `npm run build` → builds frontend via `cd frontend && npm run build`

## Key Files
- `api/index.js` — ALL backend logic (MongoDB, Gmail, SSE, CORS, rate limiting)
- `frontend/src/context/ServicesContext.tsx` — Services state, SSE, retry logic
- `frontend/src/pages/Cards.tsx` — Homepage with skeleton loader
- `frontend/src/pages/Admin.tsx` — Admin panel (credentials: devil / daKsh@3210)
- `frontend/src/pages/EmailDashboard.tsx` — Email list + viewer
- `frontend/vite.config.ts` — Vite dev proxy config
- `Dockerfile` — Production Docker build for Digital Ocean
- `AGENT_CONTEXT.md` — Detailed agent handoff document (read this for full context)

## Key Pages
- `/` — Cards page (streaming service cards)
- `/admin` — Admin dashboard (login: devil / daKsh@3210)
- `/dashboard/:emailAddress` — Email inbox for a specific address
- `/:name/verification` — Device verification page
- `/search` — Search emails

## Environment Variables
- `MONGODB_URI` — MongoDB Atlas connection string (set in Replit Secrets)
- `ALLOWED_ORIGIN` — Production domain for CORS (optional, for Digital Ocean)
- Gmail OAuth vars only needed if using local email API (currently uses external API)

## Workflows
- **Start application** — `cd frontend && npm run dev` (port 5000, webview)
- **Backend API** — `PORT=3001 node api/index.js` (port 3001)

## Important Behaviours
- MongoDB cold-start: backend waits up to 20s for DB connection before serving requests
- Frontend retries `/api/services` 3× with 3s delays (handles autoscale cold starts)
- Real-time: SSE at `/api/services/events` pushes updates to all browsers instantly
- Skeleton cards shown while loading (no flash of wrong/default data)
- Email API: calls external `https://api.luxidevilott.com` (not local API)

## Deployment
- **Replit:** Autoscale deployment, `npm start` runs on port 8080
- **Digital Ocean:** Docker via `Dockerfile` at root, port 8080
- Set `MONGODB_URI` env var on both platforms

## GitHub
- Remote: `https://github.com/luxidevil/disposable_email_ui`
- Branch: `main`
