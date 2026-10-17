# Cadence

Personal focus, task, goal, and time-tracking app. This repo is a pnpm workspace:

- `apps/web` (`@cadence/web`) — React PWA
- `packages/core` (`@cadence/core`) — shared logic with no React or Supabase imports

## Setup

This repo uses React 19.3.1 and TypeScript 6.0.3. TypeScript 7 is published, but typescript-eslint does not support it yet.

Install [pnpm](https://pnpm.io/) 12, or use Corepack (it ships with Node). Workspace scripts call `corepack pnpm`, so they still work when `pnpm` is not on your PATH:

```bash
corepack pnpm install
```

If `pnpm` is already on your PATH, `pnpm install` is the same command.

Copy the env template and fill in the Supabase project URL and anon key (Project Settings → API). Never put the service role key in this file.

```bash
cp .env.example .env
```

Vite reads that file from the repo root.

Apply the database migrations using [supabase/README.md](supabase/README.md).

## Scripts

| Command | What it does |
| --- | --- |
| `corepack pnpm dev` | Start the web app |
| `corepack pnpm test` | Run unit tests in `packages/core` |
| `corepack pnpm typecheck` | Typecheck every package |
| `corepack pnpm lint` | ESLint |
| `corepack pnpm build` | Typecheck, then production-build the web app |

If `pnpm` is on your PATH, you can drop the `corepack` prefix.

`corepack pnpm dev` starts without Supabase credentials. The client in `apps/web/src/lib/supabase.ts` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only when something calls `getSupabase()`.
