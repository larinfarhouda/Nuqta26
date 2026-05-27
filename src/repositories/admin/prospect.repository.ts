import { BaseRepository } from '../base.repository';
import type {
    ProspectVendor,
    CreateProspectVendorInput,
    CreateProspectEventInput,
    EventInterestSummary,
    PaginatedResult,
} from '@/types/admin.types';

/**
 * Admin Prospect Repository
 * Data access for prospect/phantom vendor listings, claim tokens, and conversion.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminProspectRepository extends BaseRepository {

    async createProspectVendor(input: CreateProspectVendorInput, createdBy: string): Promise<ProspectVendor> {
        const { data, error } = await this.client
            .from('prospect_vendors')
            .insert({ ...input, created_by: createdBy })
            .select()
            .single();

        if (error) this.handleError(error, 'AdminProspectRepository.createProspectVendor');
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
        if (error) this.handleError(error, 'AdminProspectRepository.getProspects');

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

        const eventCountMap: Record<string, number> = {};
        const eventToProspect: Record<string, string> = {};
        (prospectEvents || []).forEach(e => {
            if (e.prospect_vendor_id) {
                eventCountMap[e.prospect_vendor_id] = (eventCountMap[e.prospect_vendor_id] || 0) + 1;
                eventToProspect[e.id] = e.prospect_vendor_id;
            }
        });

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
        return { data: prospects, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    async updateProspectStatus(prospectId: string, status: string) {
        const { error } = await this.client
            .from('prospect_vendors')
            .update({ status, updated_at: new Date().toISOString() })
            .eq('id', prospectId);
        if (error) this.handleError(error, 'AdminProspectRepository.updateProspectStatus');
    }

    async generateClaimToken(prospectId: string): Promise<string> {
        const token = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
        const { error } = await this.client
            .from('prospect_vendors')
            .update({ claim_token: token, updated_at: new Date().toISOString() })
            .eq('id', prospectId);
        if (error) this.handleError(error, 'AdminProspectRepository.generateClaimToken');
        return token;
    }

    async getProspectByClaimToken(token: string) {
        const { data, error } = await this.client
            .from('prospect_vendors')
            .select('*')
            .eq('claim_token', token)
            .eq('status', 'pitched')
            .single();
        if (error) return null;
        return data;
    }

    async createProspectEvent(input: CreateProspectEventInput, systemVendorId: string) {
        const { slugify } = await import('@/utils/slugify');
        let slug = slugify(input.title);
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

        if (error) this.handleError(error, 'AdminProspectRepository.createProspectEvent');
        return data;
    }

    async getProspectInterests(prospectId: string): Promise<EventInterestSummary[]> {
        const { data: events, error: eventsError } = await this.client
            .from('events')
            .select('id, title')
            .eq('prospect_vendor_id', prospectId);

        if (eventsError) this.handleError(eventsError, 'AdminProspectRepository.getProspectInterests.events');
        if (!events || events.length === 0) return [];

        const eventIds = events.map(e => e.id);
        const { data: interests, error: interestsError } = await this.client
            .from('event_interests')
            .select(`event_id, created_at, profiles(id, full_name, email)`)
            .in('event_id', eventIds);

        if (interestsError) this.handleError(interestsError, 'AdminProspectRepository.getProspectInterests.interests');

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
        const { error: transferError } = await this.client
            .from('events')
            .update({ vendor_id: vendorId, prospect_vendor_id: null })
            .eq('prospect_vendor_id', prospectId)
            .eq('vendor_id', systemVendorId);

        if (transferError) this.handleError(transferError, 'AdminProspectRepository.convertProspect.transfer');

        const { error: updateError } = await this.client
            .from('prospect_vendors')
            .update({
                status: 'free',
                converted_vendor_id: vendorId,
                updated_at: new Date().toISOString(),
            })
            .eq('id', prospectId);

        if (updateError) this.handleError(updateError, 'AdminProspectRepository.convertProspect.update');
    }

    async updateProspectVendor(prospectId: string, input: Partial<CreateProspectVendorInput>): Promise<void> {
        const { error } = await this.client
            .from('prospect_vendors')
            .update({ ...input, updated_at: new Date().toISOString() })
            .eq('id', prospectId);

        if (error) this.handleError(error, 'AdminProspectRepository.updateProspectVendor');
    }

    async deleteProspectVendor(prospectId: string): Promise<void> {
        // Disconnect associated events first to prevent FK constraint failures
        const { error: eventError } = await this.client
            .from('events')
            .update({ prospect_vendor_id: null, updated_at: new Date().toISOString() })
            .eq('prospect_vendor_id', prospectId);

        if (eventError) this.handleError(eventError, 'AdminProspectRepository.deleteProspectVendor.disconnectEvents');

        // Delete the prospect vendor row
        const { error } = await this.client
            .from('prospect_vendors')
            .delete()
            .eq('id', prospectId);

        if (error) this.handleError(error, 'AdminProspectRepository.deleteProspectVendor');
    }
}
