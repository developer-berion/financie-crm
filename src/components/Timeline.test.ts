import { describe, it, expect } from 'vitest';

// =============================================================================
// Extracted pure functions from Timeline.tsx for testing
// These mirror the functions inside the Timeline component
// =============================================================================

interface TimelineEvent {
    id: string;
    event_type: string;
    payload: Record<string, unknown> | null;
    created_at: string;
}

function getColor(type: string) {
    if (type.startsWith('call')) return 'bg-orange-500';
    if (type.startsWith('sms')) return 'bg-purple-500';
    if (type.startsWith('appointment')) return 'bg-blue-500';
    if (type.startsWith('pipeline')) return 'bg-gray-500';
    if (type.startsWith('lead.received')) return 'bg-green-500';
    if (type.startsWith('lead.dnc') || type.includes('dnc')) return 'bg-red-500';
    if (type.includes('failed') || type.includes('skipped')) return 'bg-red-600';
    if (type.startsWith('conversation')) return 'bg-brand-accent';
    return 'bg-gray-400';
}

function getTitle(e: TimelineEvent) {
    switch (e.event_type) {
        case 'lead.received.meta': return 'Lead recibido de Meta';
        case 'sms.immediate_sent': return 'SMS de Bienvenida Enviado';
        case 'sms.attempted': return 'SMS de Seguimiento Enviado';
        case 'sms.failed': return 'Error al enviar SMS';
        case 'call.outbound_triggered': return 'Agente AI ha realizado la llamada';
        case 'call.attempted': return 'Llamada automática intentada';
        case 'call.scheduled': return 'Agendamiento Creado';
        case 'call.scheduling_skipped': return 'Llamada automática omitida';
        case 'appointment.scheduled': return 'Cita agendada';
        case 'pipeline.stage_changed': return `Cambio de etapa: ${(e.payload as Record<string, unknown>)?.to || ''}`;
        case 'note.added': return 'Nota agregada';
        case 'lead.dnc_set': return 'Marcado como No Llamar';
        case 'conversation.completed': return 'Conversación AI Finalizada';
        case 'conversation.failed_initiation': return 'Fallo al Iniciar Conversación';
        case 'sms.received': return 'SMS Recibido (Respuesta)';
        case 'call.initiated': return 'Llamada Realizada';
        case 'call.answered': return 'Llamada Atendida';
        case 'call.failed': return 'Llamada no realizada por error';
        case 'call.missed': return 'Llamada Desviada / Sin Respuesta';
        case 'call.completed': return 'Llamada Finalizada';
        default: return e.event_type;
    }
}

function getDetails(e: TimelineEvent): string | null {
    const payload = e.payload as Record<string, unknown> | null;
    if (!payload) return null;

    if (e.event_type === 'call.attempted') {
        return `Intento #${payload.attempt || '?'}`;
    }
    if (e.event_type === 'sms.immediate_sent') {
        return payload.success ? 'Envío exitoso' : 'Falló el envío';
    }
    if (e.event_type === 'call.outbound_triggered') {
        return `Call ID: ${payload.call_id || 'N/A'}`;
    }
    return null;
}

// =============================================================================
// Tests
// =============================================================================

describe('Timeline — getColor', () => {
    it('returns orange for call events', () => {
        expect(getColor('call.completed')).toBe('bg-orange-500');
        expect(getColor('call.attempted')).toBe('bg-orange-500');
        expect(getColor('call.outbound_triggered')).toBe('bg-orange-500');
    });

    it('returns purple for sms events', () => {
        expect(getColor('sms.immediate_sent')).toBe('bg-purple-500');
        expect(getColor('sms.received')).toBe('bg-purple-500');
    });

    it('returns blue for appointment events', () => {
        expect(getColor('appointment.scheduled')).toBe('bg-blue-500');
        expect(getColor('appointment.synced')).toBe('bg-blue-500');
    });

    it('returns gray for pipeline events', () => {
        expect(getColor('pipeline.stage_changed')).toBe('bg-gray-500');
    });

    it('returns green for lead.received events', () => {
        expect(getColor('lead.received.meta')).toBe('bg-green-500');
    });

    it('returns red for DNC events', () => {
        expect(getColor('lead.dnc_set')).toBe('bg-red-500');
    });

    it('returns red-600 for failed/skipped events (non-call prefix)', () => {
        expect(getColor('something.failed')).toBe('bg-red-600');
        expect(getColor('task.skipped')).toBe('bg-red-600');
    });

    it('call.scheduling_skipped matches call prefix first (priority order)', () => {
        // call.scheduling_skipped starts with 'call', so it matches 'bg-orange-500' before 'skipped'
        expect(getColor('call.scheduling_skipped')).toBe('bg-orange-500');
    });

    it('returns brand-accent for conversation events', () => {
        expect(getColor('conversation.completed')).toBe('bg-brand-accent');
    });

    it('returns gray-400 as default', () => {
        expect(getColor('unknown.event')).toBe('bg-gray-400');
        expect(getColor('')).toBe('bg-gray-400');
    });
});

describe('Timeline — getTitle', () => {
    const makeEvent = (event_type: string, payload: Record<string, unknown> | null = null): TimelineEvent => ({
        id: '1', event_type, payload, created_at: '2026-01-01T00:00:00Z'
    });

    it('returns correct titles for all known event types', () => {
        expect(getTitle(makeEvent('lead.received.meta'))).toBe('Lead recibido de Meta');
        expect(getTitle(makeEvent('sms.immediate_sent'))).toBe('SMS de Bienvenida Enviado');
        expect(getTitle(makeEvent('call.outbound_triggered'))).toBe('Agente AI ha realizado la llamada');
        expect(getTitle(makeEvent('call.attempted'))).toBe('Llamada automática intentada');
        expect(getTitle(makeEvent('call.scheduled'))).toBe('Agendamiento Creado');
        expect(getTitle(makeEvent('appointment.scheduled'))).toBe('Cita agendada');
        expect(getTitle(makeEvent('note.added'))).toBe('Nota agregada');
        expect(getTitle(makeEvent('lead.dnc_set'))).toBe('Marcado como No Llamar');
        expect(getTitle(makeEvent('conversation.completed'))).toBe('Conversación AI Finalizada');
        expect(getTitle(makeEvent('call.initiated'))).toBe('Llamada Realizada');
        expect(getTitle(makeEvent('call.answered'))).toBe('Llamada Atendida');
        expect(getTitle(makeEvent('call.failed'))).toBe('Llamada no realizada por error');
        expect(getTitle(makeEvent('call.missed'))).toBe('Llamada Desviada / Sin Respuesta');
        expect(getTitle(makeEvent('call.completed'))).toBe('Llamada Finalizada');
    });

    it('includes pipeline stage name in title for stage_changed', () => {
        const e = makeEvent('pipeline.stage_changed', { to: 'Calificado' });
        expect(getTitle(e)).toBe('Cambio de etapa: Calificado');
    });

    it('handles pipeline.stage_changed with no payload', () => {
        const e = makeEvent('pipeline.stage_changed', null);
        expect(getTitle(e)).toContain('Cambio de etapa');
    });

    it('returns event_type for unknown event types', () => {
        expect(getTitle(makeEvent('custom.event'))).toBe('custom.event');
    });
});

describe('Timeline — getDetails', () => {
    const makeEvent = (event_type: string, payload: Record<string, unknown> | null = null): TimelineEvent => ({
        id: '1', event_type, payload, created_at: '2026-01-01T00:00:00Z'
    });

    it('returns null for events with no payload', () => {
        expect(getDetails(makeEvent('call.attempted', null))).toBeNull();
    });

    it('returns attempt number for call.attempted', () => {
        expect(getDetails(makeEvent('call.attempted', { attempt: 3 }))).toBe('Intento #3');
    });

    it('returns ? for call.attempted without attempt number', () => {
        expect(getDetails(makeEvent('call.attempted', {}))).toBe('Intento #?');
    });

    it('returns success message for sms.immediate_sent', () => {
        expect(getDetails(makeEvent('sms.immediate_sent', { success: true }))).toBe('Envío exitoso');
        expect(getDetails(makeEvent('sms.immediate_sent', { success: false }))).toBe('Falló el envío');
    });

    it('returns call_id for call.outbound_triggered', () => {
        expect(getDetails(makeEvent('call.outbound_triggered', { call_id: 'abc123' }))).toBe('Call ID: abc123');
    });

    it('returns N/A when call_id is missing', () => {
        expect(getDetails(makeEvent('call.outbound_triggered', {}))).toBe('Call ID: N/A');
    });

    it('returns null for unknown event types with payload', () => {
        expect(getDetails(makeEvent('unknown.event', { data: 'test' }))).toBeNull();
    });
});
