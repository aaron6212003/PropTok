-- Add parent_id to comments table
alter table public.comments 
add column if not exists parent_id uuid references public.comments(id) on delete cascade;

-- Update comment_details view to include parent_id
-- We must DROP first because changing column types/order via REPLACE is restricted
drop view if exists public.comment_details;

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
