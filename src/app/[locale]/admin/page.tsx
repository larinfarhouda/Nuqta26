'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { Check, X, FileText, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const supabase = createClient();
    const [vendors, setVendors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [processingVendorId, setProcessingVendorId] = useState<string | null>(null);

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            window.location.href = '/login';
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            window.location.href = '/';
            return;
        }

        setAuthorized(true);
        await fetchPendingVendors();
        setLoading(false);
    };

    const fetchPendingVendors = async () => {
        try {
            const { data, error } = await supabase
                .from('vendors')
                .select('*, profiles(email: id)')
                .eq('status', 'pending');

            if (error) throw error;
            setVendors(data || []);
        } catch (error) {
            console.error('Failed to fetch pending vendors:', error);
            alert('Failed to load pending vendors.');
        }
    };

    const handleApprove = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to approve "${name}"?`)) return;

        setProcessingVendorId(id);
        try {
            const { error } = await supabase
                .from('vendors')
                .update({ status: 'approved', is_verified: true })
                .eq('id', id);

            if (error) throw error;
            await fetchPendingVendors();
        } catch (error: any) {
            console.error('Error approving vendor:', error);
            alert('Error approving vendor: ' + error.message);
        } finally {
            setProcessingVendorId(null);
        }
    };

    const handleReject = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to REJECT "${name}"? This will suspend their account.`)) return;

        setProcessingVendorId(id);
        try {
            const { error } = await supabase
                .from('vendors')
                .update({ status: 'suspended' })
                .eq('id', id);

            if (error) throw error;
            await fetchPendingVendors();
        } catch (error: any) {
            console.error('Error rejecting vendor:', error);
            alert('Error rejecting vendor: ' + error.message);
        } finally {
            setProcessingVendorId(null);
        }
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

    if (loading || !authorized) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin" /></div>;

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
                                    onClick={() => handleReject(vendor.id, vendor.business_name)}
                                    disabled={processingVendorId === vendor.id}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                                    title="Reject"
                                >
                                    {processingVendorId === vendor.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <X className="w-5 h-5" />}
                                </button>
                                <button
                                    onClick={() => handleApprove(vendor.id, vendor.business_name)}
                                    disabled={processingVendorId === vendor.id}
                                    className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                                    title="Approve"
                                >
                                    {processingVendorId === vendor.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
