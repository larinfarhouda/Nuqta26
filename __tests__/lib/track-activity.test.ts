jest.mock('@/lib/logger/logger', () => ({
    logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

// Must define the mock fn before jest.mock references it (via hoisting issue workaround)
const mockInsert = jest.fn().mockResolvedValue({ error: null });

jest.mock('@/utils/supabase/server', () => ({
    createAdminClient: jest.fn(() => ({
        from: jest.fn(() => ({ insert: mockInsert })),
    })),
}));

import { trackActivity } from '@/lib/track-activity';

describe('trackActivity', () => {
    beforeEach(() => jest.clearAllMocks());

    it('should insert activity log', async () => {
        trackActivity({
            userId: 'user-1',
            userRole: 'customer',
            action: 'page_view',
            targetType: 'event',
            targetId: 'evt-1',
            details: { slug: 'test' },
        });

        // Wait for fire-and-forget promise
        await new Promise(r => setTimeout(r, 50));

        expect(mockInsert).toHaveBeenCalledWith({
            user_id: 'user-1',
            user_role: 'customer',
            action: 'page_view',
            target_type: 'event',
            target_id: 'evt-1',
            details: { slug: 'test' },
        });
    });

    it('should default userRole to customer', async () => {
        trackActivity({ userId: 'u1', action: 'test' });
        await new Promise(r => setTimeout(r, 50));

        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({ user_role: 'customer' })
        );
    });

    it('should never throw on error', async () => {
        mockInsert.mockRejectedValueOnce(new Error('DB down'));

        expect(() => {
            trackActivity({ userId: 'u1', action: 'fail' });
        }).not.toThrow();

        await new Promise(r => setTimeout(r, 50));
    });

    it('should handle null optional fields', async () => {
        trackActivity({ userId: 'u1', action: 'login' });
        await new Promise(r => setTimeout(r, 50));

        expect(mockInsert).toHaveBeenCalledWith(
            expect.objectContaining({
                target_type: null,
                target_id: null,
                details: {},
            })
        );
    });
});
