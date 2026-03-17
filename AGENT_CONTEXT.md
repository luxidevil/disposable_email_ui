# Agent Context — Email Viewer Dashboard

> **For Replit AI agents:** Read this file first. It contains the complete picture of what was built, every decision made, and exactly how everything works. Reading this before starting saves significant time and credits.

---

## What This Project Is

A streaming service email viewer dashboard. Users pick a streaming service (NF, Crunchy, YT Premium, Prime, etc.) from a card grid on the homepage, get taken to a verification page, and then see emails sent to that service's email address. There is an admin panel to manage which services show on the homepage.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite (port 5000 in dev) |
| Backend | Node.js + Express (port 3001 in dev, 8080 in production) |
| Database | MongoDB Atlas via Mongoose |
| UI | Tailwind CSS + shadcn/ui (Radix UI) |
| Routing | React Router v6 |
| Real-time | Server-Sent Events (SSE) |

---

## Monorepo Structure

```
/
├── api/
│   ├── index.js          ← Express server (ALL backend logic here)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── ServicesContext.tsx   ← Services state + SSE + retry logic
│   │   ├── pages/
│   │   │   ├── Cards.tsx             ← Homepage with service cards + skeleton loader
│   │   │   ├── Admin.tsx             ← Admin dashboard (/admin)
│   │   │   ├── EmailDashboard.tsx    ← Email list/viewer
│   │   │   └── deviceVerification.tsx
│   │   └── components/
│   │       ├── EmailFeed.tsx
│   │       ├── EmailCard.tsx
│   │       └── ...
│   ├── dist/             ← Built frontend (served by Express in production)
│   ├── vite.config.ts    ← Proxy: /api/* → localhost:3001
│   └── package.json
├── Dockerfile            ← For Digital Ocean deployment
├── .dockerignore
├── .env.example
└── package.json          ← Root: build + start scripts
```

---

## How the Two Workflows Work

| Workflow | Command | Purpose |
|---|---|---|
| `Start application` | `cd frontend && npm run dev` | Vite dev server on port 5000 |
| `Backend API` | `PORT=3001 node api/index.js` | Express API on port 3001 |

In **development**, Vite proxies `/api/*` to `localhost:3001` (see `vite.config.ts`).

In **production**, `node api/index.js` serves BOTH the built frontend from `frontend/dist` AND the API on a single port (8080 default, or `process.env.PORT`).

---

## MongoDB — Critical Details

- **Secret name:** `MONGODB_URI` (stored in Replit Secrets)
- **Connection string:** `mongodb+srv://luxuriousdevil0_db_user:1234qwer@cluster0.wlx674k.mongodb.net/?appName=Cluster0`
- **No database name** in the URI → Mongoose uses `test` database by default
- **Collection:** `services` (Mongoose model: `Service`)
- **Seeding:** On first connect, if collection is empty, 4 default services are inserted automatically

### Service Schema
```js
{
  name: String,       // e.g. "NF"
  color: String,      // Tailwind class e.g. "bg-red-700"
  img: String,        // URL or base64 data URI
  active: Boolean,    // true = shown on homepage
  order: Number,      // display order
  createdAt, updatedAt  // timestamps
}
```

---

## API Endpoints

### Services
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/services` | Get all services (no-cache headers) |
| `POST` | `/api/services` | Add new service |
| `PATCH` | `/api/services/:id` | Toggle active/update service |
| `DELETE` | `/api/services/:id` | Remove service |
| `GET` | `/api/services/events` | SSE stream for real-time updates |

### Email
| Method | Path | Description |
|---|---|---|
| `GET` | `/api?to=email@domain.com` | Fetch emails sent to address (rate limited, validated) |

### Gmail API Note
The frontend `EmailDashboard.tsx` calls `https://api.luxidevilott.com` (external, hardcoded) for email data — NOT the local `/api` endpoint. The local `/api` Gmail endpoint exists as a backup.

---

## Real-Time Updates (SSE)

When admin makes a change, ALL open browsers update instantly (no refresh needed).

**How it works:**
1. Every browser on the homepage connects to `GET /api/services/events`
2. Server keeps all connections in a `Set` called `sseClients`
3. After any POST/PATCH/DELETE to services, `broadcastServices()` fires — sends updated list to every connected client
4. Frontend `ServicesContext.tsx` receives the event and updates React state immediately
5. Fallback: if SSE fails, auto-polls every 10 seconds

---

## Frontend Services Loading — Important Behaviour

`ServicesContext.tsx` loads state as follows:
1. `loading = true`, `services = []` (empty, no flash of wrong data)
2. Calls `GET /api/services` with **3 retries**, **3s delay**, **25s timeout** (handles cold-start delay)
3. On success → sets real services from MongoDB, `loading = false`
4. On total failure → falls back to `DEFAULT_SERVICES` (hardcoded), `loading = false`
5. Connects SSE for real-time updates
6. If SSE errors → switches to 10s polling

`Cards.tsx` shows **animated skeleton cards** while `loading = true` — users never see hardcoded wrong data.

---

## Admin Panel

- **URL:** `/admin`
- **Credentials:** username `devil`, password `daKsh@3210` (hardcoded in `Admin.tsx`)
- **Features:** Toggle services on/off, add new service (upload image or URL), remove service
- Uses `_id` (MongoDB ObjectId string) NOT `id` for all operations

---

## Security on `/api` (Email Endpoint)

Three layers of protection were added:
1. **Email validation regex** — must match `user@domain.tld` format exactly
2. **Blocked characters** — wildcards `*`, spaces, Gmail operators (`from:`, `subject:`, etc.) are all rejected
3. **Rate limiting** — 30 requests per minute per IP (in-memory, resets on server restart)
4. **CORS restriction** — only `.replit.dev`, `.repl.co`, `localhost`, and `ALLOWED_ORIGIN` env var are allowed

---

## MongoDB Cold-Start Fix

Autoscale deployments (Replit/Digital Ocean) pause when idle. On wakeup, Express starts in ~3s but MongoDB connects in ~7-10s. Fix:

- Backend: `waitForMongo(20000)` — GET /api/services waits up to 20s for DB before responding
- Frontend: 3 retries with 3s delays and 25s timeout per attempt

---

## Digital Ocean Deployment

The project is Docker-ready. `Dockerfile` at root:
1. Installs dependencies for `api/` and `frontend/`
2. Builds frontend (`npm run build` in `frontend/`)
3. Runs `node api/index.js` on port 8080

**Required environment variable on Digital Ocean:**
- `MONGODB_URI` — the MongoDB connection string
- `ALLOWED_ORIGIN` — your production domain (e.g. `myapp.com`) for CORS

---

## What NOT to Change Without Understanding

- `vite.config.ts` proxy — required for dev; `/api/services/events` must be listed FIRST (most specific first)
- `waitForMongo()` — removing it breaks the deployed app on cold starts
- `frontend/dist/` — must be rebuilt (`cd frontend && npm run build`) before deploying
- `_id` field — services from MongoDB use `_id` not `id`; both `Admin.tsx` and `Cards.tsx` depend on this
- SSE endpoint must be registered BEFORE `GET /api/services` in Express (more specific path first)

---

## Known Issues / Quirks

- `efdsgfds` test service exists in MongoDB (added during testing) — remove it from admin panel
- Gmail API credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`) are NOT set in this Replit — emails come from the external `https://api.luxidevilott.com`
- The `main.py` and `pyproject.toml` files at root are unused leftovers from the original template
