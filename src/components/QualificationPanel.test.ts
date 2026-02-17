import { describe, it, expect } from 'vitest';

// =============================================================================
// Extracted pure functions from QualificationPanel.tsx for testing
// =============================================================================

function normalizeObjective(val: string | null): string {
    if (!val) return '';
    const lower = val.toLowerCase().trim();
    if (lower.includes('protección') || lower.includes('proteccion') || lower.includes('familiar')) return 'Protección Familiar';
    if (lower.includes('retiro')) return 'Ahorro para retiro';
    if (lower.includes('hijos') || lower.includes('educación') || lower.includes('educacion')) return 'Educación para tus hijos';
    return val;
}

function normalizeYesNo(val: string | null): string {
    if (!val) return '';
    const lower = val.toLowerCase().trim();
    if (lower === 'si' || lower === 'sí' || lower === 'yes') return 'Si';
    if (lower === 'no') return 'No';
    return val;
}

// =============================================================================
// Tests
// =============================================================================

describe('QualificationPanel — normalizeObjective', () => {
    it('returns empty string for null', () => {
        expect(normalizeObjective(null)).toBe('');
    });

    it('returns empty string for empty string', () => {
        expect(normalizeObjective('')).toBe('');
    });

    it('normalizes "protección" variants to "Protección Familiar"', () => {
        expect(normalizeObjective('protección')).toBe('Protección Familiar');
        expect(normalizeObjective('proteccion')).toBe('Protección Familiar');
        expect(normalizeObjective('Protección Familiar')).toBe('Protección Familiar');
        expect(normalizeObjective('PROTECCION TOTAL')).toBe('Protección Familiar');
    });

    it('normalizes "familiar" variants', () => {
        expect(normalizeObjective('protección familiar')).toBe('Protección Familiar');
        expect(normalizeObjective('Seguro Familiar')).toBe('Protección Familiar');
    });

    it('normalizes "retiro" to "Ahorro para retiro"', () => {
        expect(normalizeObjective('retiro')).toBe('Ahorro para retiro');
        expect(normalizeObjective('Plan de Retiro')).toBe('Ahorro para retiro');
        expect(normalizeObjective('RETIRO TEMPRANO')).toBe('Ahorro para retiro');
    });

    it('normalizes "hijos" and "educación" to "Educación para tus hijos"', () => {
        expect(normalizeObjective('hijos')).toBe('Educación para tus hijos');
        expect(normalizeObjective('educación')).toBe('Educación para tus hijos');
        expect(normalizeObjective('educacion')).toBe('Educación para tus hijos');
        expect(normalizeObjective('Fondo para Hijos')).toBe('Educación para tus hijos');
    });

    it('returns original value for non-matching strings', () => {
        expect(normalizeObjective('Inversión')).toBe('Inversión');
        expect(normalizeObjective('Otro objetivo')).toBe('Otro objetivo');
    });

    it('handles leading/trailing whitespace', () => {
        expect(normalizeObjective('  retiro  ')).toBe('Ahorro para retiro');
    });
});

describe('QualificationPanel — normalizeYesNo', () => {
    it('returns empty string for null', () => {
        expect(normalizeYesNo(null)).toBe('');
    });

    it('returns empty string for empty string', () => {
        expect(normalizeYesNo('')).toBe('');
    });

    it('normalizes "si" variants to "Si"', () => {
        expect(normalizeYesNo('si')).toBe('Si');
        expect(normalizeYesNo('SI')).toBe('Si');
        expect(normalizeYesNo('Si')).toBe('Si');
    });

    it('normalizes "sí" (with accent) to "Si"', () => {
        expect(normalizeYesNo('sí')).toBe('Si');
        expect(normalizeYesNo('SÍ')).toBe('Si');
    });

    it('normalizes "yes" to "Si"', () => {
        expect(normalizeYesNo('yes')).toBe('Si');
        expect(normalizeYesNo('YES')).toBe('Si');
    });

    it('normalizes "no" to "No"', () => {
        expect(normalizeYesNo('no')).toBe('No');
        expect(normalizeYesNo('NO')).toBe('No');
        expect(normalizeYesNo('No')).toBe('No');
    });

    it('returns original value for non-matching strings', () => {
        expect(normalizeYesNo('maybe')).toBe('maybe');
        expect(normalizeYesNo('N/A')).toBe('N/A');
    });

    it('handles leading/trailing whitespace', () => {
        expect(normalizeYesNo('  si  ')).toBe('Si');
        expect(normalizeYesNo(' no ')).toBe('No');
    });
});
