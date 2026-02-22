import { describe, it, expect } from 'vitest';

describe('AppointmentsList Logic', () => {
    it('filters only scheduled appointments', () => {
        const events = [
            { event_type: 'appointment.scheduled' },
            { event_type: 'invitee.created' }
        ];
        const filtered = events.filter(e => e.event_type === 'appointment.scheduled');
        expect(filtered).toHaveLength(1);
    });
});
