import { BaseRepository } from './base.repository';
import type {
    PlatformStats,
    SubscriptionRevenue,
    TrendDataPoint,
    CategoryStat,
    EventStatusCounts,
    AdminVendor,
    VendorDirectoryParams,
    BankTransferBooking,
    FlaggedReview,
    ProspectVendor,
    CreateProspectVendorInput,
    CreateProspectEventInput,
    EventInterestSummary,
    ActivityLog,
    CreateActivityLogInput,
    PaginatedResult,
} from '@/types/admin.types';

/**
 * Admin Repository
 * Platform-wide data access for the Super Admin panel.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminRepository extends BaseRepository {

    // ─── Dashboard Stats ────────────────────────────────────────────────

    async getPlatformStats(): Promise<PlatformStats> {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();
        const sixtyDaysAgoISO = sixtyDaysAgo.toISOString();

        const [users, vendors, bookings, events, recentUsers, prevUsers, recentVendors, prevVendors, recentBookings, prevBookings, pendingPayments] = await Promise.all([
            this.client.from('profiles').select('*', { count: 'exact', head: true }),
            this.client.from('vendors').select('*', { count: 'exact', head: true }),
            this.client.from('bookings').select('total_amount').eq('status', 'confirmed'),
            this.client.from('events').select('*', { count: 'exact', head: true }),
            // Recent 30 days counts
            this.client.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO),
            this.client.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgoISO).lt('created_at', thirtyDaysAgoISO),
            this.client.from('vendors').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO),
            this.client.from('vendors').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgoISO).lt('created_at', thirtyDaysAgoISO),
            this.client.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoISO).eq('status', 'confirmed'),
            this.client.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', sixtyDaysAgoISO).lt('created_at', thirtyDaysAgoISO).eq('status', 'confirmed'),
            this.client.from('bookings').select('*', { count: 'exact', head: true }).in('status', ['pending_payment', 'payment_submitted']),
        ]);

        const totalBookingValue = (bookings.data || []).reduce((sum, b) => sum + (b.total_amount || 0), 0);

        const calcGrowth = (recent: number, prev: number) =>
            prev === 0 ? (recent > 0 ? 100 : 0) : Math.round(((recent - prev) / prev) * 100);

        return {
            totalUsers: users.count || 0,
            totalVendors: vendors.count || 0,
            totalBookings: (bookings.data || []).length,
            totalEvents: events.count || 0,
            totalBookingValue,
            pendingPayments: pendingPayments.count || 0,
            userGrowth: calcGrowth(recentUsers.count || 0, prevUsers.count || 0),
            vendorGrowth: calcGrowth(recentVendors.count || 0, prevVendors.count || 0),
            bookingGrowth: calcGrowth(recentBookings.count || 0, prevBookings.count || 0),
        };
    }

    async getSubscriptionRevenue(): Promise<SubscriptionRevenue> {
        const { data, error } = await this.client
            .from('vendors')
            .select('subscription_tier');

        if (error) this.handleError(error, 'AdminRepository.getSubscriptionRevenue');

        const vendors = data || [];
        return {
            starterCount: vendors.filter(v => v.subscription_tier === 'starter').length,
            growthCount: vendors.filter(v => v.subscription_tier === 'growth').length,
            professionalCount: vendors.filter(v => v.subscription_tier === 'professional').length,
            totalVendors: vendors.length,
        };
    }

    async get30DayTrend(): Promise<TrendDataPoint[]> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data, error } = await this.client
            .from('bookings')
            .select('created_at, total_amount, status')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .eq('status', 'confirmed');

        if (error) this.handleError(error, 'AdminRepository.get30DayTrend');

        // Group by day
        const dayMap: Record<string, { bookings: number; revenue: number }> = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            const key = d.toISOString().split('T')[0];
            dayMap[key] = { bookings: 0, revenue: 0 };
        }

        (data || []).forEach(b => {
            const key = b.created_at?.split('T')[0];
            if (key && dayMap[key]) {
                dayMap[key].bookings++;
                dayMap[key].revenue += b.total_amount || 0;
            }
        });

        return Object.entries(dayMap).map(([date, vals]) => ({
            date,
            ...vals,
        }));
    }

    async getTopCategories(limit = 5): Promise<CategoryStat[]> {
        const { data, error } = await this.client
            .from('events')
            .select('event_type')
            .eq('status', 'published');

        if (error) this.handleError(error, 'AdminRepository.getTopCategories');

        const counts: Record<string, number> = {};
        (data || []).forEach(e => {
            const type = e.event_type || 'Other';
            counts[type] = (counts[type] || 0) + 1;
        });

        return Object.entries(counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([name, value]) => ({ name, value }));
    }

    async getEventStatusCounts(): Promise<EventStatusCounts> {
        const [published, draft, cancelled, featured] = await Promise.all([
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('status', 'cancelled'),
            this.client.from('events').select('*', { count: 'exact', head: true }).eq('is_featured', true),
        ]);

        return {
            published: published.count || 0,
            draft: draft.count || 0,
            cancelled: cancelled.count || 0,
            featured: featured.count || 0,
        };
    }

    // ─── Vendor Management ──────────────────────────────────────────────

    async getVendorDirectory(params: VendorDirectoryParams): Promise<PaginatedResult<AdminVendor>> {
        const { page, pageSize, search, tier } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = this.client
            .from('vendors')
            .select(`
                id, business_name, company_logo, slug, category,
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
        if (error) this.handleError(error, 'AdminRepository.getVendorDirectory');

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

        if (error) this.handleError(error, 'AdminRepository.updateVendorStatus');
    }

    // ─── Booking (Bank Transfer) Management ─────────────────────────────

    async getBankTransferQueue(page: number, pageSize: number): Promise<PaginatedResult<BankTransferBooking>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.client
            .from('bookings')
            .select(`
                id, user_id, event_id, vendor_id, status, total_amount, discount_amount,
                payment_method, payment_proof_url, payment_note,
                contact_name, contact_email, contact_phone, created_at,
                profiles(full_name, email),
                events(title, date),
                vendors(business_name)
            `, { count: 'exact' })
            .in('status', ['payment_submitted', 'pending_payment'])
            .eq('payment_method', 'bank_transfer')
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) this.handleError(error, 'AdminRepository.getBankTransferQueue');

        const total = count || 0;
        return {
            data: (data || []) as unknown as BankTransferBooking[],
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async confirmPayment(bookingId: string) {
        // Get booking to know ticket info
        const { data: booking, error: fetchError } = await this.client
            .from('bookings')
            .select('id, event_id, status')
            .eq('id', bookingId)
            .single();

        if (fetchError) this.handleError(fetchError, 'AdminRepository.confirmPayment.fetch');

        // Get booking items to compute quantity
        const { data: items, error: itemsError } = await this.client
            .from('booking_items')
            .select('ticket_id')
            .eq('booking_id', bookingId);

        if (itemsError) this.handleError(itemsError, 'AdminRepository.confirmPayment.items');

        // Update booking status
        const { error: updateError } = await this.client
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', bookingId);

        if (updateError) this.handleError(updateError, 'AdminRepository.confirmPayment.update');

        // Increment ticket sold counts
        if (items && items.length > 0) {
            const ticketCounts: Record<string, number> = {};
            items.forEach(item => {
                if (item.ticket_id) {
                    ticketCounts[item.ticket_id] = (ticketCounts[item.ticket_id] || 0) + 1;
                }
            });

            for (const [ticketId, qty] of Object.entries(ticketCounts)) {
                await this.client.rpc('increment_ticket_sold', {
                    ticket_id: ticketId,
                    quantity: qty,
                });
            }
        }
    }

    async rejectPayment(bookingId: string) {
        const { error } = await this.client
            .from('bookings')
            .update({ status: 'pending_payment' })
            .eq('id', bookingId);

        if (error) this.handleError(error, 'AdminRepository.rejectPayment');
    }

    // ─── Moderation ─────────────────────────────────────────────────────

    async getFlaggedReviews(page: number, pageSize: number): Promise<PaginatedResult<FlaggedReview>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.client
            .from('event_reviews')
            .select(`
                id, event_id, user_id, rating, comment, is_flagged, created_at,
                events(title),
                profiles!event_reviews_user_id_fkey(full_name, email),
                review_flags(id)
            `, { count: 'exact' })
            .eq('is_flagged', true)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) this.handleError(error, 'AdminRepository.getFlaggedReviews');

        const reviews: FlaggedReview[] = (data || []).map((r: any) => ({
            id: r.id,
            event_id: r.event_id,
            user_id: r.user_id,
            rating: r.rating,
            comment: r.comment,
            is_flagged: r.is_flagged,
            created_at: r.created_at,
            flag_count: r.review_flags?.length || 0,
            event_title: r.events?.title || null,
            reviewer_name: r.profiles?.full_name || null,
            reviewer_email: r.profiles?.email || null,
        }));

        const total = count || 0;
        return {
            data: reviews,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async unflagReview(reviewId: string) {
        const { error } = await this.client
            .from('event_reviews')
            .update({ is_flagged: false })
            .eq('id', reviewId);

        if (error) this.handleError(error, 'AdminRepository.unflagReview');
    }

    async deleteReview(reviewId: string) {
        const { error } = await this.client
            .from('event_reviews')
            .delete()
            .eq('id', reviewId);

        if (error) this.handleError(error, 'AdminRepository.deleteReview');
    }

    async toggleFeatureEvent(eventId: string, featured: boolean) {
        const { error } = await this.client
            .from('events')
            .update({
                is_featured: featured,
                featured_at: featured ? new Date().toISOString() : null,
            })
            .eq('id', eventId);

        if (error) this.handleError(error, 'AdminRepository.toggleFeatureEvent');
    }

    // ─── Prospect Vendors (Phantom Listings) ────────────────────────────

    async createProspectVendor(input: CreateProspectVendorInput, createdBy: string): Promise<ProspectVendor> {
        const { data, error } = await this.client
            .from('prospect_vendors')
            .insert({
                ...input,
                created_by: createdBy,
            })
            .select()
            .single();

        if (error) this.handleError(error, 'AdminRepository.createProspectVendor');
        return { ...data, eventCount: 0, totalInterests: 0 } as ProspectVendor;
    }

    async getProspects(page: number, pageSize: number, status?: string): Promise<PaginatedResult<ProspectVendor>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = this.client
            .from('prospect_vendors')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;
        if (error) this.handleError(error, 'AdminRepository.getProspects');

        // Get event counts + interest counts for each prospect
        const prospectIds = (data || []).map(p => p.id);
        const { data: prospectEvents } = await this.client
            .from('events')
            .select('prospect_vendor_id, id')
            .in('prospect_vendor_id', prospectIds.length > 0 ? prospectIds : ['__none__']);

        const eventIds = (prospectEvents || []).map(e => e.id);
        const { data: interests } = await this.client
            .from('event_interests')
            .select('event_id')
            .in('event_id', eventIds.length > 0 ? eventIds : ['__none__']);

        // Count events per prospect
        const eventCountMap: Record<string, number> = {};
        const eventToProspect: Record<string, string> = {};
        (prospectEvents || []).forEach(e => {
            if (e.prospect_vendor_id) {
                eventCountMap[e.prospect_vendor_id] = (eventCountMap[e.prospect_vendor_id] || 0) + 1;
                eventToProspect[e.id] = e.prospect_vendor_id;
            }
        });

        // Count interests per prospect
        const interestCountMap: Record<string, number> = {};
        (interests || []).forEach(i => {
            const pId = eventToProspect[i.event_id];
            if (pId) {
                interestCountMap[pId] = (interestCountMap[pId] || 0) + 1;
            }
        });

        const prospects: ProspectVendor[] = (data || []).map(p => ({
            ...p,
            eventCount: eventCountMap[p.id] || 0,
            totalInterests: interestCountMap[p.id] || 0,
        }));

        const total = count || 0;
        return {
            data: prospects,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async updateProspectStatus(prospectId: string, status: string) {
        const { error } = await this.client
            .from('prospect_vendors')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', prospectId);

        if (error) this.handleError(error, 'AdminRepository.updateProspectStatus');
    }

    async generateClaimToken(prospectId: string): Promise<string> {
        const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);

        const { error } = await this.client
            .from('prospect_vendors')
            .update({ claim_token: token, updated_at: new Date().toISOString() })
            .eq('id', prospectId);

        if (error) this.handleError(error, 'AdminRepository.generateClaimToken');
        return token;
    }

    async getProspectByClaimToken(token: string) {
        const { data, error } = await this.client
            .from('prospect_vendors')
            .select('*')
            .eq('claim_token', token)
            .eq('status', 'contacted')
            .single();

        if (error) return null;
        return data;
    }

    async createProspectEvent(input: CreateProspectEventInput, systemVendorId: string) {
        const { slugify } = await import('@/utils/slugify');
        let slug = slugify(input.title);
        // Ensure unique slug
        const { data: existing } = await this.client.from('events').select('slug').eq('slug', slug).maybeSingle();
        if (existing) {
            slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
        }

        const { data, error } = await this.client
            .from('events')
            .insert({
                vendor_id: systemVendorId,
                prospect_vendor_id: input.prospect_vendor_id,
                title: input.title,
                slug,
                description: input.description || null,
                image_url: input.image_url || null,
                date: input.date,
                end_date: input.end_date || null,
                location_name: input.location_name || null,
                location_lat: input.location_lat || null,
                location_long: input.location_long || null,
                district: input.district || null,
                city: input.city || null,
                country: input.country || null,
                capacity: input.capacity || 0,
                event_type: input.event_type || null,
                status: 'published',
            })
            .select()
            .single();

        if (error) this.handleError(error, 'AdminRepository.createProspectEvent');
        return data;
    }

    async getProspectInterests(prospectId: string): Promise<EventInterestSummary[]> {
        // Get events for this prospect
        const { data: events, error: eventsError } = await this.client
            .from('events')
            .select('id, title')
            .eq('prospect_vendor_id', prospectId);

        if (eventsError) this.handleError(eventsError, 'AdminRepository.getProspectInterests.events');
        if (!events || events.length === 0) return [];

        const eventIds = events.map(e => e.id);
        const { data: interests, error: interestsError } = await this.client
            .from('event_interests')
            .select(`
                event_id, created_at,
                profiles(id, full_name, email)
            `)
            .in('event_id', eventIds);

        if (interestsError) this.handleError(interestsError, 'AdminRepository.getProspectInterests.interests');

        return events.map(event => ({
            eventId: event.id,
            eventTitle: event.title,
            interestCount: (interests || []).filter(i => i.event_id === event.id).length,
            interestedUsers: (interests || [])
                .filter(i => i.event_id === event.id)
                .map((i: any) => ({
                    userId: i.profiles?.id || '',
                    fullName: i.profiles?.full_name || null,
                    email: i.profiles?.email || null,
                    interestedAt: i.created_at,
                })),
        }));
    }

    async convertProspect(prospectId: string, vendorId: string, systemVendorId: string) {
        // 1. Transfer all prospect events to actual vendor
        const { error: transferError } = await this.client
            .from('events')
            .update({ vendor_id: vendorId, prospect_vendor_id: null })
            .eq('prospect_vendor_id', prospectId)
            .eq('vendor_id', systemVendorId);

        if (transferError) this.handleError(transferError, 'AdminRepository.convertProspect.transfer');

        // 2. Mark prospect as converted
        const { error: updateError } = await this.client
            .from('prospect_vendors')
            .update({
                status: 'converted',
                converted_vendor_id: vendorId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', prospectId);

        if (updateError) this.handleError(updateError, 'AdminRepository.convertProspect.update');
    }

    // ─── Activity Logs ──────────────────────────────────────────────────

    async logActivity(input: CreateActivityLogInput) {
        const { error } = await this.client
            .from('activity_logs')
            .insert({
                user_id: input.user_id || null,
                action: input.action,
                entity_type: input.entity_type || null,
                entity_id: input.entity_id || null,
                metadata: input.metadata || {},
                ip_address: input.ip_address || null,
            });

        // Silently fail — logging should not break the main flow
        if (error) {
            console.error('Failed to log activity:', error.message);
        }
    }

    async getRecentActivity(page: number, pageSize: number): Promise<PaginatedResult<ActivityLog>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.client
            .from('activity_logs')
            .select(`
                id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at,
                profiles(full_name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) this.handleError(error, 'AdminRepository.getRecentActivity');

        const logs: ActivityLog[] = (data || []).map((l: any) => ({
            id: l.id,
            user_id: l.user_id,
            action: l.action,
            entity_type: l.entity_type,
            entity_id: l.entity_id,
            metadata: l.metadata || {},
            ip_address: l.ip_address,
            created_at: l.created_at,
            user_name: l.profiles?.full_name || null,
            user_email: l.profiles?.email || null,
        }));

        const total = count || 0;
        return {
            data: logs,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    // ─── User Activity Tracking ─────────────────────────────────────────

    async getUserActivityFeed(
        page: number,
        pageSize: number,
        filters?: { userId?: string; action?: string; userRole?: string }
    ) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = this.client
            .from('user_activity_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (filters?.userId) {
            query = query.eq('user_id', filters.userId);
        }
        if (filters?.action) {
            query = query.eq('action', filters.action);
        }
        if (filters?.userRole) {
            query = query.eq('user_role', filters.userRole);
        }

        const { data, error, count } = await query;
        if (error) console.error('getUserActivityFeed error:', error.message);

        // Enrich with user info from profiles
        const userIds = [...new Set((data || []).map((d: any) => d.user_id))] as string[];
        const { data: profiles } = await this.client
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds.length > 0 ? userIds : ['__none__']);

        const profileMap = new Map(
            (profiles || []).map((p: any) => [p.id, p])
        );

        const enriched = (data || []).map((log: any) => ({
            ...log,
            user_name: profileMap.get(log.user_id)?.full_name || null,
            user_email: profileMap.get(log.user_id)?.email || null,
        }));

        const total = count || 0;
        return {
            data: enriched,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
        };
    }

    async getUserEngagementStats() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [dau, wau, mau, totalLogs, actionBreakdown] = await Promise.all([
            // DAU: distinct users in last 24h
            this.client
                .from('user_activity_logs')
                .select('user_id', { count: 'exact' })
                .gte('created_at', oneDayAgo),
            // WAU: distinct users in last 7d
            this.client
                .from('user_activity_logs')
                .select('user_id', { count: 'exact' })
                .gte('created_at', sevenDaysAgo),
            // MAU: distinct users in last 30d
            this.client
                .from('user_activity_logs')
                .select('user_id', { count: 'exact' })
                .gte('created_at', thirtyDaysAgo),
            // Total logs
            this.client
                .from('user_activity_logs')
                .select('*', { count: 'exact', head: true }),
            // Action breakdown (last 30d)
            this.client
                .from('user_activity_logs')
                .select('action')
                .gte('created_at', thirtyDaysAgo),
        ]);

        // Count distinct users
        const dauUsers = new Set((dau.data || []).map((d: any) => d.user_id));
        const wauUsers = new Set((wau.data || []).map((d: any) => d.user_id));
        const mauUsers = new Set((mau.data || []).map((d: any) => d.user_id));

        // Action breakdown
        const actionCounts: Record<string, number> = {};
        (actionBreakdown.data || []).forEach((d: any) => {
            actionCounts[d.action] = (actionCounts[d.action] || 0) + 1;
        });

        return {
            dau: dauUsers.size,
            wau: wauUsers.size,
            mau: mauUsers.size,
            totalLogs: totalLogs.count || 0,
            actionBreakdown: Object.entries(actionCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => ({ action, count })),
        };
    }

    async getMostActiveUsers(limit = 10) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await this.client
            .from('user_activity_logs')
            .select('user_id, action, created_at')
            .gte('created_at', thirtyDaysAgo);

        if (error) console.error('getMostActiveUsers error:', error.message);

        // Count actions per user + track last activity
        const userMap: Record<string, { count: number; lastActive: string; role: string }> = {};
        (data || []).forEach((d: any) => {
            if (!userMap[d.user_id]) {
                userMap[d.user_id] = { count: 0, lastActive: d.created_at, role: d.user_role || 'customer' };
            }
            userMap[d.user_id].count++;
            if (d.created_at > userMap[d.user_id].lastActive) {
                userMap[d.user_id].lastActive = d.created_at;
            }
        });

        const sorted = Object.entries(userMap)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, limit);

        // Enrich with profile info
        const userIds = sorted.map(([id]) => id);
        const { data: profiles } = await this.client
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds.length > 0 ? userIds : ['__none__']);

        const profileMap = new Map(
            (profiles || []).map((p: any) => [p.id, p])
        );

        return sorted.map(([userId, info]) => ({
            userId,
            fullName: profileMap.get(userId)?.full_name || null,
            email: profileMap.get(userId)?.email || null,
            actionCount: info.count,
            lastActive: info.lastActive,
            role: info.role,
        }));
    }
}
