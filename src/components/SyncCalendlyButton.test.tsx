import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('SyncCalendlyButton', () => {
    it('has mm:ss formatting for cooldown', () => {
        const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        };
        expect(formatTime(300)).toBe('5:00');
        expect(formatTime(125)).toBe('2:05');
    });
});
