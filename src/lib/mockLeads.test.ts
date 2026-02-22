import { describe, it, expect } from 'vitest';
import { generateMockLeads } from './mockLeads';

describe('generateMockLeads', () => {
    it('generates the requested number of leads', () => {
        expect(generateMockLeads(10)).toHaveLength(10);
    });

    it('each lead has all required fields', () => {
        const leads = generateMockLeads(5);
        for (const lead of leads) {
            expect(lead).toHaveProperty('id');
            expect(lead).toHaveProperty('full_name');
            expect(lead).toHaveProperty('email');
            expect(lead).toHaveProperty('phone');
            expect(lead).toHaveProperty('source');
            expect(lead).toHaveProperty('status');
            expect(lead).toHaveProperty('created_at');
        }
    });
});
