# Cadence

Cadence is a personal focus app for planning the day, tying tasks to goals, and seeing where time actually goes. A focus session is stored as a start timestamp, so the timer stays correct across refresh, sleep, and a closed tab.

The browser app is a progressive web app. Desktop and Android builds are planned later. Data lives in Supabase Postgres, with row level security so each account only sees its own rows.

## Status

Auth and the app shell are in place: email and password, magic link, protected routes, and a settings row created on first sign-in. Tasks, goals, the focus timer, and reports are still to come.

## Stack

- TypeScript, React, Vite, Tailwind CSS
- React Router, Zod, Vitest
- Supabase: Postgres, Auth, and row level security
- pnpm workspace

| Package | Role |
| --- | --- |
| `apps/web` | React app (`@cadence/web`) |
| `packages/core` | Shared logic with no React or Supabase imports (`@cadence/core`) |

## Run locally

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Put the Supabase project URL and anon key in `.env`. Apply the SQL in `supabase/migrations` first; the steps are in [supabase/README.md](supabase/README.md).

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the web app |
| `pnpm test` | Run unit tests |
| `pnpm typecheck` | Typecheck every package |
| `pnpm lint` | ESLint |
| `pnpm build` | Typecheck, then build the web app |
