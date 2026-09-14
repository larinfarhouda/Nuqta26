import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { RECEIPT_BUCKET, receiptStoragePath } from '@/lib/booking-receipts';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const fail = () => NextResponse.json({ error: 'Receipt unavailable' }, { status: 404, headers: { 'Cache-Control': 'private, no-store' } });
    if (!user) return fail();
    const { data: booking } = await supabase.from('bookings').select('id, user_id, vendor_id, payment_proof_url').eq('id', id).single();
    if (!booking?.payment_proof_url) return fail();
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (booking.user_id !== user.id && booking.vendor_id !== user.id && profile?.role !== 'admin') return fail();
    const path = receiptStoragePath(booking.payment_proof_url, id, process.env.NEXT_PUBLIC_SUPABASE_URL!);
    if (!path) return fail();
    const { data, error } = await supabase.storage.from(RECEIPT_BUCKET).createSignedUrl(path, 60);
    if (error || !data) return fail();
    const response = NextResponse.redirect(data.signedUrl, 307);
    response.headers.set('Cache-Control', 'private, no-store');
    response.headers.set('Referrer-Policy', 'no-referrer');
    return response;
}
