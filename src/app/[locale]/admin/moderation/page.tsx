import { getAdminFlaggedReviews } from '@/actions/admin';
import AdminModerationClient from '@/components/admin/AdminModerationClient';

export default async function AdminModerationPage() {
    const reviews = await getAdminFlaggedReviews(1, 20);

    return <AdminModerationClient initialReviews={reviews} />;
}
