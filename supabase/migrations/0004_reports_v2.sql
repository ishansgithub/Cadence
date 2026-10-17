-- Timezone-aware report buckets. 0003 stays as originally applied (UTC date_trunc).
-- Every view runs as the querying user so row level security still applies.

create view daily_focus_local with (security_invoker = true) as
select
  s.user_id,
  (s.started_at at time zone st.timezone)::date as day,
  t.goal_id,
  sum(extract(epoch from (s.ended_at - s.started_at))) / 60 as focus_min,
  count(*)::integer as sessions,
  count(*) filter (where s.interrupted)::integer as interrupted_sessions
from sessions s
join settings st on st.user_id = s.user_id
left join tasks t on t.id = s.task_id
where s.type = 'focus' and s.ended_at is not null
group by s.user_id, (s.started_at at time zone st.timezone)::date, t.goal_id;

create view time_by_goal_local with (security_invoker = true) as
select
  s.user_id,
  t.goal_id,
  (
    (s.started_at at time zone st.timezone)::date
    - ((extract(dow from (s.started_at at time zone st.timezone))::integer - st.week_starts_on + 7) % 7)
  ) as week_start,
  sum(extract(epoch from (s.ended_at - s.started_at))) / 60 as focus_min
from sessions s
join settings st on st.user_id = s.user_id
join tasks t on t.id = s.task_id
where s.type = 'focus' and s.ended_at is not null
group by s.user_id, t.goal_id, 3;

create view task_focus_by_day with (security_invoker = true) as
select
  t.user_id,
  t.id as task_id,
  t.goal_id,
  t.title,
  t.status,
  t.estimate_min,
  (s.started_at at time zone st.timezone)::date as day,
  coalesce(sum(extract(epoch from (s.ended_at - s.started_at))) / 60, 0) as actual_min
from tasks t
join settings st on st.user_id = t.user_id
join sessions s on s.task_id = t.id and s.type = 'focus' and s.ended_at is not null
group by t.user_id, t.id, t.goal_id, t.title, t.status, t.estimate_min, (s.started_at at time zone st.timezone)::date;

create view focus_by_hour_local with (security_invoker = true) as
select
  s.user_id,
  t.goal_id,
  (s.started_at at time zone st.timezone)::date as day,
  extract(hour from (s.started_at at time zone st.timezone))::integer as hour,
  sum(extract(epoch from (s.ended_at - s.started_at))) / 60 as focus_min
from sessions s
join settings st on st.user_id = s.user_id
left join tasks t on t.id = s.task_id
where s.type = 'focus' and s.ended_at is not null
group by s.user_id, t.goal_id, (s.started_at at time zone st.timezone)::date, 4;

create view interruptions_local with (security_invoker = true) as
select
  s.user_id,
  t.goal_id,
  (s.started_at at time zone st.timezone)::date as day,
  coalesce(nullif(s.interrupt_reason, ''), 'Other') as reason,
  count(*)::integer as interruptions
from sessions s
join settings st on st.user_id = s.user_id
left join tasks t on t.id = s.task_id
where s.type = 'focus' and s.interrupted and s.ended_at is not null
group by s.user_id, t.goal_id, (s.started_at at time zone st.timezone)::date, 4;

grant select on daily_focus_local, time_by_goal_local, task_focus_by_day, focus_by_hour_local, interruptions_local
  to authenticated, anon;
