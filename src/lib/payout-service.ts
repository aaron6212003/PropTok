/**
 * Payout Service
 * Handles the logic for distributing tournament pools to winners, creators, and the platform.
 */

export interface PayoutCalculation {
    poolCents: number;
    platformCents: number;
    creatorCents: number;
    winners: {
        userId: string;
        amountCents: number;
        rank: number;
    }[];
}

export function calculatePayouts(
    totalPotCents: number,
    platformFeePercent: number,
    creatorFeePercent: number,
    payoutStructure: Record<string, number>,
    rankedEntries: { userId: string; currentStack: number }[]
): PayoutCalculation {
    const platformCents = Math.floor(totalPotCents * (platformFeePercent / 100));
    const creatorCents = Math.floor(totalPotCents * (creatorFeePercent / 100));
    const netPoolCents = totalPotCents - platformCents - creatorCents;

    const winners: PayoutCalculation['winners'] = [];

    // Payout structure is e.g. {"1": 70, "2": 20, "3": 10}
    for (const [rankStr, percent] of Object.entries(payoutStructure)) {
        const rank = parseInt(rankStr);
        const entry = rankedEntries[rank - 1]; // 0-indexed

        if (entry) {
            winners.push({
                userId: entry.userId,
                amountCents: Math.floor(netPoolCents * (percent / 100)),
                rank: rank
            });
        }
    }

    // Adjust for rounding: add leftovers to 1st place
    const totalDistributed = winners.reduce((acc, w) => acc + w.amountCents, 0);
    if (winners.length > 0 && totalDistributed < netPoolCents) {
        winners[0].amountCents += (netPoolCents - totalDistributed);
    }

    return {
        poolCents: totalPotCents,
        platformCents,
        creatorCents,
        winners
    };
}
