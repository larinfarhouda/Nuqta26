import { getAdminActivity } from '@/actions/admin';
import AdminActivityClient from '@/components/admin/AdminActivityClient';

export default async function AdminActivityPage() {
    const result = await getAdminActivity(1, 50);

    return <AdminActivityClient initialData={result} />;
}
