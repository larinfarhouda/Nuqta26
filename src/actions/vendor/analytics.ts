'use server';

import { createClient } from '@/utils/supabase/server';

export async function getVendorAnalytics() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // 1. Total Revenue & Sales
    const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, status, created_at')
        .eq('vendor_id', user.id)
        .eq('status', 'confirmed');

    const totalRevenue = bookings?.reduce((sum, b) => sum + (b.total_amount || 0), 0) || 0;
    const totalSales = bookings?.length || 0;

    // 2. Events Count
    const { count: eventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_id', user.id);

    // 3. Recent Activity (simplistic)
    const recentSales = bookings?.filter(b => {
        const date = new Date(b.created_at);
        const now = new Date();
        return (now.getTime() - date.getTime()) < (30 * 24 * 60 * 60 * 1000); // Last 30 days
    }).length || 0;

    return {
        revenue: totalRevenue,
        sales: totalSales,
        events: eventsCount || 0,
        recentSales
    };
}

export async function getSegmentationData() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Fetch all confirmed bookings with event type
    const { data: bookings } = await supabase
        .from('bookings')
        .select(`
            user_id,
            events (event_type)
        `)
        .eq('vendor_id', user.id)
        .eq('status', 'confirmed');

    if (!bookings) return { typeDistribution: [], customerLoyalty: [] };

    // 1. Event Type Preferences
    const typeCount: Record<string, number> = {};
    bookings.forEach((b: any) => {
        const type = b.events?.event_type || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const typeDistribution = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

    // 2. Customer Loyalty (Repeat vs One-time)
    const customerCounts: Record<string, number> = {};
    bookings.forEach((b: any) => {
        if (b.user_id) customerCounts[b.user_id] = (customerCounts[b.user_id] || 0) + 1;
    });

    let oneTime = 0;
    let repeat = 0;
    let loyal = 0; // > 3 bookings

    Object.values(customerCounts).forEach(count => {
        if (count === 1) oneTime++;
        else if (count <= 3) repeat++;
        else loyal++;
    });

    const customerLoyalty = [
        { name: 'One-time', value: oneTime },
        { name: 'Recurring', value: repeat },
        { name: 'Loyal', value: loyal }
    ];

    return {
        typeDistribution,
        customerLoyalty
    };
}
