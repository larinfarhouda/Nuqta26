import { BaseRepository } from '../base.repository';
import type {
    AdminVendor,
    VendorDirectoryParams,
    PaginatedResult,
} from '@/types/admin.types';

/**
 * Admin Vendor Management Repository
 * Data access for vendor directory, details, status, and subscription management.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminVendorRepository extends BaseRepository {

    async getVendorDirectory(params: VendorDirectoryParams): Promise<PaginatedResult<AdminVendor>> {
        const { page, pageSize, search, tier } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = this.client
            .from('vendors')
            .select(`
                id, business_name, company_logo, slug, category, country,
                status, is_verified, subscription_tier, is_founder_pricing, created_at,
                profiles!inner(full_name, email)
            `, { count: 'exact' })
            .range(from, to)
            .order('created_at', { ascending: false });

        if (search) {
            query = query.or(`business_name.ilike.%${search}%,slug.ilike.%${search}%`);
        }
        if (tier) {
            query = query.eq('subscription_tier', tier);
        }

        const { data, error, count } = await query;
        if (error) this.handleError(error, 'AdminVendorRepository.getVendorDirectory');

        // Get event+booking counts per vendor
        const vendorIds = (data || []).map(v => v.id);
        const [eventCounts, bookingCounts] = await Promise.all([
            this.client.from('events').select('vendor_id').in('vendor_id', vendorIds),
            this.client.from('bookings').select('vendor_id').in('vendor_id', vendorIds).eq('status', 'confirmed'),
        ]);

        const eCounts: Record<string, number> = {};
        const bCounts: Record<string, number> = {};
        (eventCounts.data || []).forEach(e => { eCounts[e.vendor_id] = (eCounts[e.vendor_id] || 0) + 1; });
        (bookingCounts.data || []).forEach(b => { bCounts[b.vendor_id] = (bCounts[b.vendor_id] || 0) + 1; });

        const vendors: AdminVendor[] = (data || []).map((v: any) => ({
            id: v.id,
            business_name: v.business_name,
            company_logo: v.company_logo,
            slug: v.slug,
            category: v.category,
            status: v.status,
            is_verified: v.is_verified,
            subscription_tier: v.subscription_tier,
            is_founder_pricing: v.is_founder_pricing,
            created_at: v.created_at,
            country: v.country || null,
            email: v.profiles?.email || null,
            full_name: v.profiles?.full_name || null,
            eventCount: eCounts[v.id] || 0,
            bookingCount: bCounts[v.id] || 0,
        }));

        const total = count || 0;
        return {
            data: vendors,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async updateVendorStatus(vendorId: string, status: string, isVerified: boolean) {
        const { error } = await this.client
            .from('vendors')
            .update({ status, is_verified: isVerified, updated_at: new Date().toISOString() })
            .eq('id', vendorId);

        if (error) this.handleError(error, 'AdminVendorRepository.updateVendorStatus');
    }

    async getVendorFullDetails(vendorId: string) {
        // Run all queries in parallel instead of sequentially
        const [vendorRes, eventRes, bookingRes] = await Promise.all([
            this.client
                .from('vendors')
                .select(`
                    id, business_name, company_logo, cover_image, slug, category,
                    description_ar, status, is_verified, whatsapp_number,
                    website, instagram, country, location_name, location_details,
                    location_lat, location_long,
                    bank_name, bank_account_name, bank_iban,
                    subscription_tier, subscription_status, subscription_starts_at,
                    subscription_expires_at, is_founder_pricing,
                    cancellation_policy, return_policy, tax_id_document, created_at,
                    profiles(full_name, email)
                `)
                .eq('id', vendorId)
                .single(),
            this.client.from('events').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId),
            this.client.from('bookings').select('id', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'confirmed'),
        ]);

        if (vendorRes.error) this.handleError(vendorRes.error, 'AdminVendorRepository.getVendorFullDetails');

        return {
            ...vendorRes.data,
            email: (vendorRes.data as any)?.profiles?.email || null,
            full_name: (vendorRes.data as any)?.profiles?.full_name || null,
            eventCount: eventRes.count || 0,
            bookingCount: bookingRes.count || 0,
        };
    }

    async updateVendorSubscription(vendorId: string, tier: string, isFounder: boolean) {
        const { error } = await this.client
            .from('vendors')
            .update({
                subscription_tier: tier,
                is_founder_pricing: isFounder,
                subscription_status: 'active',
                subscription_starts_at: new Date().toISOString(),
                subscription_expires_at: null, // admin override = no expiry
            })
            .eq('id', vendorId);

        if (error) this.handleError(error, 'AdminVendorRepository.updateVendorSubscription');
    }

    async updateVendorDetails(vendorId: string, updates: Record<string, any>) {
        // Remove fields that shouldn't be directly updated
        const { id, profiles, eventCount, bookingCount, email, full_name, ...safeUpdates } = updates;
        const { error } = await this.client
            .from('vendors')
            .update(safeUpdates as any)
            .eq('id', vendorId);

        if (error) this.handleError(error, 'AdminVendorRepository.updateVendorDetails');
    }
}
