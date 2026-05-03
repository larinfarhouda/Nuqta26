import { getAdminSubscriptionTiers } from '@/actions/admin/subscription-tiers';
import AdminSubscriptionTiersClient from '@/components/admin/AdminSubscriptionTiersClient';

export default async function AdminSubscriptionsPage() {
    const tiers = await getAdminSubscriptionTiers();

    return <AdminSubscriptionTiersClient initialTiers={tiers} />;
}
