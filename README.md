# Salesforce Data Console

A full-stack app that logs into a Salesforce org via **OAuth 2.0**, then does
**Create / Read / Update / Delete** on **Account, Opportunity, Lead, Contact,
and Case** through a single UI — no native Salesforce screens involved.

- **Backend:** Node.js + Express — owns the OAuth 2.0 Web Server Flow, holds the
  Salesforce access/refresh token in a server-side session, and proxies
  describe/query/CRUD calls to the Salesforce REST API.
- **Frontend:** React (Vite) — login button, object dropdown, a data grid that
  dynamically renders whatever fields the backend describes, infinite-scroll
  pagination (20 records/page), and create/view/edit/delete.

```
sf-crud-app/
├── backend/     Express API + OAuth
└── frontend/    React UI
```

---

## 1. Create a Salesforce Developer Org

1. Sign up at https://developer.salesforce.com/signup (free).
2. Log in at https://login.salesforce.com once your org is verified.
3. Make sure you have a few sample records in Account/Opportunity/Lead/
   Contact/Case, or just create them from the app once it's running.

## 2. Create an External Client App (the OAuth "connected app")

1. In Salesforce **Setup**, search for **External Client App Manager** →
   **New External Client App**.
2. Fill in Name (e.g. `Data Console`) and a contact email.
3. Under **API (Enable OAuth Settings)**:
   - Check **Enable OAuth**.
   - **Callback URL:** `http://localhost:5000/auth/callback` for local dev.
     Add your production backend's `/auth/callback` URL too once deployed
     (you can list multiple, one per line).
   - **OAuth Scopes:** add `Manage user data via APIs (api)` and
     `Perform requests at any time (refresh_token, offline_access)`.
   - Save.
4. Open the app you just created → **Settings** → copy the **Consumer Key**
   and **Consumer Secret**. These become `SF_CLIENT_ID` / `SF_CLIENT_SECRET`.
5. Under **OAuth Policies**, set **Permitted Users** to "All users may
   self-authorize" (simplest for a demo/dev org), and make sure the app is
   not left in "pending" — External Client Apps are usually active
   immediately, but some orgs require an admin to approve it under
   **Manage → Edit Policies** the first time.

> Note: the assignment mentions the Metadata/Tooling API for context on how
> connected apps work under the hood, but for standard-object CRUD the
> **REST API** (`/services/data/vXX.X/sobjects`, `/query`) is what this app
> actually calls — Metadata/Tooling APIs are for customizing the org itself
> (fields, objects, code), not for reading/writing records.

## 3. Configure and run the backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: SF_CLIENT_ID, SF_CLIENT_SECRET, SESSION_SECRET
npm run dev        # or: npm start
```

Backend runs on `http://localhost:5000`.

## 4. Configure and run the frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL=http://localhost:5000
npm run dev
```

Frontend runs on `http://localhost:5173`. Open it, click **Log in with
Salesforce**, approve the OAuth prompt, and you'll land back in the console.

## 5. Using the app

1. Pick an object from the dropdown (Account, Opportunity, Lead, Contact, Case).
2. The grid loads that object's fields (5–10 per object, configured in
   `backend/config/objectFields.js`) and the first 20 records.
3. Scroll to the bottom of the grid to auto-load the next 20, and so on.
4. **View** opens a read-only modal. **Edit** opens an editable form and
   saves with `PATCH`. **Delete** confirms, then removes the record.
   **+ New record** opens a blank form and creates via `POST`.

To change which fields are shown for an object, edit the array in
`backend/config/objectFields.js` — the frontend renders whatever the
backend describes, so no frontend changes are needed.

---

## Deployment (free tiers)

**Backend → Render** (or Railway/Fly.io):
1. Push this repo to GitHub.
2. New Web Service on Render, root directory `backend`, build command
   `npm install`, start command `npm start`.
3. Add the same environment variables as `.env`, with:
   - `SF_CALLBACK_URL` = `https://<your-render-app>.onrender.com/auth/callback`
   - `FRONTEND_URL` = your deployed frontend URL (set after step below)
   - `NODE_ENV` = `production`
4. Add this new callback URL to the External Client App's Callback URL list
   in Salesforce (Step 2 above).

**Frontend → Vercel or Netlify:**
1. New project from the same repo, root directory `frontend`, build command
   `npm run build`, output directory `dist`.
2. Set `VITE_API_URL` to your Render backend URL.
3. Redeploy, then update the backend's `FRONTEND_URL` env var to match this
   frontend URL and redeploy the backend too (needed for CORS + the
   post-login redirect).

Because the backend sets a cross-site session cookie in production, both
services must be served over **HTTPS** (Render/Vercel do this by default) —
that's why `server.js` only sets `secure: true / sameSite: "none"` when
`NODE_ENV=production`.

---

## Notes on the assignment's "local server" wording

The assignment text says code must be "deployed on a local server" and asks
for a deployed link — read together, that means: don't submit a Word/PDF/
image writeup, submit a running app with a link (e.g. Render + Vercel as
above) plus the Git repo link, which is what this project is set up for.
