create table if not exists public.telemetry_events (
  event_id uuid primary key,
  timestamp timestamptz not null,
  session_id uuid null,
  user_id text null,
  event_type text not null,
  schema_version text not null,
  request_id uuid not null,
  tags jsonb not null default '{}'::jsonb,
  service text not null,
  constraint telemetry_events_tags_object
    check (jsonb_typeof(tags) = 'object')
);

create index if not exists telemetry_events_timestamp_idx
  on public.telemetry_events (timestamp);

create index if not exists telemetry_events_event_type_idx
  on public.telemetry_events (event_type);

create index if not exists telemetry_events_tags_gin_idx
  on public.telemetry_events using gin (tags);

alter table public.telemetry_events enable row level security;

revoke all on public.telemetry_events from public, anon, authenticated;
revoke update, delete, truncate on public.telemetry_events from service_role;
grant insert on public.telemetry_events to service_role;