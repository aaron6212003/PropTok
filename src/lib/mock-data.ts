import { Prediction, User } from './types';

export const MOCK_USER: User = {
    id: 'u1',
    username: 'crypto_king',
    winRate: 68,
    streak: 5,
    bestStreak: 12,
};

export const MOCK_PREDICTIONS: Prediction[] = [
    {
        id: 'p1',
        category: 'Sports',
        question: 'Will the Steelers beat the Ravens this Sunday?',
        description: 'Week 14 Matchup. Ravens are favored by 3.5 points.',
        yesPercent: 42,
        volume: 12403,
        expiresAt: new Date(Date.now() + 86400000 * 2).toISOString(),
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        yesMultiplier: 2.1,
        noMultiplier: 1.6,
        imageUrl: 'https://images.unsplash.com/photo-1629906646841-39e56fd2372e?auto=format&fit=crop&q=80',
    },
    {
        id: 'p2',
        category: 'Crypto',
        question: 'Will Bitcoin hit $100k before Friday?',
        yesPercent: 88,
        volume: 45092,
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        yesMultiplier: 1.1,
        noMultiplier: 5.4,
        imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&q=80',
    },
    {
        id: 'p3',
        category: 'Celebs',
        question: 'Will Taylor Swift announce a new album tonight?',
        yesPercent: 12,
        volume: 8900,
        expiresAt: new Date(Date.now() + 10000000).toISOString(),
        createdAt: new Date(Date.now() - 1000000).toISOString(),
        yesMultiplier: 6.5,
        noMultiplier: 1.05,
        imageUrl: 'https://images.unsplash.com/photo-1514525253440-b393452e3383?auto=format&fit=crop&q=80',
    },
    {
        id: 'p4',
        category: 'Stocks',
        question: 'Will NVDA close above $150 today?',
        yesPercent: 55,
        volume: 2100,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        yesMultiplier: 1.8,
        noMultiplier: 1.8,
        imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?auto=format&fit=crop&q=80', // Stock chart placeholder
    },
];
