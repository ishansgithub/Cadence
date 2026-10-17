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
