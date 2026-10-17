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
