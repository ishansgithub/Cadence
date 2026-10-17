# Cadence

Cadence is a personal focus app for planning the day, tying tasks to goals, and seeing where time actually goes. A focus session is stored as a start timestamp, so the timer stays correct across refresh, sleep, and a closed tab.

The browser app is an installable progressive web app. Desktop and Android builds are planned later. Data lives in Supabase Postgres, with row level security so each account only sees its own rows.

## What it does

- Email and password sign-in, plus a magic link. The first sign-in creates a settings row.
- Tasks and goals, with a Today view for what is planned, overdue, and done.
- A focus timer with short and long breaks, interruption reasons, and a mini-timer on every page.
- Reports for focus time, goals, estimates, interruptions, and hour of day. Charts use the account time zone.
- Offline start and stop for focus sessions. Pending task and session writes sync when the network returns.
- Settings for timer lengths, week start, time zone, sound, notifications, and light, dark, or system theme.
- A JSON export and import of the account's goals, tasks, sessions, blocklists, and settings.

## Stack

- TypeScript, React, Vite, Tailwind CSS
- React Router, TanStack Query, Zod, Dexie
- Recharts, Vitest, Playwright
- Supabase: Postgres, Auth, Realtime, and row level security
- pnpm workspace

| Package | Role |
| --- | --- |
| `apps/web` | React PWA (`@cadence/web`) |
| `packages/core` | Shared logic with no React, Supabase, or Dexie imports (`@cadence/core`) |

## Run locally

```bash
corepack pnpm install
cp .env.example .env
corepack pnpm dev
```

Put the Supabase project URL and anon key in `.env`. Never put the service role key there. Apply the SQL in `supabase/migrations` first; the steps are in [supabase/README.md](supabase/README.md).

| Command | What it does |
| --- | --- |
| `corepack pnpm dev` | Start the web app |
| `corepack pnpm test` | Run unit tests |
| `corepack pnpm typecheck` | Typecheck every package |
| `corepack pnpm lint` | ESLint |
| `corepack pnpm build` | Typecheck, then build the web app |
| `corepack pnpm test:e2e` | Playwright smoke test. Needs `E2E_EMAIL` and `E2E_PASSWORD` in `.env` |

Install from Chrome using the production build (`corepack pnpm build`, then `corepack pnpm --filter @cadence/web preview`). The dev server does not register the service worker.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
