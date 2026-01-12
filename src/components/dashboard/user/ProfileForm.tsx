'use client';

import { useState } from 'react';
import { updateUserProfile } from '@/actions/user';
import { Loader2, Save, User } from 'lucide-react';
import { useRouter } from '@/navigation';

export default function ProfileForm({
    initialData
}: {
    initialData: { full_name: string | null, email: string | undefined }
}) {
    const [fullName, setFullName] = useState(initialData.full_name || '');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const result = await updateUserProfile({ full_name: fullName });

            if (result.error) {
                setMessage({ type: 'error', text: 'Failed to update profile' });
            } else {
                setMessage({ type: 'success', text: 'Profile updated successfully' });
                router.refresh();
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-2xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Profile Information
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={initialData.email}
                        disabled
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-500 font-medium cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                        Full Name
                    </label>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-medium"
                        placeholder="Enter your full name"
                    />
                </div>

                {message && (
                    <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                        {message.text}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
