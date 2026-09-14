export const RECEIPT_BUCKET = 'booking-receipts';
export const RECEIPT_MAX_BYTES = 5 * 1024 * 1024;
const RECEIPT_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };

export function receiptUploadPath(bookingId: string, file: Pick<File, 'type' | 'size'>, token: string) {
    const extension = RECEIPT_TYPES[file.type];
    if (!extension || file.size <= 0 || file.size > RECEIPT_MAX_BYTES) throw new Error('Use a JPG, PNG, WebP or PDF receipt up to 5 MB.');
    if (!/^[0-9a-f-]{36}$/i.test(bookingId) || !/^[0-9a-f-]{36}$/i.test(token)) throw new Error('Invalid booking.');
    return `receipts/${bookingId}/${token}.${extension}`;
}

// Accept existing Supabase public URLs only from our own storage host.
export function receiptStoragePath(value: string, bookingId: string, supabaseUrl: string) {
    let path = value;
    if (value.startsWith('http')) {
        try {
            const url = new URL(value);
            const prefix = `/storage/v1/object/public/${RECEIPT_BUCKET}/`;
            if (url.origin !== new URL(supabaseUrl).origin || !url.pathname.startsWith(prefix)) return null;
            path = decodeURIComponent(url.pathname.slice(prefix.length));
        } catch { return null; }
    }
    if (path.includes('..') || path.includes('?') || path.includes('#')) return null;
    const match = path.match(/^receipts\/([0-9a-f-]{36})(?:\/[0-9a-f-]{36}|-\d+)\.(jpg|jpeg|png|webp|pdf)$/i);
    return match?.[1] === bookingId ? path : null;
}

export function receiptViewUrl(bookingId: string, value: string) {
    return `/api/bookings/${encodeURIComponent(bookingId)}/receipt?filename=receipt.${value.toLowerCase().endsWith('.pdf') ? 'pdf' : 'jpg'}`;
}
