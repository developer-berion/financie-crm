import { describe, it, expect } from 'vitest';
import { getStatusConfig, STATUS_CONFIG } from './constants';

describe('getStatusConfig', () => {
  it('should return default config when status is null or undefined', () => {
    expect(getStatusConfig(null)).toEqual(STATUS_CONFIG['default']);
    expect(getStatusConfig(undefined)).toEqual(STATUS_CONFIG['default']);
  });

  it('should return "new" config for "New" or "Nuevo" status', () => {
    expect(getStatusConfig('New')).toEqual(STATUS_CONFIG['new']);
    expect(getStatusConfig('Nuevo')).toEqual(STATUS_CONFIG['new']);
    expect(getStatusConfig('nuevo lead')).toEqual(STATUS_CONFIG['new']);
  });

  it('should return "won" config for "Ganado", "Won", or "Cerrado"', () => {
    expect(getStatusConfig('Ganado')).toEqual(STATUS_CONFIG['won']);
    expect(getStatusConfig('Won')).toEqual(STATUS_CONFIG['won']);
    expect(getStatusConfig('Cerrado')).toEqual(STATUS_CONFIG['won']);
  });

  it('should return "lost" config for "Perdido" or "Lost"', () => {
    expect(getStatusConfig('Perdido')).toEqual(STATUS_CONFIG['lost']);
    expect(getStatusConfig('Lost')).toEqual(STATUS_CONFIG['lost']);
  });

  it('should return "contacted" config for "Contactado", "Progres", or "Negotiation"', () => {
    expect(getStatusConfig('Contactado')).toEqual(STATUS_CONFIG['contacted']);
    expect(getStatusConfig('En Progreso')).toEqual(STATUS_CONFIG['contacted']);
    expect(getStatusConfig('Negotiation')).toEqual(STATUS_CONFIG['contacted']);
  });

  it('should return exact match if defined in STATUS_CONFIG', () => {
    expect(getStatusConfig('nurturing')).toEqual(STATUS_CONFIG['nurturing']);
  });

  it('should fall back to default style with original label if unknown', () => {
    const unknownStatus = 'Some Weird Status';
    const result = getStatusConfig(unknownStatus);
    expect(result.color).toBe(STATUS_CONFIG['default'].color);
    expect(result.bg).toBe(STATUS_CONFIG['default'].bg);
    expect(result.label).toBe(unknownStatus);
  });
});
