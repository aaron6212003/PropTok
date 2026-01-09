export interface User {
    id: string;
    username: string;
    avatarUrl?: string;
    winRate: number; // 0-100
    baseWinRate?: number; // Previous win rate for comparison
    streak: number;
    bestStreak: number;
}

export interface Prediction {
    id: string;
    question: string;
    description?: string;
    category: 'Sports' | 'Crypto' | 'Stocks' | 'Politics' | 'Weather' | 'Celebs';
    imageUrl?: string; // Background image
    yesPercent: number; // 0-100
    volume: number; // Number of votes
    expiresAt: string; // ISO date
    createdAt: string; // ISO date

    // Live Multipliers (from DB)
    payoutMultiplierYes?: number;
    payoutMultiplierNo?: number;

    // Computed/Contextual multipliers (used by UI)
    yesMultiplier: number;
    noMultiplier: number;

    // Live Data Sources
    externalId?: string;
    oddsSource?: string;

    // Social
    commentCount?: number;
}

export interface Comment {
    id: string;
    userId: string;
    username: string;
    text: string;
    side: 'YES' | 'NO';
    likes: number;
    createdAt: string;
}
