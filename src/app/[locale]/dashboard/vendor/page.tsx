import VendorDashboard from '@/components/dashboard/VendorDashboard';
import { createClient } from '@/utils/supabase/server';
import { getPendingBookingsCount } from '@/actions/vendor/bookings';

export default async function VendorDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Unauthorized</div>;
    }

    // Pre-fetch all dashboard data server-side in parallel
    const now = new Date().toISOString();
    const [
        { data: vendorData },
        pendingBookingsCount,
        { count: activeEventsCount }
    ] = await Promise.all([
        supabase.from('vendors').select('*').eq('id', user.id).single(),
        getPendingBookingsCount(),
        supabase
            .from('events')
            .select('id', { count: 'exact', head: true })
            .eq('vendor_id', user.id)
            .gte('date', now)
    ]);

    return (
        <div>
            <VendorDashboard
                initialVendorData={vendorData}
                initialPendingBookingsCount={pendingBookingsCount}
                initialActiveEventsCount={activeEventsCount || 0}
            />
        </div>
    );
}
