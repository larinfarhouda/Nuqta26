import { getAdminVendors } from '@/actions/admin';
import AdminVendorsClient from '@/components/admin/AdminVendorsClient';

export default async function AdminVendorsPage() {
    const result = await getAdminVendors(1, 20);

    return <AdminVendorsClient initialData={result} />;
}
