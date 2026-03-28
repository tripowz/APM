# Apartment Management MVP

Internal dashboard MVP for one short-term rental business. This app is intentionally small in scope: a single workspace, simple owner/member roles, practical reservation management, expense tracking, reporting, and a polished responsive admin UI.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase Auth + Postgres
- Cloudflare Workers compatibility via OpenNext

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
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Optional:

- `SUPABASE_SERVICE_ROLE_KEY`
  Use this for `npm run seed:demo` and for in-app user creation from the Settings page.
  Keep it server-only and never expose it in client-side code.
- `SEED_DEMO_PASSWORD`
  Overrides the temporary password used by the demo seed script.

For Cloudflare local preview, also copy `.dev.vars.example` to `.dev.vars`.

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

7. Optional: preview the Cloudflare worker runtime locally:

```bash
npm run preview
```

## Supabase setup

1. Create a new Supabase project.
2. In Supabase SQL Editor, run the files in [supabase/migrations](./supabase/migrations) in order.
3. Copy the project URL and publishable key into `.env.local`.
4. If you want in-app user creation or local seeding, also add the service role key to `.env.local`.
5. Confirm Email/Password auth is enabled in Supabase Auth.

## GitHub + Cloudflare deployment

This repository is prepared for Cloudflare Workers deployment through OpenNext.

### One-time project setup

1. Push the project to GitHub.
2. Install dependencies:

```bash
npm install
```

3. Verify the worker config files exist:
   - [wrangler.jsonc](./wrangler.jsonc)
   - [open-next.config.ts](./open-next.config.ts)
   - [public/_headers](./public/_headers)

4. Add production environment variables in Cloudflare:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` only if you want in-app user creation in production

5. If you use Workers Builds with GitHub, set:
   - Build command: `npx @opennextjs/cloudflare build`
   - Deploy command: `npx @opennextjs/cloudflare upload`

### Deploy using Cloudflare Workers

1. Authenticate Wrangler:

```bash
npx wrangler login
```

2. Deploy:

```bash
npm run deploy
```

### Deploy using GitHub integration

1. In Cloudflare, open Workers & Pages.
2. Create an application by importing the GitHub repository.
3. Connect the repository to the Worker.
4. Set the production branch.
5. Add the required environment variables in Cloudflare.
6. Let Cloudflare build and deploy on pushes to your chosen branch.

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
