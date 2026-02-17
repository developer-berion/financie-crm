import { describe, it, expect } from 'vitest';

// =============================================================================
// Extracted pure functions from LeadTable.tsx for testing
// =============================================================================

interface Lead {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
    source: string;
    meta_lead_id: string | null;
    status: string;
    stage_id: string | null;
    do_not_call: boolean;
    marketing_consent: boolean;
    created_at: string;
    updated_at: string;
    pipeline_stages?: { name: string } | { name: string }[] | null;
    estimated_value?: number;
}

function getStageName(lead: Lead): string {
    return Array.isArray(lead.pipeline_stages)
        ? lead.pipeline_stages[0]?.name || ''
        : lead.pipeline_stages?.name || '';
}

function getRowBorderColor(stageName: string = ''): string {
    const lower = stageName.toLowerCase();
    if (lower.includes('contacto 1')) return 'border-l-4 border-emerald-500 bg-emerald-50/10';
    if (lower.includes('contacto 2')) return 'border-l-4 border-yellow-400 bg-yellow-50/10';
    if (lower.includes('contacto 3')) return 'border-l-4 border-red-500 bg-red-50/10';
    if (lower.includes('ganado')) return 'border-l-4 border-green-600';
    if (lower.includes('perdido')) return 'border-l-4 border-gray-300 opacity-70';
    return 'border-l-4 border-indigo-500';
}

function getStageBadgeStyle(stageName: string = ''): string {
    const lower = stageName.toLowerCase();
    if (lower.includes('contacto 1')) return 'bg-emerald-500 text-white border-emerald-600 shadow-sm';
    if (lower.includes('contacto 2')) return 'bg-yellow-500 text-white border-yellow-600 shadow-sm';
    if (lower.includes('contacto 3')) return 'bg-red-600 text-white border-red-700 shadow-sm';
    if (lower.includes('ganado')) return 'bg-green-600 text-white border-green-700 shadow-sm';
    if (lower.includes('perdido')) return 'bg-gray-400 text-white border-gray-500 shadow-sm';
    return 'bg-indigo-500 text-white border-indigo-600 shadow-sm';
}

function getValueStyle(value?: number): string {
    if (!value) return 'text-gray-300 text-xs';
    if (value >= 5000) return 'text-emerald-700 font-bold bg-emerald-50 border-emerald-300';
    if (value >= 1000) return 'text-blue-700 font-bold bg-blue-50 border-blue-200';
    return 'text-gray-700 font-semibold bg-gray-50 border-gray-200';
}

// =============================================================================
// Tests
// =============================================================================

describe('LeadTable — getStageName', () => {
    const baseLead: Lead = {
        id: '1', full_name: 'Test User', phone: '+1234567890', email: null,
        source: 'meta', meta_lead_id: null, status: 'nuevo', stage_id: null,
        do_not_call: false, marketing_consent: true,
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    };

    it('extracts name from object pipeline_stages', () => {
        const lead = { ...baseLead, pipeline_stages: { name: 'Lead Nuevo' } };
        expect(getStageName(lead)).toBe('Lead Nuevo');
    });

    it('extracts first name from array pipeline_stages', () => {
        const lead = { ...baseLead, pipeline_stages: [{ name: 'Contactado' }, { name: 'Calificado' }] };
        expect(getStageName(lead)).toBe('Contactado');
    });

    it('returns empty string for null pipeline_stages', () => {
        const lead = { ...baseLead, pipeline_stages: null };
        expect(getStageName(lead)).toBe('');
    });

    it('returns empty string for undefined pipeline_stages', () => {
        const lead = { ...baseLead };
        delete (lead as Record<string, unknown>).pipeline_stages;
        expect(getStageName(lead)).toBe('');
    });

    it('returns empty string for empty array pipeline_stages', () => {
        const lead = { ...baseLead, pipeline_stages: [] as { name: string }[] };
        expect(getStageName(lead)).toBe('');
    });
});

describe('LeadTable — getRowBorderColor', () => {
    it('returns emerald for "Contacto 1"', () => {
        expect(getRowBorderColor('Contacto 1')).toContain('border-emerald-500');
    });

    it('returns yellow for "Contacto 2"', () => {
        expect(getRowBorderColor('Contacto 2')).toContain('border-yellow-400');
    });

    it('returns red for "Contacto 3"', () => {
        expect(getRowBorderColor('Contacto 3')).toContain('border-red-500');
    });

    it('returns green for stages containing "ganado"', () => {
        expect(getRowBorderColor('Cerrado Ganado')).toContain('border-green-600');
    });

    it('returns gray with opacity for "perdido"', () => {
        const res = getRowBorderColor('Cerrado Perdido');
        expect(res).toContain('border-gray-300');
        expect(res).toContain('opacity-70');
    });

    it('returns indigo default for unknown stages', () => {
        expect(getRowBorderColor('Lead Nuevo')).toContain('border-indigo-500');
    });

    it('handles empty string', () => {
        expect(getRowBorderColor('')).toContain('border-indigo-500');
    });

    it('handles undefined', () => {
        expect(getRowBorderColor()).toContain('border-indigo-500');
    });

    it('is case insensitive', () => {
        expect(getRowBorderColor('CONTACTO 1')).toContain('border-emerald-500');
        expect(getRowBorderColor('cerrado ganado')).toContain('border-green-600');
    });
});

describe('LeadTable — getStageBadgeStyle', () => {
    it('returns emerald for "Contacto 1"', () => {
        expect(getStageBadgeStyle('Contacto 1')).toContain('bg-emerald-500');
    });

    it('returns yellow for "Contacto 2"', () => {
        expect(getStageBadgeStyle('Contacto 2')).toContain('bg-yellow-500');
    });

    it('returns red for "Contacto 3"', () => {
        expect(getStageBadgeStyle('Contacto 3')).toContain('bg-red-600');
    });

    it('returns green for "ganado"', () => {
        expect(getStageBadgeStyle('Cerrado Ganado')).toContain('bg-green-600');
    });

    it('returns gray for "perdido"', () => {
        expect(getStageBadgeStyle('Cerrado Perdido')).toContain('bg-gray-400');
    });

    it('returns indigo default', () => {
        expect(getStageBadgeStyle('Lead Nuevo')).toContain('bg-indigo-500');
    });

    it('all styles include text-white', () => {
        expect(getStageBadgeStyle('Contacto 1')).toContain('text-white');
        expect(getStageBadgeStyle('Lead Nuevo')).toContain('text-white');
        expect(getStageBadgeStyle('Cerrado Perdido')).toContain('text-white');
    });
});

describe('LeadTable — getValueStyle', () => {
    it('returns muted style for undefined value', () => {
        expect(getValueStyle(undefined)).toContain('text-gray-300');
    });

    it('returns muted style for 0 value', () => {
        expect(getValueStyle(0)).toContain('text-gray-300');
    });

    it('returns emerald for high values (>= 5000)', () => {
        expect(getValueStyle(5000)).toContain('text-emerald-700');
        expect(getValueStyle(10000)).toContain('text-emerald-700');
    });

    it('returns blue for medium values (>= 1000, < 5000)', () => {
        expect(getValueStyle(1000)).toContain('text-blue-700');
        expect(getValueStyle(4999)).toContain('text-blue-700');
    });

    it('returns gray for low values (< 1000)', () => {
        expect(getValueStyle(500)).toContain('text-gray-700');
        expect(getValueStyle(1)).toContain('text-gray-700');
    });

    it('high values include font-bold', () => {
        expect(getValueStyle(5000)).toContain('font-bold');
    });

    it('low values include font-semibold', () => {
        expect(getValueStyle(500)).toContain('font-semibold');
    });
});
