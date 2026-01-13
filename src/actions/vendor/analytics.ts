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

    // 3. Demographics (Age & Gender)
    const userIds = Array.from(new Set(bookings.map((b: any) => b.user_id).filter(Boolean)));

    let genderDistribution: { name: string, value: number }[] = [];
    let ageDistribution: { name: string, value: number }[] = [];

    if (userIds.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('gender, age')
            .in('id', userIds);

        if (profiles) {
            // Gender
            const genderCount: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
            profiles.forEach(p => {
                if (p.gender === 'Male') genderCount.Male++;
                else if (p.gender === 'Female') genderCount.Female++;
                else genderCount.Other++;
            });
            genderDistribution = Object.entries(genderCount)
                .filter(([_, val]) => val > 0)
                .map(([name, value]) => ({ name, value }));

            // Age
            const ageRanges: Record<string, number> = {
                '<18': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0
            };

            profiles.forEach(p => {
                if (!p.age) return;
                const age = p.age;
                if (age < 18) ageRanges['<18']++;
                else if (age <= 24) ageRanges['18-24']++;
                else if (age <= 34) ageRanges['25-34']++;
                else if (age <= 44) ageRanges['35-44']++;
                else if (age <= 54) ageRanges['45-54']++;
                else ageRanges['55+']++;
            });

            ageDistribution = Object.entries(ageRanges)
                .map(([name, value]) => ({ name, value }));
        }
    }

    return {
        typeDistribution,
        customerLoyalty,
        genderDistribution,
        ageDistribution
    };
}
