import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/navigation';
import ProfileForm from '@/components/dashboard/user/ProfileForm';

export default async function UserProfilePage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect({ href: '/login', locale });
        return null;
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-3 mb-6">
                <h1 className="text-2xl font-black text-gray-900">Account Settings</h1>
            </div>

            <ProfileForm
                initialData={{
                    full_name: profile?.full_name || '',
                    email: user.email
                }}
            />
        </div>
    );
}
