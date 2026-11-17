create table if not exists public.contact (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nombre text check (char_length(nombre) <= 80),
  email text check (char_length(email) <= 120),
  asunto text check (char_length(asunto) <= 40),
  mensaje text check (char_length(mensaje) <= 3000)
);
alter table public.contact enable row level security;
drop policy if exists "contact insert" on public.contact;
create policy "contact insert" on public.contact for insert to anon, authenticated with check (true);
