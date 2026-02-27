/**
 * @jest-environment node
 */

/**
 * Daily Tasks Cron Route Tests
 * Tests both event reminders and review request emails
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
jest.mock('@/components/emails/ReviewRequestTemplate', () => 'ReviewRequestTemplate');
jest.mock('@/components/emails/EventSoldOutTemplate', () => 'EventSoldOutTemplate');
jest.mock('@/components/emails/NewSignupAdminTemplate', () => 'NewSignupAdminTemplate');

// Mock Supabase admin client
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

import { GET } from '@/app/api/cron/daily-tasks/route';
import { sendEmail } from '@/utils/mail';

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

function createRequest(headers: Record<string, string> = {}): Request {
    return new Request('http://localhost:3000/api/cron/daily-tasks', {
        method: 'GET',
        headers: new Headers(headers),
    });
}

describe('Daily Tasks Cron', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv, CRON_SECRET: 'test-secret' };

        // Reset chain mocks
        mockSupabase.from.mockReturnValue(mockSupabase);
        mockSupabase.select.mockReturnValue(mockSupabase);
        mockSupabase.eq.mockReturnValue(mockSupabase);
        mockSupabase.gte.mockReturnValue(mockSupabase);
        // Default: no bookings for both reminder and review request queries
        mockSupabase.lte.mockResolvedValue({ data: [], error: null });
        mockSupabase.update.mockReturnValue(mockSupabase);
        mockSupabase.in.mockResolvedValue({ data: [], error: null });
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    // ─── Auth Tests ──────────────────────────────────────────────────────

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

    it('should allow requests when CRON_SECRET is not set', async () => {
        delete process.env.CRON_SECRET;

        const req = createRequest();
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });

    // ─── Combined Results ────────────────────────────────────────────────

    it('should return combined results with both reminders and reviewRequests', async () => {
        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
        expect(body.reminders).toBeDefined();
        expect(body.reviewRequests).toBeDefined();
        expect(body.durationMs).toBeDefined();
    });

    it('should return 0 counts when no bookings exist', async () => {
        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(body.reminders.total).toBe(0);
        expect(body.reminders.sent).toBe(0);
        expect(body.reviewRequests.total).toBe(0);
        expect(body.reviewRequests.sent).toBe(0);
    });

    // ─── Reminder Tests ──────────────────────────────────────────────────

    it('should send reminders for bookings with events tomorrow', async () => {
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

        // First lte call = reminders query (returns bookings)
        // Second lte call = review requests query (returns empty)
        mockSupabase.lte
            .mockResolvedValueOnce({ data: mockBookings, error: null })
            .mockResolvedValueOnce({ data: [], error: null });
        mockSupabase.in.mockResolvedValue({ data: [], error: null });

        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(body.reminders.total).toBe(1);
        expect(body.reminders.sent).toBe(1);
        expect(body.reminders.failed).toBe(0);
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    // ─── Review Request Tests ────────────────────────────────────────────

    it('should send review requests for bookings with events that ended yesterday', async () => {
        const mockBookings = [
            {
                id: 'booking-2',
                user_id: 'user-2',
                contact_email: 'attendee@example.com',
                contact_name: 'Sara',
                events: {
                    id: 'event-2',
                    title: 'Workshop',
                    date: '2026-02-26T10:00:00Z',
                    end_date: '2026-02-26T16:00:00Z',
                    slug: 'workshop-456',
                },
            },
        ];

        // First lte call = reminders (empty)
        // Second lte call = review requests (returns bookings)
        mockSupabase.lte
            .mockResolvedValueOnce({ data: [], error: null })
            .mockResolvedValueOnce({ data: mockBookings, error: null });
        mockSupabase.in.mockResolvedValue({ data: [], error: null });

        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(body.reviewRequests.total).toBe(1);
        expect(body.reviewRequests.sent).toBe(1);
        expect(body.reviewRequests.failed).toBe(0);
        expect(mockSendEmail).toHaveBeenCalledTimes(1);
    });

    it('should skip review requests for bookings without contact email', async () => {
        const mockBookings = [
            {
                id: 'booking-3',
                user_id: 'user-3',
                contact_email: null,
                contact_name: null,
                events: {
                    id: 'event-3',
                    title: 'Meetup',
                    date: '2026-02-26T18:00:00Z',
                    end_date: null,
                    slug: 'meetup-789',
                },
            },
        ];

        mockSupabase.lte
            .mockResolvedValueOnce({ data: [], error: null })
            .mockResolvedValueOnce({ data: mockBookings, error: null });

        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(body.reviewRequests.total).toBe(1);
        expect(body.reviewRequests.sent).toBe(0);
        expect(body.reviewRequests.failed).toBe(1);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });

    it('should skip review requests for events without slug', async () => {
        const mockBookings = [
            {
                id: 'booking-4',
                user_id: 'user-4',
                contact_email: 'user4@example.com',
                contact_name: 'Ahmad',
                events: {
                    id: 'event-4',
                    title: 'Private Event',
                    date: '2026-02-26T18:00:00Z',
                    end_date: null,
                    slug: null,
                },
            },
        ];

        mockSupabase.lte
            .mockResolvedValueOnce({ data: [], error: null })
            .mockResolvedValueOnce({ data: mockBookings, error: null });

        const req = createRequest({ authorization: 'Bearer test-secret' });
        const res = await GET(req);
        const body = await res.json();

        expect(body.reviewRequests.total).toBe(1);
        expect(body.reviewRequests.sent).toBe(0);
        expect(body.reviewRequests.failed).toBe(1);
        expect(mockSendEmail).not.toHaveBeenCalled();
    });
});
