import { getAdminProspects } from '@/actions/admin';
import AdminProspectsClient from '@/components/admin/AdminProspectsClient';

export default async function AdminProspectsPage() {
    const result = await getAdminProspects(1, 20);

    return <AdminProspectsClient initialData={result} />;
}
