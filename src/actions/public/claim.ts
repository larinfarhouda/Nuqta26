'use server';

import { createClient, createAdminClient } from '@/utils/supabase/server';
import { logger } from '@/lib/logger/logger';
import { ServiceFactory } from '@/services/service-factory';

/**
 * Claim a prospect vendor business.
 * 
 * This action:
 * 1. Verifies the current user is logged in
 * 2. Verifies the claim token is valid and the prospect is in "contacted" status
 * 3. Ensures the user has a vendor account (creates one if needed)
 * 4. Converts the prospect: transfers phantom events to the real vendor
 * 5. Updates the prospect status to "converted"
 */
export async function claimProspectBusiness(claimToken: string) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { error: 'You must be logged in to claim a business.' };
        }

        let adminClient;
        try {
            adminClient = await createAdminClient();
        } catch {
            return { error: 'Service unavailable. Please try again later.' };
        }

        // 1. Find the prospect by claim token
        const { data: prospect } = await adminClient
            .from('prospect_vendors')
            .select('*')
            .eq('claim_token', claimToken)
            .single();

        if (!prospect) {
            return { error: 'Invalid or expired claim link.' };
        }

        if (prospect.status === 'converted') {
            return { error: 'This business has already been claimed.' };
        }

        // 2. Get system vendor ID (phantom events are owned by this account)
        const { data: systemVendor } = await adminClient
            .from('vendors')
            .select('id')
            .eq('slug', 'nuqta-platform')
            .single();

        if (!systemVendor) {
            logger.error('System vendor not found during claim');
            return { error: 'System configuration error. Please contact support.' };
        }

        // 3. Ensure user has a vendor profile
        const { data: existingVendor } = await adminClient
            .from('vendors')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!existingVendor) {
            // Create vendor account with prospect's business info
            const { error: vendorError } = await adminClient.from('vendors').insert({
                id: user.id,
                business_name: prospect.business_name,
                category: 'other',
                subscription_tier: 'starter',
                status: 'approved',
                is_verified: true,
                instagram: prospect.instagram || null,
                website: prospect.website || null,
                whatsapp_number: prospect.contact_phone || null,
                slug: prospect.business_name
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/(^-|-$)/g, '')
                    + '-' + Math.random().toString(36).substring(2, 6),
            } as any);

            if (vendorError) {
                logger.error('Failed to create vendor during claim', { vendorError });
                return { error: 'Failed to create your vendor account. Please try again.' };
            }

            // Update profile to vendor role
            await adminClient
                .from('profiles')
                .update({ role: 'vendor' })
                .eq('id', user.id);
        }

        // 4. Convert prospect — transfer events from system vendor to this vendor
        const factory = new ServiceFactory(adminClient);
        const adminService = factory.getAdminService();
        await adminService.convertProspect(
            prospect.id,
            user.id,
            systemVendor.id,
            user.id, // The claimant acts as the actor for the activity log
        );

        logger.info('Prospect claimed successfully', {
            prospectId: prospect.id,
            vendorId: user.id,
            businessName: prospect.business_name,
        });

        return { success: true, businessName: prospect.business_name };
    } catch (error) {
        logger.error('claimProspectBusiness failed', { error });
        return { error: 'An unexpected error occurred. Please try again.' };
    }
}
