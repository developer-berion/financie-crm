import { describe, it, expect } from 'vitest';

function formatCurrency(amount: number): string {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
    return `$${amount}`;
}

describe('RevenueForecast — formatCurrency', () => {
    it('formats millions with M suffix', () => {
        expect(formatCurrency(1_000_000)).toBe('$1.0M');
    });

    it('formats thousands with K suffix', () => {
        expect(formatCurrency(1_000)).toBe('$1K');
    });
});
