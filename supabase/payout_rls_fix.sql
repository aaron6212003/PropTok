-- Payout Modal RLS Fix
-- Allow users to update their own votes and bundles to mark them as acknowledged

-- 1. Update policy for Votes
create policy "Users can update their own votes."
on public.votes
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- 2. Update policy for Bundles
create policy "Users can update their own bundles."
on public.bundles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
