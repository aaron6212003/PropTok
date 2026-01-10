import { getAllTournaments } from '../actions';
import { createClient } from '@/lib/supabase/server';
import BottomNavBar from '@/components/layout/bottom-nav';
import TournamentList from './tournament-list';

// Force dynamic rendering so we always get fresh tournaments
export const dynamic = 'force-dynamic';

export default async function TournamentsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Parallel Fetching for Performance
    const [tournamentsRes, entriesRes] = await Promise.all([
        getAllTournaments(),
        user ? supabase.from('tournament_entries').select('*').eq('user_id', user.id) : Promise.resolve({ data: [] })
    ]);

    const tournaments = tournamentsRes.data || [];
    const myEntries = entriesRes.data || [];

    return (
        <main className="relative flex h-full w-full flex-col overflow-y-auto bg-black pb-32 text-white">
            <TournamentList
                initialTournaments={tournaments}
                initialEntries={myEntries}
                currentUserId={user?.id || null}
            />

            <nav className="fixed bottom-0 left-0 right-0 z-50">
                <BottomNavBar />
            </nav>
        </main>
    );
}
