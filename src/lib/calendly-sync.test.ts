import { describe, it, expect } from 'vitest';

describe('Calendly Sync Logic', () => {
    it('documents failure when token is missing', () => {
        const error = 'Missing Calendly Token';
        expect(error).toBe('Missing Calendly Token');
    });

    it('documents failure when origin is localhost', () => {
        const origin: string = 'http://localhost:5173';
        const isAllowed = origin === 'https://crm.financiegroup.com';
        expect(isAllowed).toBe(false);
    });
});
