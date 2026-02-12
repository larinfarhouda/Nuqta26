import { getAdminUserActivity, getAdminUserEngagement, getAdminMostActiveUsers } from '@/actions/admin';
import AdminUsersClient from '@/components/admin/AdminUsersClient';

export default async function AdminUsersPage() {
    const [activityResult, engagementResult, activeUsers] = await Promise.all([
        getAdminUserActivity(1, 20),
        getAdminUserEngagement(),
        getAdminMostActiveUsers(10),
    ]);

    return (
        <AdminUsersClient
            initialActivity={activityResult}
            engagement={engagementResult}
            activeUsers={activeUsers}
        />
    );
}
