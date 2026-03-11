# Email Viewer Dashboard

## Project Overview
A monorepo email viewing application that uses the Gmail API to display emails sent to specific addresses. The frontend is a React SPA; the backend is an Express API that authenticates with Gmail via OAuth2.

## Architecture

### Frontend (`/frontend`)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite (with SWC)
- **UI:** Tailwind CSS + shadcn/ui (Radix UI components)
- **Routing:** React Router v6
- **State:** TanStack Query
- **Port:** 5000 (dev), served at `/`

### Backend API (`/api`)
- **Runtime:** Node.js (CommonJS)
- **Framework:** Express
- **Auth:** Google OAuth2 via `googleapis` and `google-auth-library`
- **Port:** 3001 (dev)
- **Endpoint:** `GET /api?to=<email>` — returns emails sent to the specified address

### Root (`/`)
- Monorepo root with `concurrently` to run both services together
- `npm start` runs both frontend and backend concurrently

## Key Pages
- `/` — Cards page (list of email accounts)
- `/dashboard/:emailAddress` — Email dashboard for a specific address
- `/:name/verification` — Device verification page
- `/search` — Search emails

## Environment Variables Required
The API requires these secrets in `api/.env`:
- `GOOGLE_CLIENT_ID` — Google OAuth2 client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth2 client secret
- `GOOGLE_REFRESH_TOKEN` — OAuth2 refresh token for Gmail access

## API URL Configuration
The frontend currently points to `https://api.luxidevilott.com` (hardcoded in `EmailDashboard.tsx` and `Search.tsx`).

## Workflows
- **Start application** — Runs `cd frontend && npm run dev` on port 5000 (webview)

## Deployment
- Configured as **static** deployment
- Build: `npm run build` (from root, builds frontend)
- Public directory: `frontend/dist`
