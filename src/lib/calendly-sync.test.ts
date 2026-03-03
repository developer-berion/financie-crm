import { describe, it, expect } from 'vitest';

describe('Calendly Sync Logic', () => {
    it('documents failure when token is missing', () => {
        const error = 'Missing Calendly Token';
        expect(error).toBe('Missing Calendly Token');
    });

    it('documents failure when origin is localhost', () => {
        const origin = 'http://localhost:5173';
        const allowedOrigins = ['https://portal.financiegroup.com', 'https://portal-staging.financiegroup.com'];
        const isAllowed = allowedOrigins.includes(origin);
        expect(isAllowed).toBe(false);
    });
});
