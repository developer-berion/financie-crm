import { describe, it, expect } from 'vitest';
import { getLeadTimeZone, formatLeadTime } from './utils';

describe('getLeadTimeZone', () => {
  it('returns America/New_York as default for empty input', () => {
    expect(getLeadTimeZone(undefined)).toBe('America/New_York');
    expect(getLeadTimeZone('')).toBe('America/New_York');
  });

  it('resolves standard US state abbreviations correctly', () => {
    expect(getLeadTimeZone('FL')).toBe('America/New_York');
    expect(getLeadTimeZone('NY')).toBe('America/New_York');
    expect(getLeadTimeZone('CA')).toBe('America/Los_Angeles');
    expect(getLeadTimeZone('TX')).toBe('America/Chicago');
    expect(getLeadTimeZone('AZ')).toBe('America/Phoenix');
  });

  it('resolves full state names (case insensitive) correctly', () => {
    expect(getLeadTimeZone('Florida')).toBe('America/New_York');
    expect(getLeadTimeZone('california')).toBe('America/Los_Angeles');
    expect(getLeadTimeZone('TEXAS')).toBe('America/Chicago');
  });

  it('defaults to America/New_York for unknown states', () => {
    expect(getLeadTimeZone('Mars')).toBe('America/New_York');
    expect(getLeadTimeZone('XX')).toBe('America/New_York');
  });
});

describe('formatLeadTime', () => {
    // We use a fixed UTC date for testing: 2026-02-15T10:00:00Z
    // In NY (EST -5): 05:00 AM
    // In CA (PST -8): 02:00 AM
    const testDate = '2026-02-15T10:00:00Z';

    it('formats time correctly for NY (Eastern)', () => {
        const result = formatLeadTime(testDate, 'NY');
        expect(result.timeZone).toBe('America/New_York');
        // Node's Intl might return non-breaking space, so we match loosely or trim
        expect(result.time).toMatch(/5:00/);
        expect(result.friendlyZone).toBe('Eastern');
    });

    it('formats time correctly for CA (Pacific)', () => {
        const result = formatLeadTime(testDate, 'CA');
        expect(result.timeZone).toBe('America/Los_Angeles');
        expect(result.time).toMatch(/2:00/);
        expect(result.friendlyZone).toBe('Pacific');
    });

    it('handles Spanish day formatting', () => {
        // 2026-02-15 is a Sunday (domingo)
        const result = formatLeadTime(testDate, 'NY');
        expect(result.day).toMatch(/dom/i);
        expect(result.day).toMatch(/15/);
    });
});
