import { describe, it, expect } from 'vitest';

// =============================================================================
// Extracted pure functions from PipelineFunnel.tsx for testing
// =============================================================================

const stageColors: Record<string, string> = {
    'lead nuevo': 'bg-blue-500',
    'llamada en curso': 'bg-indigo-500',
    'contactado': 'bg-violet-500',
    'calificando': 'bg-violet-500',
    'cita agendada': 'bg-amber-500',
    'cita completada': 'bg-orange-500',
    'propuesta': 'bg-cyan-600',
    'cerrado ganado': 'bg-emerald-500',
    'cerrado perdido': 'bg-gray-400',
};

function getBarColor(stageName: string): string {
    const lower = stageName.toLowerCase();
    for (const [key, color] of Object.entries(stageColors)) {
        if (lower.includes(key)) return color;
    }
    return 'bg-blue-500';
}

// =============================================================================
// Tests
// =============================================================================

describe('PipelineFunnel — getBarColor', () => {
    it('returns blue for "Lead Nuevo"', () => {
        expect(getBarColor('Lead Nuevo')).toBe('bg-blue-500');
    });

    it('returns indigo for "Llamada en Curso"', () => {
        expect(getBarColor('Llamada en Curso')).toBe('bg-indigo-500');
    });

    it('returns violet for "Contactado"', () => {
        expect(getBarColor('Contactado')).toBe('bg-violet-500');
    });

    it('returns violet for "Calificando"', () => {
        expect(getBarColor('Calificando')).toBe('bg-violet-500');
    });

    it('returns amber for "Cita Agendada"', () => {
        expect(getBarColor('Cita Agendada')).toBe('bg-amber-500');
    });

    it('returns orange for "Cita Completada"', () => {
        expect(getBarColor('Cita Completada')).toBe('bg-orange-500');
    });

    it('returns cyan for "Propuesta"', () => {
        expect(getBarColor('Propuesta')).toBe('bg-cyan-600');
    });

    it('returns emerald for "Cerrado Ganado"', () => {
        expect(getBarColor('Cerrado Ganado')).toBe('bg-emerald-500');
    });

    it('returns gray for "Cerrado Perdido"', () => {
        expect(getBarColor('Cerrado Perdido')).toBe('bg-gray-400');
    });

    it('returns default blue for unknown stages', () => {
        expect(getBarColor('Unknown Stage')).toBe('bg-blue-500');
        expect(getBarColor('')).toBe('bg-blue-500');
    });

    it('is case insensitive', () => {
        expect(getBarColor('LEAD NUEVO')).toBe('bg-blue-500');
        expect(getBarColor('CERRADO GANADO')).toBe('bg-emerald-500');
    });

    it('matches partial names', () => {
        expect(getBarColor('Etapa: Contactado (3)')).toBe('bg-violet-500');
    });
});
