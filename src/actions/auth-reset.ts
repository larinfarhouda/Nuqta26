'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function resetPasswordForEmail(email: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-callback`,
    });

    if (error) {
        console.error('Error sending reset password email:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function updatePassword(password: string) {
    const supabase = await createClient();

    const { error } = await supabase.auth.updateUser({
        password: password
    });

    if (error) {
        console.error('Error updating password:', error);
        return { success: false, error: error.message };
    }

    return { success: true };
}
