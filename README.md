# Apartment Management MVP

Internal dashboard MVP for one short-term rental business. This app is intentionally small in scope: a single workspace, simple owner/member roles, practical reservation management, expense tracking, reporting, and a polished responsive admin UI.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Vercel deployment

## What is in the MVP

- Email/password auth with Supabase
- Protected internal routes
- Apartments CRUD
- Bookings CRUD with conflict validation
- Month calendar with mobile agenda fallback
- Expenses CRUD with filters
- Dashboard KPIs and recent activity
- Reports with revenue, expenses, profit, booking counts, and occupancy snapshot
- Settings for business profile and basic user management

## What is intentionally out of scope

- Marketplace flows
- Guest portal
- AI features
- Multi-tenant SaaS architecture
- Advanced RBAC
- Drag-and-drop scheduling
- Complex BI or forecasting

## Environment variables

Copy `.env.example` to `.env.local` for local development.

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Compatibility:

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
  The codebase accepts this as an alternative to `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  You only need one of them, not both.

Optional:

- `SUPABASE_SERVICE_ROLE_KEY`
  Use this only for `npm run seed:demo` and for in-app user creation from the Settings page.
  It is server-only and must never be exposed in client-side code or committed to git.
- `SEED_DEMO_PASSWORD`
  Overrides the temporary password used by the demo seed script.

Do not commit `.env.local`, `.env.production`, or any file containing real keys.

## Local development

1. Install dependencies:

```bash
npm install
```

2. Add your environment variables in `.env.local`.

3. Create a Supabase project.

4. Run the SQL files in [supabase/migrations](./supabase/migrations) in order.

5. Optional: seed demo data:

```bash
npm run seed:demo
```

6. Start the app:

```bash
npm run dev
```

## Supabase setup

1. Create a new Supabase project.
2. In Supabase SQL Editor, run the files in [supabase/migrations](./supabase/migrations) in order.
3. Copy the project URL and anon key into `.env.local`.
4. If you prefer the newer key naming, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` also works.
5. If you want in-app user creation or local seeding, also add the service role key to `.env.local`.
6. Confirm Email/Password auth is enabled in Supabase Auth.

## GitHub + Vercel deployment

This repository is prepared for standard Vercel deployment as a Next.js app.

### One-time project setup

1. Push the project to GitHub.
2. Install dependencies:

```bash
npm install
```
3. In Vercel, import the GitHub repository.
4. Add production environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` only if you want in-app user creation in production
5. Keep the default Vercel Next.js build command:
   - Build command: `npm run build`
   - Output setting: framework default for Next.js
6. Deploy from the `main` branch or your chosen production branch.

### Recommended Vercel env strategy

- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in all environments where the app should authenticate users.
- Only set `SUPABASE_SERVICE_ROLE_KEY` in Vercel if you need the owner-only "Add user" flow inside Settings.
- The app does not require `SUPABASE_SERVICE_ROLE_KEY` for normal sign-in, route protection, CRUD pages, dashboard metrics, or reports.
- If public Supabase env vars are missing, the app now avoids import-time crashes and redirects protected routes to `/login` instead of crashing middleware.

## Realtime notes

The app now includes lightweight realtime refresh hooks for:

- dashboard summaries
- bookings calendar
- expenses ledger
- reports
- settings

The current implementation uses small Supabase Realtime subscriptions that trigger `router.refresh()` for affected pages. It is intentionally minimal and ready to evolve later into more selective live updates if needed.

## Project structure

- [app](./app): routes, layouts, server actions
- [components](./components): app shell, forms, UI primitives, realtime bridge
- [lib/data](./lib/data): typed Supabase data helpers
- [lib/business](./lib/business): dashboard/report metric logic
- [lib/validations](./lib/validations): zod schemas
- [supabase/migrations](./supabase/migrations): schema SQL
- [scripts](./scripts): seed scripts

## Known future improvements after MVP

- password reset and forced password-change flow
- richer settings controls for booking defaults and expense categories
- finer-grained realtime updates without full route refreshes
- exportable CSV/PDF reports
- photo/file attachments for apartments and expenses
- better audit history for booking and expense changes
