import { BaseRepository } from './base.repository';
import { Tables } from '@/types/database.types';

type Vendor = Tables<'vendors'>;
type VendorGallery = Tables<'vendor_gallery'>;

/**
 * Vendor Repository
 * Handles all database operations for vendors
 */
export class VendorRepository extends BaseRepository {
    /**
     * Find vendor by slug
     */
    async findBySlug(slug: string): Promise<Vendor | null> {
        const { data, error } = await this.client
            .from('vendors')
            .select('*')
            .eq('slug', slug)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'VendorRepository.findBySlug');
        }

        return data;
    }

    /**
     * Find vendor by ID
     */
    async findById(id: string): Promise<Vendor | null> {
        const { data, error } = await this.client
            .from('vendors')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            if (this.isNotFoundError(error)) return null;
            this.handleError(error, 'VendorRepository.findById');
        }

        return data;
    }

    /**
     * Get vendor gallery
     */
    async getGallery(vendorId: string): Promise<VendorGallery[]> {
        const { data, error } = await this.client
            .from('vendor_gallery')
            .select('*')
            .eq('vendor_id', vendorId)
            .order('created_at', { ascending: false });

        if (error) this.handleError(error, 'VendorRepository.getGallery');
        return data || [];
    }

    /**
     * Get upcoming published events for a vendor
     */
    async getUpcomingEvents(vendorId: string) {
        const today = new Date().toISOString();

        const { data, error } = await this.client
            .from('events')
            .select(`
        id, slug, title, description, date, 
        location_name, city, district, image_url, category_id
      `)
            .eq('vendor_id', vendorId)
            .eq('status', 'published')
            .gte('date', today)
            .order('date', { ascending: true });

        if (error) this.handleError(error, 'VendorRepository.getUpcomingEvents');
        return data || [];
    }
}
