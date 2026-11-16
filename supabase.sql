-- Forja Póker: tablas de cuentas. Pegar en Supabase → SQL Editor → Run.
create table if not exists public.progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.progress enable row level security;
drop policy if exists "progress own" on public.progress;
create policy "progress own" on public.progress for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'plus', 'premium')),
  plan_until timestamptz,
  stripe_customer text
);
alter table public.profiles enable row level security;
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select using (auth.uid() = user_id);
-- El plan solo lo cambia el servidor (webhook de Stripe con la clave service_role); los usuarios no pueden escribirlo.
