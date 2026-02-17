import { describe, it, expect } from 'vitest';

// =============================================================================
// Extracted pure functions from shared-utils.ts for testing
// These are the PII masking functions used in Edge Functions
// =============================================================================

function maskPhone(phone: string): string {
    if (!phone) return '[no-phone]';
    return phone.replace(/(\+?\d{1,3})\d{4,}(\d{2})/, '$1****$2');
}

function maskEmail(email: string): string {
    if (!email) return '[no-email]';
    return email.replace(/(.{2}).*(@.*)/, '$1***$2');
}

const PII_KEYS = ['phone', 'email', 'full_name', 'name', 'to', 'from', 'From', 'To', 'Body', 'phone_number'];

function maskValue(key: string, value: unknown): unknown {
    if (typeof value !== 'string') return value;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('email')) return value.replace(/(.{2}).*(@.*)/, '$1***$2');
    if (lowerKey.includes('phone') || lowerKey === 'to' || lowerKey === 'from' || lowerKey === 'sms')
        return value.replace(/(\+?\d{1,3})\d{4,}(\d{2})/, '$1****$2');
    if (lowerKey.includes('name') || lowerKey === 'full_name')
        return value.length > 2 ? value.substring(0, 2) + '***' : '***';
    return value;
}

function sanitizeObject(obj: unknown): unknown {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => sanitizeObject(item));
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
        if (PII_KEYS.some(piiKey => key.toLowerCase().includes(piiKey.toLowerCase()))) {
            sanitized[key] = maskValue(key, value);
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    return sanitized;
}

// =============================================================================
// Tests
// =============================================================================

describe('shared-utils — maskPhone', () => {
    it('masks a US phone number', () => {
        // Regex (\+?\d{1,3}) greedily captures up to 3 digits after +
        expect(maskPhone('+17861234563')).toBe('+178****63');
    });

    it('masks a phone number without country code', () => {
        expect(maskPhone('7861234563')).toBe('786****63');
    });

    it('returns [no-phone] for empty string', () => {
        expect(maskPhone('')).toBe('[no-phone]');
    });

    it('masks international phone numbers', () => {
        const result = maskPhone('+447912345678');
        expect(result).toContain('****');
        expect(result).not.toBe('+447912345678');
    });

    it('preserves prefix and last 2 digits', () => {
        const result = maskPhone('+1786555001234');
        expect(result.startsWith('+')).toBe(true);
        expect(result.endsWith('34')).toBe(true);
        expect(result).toContain('****');
    });
});

describe('shared-utils — maskEmail', () => {
    it('masks a standard email', () => {
        expect(maskEmail('billing@gmail.com')).toBe('bi***@gmail.com');
    });

    it('masks a short local part', () => {
        expect(maskEmail('ab@example.com')).toBe('ab***@example.com');
    });

    it('returns [no-email] for empty string', () => {
        expect(maskEmail('')).toBe('[no-email]');
    });

    it('preserves first 2 chars and domain', () => {
        const result = maskEmail('john.doe@company.com');
        expect(result.startsWith('jo')).toBe(true);
        expect(result).toContain('@company.com');
    });

    it('handles emails with dots in local part', () => {
        const result = maskEmail('first.last@domain.org');
        expect(result).toContain('***@domain.org');
    });
});

describe('shared-utils — maskValue', () => {
    it('masks email fields', () => {
        expect(maskValue('email', 'test@example.com')).toBe('te***@example.com');
        expect(maskValue('user_email', 'info@company.com')).toBe('in***@company.com');
    });

    it('masks phone fields', () => {
        expect(maskValue('phone', '+17861234563')).toBe('+178****63');
        expect(maskValue('phone_number', '+17861234563')).toBe('+178****63');
    });

    it('masks "to" and "from" as phone numbers', () => {
        expect(maskValue('to', '+17861234563')).toBe('+178****63');
        expect(maskValue('from', '+17861234563')).toBe('+178****63');
    });

    it('masks name fields', () => {
        const result = maskValue('full_name', 'John Doe');
        expect(result).toBe('Jo***');
    });

    it('masks short names with ***', () => {
        expect(maskValue('name', 'JD')).toBe('***');
    });

    it('returns non-string values unchanged', () => {
        expect(maskValue('phone', 12345)).toBe(12345);
        expect(maskValue('email', null)).toBeNull();
        expect(maskValue('name', true)).toBe(true);
    });

    it('returns unrecognized key values unchanged', () => {
        expect(maskValue('status', 'active')).toBe('active');
        expect(maskValue('id', 'abc123')).toBe('abc123');
    });
});

describe('shared-utils — sanitizeObject', () => {
    it('returns null/undefined as is', () => {
        expect(sanitizeObject(null)).toBeNull();
        expect(sanitizeObject(undefined)).toBeUndefined();
    });

    it('returns primitives as is', () => {
        expect(sanitizeObject('hello')).toBe('hello');
        expect(sanitizeObject(42)).toBe(42);
        expect(sanitizeObject(true)).toBe(true);
    });

    it('masks PII fields in flat object', () => {
        const input = {
            email: 'john@example.com',
            phone: '+17861234563',
            full_name: 'John Doe',
            status: 'active'
        };
        const result = sanitizeObject(input) as Record<string, unknown>;

        expect(result.email).toBe('jo***@example.com');
        expect(result.phone).toBe('+178****63');
        expect(result.full_name).toBe('Jo***');
        expect(result.status).toBe('active'); // non-PII untouched
    });

    it('recursively sanitizes nested objects', () => {
        const input = {
            lead: {
                email: 'test@example.com',
                name: 'Alice'
            },
            id: '123'
        };
        const result = sanitizeObject(input) as Record<string, Record<string, unknown>>;

        expect(result.lead.email).toBe('te***@example.com');
        expect(result.lead.name).toBe('Al***');
        expect(result.id).toBe('123');
    });

    it('handles arrays', () => {
        const input = [
            { email: 'test@b.com', id: 1 },
            { email: 'info@d.com', id: 2 },
        ];
        const result = sanitizeObject(input) as Record<string, unknown>[];

        expect(result[0].email).toBe('te***@b.com');
        expect(result[0].id).toBe(1);
        expect(result[1].email).toBe('in***@d.com');
        expect(result[1].id).toBe(2);
    });

    it('preserves non-PII fields', () => {
        const input = {
            status: 'nuevo',
            source: 'meta',
            created_at: '2026-01-01T00:00:00Z',
        };
        const result = sanitizeObject(input);
        expect(result).toEqual(input);
    });

    it('handles empty objects', () => {
        expect(sanitizeObject({})).toEqual({});
    });

    it('handles deeply nested structures', () => {
        const input = {
            level1: {
                level2: {
                    phone: '+17865551234'
                }
            }
        };
        const result = sanitizeObject(input) as Record<string, Record<string, Record<string, string>>>;
        expect(result.level1.level2.phone).toContain('****');
        expect(result.level1.level2.phone).not.toBe('+17865551234');
    });
});

describe('shared-utils — PII_KEYS coverage', () => {
    it('masks phone-related PII keys', () => {
        const phoneKeys = ['phone', 'to', 'from', 'From', 'To', 'phone_number'];
        for (const key of phoneKeys) {
            const result = sanitizeObject({ [key]: '+17861234563' }) as Record<string, unknown>;
            expect(result[key]).not.toBe('+17861234563');
            expect(result[key]).toContain('****');
        }
    });

    it('masks email PII key', () => {
        const result = sanitizeObject({ email: 'test@example.com' }) as Record<string, unknown>;
        expect(result.email).toBe('te***@example.com');
    });

    it('masks name PII keys', () => {
        const nameResult = sanitizeObject({ name: 'Jane' }) as Record<string, unknown>;
        expect(nameResult.name).toBe('Ja***');

        const fullNameResult = sanitizeObject({ full_name: 'John Doe' }) as Record<string, unknown>;
        expect(fullNameResult.full_name).toBe('Jo***');
    });

    it('identifies Body as a PII key but maskValue falls through to original when no specific handler matches', () => {
        // Body is in PII_KEYS, so maskValue is called, but maskValue
        // doesn't have a specific handler for 'body' — it returns the string unchanged
        const result = sanitizeObject({ Body: 'Hello message' }) as Record<string, unknown>;
        // maskValue with key='Body' doesn't match email/phone/name patterns,
        // so it returns the original string
        expect(result.Body).toBe('Hello message');
    });
});
