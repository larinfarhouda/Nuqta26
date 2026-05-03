import { SubscriptionTierRepository, SubscriptionTierRow, SubscriptionTierUpdate } from '@/repositories/subscription-tier.repository';
import { logger } from '@/lib/logger/logger';

/**
 * Subscription Tier Service
 * Business logic for managing subscription tiers.
 */
export class SubscriptionTierService {
    constructor(private tierRepo: SubscriptionTierRepository) {}

    /**
     * Get all tiers (admin view — includes inactive)
     */
    async getAllTiers(): Promise<SubscriptionTierRow[]> {
        return this.tierRepo.findAll(false);
    }

    /**
     * Get active tiers only (vendor / public facing)
     */
    async getActiveTiers(): Promise<SubscriptionTierRow[]> {
        return this.tierRepo.findAll(true);
    }

    /**
     * Get a single tier by ID
     */
    async getTier(id: string): Promise<SubscriptionTierRow | null> {
        return this.tierRepo.findById(id);
    }

    /**
     * Update a tier (admin only)
     */
    async updateTier(id: string, updates: SubscriptionTierUpdate): Promise<SubscriptionTierRow> {
        logger.info('SubscriptionTierService: Updating tier', { id, updates });
        return this.tierRepo.update(id, updates);
    }

    /**
     * Get event limit for a tier
     * Returns Infinity for unlimited (-1 in DB)
     */
    async getEventLimit(tierId: string): Promise<number> {
        const tier = await this.tierRepo.findById(tierId);
        if (!tier) return 1; // Default to starter limit
        return tier.max_active_events === -1 ? Infinity : tier.max_active_events;
    }

    /**
     * Check if a vendor can create more events based on their tier
     */
    async canCreateEvent(tierId: string, currentActiveEvents: number): Promise<boolean> {
        const limit = await this.getEventLimit(tierId);
        return currentActiveEvents < limit;
    }

    /**
     * Get subscription price for a tier
     */
    async getPrice(tierId: string, isFounder: boolean): Promise<number> {
        const tier = await this.tierRepo.findById(tierId);
        if (!tier) return 0;
        return isFounder ? tier.founder_price : tier.regular_price;
    }

    /**
     * Get badge type for a tier
     */
    async getBadge(tierId: string): Promise<string | null> {
        const tier = await this.tierRepo.findById(tierId);
        return tier?.badge || null;
    }

    /**
     * Get the next upgrade tier
     */
    async getRequiredUpgradeTier(currentTierId: string): Promise<string | null> {
        const tiers = await this.tierRepo.findAll(true);
        const currentIndex = tiers.findIndex(t => t.id === currentTierId);
        if (currentIndex === -1 || currentIndex >= tiers.length - 1) return null;
        return tiers[currentIndex + 1].id;
    }
}
