alter table settings
  add column sound_enabled boolean not null default true,
  add column notifications_enabled boolean not null default true;
