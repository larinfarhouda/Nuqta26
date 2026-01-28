'use server';

import { createClient } from '@/utils/supabase/server';
import { ServiceFactory } from '@/services/service-factory';
import { logger } from '@/lib/logger/logger';
import { UnauthorizedError } from '@/lib/errors/app-error';

/**
 * Get vendor analytics overview
 */
export async function getVendorAnalytics() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const analyticsService = factory.getAnalyticsService();

        const analytics = await analyticsService.getVendorAnalytics(user.id);
        logger.info('Vendor analytics fetched', { vendorId: user.id });

        return analytics;
    } catch (error) {
        logger.error('Failed to get vendor analytics', { error });
        return null;
    }
}

/**
 * Get vendor segmentation data
 */
export async function getSegmentationData() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) throw new UnauthorizedError();

        const factory = new ServiceFactory(supabase);
        const analyticsService = factory.getAnalyticsService();

        const segmentation = await analyticsService.getSegmentationData(user.id);
        logger.info('Vendor segmentation data fetched', { vendorId: user.id });

        return segmentation;
    } catch (error) {
        logger.error('Failed to get segmentation data', { error });
        return null;
    }
}
