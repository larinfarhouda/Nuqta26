/** @jest-environment node */
import { GET } from '@/app/api/bookings/[id]/receipt/route';
import { createClient } from '@/utils/supabase/server';
jest.mock('@/utils/supabase/server', () => ({ createClient: jest.fn() }));
const id = '11111111-1111-4111-8111-111111111111';
const token = '22222222-2222-4222-8222-222222222222';
function setup(userId: string | null, role = 'user', proof = `receipts/${id}/${token}.pdf`) {
    const sign = jest.fn().mockResolvedValue({ data: { signedUrl: 'https://project.supabase.co/signed' } });
    const db = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: userId ? { id: userId } : null } }) },
        from: jest.fn((table: string) => ({ select: () => ({ eq: () => ({ single: async () => ({ data: table === 'profiles' ? { role } : { id, user_id: 'attendee', vendor_id: 'organizer', payment_proof_url: proof } }) }) }) })),
        storage: { from: () => ({ createSignedUrl: sign }) } };
    (createClient as jest.Mock).mockResolvedValue(db);
    return sign;
}
const request = () => GET(new Request('https://nuqta.test/receipt'), { params: Promise.resolve({ id }) });
beforeEach(() => { process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://project.supabase.co'; });
test.each([null, 'unrelated'])('does not reveal receipts to %s', async user => {
    const sign = setup(user); expect((await request()).status).toBe(404); expect(sign).not.toHaveBeenCalled();
});
test.each([['attendee','user'], ['organizer','vendor'], ['support','admin']])('authorizes %s and returns only a short-lived private redirect', async (user,role) => {
    const sign=setup(user,role); const response=await request(); expect(response.status).toBe(307);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store'); expect(sign).toHaveBeenCalledWith(`receipts/${id}/${token}.pdf`,60);
});
test('cannot sign a path belonging to another booking', async () => {
    const sign=setup('attendee','user',`receipts/${token}/${token}.pdf`); expect((await request()).status).toBe(404); expect(sign).not.toHaveBeenCalled();
});
