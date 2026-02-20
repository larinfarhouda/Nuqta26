/**
 * Event Status Utility Tests
 */

import { getEventStatus, isEventExpired, isEventSoldOut, isEventBookable } from '@/utils/eventStatus';

describe('getEventStatus', () => {
    describe('active events', () => {
        it('should return active for future event with available tickets', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
                tickets: [{ quantity: 100, sold: 50 }],
            })).toBe('active');
        });

        it('should return active for future event with no tickets', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
            })).toBe('active');
        });

        it('should return active for future event with empty tickets array', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
                tickets: [],
            })).toBe('active');
        });
    });

    describe('expired events', () => {
        it('should return expired for past event', () => {
            expect(getEventStatus({
                date: '2020-01-01T00:00:00Z',
                tickets: [{ quantity: 100, sold: 50 }],
            })).toBe('expired');
        });

        it('should return expired for today (event day has passed)', () => {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            expect(getEventStatus({
                date: dateStr,
            })).toBe('expired');
        });

        it('should return expired for invalid date string', () => {
            expect(getEventStatus({
                date: 'not-a-date',
            })).toBe('expired');
        });
    });

    describe('sold out events', () => {
        it('should return sold_out when all tickets are sold', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
                tickets: [
                    { quantity: 100, sold: 100 },
                    { quantity: 50, sold: 50 },
                ],
            })).toBe('sold_out');
        });

        it('should return active when some tickets still available', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
                tickets: [
                    { quantity: 100, sold: 100 },
                    { quantity: 50, sold: 25 },
                ],
            })).toBe('active');
        });

        it('should handle null sold values (treat as 0)', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
                tickets: [{ quantity: 100, sold: null }],
            })).toBe('active');
        });

        it('should return sold_out when sold exceeds quantity', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            expect(getEventStatus({
                date: futureDate.toISOString(),
                tickets: [{ quantity: 100, sold: 150 }],
            })).toBe('sold_out');
        });
    });

    describe('date-only string format (YYYY-MM-DD)', () => {
        it('should parse date-only format correctly', () => {
            expect(getEventStatus({
                date: '2020-06-15',
            })).toBe('expired');
        });

        it('should return active for future date-only format', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 2);
            const dateStr = `${futureDate.getFullYear()}-06-15`;

            expect(getEventStatus({
                date: dateStr,
            })).toBe('active');
        });
    });
});

describe('isEventExpired', () => {
    it('should return true for expired event', () => {
        expect(isEventExpired({ date: '2020-01-01' })).toBe(true);
    });

    it('should return false for active event', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(isEventExpired({ date: futureDate.toISOString() })).toBe(false);
    });
});

describe('isEventSoldOut', () => {
    it('should return true for sold out event', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(isEventSoldOut({
            date: futureDate.toISOString(),
            tickets: [{ quantity: 100, sold: 100 }],
        })).toBe(true);
    });

    it('should return false for available event', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(isEventSoldOut({
            date: futureDate.toISOString(),
            tickets: [{ quantity: 100, sold: 50 }],
        })).toBe(false);
    });
});

describe('isEventBookable', () => {
    it('should return true for active event', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(isEventBookable({
            date: futureDate.toISOString(),
            tickets: [{ quantity: 100, sold: 50 }],
        })).toBe(true);
    });

    it('should return false for expired event', () => {
        expect(isEventBookable({ date: '2020-01-01' })).toBe(false);
    });

    it('should return false for sold out event', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        expect(isEventBookable({
            date: futureDate.toISOString(),
            tickets: [{ quantity: 100, sold: 100 }],
        })).toBe(false);
    });
});
