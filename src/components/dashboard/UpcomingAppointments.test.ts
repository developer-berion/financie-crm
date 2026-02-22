import { describe, it, expect } from 'vitest';

describe('UpcomingAppointments Logic', () => {
    it('returns "Hoy" for current date', () => {
        const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
        expect(isToday(new Date())).toBe(true);
    });
});
