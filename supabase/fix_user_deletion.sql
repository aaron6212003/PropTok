-- Fix User Deletion (Add ON DELETE CASCADE)

-- 1. Public.Votes (references public.users)
alter table public.votes 
drop constraint if exists votes_user_id_fkey;

alter table public.votes 
add constraint votes_user_id_fkey 
foreign key (user_id) references public.users(id) on delete cascade;

-- 2. Public.Bundles (references public.users)
alter table public.bundles 
drop constraint if exists bundles_user_id_fkey;

alter table public.bundles 
add constraint bundles_user_id_fkey 
foreign key (user_id) references public.users(id) on delete cascade;

-- 3. Public.Tournament_Entries (references public.users)
alter table public.tournament_entries 
drop constraint if exists tournament_entries_user_id_fkey;

alter table public.tournament_entries 
add constraint tournament_entries_user_id_fkey 
foreign key (user_id) references public.users(id) on delete cascade;

-- 4. Public.Users (references auth.users)
-- IMPORTANT: We need to drop the constraint that links public.users to auth.users
-- The standard name is likely users_id_fkey since id is the column
alter table public.users 
drop constraint if exists users_id_fkey;

alter table public.users 
add constraint users_id_fkey 
foreign key (id) references auth.users(id) on delete cascade;
