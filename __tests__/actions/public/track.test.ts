/**
 * Public Track Server Action Tests
 */

import { trackPageView } from '@/actions/public/track';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

jest.mock('@/lib/track-activity', () => ({
    trackActivity: jest.fn(),
}));

import { createClient } from '@/utils/supabase/server';
import { trackActivity } from '@/lib/track-activity';

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockTrackActivity = trackActivity as jest.MockedFunction<typeof trackActivity>;

describe('Public Track Actions', () => {
    let mockGetUser: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser = jest.fn();
        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
        } as any);
    });

    it('should track page view for authenticated user', async () => {
        mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
        await trackPageView('event', 'e1', { page: '/events/test' });
        expect(mockTrackActivity).toHaveBeenCalledWith({
            userId: 'u1',
            action: 'event_viewed',
            targetType: 'event',
            targetId: 'e1',
            details: { page: '/events/test' },
        });
    });

    it('should not track for unauthenticated user', async () => {
        mockGetUser.mockResolvedValue({ data: { user: null } });
        await trackPageView('event', 'e1');
        expect(mockTrackActivity).not.toHaveBeenCalled();
    });

    it('should not throw on error', async () => {
        mockGetUser.mockRejectedValue(new Error('fail'));
        await expect(trackPageView('event', 'e1')).resolves.toBeUndefined();
    });
});
