'use server';

import { createClient } from '@/utils/supabase/server';
import { trackActivity } from '@/lib/track-activity';


export async function signOut() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        trackActivity({
            userId: user.id,
            action: 'user_logout',
        });
    }
    await supabase.auth.signOut();
}
