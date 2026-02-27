/**
 * @jest-environment node
 */

/**
 * Event Reminders Cron Route Tests
 */

// Mock next/server before anything else
jest.mock('next/server', () => ({
    NextResponse: {
        json: (body: any, init?: { status?: number }) => ({
            status: init?.status || 200,
            json: async () => body,
        }),
    },
}));


// Mock logger
jest.mock('@/lib/logger/logger', () => ({
    logger: {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock sendEmail
jest.mock('@/utils/mail', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock React
jest.mock('react', () => ({
    createElement: jest.fn().mockReturnValue('mock-element'),
}));

// Mock email templates
jest.mock('@/components/emails/EventReminderTemplate', () => 'EventReminderTemplate');
jest.mock('@/components/emails/BookingUserTemplate', () => 'BookingUserTemplate');
jest.mock('@/components/emails/BookingVendorTemplate', () => 'BookingVendorTemplate');
jest.mock('@/components/emails/WelcomeTemplate', () => 'WelcomeTemplate');
jest.mock('@/components/emails/ReviewReceivedTemplate', () => 'ReviewReceivedTemplate');
jest.mock('@/components/emails/EventSoldOutTemplate', () => 'EventSoldOutTemplate');
jest.mock('@/components/emails/NewSignupAdminTemplate', () => 'NewSignupAdminTemplate');

// Mock Supabase admin client
const mockSelect = jest.fn();
const mockUpdate = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockIn = jest.fn();

const mockSupabase = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
};

jest.mock('@/utils/supabase/server', () => ({
    createAdminClient: jest.fn(() => mockSupabase),
}));

import { GET } from '@/app/api/cron/event-reminders/route';
import { sendEmail } from '@/utils/mail';

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

function createRequest(headers: Record<string, string> = {}): Request {
    return new Request('http://localhost:3000/api/cron/event-reminders', {
        method: 'GET',
        headers: new Headers(headers),
    });
}

describe('Event Reminders Cron', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CRON_SECRET: 'test-secret' };

        // Reset chain mocks - each call returns the mockSupabase for chaining
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        mockSupabase.gte.mockReturnValue(mockSupabase);
        mockSupabase.lte.mockResolvedValue({ data: [], error: null });
        mockSupabase.update.mockReturnValue(mockSupabase);
        mockSupabase.in.mockResolvedValue({ data: [], error: null });
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it('should return 401 if CRON_SECRET is set and auth header is missing', async () => {
        const req = createRequest();
        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('should return 401 if CRON_SECRET is set and auth header is wrong', async () => {
        const req = createRequest({ authorization: 'Bearer wrong-secret' });
        const res = await GET(req);
        expect(res.status).toBe(401);
    });

    it('should return success with 0 sent when no bookings need reminders', async () => {
        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.total).toBe(0);
        expect(body.sent).toBe(0);
    });

    it('should send reminders and mark as sent for found bookings', async () => {
        const mockBookings = [
            {
                id: 'booking-1',
                user_id: 'user-1',
                contact_email: 'user@example.com',
                contact_name: 'John',
                events: {
                    id: 'event-1',
                    title: 'Concert',
                    date: '2026-02-28T18:00:00Z',
                    end_date: null,
                    location_name: 'Istanbul Arena',
                    location_lat: 41.0082,
                    location_long: 28.9784,
                    slug: 'concert-123',
                },
            },
        ];

        // findBookingsForReminder returns bookings
        mockSupabase.lte.mockResolvedValueOnce({ data: mockBookings, error: null });
        // markReminderSent succeeds
        mockSupabase.in.mockResolvedValueOnce({ data: [], error: null });

        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.total).toBe(1);
        expect(body.sent).toBe(1);
        expect(body.failed).toBe(0);
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('should skip bookings without contact email and count as failed', async () => {
        const mockBookings = [
            {
                id: 'booking-1',
                user_id: 'user-1',
                contact_email: null,
                contact_name: null,
                events: {
                    id: 'event-1',
                    title: 'Concert',
                    date: '2026-02-28T18:00:00Z',
                    end_date: null,
                    location_name: 'Istanbul Arena',
                    location_lat: null,
                    location_long: null,
                    slug: 'concert-123',
                },
            },
        ];

        mockSupabase.lte.mockResolvedValueOnce({ data: mockBookings, error: null });

        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.total).toBe(1);
        expect(body.sent).toBe(0);
        expect(body.failed).toBe(1);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should allow requests when CRON_SECRET is not set', async () => {
        delete process.env.CRON_SECRET;

        const req = createRequest();
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });
});
