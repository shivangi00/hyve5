-- hyve5 upgrade: extra links on cards (GitHub, Behance, Substack, Instagram, anything).
-- Safe to run more than once. Keeps all your data.
alter table public.profiles add column if not exists links text[] not null default '{}';
