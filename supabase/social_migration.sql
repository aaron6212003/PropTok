-- Create Comments Table
create table if not exists public.comments (
    id uuid default gen_random_uuid() primary key,
    prediction_id uuid references public.predictions(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    text text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Comment Likes Table (for social engagement)
create table if not exists public.comment_likes (
    id uuid default gen_random_uuid() primary key,
    comment_id uuid references public.comments(id) on delete cascade not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(comment_id, user_id)
);

-- Enable RLS
alter table public.comments enable row level security;
alter table public.comment_likes enable row level security;

-- Policies for Comments
create policy "Comments are viewable by everyone" 
on public.comments for select using (true);

create policy "Users can post their own comments" 
on public.comments for insert with check (auth.uid() = user_id);

-- Policies for Comment Likes
create policy "Likes are viewable by everyone" 
on public.comment_likes for select using (true);

create policy "Users can toggle their own likes" 
on public.comment_likes for insert with check (auth.uid() = user_id);

create policy "Users can remove their own likes" 
on public.comment_likes for delete using (auth.uid() = user_id);

-- Create View for Comments with User Profiles and Like Counts
create or replace view public.comment_details as
select 
    c.*,
    u.username,
    u.avatar_url,
    count(l.id) as like_count,
    exists(select 1 from public.comment_likes l2 where l2.comment_id = c.id and l2.user_id = auth.uid()) as user_has_liked
from public.comments c
left join public.users u on c.user_id = u.id
left join public.comment_likes l on c.id = l.comment_id
group by c.id, u.username, u.avatar_url;
