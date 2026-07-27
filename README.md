# Northlight CRM

A CRM for a small service business: track leads, move deals through a drag-and-drop pipeline,
keep notes on the people you're talking to, and get emailed before a follow-up goes cold.

Built as a separate **Next.js** frontend and **Express + MongoDB** API — deployable independently.


---

## What's in it

| Area | What it does |
|---|---|
| **Pipeline** | Kanban board, drag between stages, optimistic UI, per-stage totals and share-of-pipeline bars |
| **Contacts** | Search, filter, paginate, detail page with notes timeline, deals, and follow-ups |
| **Follow-ups** | Due today / overdue / upcoming tabs, one-click complete, cron-driven email reminders |
| **Dashboard** | Open pipeline value, won this month, win rate, value-by-stage chart, 6-month won trend, activity feed |
| **Settings** | Reshape pipeline stages, mark a stage as "won", team roster with roles |
| **Data portability** | CSV import and export for contacts |
| **Auth** | JWT in an httpOnly cookie, role-based access (owner / manager / rep), multi-tenant via `orgId` |

---

## Stack

**Frontend** — Next.js 14 (App Router), TypeScript, Tailwind CSS, TanStack Query, dnd-kit, Recharts, Radix primitives, Sonner
**Backend** — Node, Express, MongoDB + Mongoose, Zod, JWT, node-cron, Nodemailer, Helmet, rate limiting

---

## Run it locally

You need Node 18+ and a MongoDB instance (local or a free Atlas cluster).

### 1. Backend

```bash
cd backend
cp .env.example .env        # set MONGODB_URI and JWT_SECRET
npm install
npm run seed                # loads the demo studio: 18 contacts, 24 deals, notes, follow-ups
npm run dev                 # http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL=http://localhost:4000/api
npm install
npm run dev                 # http://localhost:3000
```

### 3. Sign in

Hit **Try the demo** on the login screen, or use `demo@northlight.co` / `demo1234`.

---

## Architecture notes

**Multi-tenancy.** Every document carries an `orgId`. The auth middleware reads it from the signed
JWT and puts it on `req.orgId` — it is never read from a request body. Every query scopes to it, so
one workspace cannot see another's data even if a client sends a forged id.

**Fractional ordering.** Deal cards store `order` as a float. Dropping a card between two others
sets its order to the midpoint of its neighbours, so a drag writes **one document** instead of
renumbering the column. When floats run out of precision (~50 inserts in the same gap), that one
column gets renumbered.

**Optimistic UI.** The board paints the drop immediately and reconciles with the server after. If
the request fails, the board rolls back to server state and a toast explains why.

**Reminders.** A `node-cron` job sweeps every 15 minutes for follow-ups due within the hour and
emails the assignee. `reminderSent` is the idempotency guard, so a restart doesn't re-send.
Without SMTP configured it logs to console instead — the job stays observable in development.

**Validation.** Zod schemas validate every request body, query, and param at the route boundary.
Failures return a `details` array that the frontend maps straight onto the offending fields.

---

## API

All routes are prefixed `/api`. Everything except `/auth/*` requires the session cookie.

```
POST   /auth/register        Create org + owner
POST   /auth/login           Sign in
POST   /auth/demo            One-click demo session
POST   /auth/logout
GET    /auth/me              Session + org (incl. pipeline stages)

GET    /contacts             ?q= &source= &ownerId= &page= &limit=
POST   /contacts
GET    /contacts/:id         Contact + its deals, notes, tasks
PATCH  /contacts/:id
DELETE /contacts/:id
GET    /contacts/export      CSV download
POST   /contacts/import      { rows: [...] }

GET    /deals/board          Columns with cards, ordered
POST   /deals
GET    /deals/:id
PATCH  /deals/:id
PATCH  /deals/:id/move       { stageId, beforeId, afterId }
DELETE /deals/:id

POST   /notes                { body, entityType, entityId }
DELETE /notes/:id

GET    /tasks                ?filter=all|today|overdue|upcoming|done
POST   /tasks
PATCH  /tasks/:id
DELETE /tasks/:id

GET    /stages
PUT    /stages               owner/manager only

GET    /dashboard/summary
GET    /users
```

---

## Data model

```
Org      { name, currency, pipelineStages: [{ name, order, color, isWon }] }
User     { orgId, name, email, passwordHash, role, avatarColor }
Contact  { orgId, name, email, phone, company, title, source, tags[], ownerId }
Deal     { orgId, title, value, stageId, order, contactId, ownerId,
           expectedCloseDate, status, lostReason }
Note     { orgId, body, entityType, entityId, authorId }
Task     { orgId, title, dueDate, done, assigneeId, entityType, entityId, reminderSent }
Activity { orgId, actorId, verb, entityType, entityId, meta }
```

---

## Deploying

**Frontend → Vercel.** Set `NEXT_PUBLIC_API_URL` to your API's public URL.

**Backend → Render / Railway / Fly.** Set `MONGODB_URI` (Atlas), `JWT_SECRET`, and
`CLIENT_ORIGIN` to your Vercel URL.

Because the two live on different domains in production, the auth cookie needs:

```
COOKIE_SAMESITE=none
COOKIE_SECURE=true
```

Locally, `lax` + `false` is correct — different ports on `localhost` are still same-site.

---

## Known gaps

Deliberately out of scope, and worth naming rather than hiding:

- **Team invites** — users are seeded or self-registered as owners; there's no invite flow yet.
- **Refresh tokens** — the JWT is a single 7-day cookie. Real production wants rotation.
- **File attachments** on contacts and deals.
- **Tests** — the API is structured for it (thin controllers, isolated services), but there's no suite yet.
