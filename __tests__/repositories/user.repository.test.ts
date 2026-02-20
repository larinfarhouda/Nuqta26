/**
 * UserRepository Tests
 * Tests for user profile and favorites database operations
 */

import { UserRepository } from '@/repositories/user.repository';
import { createMockSupabaseClient } from '../mocks/supabase.mock';
import { mockUser } from '../mocks/data.mock';

describe('UserRepository', () => {
    let userRepo: UserRepository;
    let mockClient: ReturnType<typeof createMockSupabaseClient>;

    beforeEach(() => {
        mockClient = createMockSupabaseClient();
        userRepo = new UserRepository(mockClient as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findById', () => {
        it('should return profile when found', async () => {
            const user = mockUser();
            mockClient._mocks.single.mockResolvedValueOnce({ data: user, error: null });

            const result = await userRepo.findById('user-123');

            expect(result).toEqual(user);
            expect(mockClient.from).toHaveBeenCalledWith('profiles');
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'user-123');
        });

        it('should return null when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await userRepo.findById('bad-id');

            expect(result).toBeNull();
        });

        it('should throw on DB error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: '500', message: 'Internal error' },
            });

            await expect(userRepo.findById('user-123')).rejects.toThrow();
        });
    });

    describe('findByIds', () => {
        it('should return profiles for given IDs', async () => {
            const profiles = [
                { id: 'u1', full_name: 'User 1', avatar_url: null, phone: null },
                { id: 'u2', full_name: 'User 2', avatar_url: null, phone: null },
            ];
            mockClient._mocks.in.mockResolvedValueOnce({ data: profiles, error: null });

            const result = await userRepo.findByIds(['u1', 'u2']);

            expect(result).toEqual(profiles);
            expect(mockClient.from).toHaveBeenCalledWith('profiles');
        });

        it('should return empty array for empty input', async () => {
            const result = await userRepo.findByIds([]);

            expect(result).toEqual([]);
            expect(mockClient.from).not.toHaveBeenCalled();
        });

        it('should return empty array when data is null', async () => {
            mockClient._mocks.in.mockResolvedValueOnce({ data: null, error: null });

            const result = await userRepo.findByIds(['u1']);

            expect(result).toEqual([]);
        });
    });

    describe('update', () => {
        it('should update profile and return data', async () => {
            const updated = mockUser({ full_name: 'Updated Name' });
            mockClient._mocks.single.mockResolvedValueOnce({ data: updated, error: null });

            const result = await userRepo.update('user-123', { full_name: 'Updated Name' } as any);

            expect(result).toEqual(updated);
            expect(mockClient._mocks.update).toHaveBeenCalled();
            expect(mockClient._mocks.eq).toHaveBeenCalledWith('id', 'user-123');
        });

        it('should throw on error', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { message: 'Update failed' },
            });

            await expect(userRepo.update('user-123', {} as any)).rejects.toThrow();
        });
    });

    describe('getFavorites', () => {
        it('should return favorite events with vendor data', async () => {
            const favorites = [{ event: { id: 'e1', title: 'Event 1' } }];
            mockClient._mocks.eq.mockResolvedValueOnce({ data: favorites, error: null });

            const result = await userRepo.getFavorites('user-123');

            expect(result).toEqual(favorites);
            expect(mockClient.from).toHaveBeenCalledWith('favorite_events');
        });

        it('should return empty array when no favorites', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ data: null, error: null });

            const result = await userRepo.getFavorites('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('getFavoriteIds', () => {
        it('should return array of event IDs', async () => {
            const data = [{ event_id: 'e1' }, { event_id: 'e2' }];
            mockClient._mocks.eq.mockResolvedValueOnce({ data, error: null });

            const result = await userRepo.getFavoriteIds('user-123');

            expect(result).toEqual(['e1', 'e2']);
        });

        it('should return empty array when null data', async () => {
            mockClient._mocks.eq.mockResolvedValueOnce({ data: null, error: null });

            const result = await userRepo.getFavoriteIds('user-123');

            expect(result).toEqual([]);
        });
    });

    describe('isFavorite', () => {
        it('should return true when favorited', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: { id: 'fav-1' },
                error: null,
            });

            const result = await userRepo.isFavorite('user-123', 'event-123');

            expect(result).toBe(true);
        });

        it('should return false when not found', async () => {
            mockClient._mocks.single.mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' },
            });

            const result = await userRepo.isFavorite('user-123', 'event-456');

            expect(result).toBe(false);
        });
    });

    describe('addFavorite', () => {
        it('should insert favorite without error', async () => {
            mockClient._mocks.insert.mockResolvedValueOnce({ error: null });

            await expect(userRepo.addFavorite('user-123', 'event-123')).resolves.not.toThrow();
            expect(mockClient.from).toHaveBeenCalledWith('favorite_events');
        });

        it('should throw on insert error', async () => {
            mockClient._mocks.insert.mockResolvedValueOnce({
                error: { message: 'Duplicate' },
            });

            await expect(userRepo.addFavorite('user-123', 'event-123')).rejects.toThrow();
        });
    });

    describe('removeFavorite', () => {
        it('should delete favorite without error', async () => {
            // Chain: delete().eq().eq() — second eq resolves
            mockClient._mocks.eq
                .mockReturnValueOnce(mockClient._mocks as any)
                .mockResolvedValueOnce({ error: null });

            await expect(userRepo.removeFavorite('user-123', 'event-123')).resolves.not.toThrow();
            expect(mockClient.from).toHaveBeenCalledWith('favorite_events');
        });
    });
});
