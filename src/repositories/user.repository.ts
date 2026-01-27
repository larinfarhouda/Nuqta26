import { BaseRepository } from './base.repository';
import { Tables, TablesUpdate } from '@/types/database.types';

type Profile = Tables<'profiles'>;
type ProfileUpdate = TablesUpdate<'profiles'>;

/**
 * User Repository
 * Handles all database operations for user profiles and favorites
 */
export class UserRepository extends BaseRepository {
    /**
     * Find profile by user ID
     */
    async findById(userId: string): Promise<Profile | null> {
        const { data, error } = await this.client
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'UserRepository.findById');
        }

        return data;
    }

    /**
   * Find profiles by IDs (for batch fetching)
   */
    async findByIds(userIds: string[]): Promise<Array<{
        id: string;
        full_name: string | null;
        avatar_url: string | null;
        phone: string | null;
    }>> {
        if (userIds.length === 0) return [];

        const { data, error } = await this.client
            .from('profiles')
            .select('id, full_name, avatar_url, phone')
            .in('id', userIds);

        if (error) this.handleError(error, 'UserRepository.findByIds');
        return data || [];
    }

    /**
     * Update user profile
     */
    async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
        const { data, error } = await this.client
            .from('profiles')
            .update(updates)
            .eq('id', userId)
            .select()
            .single();

        if (error) this.handleError(error, 'UserRepository.update');
        return data;
    }

    /**
     * Get user's favorite events
     */
    async getFavorites(userId: string) {
        const { data, error } = await this.client
            .from('favorite_events')
            .select('event:events(*, vendors(business_name, company_logo))')
            .eq('user_id', userId);

        if (error) this.handleError(error, 'UserRepository.getFavorites');
        return data || [];
    }

    /**
     * Get user's favorite event IDs only
     */
    async getFavoriteIds(userId: string): Promise<string[]> {
        const { data, error } = await this.client
            .from('favorite_events')
            .select('event_id')
            .eq('user_id', userId);

        if (error) this.handleError(error, 'UserRepository.getFavoriteIds');
        return data?.map(item => item.event_id) || [];
    }

    /**
     * Check if event is favorited by user
     */
    async isFavorite(userId: string, eventId: string): Promise<boolean> {
        const { data, error } = await this.client
            .from('favorite_events')
            .select('id')
            .eq('user_id', userId)
            .eq('event_id', eventId)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return false;
            this.handleError(error, 'UserRepository.isFavorite');
        }

        return !!data;
    }

    /**
     * Add event to favorites
     */
    async addFavorite(userId: string, eventId: string): Promise<void> {
        const { error } = await this.client
            .from('favorite_events')
            .insert({ user_id: userId, event_id: eventId });

        if (error) this.handleError(error, 'UserRepository.addFavorite');
    }

    /**
     * Remove event from favorites
     */
    async removeFavorite(userId: string, eventId: string): Promise<void> {
        const { error } = await this.client
            .from('favorite_events')
            .delete()
            .eq('user_id', userId)
            .eq('event_id', eventId);

        if (error) this.handleError(error, 'UserRepository.removeFavorite');
    }
}
