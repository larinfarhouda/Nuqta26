jest.mock('@/utils/supabase/server', () => ({
    createClient: jest.fn(),
}));

import { resetPasswordForEmail, updatePassword } from '@/actions/auth-reset';
import { createClient } from '@/utils/supabase/server';

const mockCreateClient = createClient as jest.Mock;

describe('Auth Reset Actions', () => {
    beforeEach(() => jest.clearAllMocks());

    describe('resetPasswordForEmail', () => {
        it('should send reset email successfully', async () => {
            mockCreateClient.mockResolvedValue({
                auth: {
                    resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
                },
            });

            const result = await resetPasswordForEmail('test@example.com');
            expect(result).toEqual({ success: true });
        });

        it('should return error when reset fails', async () => {
            mockCreateClient.mockResolvedValue({
                auth: {
                    resetPasswordForEmail: jest.fn().mockResolvedValue({
                        error: { message: 'User not found' },
                    }),
                },
            });

            const result = await resetPasswordForEmail('bad@example.com');
            expect(result).toEqual({ success: false, error: 'User not found' });
        });
    });

    describe('updatePassword', () => {
        it('should update password successfully', async () => {
            mockCreateClient.mockResolvedValue({
                auth: {
                    updateUser: jest.fn().mockResolvedValue({ error: null }),
                },
            });

            const result = await updatePassword('newPassword123');
            expect(result).toEqual({ success: true });
        });

        it('should return error when update fails', async () => {
            mockCreateClient.mockResolvedValue({
                auth: {
                    updateUser: jest.fn().mockResolvedValue({
                        error: { message: 'Weak password' },
                    }),
                },
            });

            const result = await updatePassword('123');
            expect(result).toEqual({ success: false, error: 'Weak password' });
        });
    });
});
