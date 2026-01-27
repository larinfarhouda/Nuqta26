import { UserRepository } from '@/repositories/user.repository';
import { UpdateProfileInput } from '@/types/dto/user.dto';
import { NotFoundError, ValidationError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logger/logger';

/**
 * User Service
 * Handles business logic for user profile and favorites
 */
export class UserService {
    constructor(private userRepo: UserRepository) { }

    /**
     * Get user profile
     */
    async getProfile(userId: string) {
        logger.info('UserService: Fetching profile', { userId });

        const profile = await this.userRepo.findById(userId);
        if (!profile) {
            throw new NotFoundError('User profile');
        }

        return profile;
    }

    /**
     * Update user profile
     */
    async updateProfile(userId: string, updates: UpdateProfileInput) {
        logger.info('UserService: Updating profile', { userId });

        // Validation
        if (updates.full_name && updates.full_name.length < 2) {
            throw new ValidationError('Name must be at least 2 characters', 'full_name');
        }

        if (updates.phone && !this.isValidPhone(updates.phone)) {
            throw new ValidationError('Invalid phone number format', 'phone');
        }

        const profile = await this.userRepo.update(userId, updates);
        logger.info('Profile updated successfully', { userId });

        return profile;
    }

    /**
     * Get user's favorite events
     */
    async getFavorites(userId: string) {
        logger.info('UserService: Fetching favorites', { userId });
        return await this.userRepo.getFavorites(userId);
    }

    /**
     * Get user's favorite event IDs
     */
    async getFavoriteIds(userId: string): Promise<string[]> {
        logger.info('UserService: Fetching favorite IDs', { userId });
        return await this.userRepo.getFavoriteIds(userId);
    }

    /**
     * Add event to favorites
     */
    async addFavorite(userId: string, eventId: string): Promise<void> {
        logger.info('UserService: Adding favorite', { userId, eventId });

        // Check if already favorited
        const isFav = await this.userRepo.isFavorite(userId, eventId);
        if (isFav) {
            logger.warn('Event already in favorites', { userId, eventId });
            return; // Silently succeed if already favorited
        }

        await this.userRepo.addFavorite(userId, eventId);
        logger.info('Favorite added successfully', { userId, eventId });
    }

    /**
     * Remove event from favorites
     */
    async removeFavorite(userId: string, eventId: string): Promise<void> {
        logger.info('UserService: Removing favorite', { userId, eventId });

        await this.userRepo.removeFavorite(userId, eventId);
        logger.info('Favorite removed successfully', { userId, eventId });
    }

    /**
     * Toggle favorite status
     */
    async toggleFavorite(userId: string, eventId: string): Promise<boolean> {
        logger.info('UserService: Toggling favorite', { userId, eventId });

        const isFav = await this.userRepo.isFavorite(userId, eventId);

        if (isFav) {
            await this.userRepo.removeFavorite(userId, eventId);
            logger.info('Favorite removed', { userId, eventId });
            return false;
        } else {
            await this.userRepo.addFavorite(userId, eventId);
            logger.info('Favorite added', { userId, eventId });
            return true;
        }
    }

    /**
     * Validate phone number format
     */
    private isValidPhone(phone: string): boolean {
        // Basic validation - adjust regex based on your requirements
        const phoneRegex = /^[\d\s\-+()]+$/;
        return phoneRegex.test(phone) && phone.length >= 10;
    }
}
