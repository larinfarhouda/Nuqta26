import { BaseRepository } from './base.repository';
import { Tables, TablesInsert, TablesUpdate } from '@/types/database.types';

type DiscountCode = Tables<'discount_codes'>;
type DiscountCodeInsert = TablesInsert<'discount_codes'>;
type DiscountCodeUpdate = TablesUpdate<'discount_codes'>;
type BulkDiscount = Tables<'bulk_discounts'>;
type BulkDiscountInsert = TablesInsert<'bulk_discounts'>;

/**
 * Discount Repository
 * Handles all database operations for discount codes and bulk discounts
 */
export class DiscountRepository extends BaseRepository {
    /**
     * Find discount code by code string
     */
    async findByCode(code: string): Promise<DiscountCode | null> {
        const { data, error } = await this.client
            .from('discount_codes')
            .select('*')
            .eq('code', code.toUpperCase())
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'DiscountRepository.findByCode');
        }

        return data;
    }

    /**
     * Find discount code by ID
     */
    async findById(id: string): Promise<DiscountCode | null> {
        const { data, error } = await this.client
            .from('discount_codes')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'DiscountRepository.findById');
        }

        return data;
    }

    /**
     * Get all discount codes for a vendor
     */
    async findByVendorId(vendorId: string): Promise<DiscountCode[]> {
        const { data, error } = await this.client
            .from('discount_codes')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'DiscountRepository.findByVendorId');
        return data || [];
    }

    /**
     * Get discount codes for a specific event
     */
    async findByEventId(eventId: string): Promise<DiscountCode[]> {
        const { data, error } = await this.client
            .from('discount_codes')
            .select('*')
            .eq('event_id', eventId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'DiscountRepository.findByEventId');
        return data || [];
    }

    /**
     * Create discount code
     */
    async create(discount: DiscountCodeInsert): Promise<DiscountCode> {
        const { data, error } = await this.client
            .from('discount_codes')
            .insert(discount)
            .select()
            .single();

        if (error) this.handleError(error, 'DiscountRepository.create');
        return data;
    }

    /**
     * Update discount code
     */
    async update(id: string, vendorId: string, updates: DiscountCodeUpdate): Promise<DiscountCode> {
        const { data, error } = await this.client
            .from('discount_codes')
            .update(updates)
            .eq('id', id)
            .eq('vendor_id', vendorId)
            .select()
            .single();

        if (error) this.handleError(error, 'DiscountRepository.update');
        return data;
    }

    /**
     * Delete discount code
     */
    async delete(id: string, vendorId: string): Promise<void> {
        const { error } = await this.client
            .from('discount_codes')
            .delete()
            .eq('id', id)
            .eq('vendor_id', vendorId);

        if (error) this.handleError(error, 'DiscountRepository.delete');
    }

    /**
   * Increment discount usage (using RPC for atomicity)
   * Note: This RPC might need to be created in your database
   */
    async incrementUsage(discountId: string) {
        // TODO: Implement increment_discount_usage RPC or use manual update
        // const { data, error} = await this.client.rpc('increment_discount_usage', { p_discount_id: discountId });
        // if (error) this.handleError(error, 'DiscountRepository.incrementUsage');
        // return data;

        // Fallback: manual increment
        const { data, error } = await this.client
            .from('discount_codes')
            .select('used_count')
            .eq('id', discountId)
            .single();

        if (error) this.handleError(error, 'DiscountRepository.incrementUsage.select');

        const newCount = (data?.used_count || 0) + 1;

        const { error: updateError } = await this.client
            .from('discount_codes')
            .update({ used_count: newCount })
            .eq('id', discountId);

        if (updateError) this.handleError(updateError, 'DiscountRepository.incrementUsage.update');
        return newCount;
    }

    // ==================== Bulk Discounts ====================

    /**
     * Get bulk discounts for an event
     */
    async findBulkDiscountsByEventId(eventId: string): Promise<BulkDiscount[]> {
        const { data, error } = await this.client
            .from('bulk_discounts')
            .select('*')
            .eq('event_id', eventId)
            .order('min_quantity', { ascending: false });

        if (error) this.handleError(error, 'DiscountRepository.findBulkDiscountsByEventId');
        return data || [];
    }

    /**
     * Create bulk discount
     */
    async createBulkDiscount(discount: BulkDiscountInsert): Promise<BulkDiscount> {
        const { data, error } = await this.client
            .from('bulk_discounts')
            .insert(discount)
            .select()
            .single();

        if (error) this.handleError(error, 'DiscountRepository.createBulkDiscount');
        return data;
    }

    /**
     * Delete bulk discount
     */
    async deleteBulkDiscount(id: string): Promise<void> {
        const { error } = await this.client
            .from('bulk_discounts')
            .delete()
            .eq('id', id);

        if (error) this.handleError(error, 'DiscountRepository.deleteBulkDiscount');
    }

    /**
     * Delete all bulk discounts for an event
     */
    async deleteBulkDiscountsByEventId(eventId: string): Promise<void> {
        const { error } = await this.client
            .from('bulk_discounts')
            .delete()
            .eq('event_id', eventId);

        if (error) this.handleError(error, 'DiscountRepository.deleteBulkDiscountsByEventId');
    }
}
