-- Proves a second account cannot read or write the first account's rows.
-- The dashboard SQL editor runs as postgres, which bypasses RLS, so this script
-- switches to the `authenticated` role and sets the JWT claims `auth.uid()` reads.
--
-- 1. Create two users in the app (or in Authentication → Users).
-- 2. Replace the two UUIDs below with their auth.users.id values.
-- 3. Run the whole script in the SQL editor. It rolls back, so the probe rows are not kept.
-- A successful run finishes with no exception. An RLS leak raises an exception.

begin;

do $$
declare
  user_a uuid := '00000000-0000-0000-0000-00000000000a';
  user_b uuid := '00000000-0000-0000-0000-00000000000b';
  seen integer;
begin
  execute 'set local role authenticated';

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_a::text, 'role', 'authenticated')::text,
    true
  );

  insert into public.goals (user_id, title) values (user_a, 'rls probe goal');
  insert into public.tasks (user_id, title) values (user_a, 'rls probe task');
  insert into public.sessions (user_id, planned_min, started_at, ended_at)
    values (user_a, 25, now(), now());
  insert into public.blocklists (user_id, name) values (user_a, 'rls probe list');
  insert into public.settings (user_id, timezone) values (user_a, 'UTC')
    on conflict (user_id) do nothing;

  if (select count(*) from public.goals where user_id = user_a) < 1 then
    raise exception 'RLS check misconfigured: user A cannot see their own goal. Confirm auth.uid() reads request.jwt.claims.';
  end if;

  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', user_b::text, 'role', 'authenticated')::text,
    true
  );

  select count(*) into seen from public.goals where title = 'rls probe goal';
  if seen <> 0 then
    raise exception 'RLS failed: user B can read user A goals (%).', seen;
  end if;

  select count(*) into seen from public.tasks where title = 'rls probe task';
  if seen <> 0 then
    raise exception 'RLS failed: user B can read user A tasks (%).', seen;
  end if;

  select count(*) into seen from public.sessions where user_id = user_a;
  if seen <> 0 then
    raise exception 'RLS failed: user B can read user A sessions (%).', seen;
  end if;

  select count(*) into seen from public.blocklists where name = 'rls probe list';
  if seen <> 0 then
    raise exception 'RLS failed: user B can read user A blocklists (%).', seen;
  end if;

  select count(*) into seen from public.settings where user_id = user_a;
  if seen <> 0 then
    raise exception 'RLS failed: user B can read user A settings (%).', seen;
  end if;

  begin
    insert into public.goals (user_id, title) values (user_a, 'stolen goal');
    raise exception 'RLS failed: user B inserted a goal for user A.';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.tasks (user_id, title) values (user_a, 'stolen task');
    raise exception 'RLS failed: user B inserted a task for user A.';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.sessions (user_id, planned_min, started_at, ended_at)
      values (user_a, 25, now(), now());
    raise exception 'RLS failed: user B inserted a session for user A.';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.blocklists (user_id, name) values (user_a, 'stolen list');
    raise exception 'RLS failed: user B inserted a blocklist for user A.';
  exception
    when insufficient_privilege then
      null;
  end;

  begin
    insert into public.settings (user_id, timezone) values (user_a, 'UTC');
    raise exception 'RLS failed: user B inserted settings for user A.';
  exception
    when insufficient_privilege then
      null;
  end;
end $$;

rollback;
