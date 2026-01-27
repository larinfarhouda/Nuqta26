/**
 * UserService Tests
 * Tests for user profile and favorites management
 */

import { UserService } from '@/services/user.service';
import { UserRepository } from '@/repositories/user.repository';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';

describe('UserService', () => {
    let userService: UserService;
    let mockUserRepo: jest.Mocked<UserRepository>;

    beforeEach(() => {
        mockUserRepo = {
            findById: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            addFavorite: jest.fn(),
            removeFavorite: jest.fn(),
            getFavorites: jest.fn(),
            getFavoriteIds: jest.fn(),
            isFavorite: jest.fn(),
        } as any;

        userService = new UserService(mockUserRepo);
    });

    describe('getProfile', () => {
        it('should return user profile when found', async () => {
            const mockUser = {
                id: 'user-123',
                auth_user_id: 'auth-123',
                full_name: 'John Doe',
                email: 'john@example.com',
                phone: '+905551234567',
                created_at: '2026-01-01T00:00:00Z',
            };

            mockUserRepo.findById.mockResolvedValue(mockUser);

            const result = await userService.getProfile('user-123');

            expect(result).toEqual(mockUser);
            expect(mockUserRepo.findById).toHaveBeenCalledWith('user-123');
        });

        it('should throw error when user not found', async () => {
            mockUserRepo.findById.mockResolvedValue(null);

            await expect(
                userService.getProfile('non-existent')
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateProfile', () => {
        it('should update user profile successfully', async () => {
            const updateData = {
                full_name: 'John Updated',
                phone: '+905559876543',
            };

            const updatedUser = {
                id: 'user-123',
                ...updateData,
            };

            mockUserRepo.update.mockResolvedValue(updatedUser);

            const result = await userService.updateProfile('user-123', updateData);

            expect(result.full_name).toBe('John Updated');
            expect(mockUserRepo.update).toHaveBeenCalledWith('user-123', updateData);
        });

        it('should validate full name length', async () => {
            await expect(
                userService.updateProfile('user-123', { full_name: 'A' })
            ).rejects.toThrow(ValidationError);
        });

        it('should validate phone number format', async () => {
            await expect(
                userService.updateProfile('user-123', { phone: 'bad' })
            ).rejects.toThrow(ValidationError);
        });

        it('should allow partial updates', async () => {
            const updatedUser = {
                id: 'user-123',
                full_name: 'Updated Name',
            };

            mockUserRepo.update.mockResolvedValue(updatedUser);

            const result = await userService.updateProfile('user-123', {
                full_name: 'Updated Name',
            });

            expect(result.full_name).toBe('Updated Name');
        });
    });

    describe('toggleFavorite', () => {
        it('should return true when adding event to favorites', async () => {
            const userId = 'user-123';
            const eventId = 'event-456';

            mockUserRepo.isFavorite.mockResolvedValue(false);
            mockUserRepo.addFavorite.mockResolvedValue(undefined);

            const result = await userService.toggleFavorite(userId, eventId);

            expect(result).toBe(true);
            expect(mockUserRepo.addFavorite).toHaveBeenCalledWith(userId, eventId);
        });

        it('should return false when removing event from favorites', async () => {
            const userId = 'user-123';
            const eventId = 'event-456';

            mockUserRepo.isFavorite.mockResolvedValue(true);
            mockUserRepo.removeFavorite.mockResolvedValue(undefined);

            const result = await userService.toggleFavorite(userId, eventId);

            expect(result).toBe(false);
            expect(mockUserRepo.removeFavorite).toHaveBeenCalledWith(userId, eventId);
        });
    });

    describe('getFavorites', () => {
        it('should return list of favorite events', async () => {
            const userId = 'user-123';
            const favorites = [
                {
                    id: 'event-1',
                    title: 'Event 1',
                    slug: 'event-1',
                    date: '2026-03-01T19:00:00Z',
                },
                {
                    id: 'event-2',
                    title: 'Event 2',
                    slug: 'event-2',
                    date: '2026-03-15T19:00:00Z',
                },
            ];

            mockUserRepo.getFavorites.mockResolvedValue(favorites);

            const result = await userService.getFavorites(userId);

            expect(result).toHaveLength(2);
            expect(result).toEqual(favorites);
        });

        it('should return empty array when no favorites', async () => {
            mockUserRepo.getFavorites.mockResolvedValue([]);

            const result = await userService.getFavorites('user-123');

            expect(result).toHaveLength(0);
        });
    });

    describe('addFavorite', () => {
        it('should add event to favorites when not already favorited', async () => {
            mockUserRepo.isFavorite.mockResolvedValue(false);
            mockUserRepo.addFavorite.mockResolvedValue(undefined);

            await userService.addFavorite('user-123', 'event-456');

            expect(mockUserRepo.addFavorite).toHaveBeenCalledWith('user-123', 'event-456');
        });

        it('should succeed silently if already favorited', async () => {
            mockUserRepo.isFavorite.mockResolvedValue(true);

            await userService.addFavorite('user-123', 'event-456');

            expect(mockUserRepo.addFavorite).not.toHaveBeenCalled();
        });
    });

    describe('removeFavorite', () => {
        it('should remove event from favorites', async () => {
            mockUserRepo.removeFavorite.mockResolvedValue(undefined);

            await userService.removeFavorite('user-123', 'event-456');

            expect(mockUserRepo.removeFavorite).toHaveBeenCalledWith('user-123', 'event-456');
        });
    });
});
