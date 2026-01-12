'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Check, X, FileText, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const supabase = createClient();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPendingVendors();
    }, []);

    const fetchPendingVendors = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('vendors')
            .select('*, profiles(email: id)') // In real joining, we might need to join on id if profiles has email, but email is in auth.users.
            // Actually profiles doesn't have email. We might need a function to get emails or just show business name.
            .eq('status', 'pending');

        setVendors(data || []);
        setLoading(false);
    };

    const handleApprove = async (id: string) => {
        const { error } = await supabase
            .from('vendors')
            .update({ status: 'approved', is_verified: true })
            .eq('id', id);

        if (!error) fetchPendingVendors();
    };

    const handleReject = async (id: string) => {
        const { error } = await supabase
            .from('vendors')
            .update({ status: 'suspended' }) // Or rejected
            .eq('id', id);

        if (!error) fetchPendingVendors();
    };

    const getDocUrl = (path: string) => {
        // If we simply stored the path, we use .createSignedUrl for private buckets
        // But for now, we'll try to get it.
        if (!path) return '#';
        // Logic depends on if we save full URL or path. In VendorDashboard we saved path.
        // Since it's a private bucket, we need a signed URL.
        return path;
    };

    const openDocument = async (path: string) => {
        if (!path) return;
        const { data } = await supabase.storage.from('vendor-documents').createSignedUrl(path, 60);
        if (data?.signedUrl) window.open(data.signedUrl, '_blank');
    };

    if (loading) return <Loader2 className="animate-spin" />;

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">Verification Queue</h2>
            </div>
            <ul className="divide-y divide-gray-200">
                {vendors.length === 0 && <li className="p-6 text-center text-gray-500">No pending verifications.</li>}
                {vendors.map((vendor) => (
                    <li key={vendor.id} className="p-6 flex items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{vendor.business_name}</h3>
                            <p className="text-sm text-gray-500">{vendor.category}</p>
                            <div className="mt-2 text-sm text-gray-500">
                                Lat: {vendor.location_lat}, Long: {vendor.location_long}
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {vendor.tax_id_document ? (
                                <button
                                    onClick={() => openDocument(vendor.tax_id_document)}
                                    className="flex items-center text-blue-600 hover:underline"
                                >
                                    <FileText className="w-4 h-4 mr-1" />
                                    View Tax ID
                                </button>
                            ) : (
                                <span className="text-xs text-red-500">No Document</span>
                            )}

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleReject(vendor.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                                    title="Reject"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleApprove(vendor.id)}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded"
                                    title="Approve"
                                >
                                    <Check className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
