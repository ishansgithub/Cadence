# Cadence: Build Plan for Cursor

Cadence is a personal focus, task, goal and time-tracking app. Browser first (PWA), then desktop (Tauri) and Android (Capacitor). Backed by Supabase Postgres from day one.

**How to use this doc:** put it in the repo root as `PLAN.md`. Tell Cursor: *"Read PLAN.md fully. Implement one phase at a time, starting with Phase 0. Stop at the end of each phase and wait for me to confirm before continuing."*

## 1. Product summary

A single-user app that helps me focus and see where my time goes.

**Core features (v1):**

- Task list and daily planning
- Goal tracking (tasks roll up into goals, goals have targets)
- Pomodoro-style focus timer linked to a task
- Time reports and analytics
- Website blocking during focus sessions (browser extension, Phase 6)

**Non-goals for v1:** teams, sharing, notifications to other people, social features, payments.

## 2. Tech stack (fixed, do not substitute)

- **Language:** TypeScript everywhere (strict mode)
- **Frontend:** React 18 + Vite, built as a PWA (`vite-plugin-pwa`)
- **Styling:** Tailwind CSS
- **State:** Zustand for UI state, TanStack Query for server data
- **Routing:** React Router
- **Backend/DB:** Supabase (Postgres, Auth, Realtime, Row Level Security)
- **Client:** `@supabase/supabase-js`
- **Offline cache:** Dexie (IndexedDB) for a write queue and read cache
- **Charts:** Recharts
- **Validation:** Zod
- **Tests:** Vitest (unit), Playwright (one smoke e2e at the end of Phase 4)
- **Package manager / monorepo:** pnpm workspaces
- **Later:** Manifest V3 extension, Tauri (desktop), Capacitor (Android)

## 3. Repo structure

```
/
  PLAN.md
  pnpm-workspace.yaml
  package.json
  supabase/
    migrations/        # SQL migrations, numbered
    seed.sql
  packages/
    core/              # framework-agnostic logic, NO React, NO supabase imports
      src/
        types.ts       # Zod schemas + inferred types
        timer.ts       # timestamp-based timer logic
        reports.ts     # report shaping helpers
        repos.ts       # repository INTERFACES only
  apps/
    web/               # React PWA
      src/
        data/          # Supabase + Dexie implementations of repos
        features/
          auth/ tasks/ goals/ timer/ reports/ settings/
        components/
        lib/
    extension/         # added in Phase 6
```

**Rule:** `packages/core` must never import React, Supabase, or Dexie. All platforms depend on it, and it must stay portable.

**Naming:** the product is called Cadence. Use the package scope `@cadence` (`@cadence/core`, `@cadence/web`, `@cadence/extension`), and use "Cadence" for the app title, PWA name and extension name.

## 4. Data model

All tables have `id uuid primary key default gen_random_uuid()`, `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()`, `created_at timestamptz not null default now()`, and `updated_at timestamptz not null default now()` (maintained by a trigger).

Create this as `supabase/migrations/0001_init.sql`:

```sql
create type goal_status as enum ('active','paused','done','archived');
create type task_status as enum ('todo','in_progress','done','archived');
create type session_type as enum ('focus','short_break','long_break');
create type goal_target_type as enum ('hours_per_week','total_hours','deadline','none');

create table goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target_type goal_target_type not null default 'none',
  target_value numeric,            -- hours, if applicable
  deadline date,
  status goal_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  goal_id uuid references goals(id) on delete set null,
  title text not null,
  notes text,
  estimate_min integer,
  due_date date,
  planned_for date,                -- the day I plan to do it
  status task_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  task_id uuid references tasks(id) on delete set null,
  type session_type not null default 'focus',
  planned_min integer not null,
  started_at timestamptz not null,
  ended_at timestamptz,            -- null means currently active
  interrupted boolean not null default false,
  interrupt_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Only one active session per user
create unique index one_active_session_per_user
  on sessions(user_id) where ended_at is null;

create table blocklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  domains text[] not null default '{}',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  focus_min integer not null default 25,
  short_break_min integer not null default 5,
  long_break_min integer not null default 15,
  sessions_before_long_break integer not null default 4,
  week_starts_on integer not null default 1,   -- 0=Sun, 1=Mon
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

-- Indexes
create index on tasks(user_id, status);
create index on tasks(user_id, planned_for);
create index on sessions(user_id, started_at desc);
create index on sessions(task_id);

-- updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;

create trigger t_goals before update on goals for each row execute function set_updated_at();
create trigger t_tasks before update on tasks for each row execute function set_updated_at();
create trigger t_sessions before update on sessions for each row execute function set_updated_at();
create trigger t_blocklists before update on blocklists for each row execute function set_updated_at();
create trigger t_settings before update on settings for each row execute function set_updated_at();
```

Create `0002_rls.sql`: enable RLS on **every** table and add one policy per table:

```sql
alter table goals enable row level security;
create policy "own rows" on goals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
-- repeat for tasks, sessions, blocklists, settings
```

Create `0003_reports.sql` with SQL views (use `security_invoker = true` so RLS applies):

```sql
create view daily_focus with (security_invoker = true) as
select user_id,
       date_trunc('day', started_at) as day,
       sum(extract(epoch from (ended_at - started_at)))/60 as focus_min,
       count(*) as sessions,
       count(*) filter (where interrupted) as interrupted_sessions
from sessions
where type = 'focus' and ended_at is not null
group by user_id, date_trunc('day', started_at);

create view time_by_goal with (security_invoker = true) as
select s.user_id, t.goal_id,
       date_trunc('week', s.started_at) as week,
       sum(extract(epoch from (s.ended_at - s.started_at)))/60 as focus_min
from sessions s join tasks t on t.id = s.task_id
where s.type = 'focus' and s.ended_at is not null
group by s.user_id, t.goal_id, date_trunc('week', s.started_at);

create view estimate_vs_actual with (security_invoker = true) as
select t.user_id, t.id as task_id, t.title, t.estimate_min,
       coalesce(sum(extract(epoch from (s.ended_at - s.started_at)))/60, 0) as actual_min
from tasks t left join sessions s
  on s.task_id = t.id and s.type = 'focus' and s.ended_at is not null
group by t.user_id, t.id, t.title, t.estimate_min;
```

## 5. Architecture rules (important)

1. **Repository pattern.** `packages/core/src/repos.ts` defines interfaces: `GoalRepo`, `TaskRepo`, `SessionRepo`, `BlocklistRepo`, `SettingsRepo`. UI code only talks to these. `apps/web/src/data/` provides Supabase-backed implementations. No component may call `supabase.from(...)` directly.
2. **Timer is timestamp-based.** Never count ticks. An active session is a `sessions` row with `ended_at = null`. Remaining time = `planned_min * 60 - (now - started_at)`. The UI re-renders every second, but the truth is the stored timestamp. This makes the timer survive tab closes, sleep, and refresh. On app load, check for an active session and resume it.
3. **Auto-complete.** If an active session is found past its planned end on load, close it with `ended_at = started_at + planned_min` and mark it complete (not interrupted).
4. **Interruptions are first-class.** Stopping a session early sets `interrupted = true` and prompts for a one-tap reason (Distracted, Urgent task, Break needed, Other).
5. **Offline resilience.** Use Dexie as a write queue. If a write fails because of connectivity, store it locally and retry on reconnect. The timer must keep working with no network. Keep this simple: queue for `sessions` and `tasks` writes only.
6. **Validate at the edges.** Zod schemas in `core/types.ts` are the single source of truth for types. Parse all data coming from Supabase.
7. **Reports use SQL views**, not client-side aggregation.
8. **Secrets.** Only the Supabase URL and anon key go in `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). Never use the service role key in client code. Provide `.env.example`.

## 6. Phased build

Complete one phase at a time. Each phase ends with a working, runnable app and the listed acceptance criteria.

### Phase 0: Scaffold and database

- Set up pnpm monorepo with `packages/core` and `apps/web`.
- Vite + React + TS + Tailwind + PWA plugin, ESLint, Prettier, Vitest.
- Add the three SQL migration files above and a short `supabase/README.md` explaining how to apply them (Supabase CLI or SQL editor).
- Add `.env.example`, and a Supabase client in `apps/web/src/lib/supabase.ts`.

**Acceptance:** `pnpm dev` runs the app. Migrations apply cleanly to a fresh Supabase project. A README documents setup.

### Phase 1: Auth and app shell

- Email magic link or email+password login via Supabase Auth (also add Google if easy).
- Protected routes, sign-out, and an app shell with sidebar nav: Today, Tasks, Goals, Reports, Settings.
- On first login, create the `settings` row.
- Responsive layout that works on phone widths.

**Acceptance:** I can sign up, sign in, refresh, and stay signed in. Unauthenticated users are redirected to login. RLS verified: a second account sees none of the first account's data.

### Phase 2: Tasks and goals

- Goals CRUD with target type/value and deadline, plus a progress bar (hours this week vs target, filled in properly once sessions exist).
- Tasks CRUD: title, notes, estimate, due date, goal link, status.
- **Today view:** tasks with `planned_for = today`, drag or button to plan/unplan tasks, quick-add input, overdue section.
- Task detail drawer. Filters by goal and status.
- Implement via the repo interfaces.

**Acceptance:** I can create goals, create tasks under them, plan tasks for today, mark them done. Data persists across refresh and devices.

### Phase 3: Focus timer and session logging

- Timer screen/panel: pick a task (or none), start a focus session using `settings.focus_min`.
- Timestamp-based timer per section 5. Pause is **not** supported in v1 (stopping = interrupt).
- Auto-advance to short break, long break after N focus sessions. Break sessions are also logged.
- Stop early flow with interruption reason.
- Browser notification and sound when a session ends (request permission gracefully).
- Persistent mini-timer visible on every page, and the tab title shows the countdown.
- Resume or auto-complete active session on load.
- Unit tests in `core/timer.test.ts` for remaining-time and auto-complete logic.

**Acceptance:** Start a session, close the tab, reopen: the timer is still correct. Sessions appear in the database with correct timestamps. Only one active session can exist.

### Phase 4: Reports and analytics

- Reports page with date range selector (week, month, custom).
- Charts using the SQL views: daily focus minutes, time by goal (stacked by week), estimate vs actual per task, interruption rate and top interruption reasons, and a heatmap of focus by hour of day.
- Summary cards: total focus time, sessions completed, streak of days with at least one focus session, best day.
- Goal progress bars on the Goals page now use real data.
- One Playwright smoke test: login, create task, run a short session, see it in reports.

**Acceptance:** Numbers in reports match raw session data (spot check a few). Empty states look fine for new users.

### Phase 5: Polish and PWA

- Installable PWA named Cadence with offline shell, icons, and manifest.
- Dexie write queue for offline `sessions` and `tasks` writes.
- Dark mode, keyboard shortcuts (`n` new task, `space` start/stop timer, `g` then `t/g/r` for navigation).
- JSON export of all my data (backup).
- Settings page for timer durations, week start, timezone.

**Acceptance:** App installs from Chrome. Starting and ending a session while offline syncs correctly when back online. Lighthouse PWA checks pass.

### Phase 6: Website blocking extension

- New workspace `apps/extension` (Manifest V3, TypeScript, built with Vite or WXT).
- Extension reads the active session state: the web app posts a message to the extension (`externally_connectable` or content script bridge) when a focus session starts or ends, including the blocklist domains.
- Use `chrome.declarativeNetRequest` dynamic rules to redirect blocked domains to a bundled `blocked.html` page that shows the current task and remaining time, with no easy bypass button (a 10-second delay "I really need to" link is acceptable and logs an interruption).
- Rules are removed when the session ends or is stopped. Handle service worker restarts by re-deriving state from `chrome.storage`.
- Blocklist management UI in the web app Settings page (`blocklists` table).

**Acceptance:** During a focus session, visiting a blocked domain shows the block page. After the session, the domain loads normally. Closing the browser mid-session does not leave rules stuck permanently (expire by `planned end` timestamp).

### Phase 7: Desktop (Tauri)

- Add `apps/desktop` wrapping the web build with Tauri v2.
- System tray with the live timer, native notifications, start on login option.
- Keep Tauri-specific code isolated behind a small `platform` module in the web app so the web build still runs standalone.

### Phase 8: Android (Capacitor)

- Add Capacitor, produce an Android build, local notifications for session end, foreground service so the timer notification stays alive.
- App/site blocking via a native plugin (Accessibility Service or VPN service) is a separate, optional follow-up. Do not start it without asking me.

## 7. Conventions for Cursor

- Small, focused commits per feature. Explain what changed after each.
- Functional React components and hooks only. No class components.
- Colocate feature code under `apps/web/src/features/<name>`.
- Every new table or column goes into a new numbered migration, never edit applied migrations.
- Write unit tests for anything in `packages/core`.
- Handle loading, empty, and error states for every data-driven screen.
- Accessibility: semantic HTML, keyboard-operable controls, visible focus.
- Do not add dependencies beyond section 2 without asking me.
- If something in this plan is ambiguous or conflicts with reality (library API changes, etc.), state your assumption and proceed with the simplest option.

## 8. Definition of done (v1)

- I can sign in on any browser and see the same tasks, goals, and history.
- I can plan my day, run focus sessions against tasks, and the timer never loses state.
- Reports clearly show where my time went per goal, estimate accuracy, and when I focus best.
- Distracting sites are blocked during focus sessions in my browser.
- My data is private (RLS verified) and exportable.

## 9. First prompt to paste into Cursor

> Read PLAN.md fully. Implement **Phase 0** only: scaffold the pnpm monorepo for the app named Cadence (package scope @cadence), set up `apps/web` and `packages/core`, add the three SQL migrations exactly as written, the Supabase client, `.env.example`, and a setup README. Do not start Phase 1. When done, list what you created and how I verify it.
