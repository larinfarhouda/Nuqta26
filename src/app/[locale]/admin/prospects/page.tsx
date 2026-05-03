import { getAdminProspects, getProspectStats } from '@/actions/admin';
import AdminProspectsClient from '@/components/admin/AdminProspectsClient';

export default async function AdminProspectsPage() {
    const [result, stats] = await Promise.all([
        getAdminProspects(1, 20),
        getProspectStats(),
    ]);

    return <AdminProspectsClient initialData={result} stats={stats} />;
}
