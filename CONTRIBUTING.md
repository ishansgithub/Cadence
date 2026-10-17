# Contributing to Cadence

Thanks for helping. Cadence is a personal focus app, and changes should stay small enough to review.

## Setup

You need Node.js 22 or newer. pnpm is provided through Corepack, so a global `pnpm` install is optional.

```bash
corepack pnpm install
cp .env.example .env
```

Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the Supabase project's API settings. Use the anon key, not the service role key. Apply every file in `supabase/migrations` in filename order. [supabase/README.md](supabase/README.md) covers the SQL editor and the Supabase CLI.

`E2E_EMAIL` and `E2E_PASSWORD` are only needed for `corepack pnpm test:e2e`. Use a dedicated account, and do not commit those values.

## Checks

Run these before opening a pull request:

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm lint
```

`corepack pnpm format` writes Prettier changes. UI changes should be checked in the browser at a phone width (360px) as well as on a desktop layout.

## Project layout

- `packages/core` holds types, timer math, report shaping, and repository interfaces. It must not import React, Supabase, or Dexie.
- `apps/web/src/data` is the only place that calls Supabase or Dexie. Screens talk to repository interfaces and TanStack Query hooks.
- Parse data from Supabase with the Zod schemas in `packages/core`.
- Reports read the timezone-aware SQL views. Do not aggregate raw session rows in a component.
- Do not edit a migration after it has been applied. Add the next numbered file instead.

## Pull requests

- One change per pull request when you can.
- Describe what changed and how you checked it. The pull request template lists the checks.
- Leave secrets, `.env`, and local notes out of the diff.
