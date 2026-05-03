import { BaseRepository } from './base.repository';

/**
 * Subscription Tier shape from the database
 */
export interface SubscriptionTierRow {
    id: string;
    name: string;
    max_active_events: number; // -1 = unlimited
    regular_price: number;
    founder_price: number;
    badge: string | null;   // null, 'verified', 'premium'
    features: string[];     // JSONB array of feature strings
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

/**
 * Fields the admin can update
 */
export interface SubscriptionTierUpdate {
    name?: string;
    max_active_events?: number;
    regular_price?: number;
    founder_price?: number;
    badge?: string | null;
    features?: string[];
    sort_order?: number;
    is_active?: boolean;
}

/**
 * Subscription Tier Repository
 * CRUD operations for the subscription_tiers table.
 * 
 * Note: Uses `any` casts for the table name because this table
 * may not be in the generated Supabase types yet. Run 
 * `supabase gen types` after creating the table to get full type safety.
 */
export class SubscriptionTierRepository extends BaseRepository {

    /**
     * Get all tiers ordered by sort_order
     */
    async findAll(activeOnly = false): Promise<SubscriptionTierRow[]> {
        let query = (this.client as any)
            .from('subscription_tiers')
            .select('*')
            .order('sort_order', { ascending: true });

        if (activeOnly) {
            query = query.eq('is_active', true);
        }

        const { data, error } = await query;
        if (error) this.handleError(error, 'SubscriptionTierRepository.findAll');
        return (data || []) as SubscriptionTierRow[];
    }

    /**
     * Get a single tier by ID
     */
    async findById(id: string): Promise<SubscriptionTierRow | null> {
        const { data, error } = await (this.client as any)
            .from('subscription_tiers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'SubscriptionTierRepository.findById');
        }
        return data as SubscriptionTierRow;
    }

    /**
     * Update a tier's configuration
     */
    async update(id: string, updates: SubscriptionTierUpdate): Promise<SubscriptionTierRow> {
        const { data, error } = await (this.client as any)
            .from('subscription_tiers')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) this.handleError(error, 'SubscriptionTierRepository.update');
        return data as SubscriptionTierRow;
    }
}
