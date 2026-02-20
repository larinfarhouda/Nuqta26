/**
 * Public Interests Server Action Tests
 */

import { expressInterest, hasExpressedInterest, getEventInterestCount } from '@/actions/public/interests';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
    createAdminClient: jest.fn(),
}));
jest.mock('@/lib/track-activity', () => ({ trackActivity: jest.fn() }));

import { createClient, createAdminClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockCreateAdminClient = createAdminClient as jest.MockedFunction<any>;

describe('Public Interest Actions', () => {
    let mockGetUser: jest.Mock;
    let mockAdminFrom: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser = jest.fn();
        mockCreateClient.mockResolvedValue({
            auth: { getUser: mockGetUser },
        } as any);

        mockAdminFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'e1', prospect_vendor_id: 'pv1' } }),
            maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            insert: jest.fn().mockResolvedValue({ error: null }),
        });
        mockCreateAdminClient.mockReturnValue({ from: mockAdminFrom });
    });

    describe('expressInterest', () => {
        it('should return error when not logged in', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await expressInterest('e1');
            expect(result.error).toContain('logged in');
        });

        it('should return success when interest is expressed', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            const result = await expressInterest('e1');
            expect(result.success).toBe(true);
        });

        it('should handle duplicate interest gracefully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockAdminFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: { id: 'e1', prospect_vendor_id: 'pv1' } }),
                insert: jest.fn().mockResolvedValue({ error: { code: '23505' } }),
            });

            const result = await expressInterest('e1');
            expect(result.success).toBe(true);
            expect(result.alreadyInterested).toBe(true);
        });
    });

    describe('hasExpressedInterest', () => {
        it('should return false when not logged in', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            const result = await hasExpressedInterest('e1');
            expect(result).toBe(false);
        });

        it('should return true when interest exists', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockAdminFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: { id: 'i1' } }),
            });

            const result = await hasExpressedInterest('e1');
            expect(result).toBe(true);
        });

        it('should return false when no interest', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            mockAdminFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                maybeSingle: jest.fn().mockResolvedValue({ data: null }),
            });

            const result = await hasExpressedInterest('e1');
            expect(result).toBe(false);
        });
    });

    describe('getEventInterestCount', () => {
        it('should return count', async () => {
            mockAdminFrom.mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ count: 5 }),
            });

            const result = await getEventInterestCount('e1');
            expect(result).toBe(5);
        });

        it('should return 0 on error', async () => {
            mockCreateAdminClient.mockImplementation(() => { throw new Error('no admin'); });
            const result = await getEventInterestCount('e1');
            expect(result).toBe(0);
        });
    });
});
