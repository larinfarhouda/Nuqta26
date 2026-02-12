import { getAdminDashboardData } from '@/actions/admin';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboardPage() {
    const data = await getAdminDashboardData();

    if (!data) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                Failed to load dashboard data.
            </div>
        );
    }

    return <AdminDashboardClient data={data} />;
}
