import { describe, it, expect } from 'vitest';

// =============================================================================
// Extracted pure functions from ActivityFeed.tsx for testing
// =============================================================================

interface LeadEvent {
    id: string;
    lead_id: string | null;
    event_type: string;
    payload: Record<string, unknown> | null;
    created_at: string;
    lead_name?: string;
}

const eventConfig: Record<string, { label: string }> = {
    'lead.received.meta': { label: 'Nuevo lead de Meta' },
    'lead.created': { label: 'Lead creado' },
    'call.completed': { label: 'Llamada completada' },
    'call.answered': { label: 'Llamada contestada' },
    'call.failed': { label: 'Llamada fallida' },
    'call.no_answer': { label: 'Sin respuesta' },
    'note.added': { label: 'Nota agregada' },
    'appointment.scheduled': { label: 'Cita agendada' },
    'appointment.synced': { label: 'Cita sincronizada' },
    'pipeline.stage_changed': { label: 'Pipeline movido' },
    'conversation.completed': { label: 'IA: Análisis completado' },
};

const defaultConfig = { label: 'Evento' };

function getEventDescription(event: LeadEvent): string {
    const config = eventConfig[event.event_type] || defaultConfig;
    const leadName = event.lead_name || 'Lead';

    if (event.event_type === 'pipeline.stage_changed' && event.payload?.to) {
        return `${leadName} → ${event.payload.to}`;
    }
    if (event.event_type === 'call.completed' && event.payload?.status) {
        return `${config.label} — ${leadName}`;
    }
    if (event.event_type === 'conversation.completed' && (event.payload as Record<string, unknown>)?.analysis) {
        const payload = event.payload as Record<string, Record<string, string>>;
        const summary = payload.analysis?.summary;
        if (summary) {
            return `IA: ${summary.length > 60 ? summary.substring(0, 60) + '...' : summary}`;
        }
    }

    return `${config.label} — ${leadName}`;
}

// Event filtering logic from ActivityFeed component
function filterEvents(events: LeadEvent[], enableAI: boolean): LeadEvent[] {
    return events.filter(e => {
        if (!enableAI && (e.event_type.startsWith('call.') || e.event_type.startsWith('sms.'))) {
            return false;
        }
        return true;
    });
}

// =============================================================================
// Tests
// =============================================================================

describe('ActivityFeed — getEventDescription', () => {
    const makeEvent = (overrides: Partial<LeadEvent>): LeadEvent => ({
        id: '1',
        lead_id: 'lead-1',
        event_type: 'lead.created',
        payload: null,
        created_at: '2026-01-01T00:00:00Z',
        lead_name: 'John Doe',
        ...overrides,
    });

    it('returns pipeline stage change with lead name and destination', () => {
        const event = makeEvent({
            event_type: 'pipeline.stage_changed',
            payload: { to: 'Calificado' },
        });
        expect(getEventDescription(event)).toBe('John Doe → Calificado');
    });

    it('returns call.completed with label and lead name', () => {
        const event = makeEvent({
            event_type: 'call.completed',
            payload: { status: 'completed' },
        });
        expect(getEventDescription(event)).toBe('Llamada completada — John Doe');
    });

    it('returns AI summary for conversation.completed', () => {
        const event = makeEvent({
            event_type: 'conversation.completed',
            payload: { analysis: { summary: 'Prospect interested in retirement plan' } },
        });
        expect(getEventDescription(event)).toBe('IA: Prospect interested in retirement plan');
    });

    it('truncates long AI summaries at 60 characters', () => {
        const longSummary = 'A'.repeat(100);
        const event = makeEvent({
            event_type: 'conversation.completed',
            payload: { analysis: { summary: longSummary } },
        });
        const result = getEventDescription(event);
        expect(result).toContain('...');
        expect(result.length).toBeLessThan(70);
    });

    it('uses "Lead" as default name when lead_name is missing', () => {
        const event = makeEvent({
            event_type: 'note.added',
            lead_name: undefined,
        });
        expect(getEventDescription(event)).toBe('Nota agregada — Lead');
    });

    it('returns default label for unknown events', () => {
        const event = makeEvent({ event_type: 'unknown.event' });
        expect(getEventDescription(event)).toBe('Evento — John Doe');
    });

    it('returns correct labels for each known event type', () => {
        expect(getEventDescription(makeEvent({ event_type: 'lead.received.meta' }))).toContain('Nuevo lead de Meta');
        expect(getEventDescription(makeEvent({ event_type: 'call.failed' }))).toContain('Llamada fallida');
        expect(getEventDescription(makeEvent({ event_type: 'appointment.scheduled' }))).toContain('Cita agendada');
        expect(getEventDescription(makeEvent({ event_type: 'appointment.synced' }))).toContain('Cita sincronizada');
    });
});

describe('ActivityFeed — filterEvents', () => {
    const events: LeadEvent[] = [
        { id: '1', lead_id: 'l1', event_type: 'lead.created', payload: null, created_at: '2026-01-01T00:00:00Z' },
        { id: '2', lead_id: 'l1', event_type: 'call.completed', payload: null, created_at: '2026-01-01T01:00:00Z' },
        { id: '3', lead_id: 'l1', event_type: 'sms.immediate_sent', payload: null, created_at: '2026-01-01T02:00:00Z' },
        { id: '4', lead_id: 'l1', event_type: 'appointment.scheduled', payload: null, created_at: '2026-01-01T03:00:00Z' },
        { id: '5', lead_id: 'l1', event_type: 'note.added', payload: null, created_at: '2026-01-01T04:00:00Z' },
    ];

    it('returns all events when AI features are enabled', () => {
        expect(filterEvents(events, true)).toHaveLength(5);
    });

    it('filters out call and sms events when AI features are disabled', () => {
        const filtered = filterEvents(events, false);
        expect(filtered).toHaveLength(3);
        expect(filtered.map(e => e.event_type)).toEqual([
            'lead.created',
            'appointment.scheduled',
            'note.added',
        ]);
    });

    it('returns empty array for empty input', () => {
        expect(filterEvents([], true)).toHaveLength(0);
    });

    it('returns empty array when all events are filtered', () => {
        const onlyCallEvents: LeadEvent[] = [
            { id: '1', lead_id: 'l1', event_type: 'call.completed', payload: null, created_at: '2026-01-01T00:00:00Z' },
            { id: '2', lead_id: 'l1', event_type: 'sms.sent', payload: null, created_at: '2026-01-01T00:00:00Z' },
        ];
        expect(filterEvents(onlyCallEvents, false)).toHaveLength(0);
    });
});
