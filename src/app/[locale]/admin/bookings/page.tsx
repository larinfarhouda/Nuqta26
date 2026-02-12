import { getAdminBankTransfers } from '@/actions/admin';
import AdminBookingsClient from '@/components/admin/AdminBookingsClient';

export default async function AdminBookingsPage() {
    const result = await getAdminBankTransfers(1, 20);

    return <AdminBookingsClient initialData={result} />;
}
