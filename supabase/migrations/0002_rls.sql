alter table goals enable row level security;
create policy "own rows" on goals for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table tasks enable row level security;
create policy "own rows" on tasks for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table sessions enable row level security;
create policy "own rows" on sessions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table blocklists enable row level security;
create policy "own rows" on blocklists for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

alter table settings enable row level security;
create policy "own rows" on settings for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
