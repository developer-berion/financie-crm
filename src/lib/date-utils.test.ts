import { describe, it, expect, vi } from 'vitest';
import { getDashboardDateRange } from './date-utils';

describe('getDashboardDateRange', () => {
  // Mock current date
  // Using a specific local time that maps to a clean UTC day if possible, 
  // but better to just compare the dates.
  const mockDate = new Date(2026, 1, 20, 10, 0, 0); // Feb 20, 2026, 10:00 AM Local
  
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates "today" correctly', () => {
    const { start } = getDashboardDateRange('today');
    const startObj = new Date(start);
    expect(startObj.getHours()).toBe(0);
    expect(startObj.getDate()).toBe(20);
  });

  it('calculates "yesterday" correctly', () => {
    const { start } = getDashboardDateRange('yesterday');
    const startObj = new Date(start);
    expect(startObj.getDate()).toBe(19);
    expect(startObj.getHours()).toBe(0);
  });

  it('calculates "this_week" correctly (starting Monday)', () => {
    const { start } = getDashboardDateRange('this_week');
    const startObj = new Date(start);
    // Feb 20, 2026 is Friday. Monday was Feb 16.
    expect(startObj.getDate()).toBe(16);
    expect(startObj.getHours()).toBe(0);
  });

  it('calculates "this_month" correctly', () => {
    const { start } = getDashboardDateRange('this_month');
    const startObj = new Date(start);
    expect(startObj.getDate()).toBe(1);
    expect(startObj.getMonth()).toBe(1); // February
  });

  it('calculates "last_month" correctly', () => {
    const { start, end } = getDashboardDateRange('last_month');
    const startObj = new Date(start);
    const endObj = new Date(end);
    expect(startObj.getMonth()).toBe(0); // January
    expect(startObj.getDate()).toBe(1);
    expect(endObj.getMonth()).toBe(0);
    expect(endObj.getDate()).toBe(31);
  });
});
