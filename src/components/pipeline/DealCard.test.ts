import { describe, it, expect } from 'vitest';

function formatDealValue(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

function isStagnant(updatedAt: string | null, now: Date = new Date()): boolean {
    const lastActivity = updatedAt ? new Date(updatedAt) : new Date();
    return (now.getTime() - lastActivity.getTime()) > (10 * 24 * 60 * 60 * 1000);
}

describe('DealCard utilities', () => {
    describe('formatDealValue', () => {
        it('formats whole numbers as USD', () => {
            expect(formatDealValue(5000)).toBe('$5,000');
        });
    });

    describe('isStagnant', () => {
        const NOW = new Date('2026-02-20T12:00:00Z');
        it('returns true when last activity was 11 days ago', () => {
            const elevenDaysAgo = new Date('2026-02-09T12:00:00Z');
            expect(isStagnant(elevenDaysAgo.toISOString(), NOW)).toBe(true);
        });
    });
});
