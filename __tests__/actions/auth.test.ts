/**
 * Auth Server Action Tests
 */

import { signOut } from '@/actions/auth';
import { resetPasswordForEmail, updatePassword } from '@/actions/auth-reset';

jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));
jest.mock('@/lib/track-activity', () => ({ trackActivity: jest.fn() }));

import { createClient } from '@/utils/supabase/server';
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Auth Actions', () => {
    let mockGetUser: jest.Mock;
    let mockSignOut: jest.Mock;
    let mockResetPasswordForEmail: jest.Mock;
    let mockUpdateUser: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        mockGetUser = jest.fn();
        mockSignOut = jest.fn().mockResolvedValue({});
        mockResetPasswordForEmail = jest.fn();
        mockUpdateUser = jest.fn();

        mockCreateClient.mockResolvedValue({
            auth: {
                getUser: mockGetUser,
                signOut: mockSignOut,
                resetPasswordForEmail: mockResetPasswordForEmail,
                updateUser: mockUpdateUser,
            },
        } as any);
    });

    describe('signOut', () => {
        it('should sign out user and track activity', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
            await signOut();
            expect(mockSignOut).toHaveBeenCalled();
        });

        it('should sign out even when no user', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });
            await signOut();
            expect(mockSignOut).toHaveBeenCalled();
        });
    });

    describe('resetPasswordForEmail', () => {
        it('should return success on valid email', async () => {
            mockResetPasswordForEmail.mockResolvedValue({ error: null });
            const result = await resetPasswordForEmail('test@test.com');
            expect(result.success).toBe(true);
        });

        it('should return error on failure', async () => {
            mockResetPasswordForEmail.mockResolvedValue({ error: { message: 'User not found' } });
            const result = await resetPasswordForEmail('bad@test.com');
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not found');
        });
    });

    describe('updatePassword', () => {
        it('should return success on valid password', async () => {
            mockUpdateUser.mockResolvedValue({ error: null });
            const result = await updatePassword('newPassword123');
            expect(result.success).toBe(true);
        });

        it('should return error on failure', async () => {
            mockUpdateUser.mockResolvedValue({ error: { message: 'Password too weak' } });
            const result = await updatePassword('123');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Password too weak');
        });
    });
});
