import { describe, it, expect } from 'vitest';
import { validateLeadStageGate, STAGE_GATES } from './stage-gates';

describe('STAGE_GATES configuration', () => {
    it('defines rules for "Propuesta" stage', () => {
        expect(STAGE_GATES['Propuesta']).toBeDefined();
        expect(STAGE_GATES['Propuesta'].requiredFields).toContain('estimated_value');
    });

    it('defines rules for "Cerrado Ganado" stage', () => {
        expect(STAGE_GATES['Cerrado Ganado']).toBeDefined();
        expect(STAGE_GATES['Cerrado Ganado'].requiredFields).toContain('contract_signed');
        expect(STAGE_GATES['Cerrado Ganado'].requiredFields).toContain('contract_url');
    });

    it('has explanations for all stages', () => {
        for (const [, rule] of Object.entries(STAGE_GATES)) {
            expect(rule.explanation).toBeTruthy();
            expect(rule.explanation.length).toBeGreaterThan(10);
        }
    });
});

describe('validateLeadStageGate', () => {
    describe('Propuesta stage', () => {
        it('returns empty array when estimated_value is present and > 0', () => {
            const lead = { estimated_value: 5000 };
            expect(validateLeadStageGate(lead, 'Propuesta')).toEqual([]);
        });

        it('returns ["estimated_value"] when value is 0', () => {
            const lead = { estimated_value: 0 };
            expect(validateLeadStageGate(lead, 'Propuesta')).toEqual(['estimated_value']);
        });
    });

    describe('Cerrado Ganado stage', () => {
        it('returns empty array when all fields are present', () => {
            const lead = {
                contract_details: {
                    contract_signed: 'true',
                    contract_url: 'https://example.com/contract.pdf'
                }
            };
            expect(validateLeadStageGate(lead, 'Cerrado Ganado')).toEqual([]);
        });
    });
});
