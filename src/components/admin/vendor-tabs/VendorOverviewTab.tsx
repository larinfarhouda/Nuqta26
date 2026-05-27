'use client';

import { Save } from 'lucide-react';
import { AdminButton } from '../ui/AdminButton';
import { AdminInput } from '../ui/AdminInput';

const CATEGORIES = [
    'workshops', 'concerts', 'conferences', 'exhibitions', 'festivals',
    'sports', 'theater', 'comedy', 'food', 'networking', 'education', 'other',
];

interface Props {
    editData: Record<string, any>;
    vendor: { email: string | null };
    updateField: (field: string, value: any) => void;
    onSave: (updates: Record<string, any>) => void;
    saving: boolean;
}

export default function VendorOverviewTab({ editData, vendor, updateField, onSave, saving }: Props) {
    return (
        <div>
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Business Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Business Name</label>
                        <AdminInput value={editData.business_name || ''} onChange={e => updateField('business_name', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Category</label>
                        <select
                            className="w-full h-11 px-4 text-sm rounded-2xl border-2 transition-all duration-200 outline-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10"
                            value={editData.category || ''}
                            onChange={e => updateField('category', e.target.value)}
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Slug</label>
                        <AdminInput value={editData.slug || ''} onChange={e => updateField('slug', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Country</label>
                        <AdminInput value={editData.country || ''} onChange={e => updateField('country', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Contact & Social</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">WhatsApp</label>
                        <AdminInput value={editData.whatsapp_number || ''} onChange={e => updateField('whatsapp_number', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Website</label>
                        <AdminInput value={editData.website || ''} onChange={e => updateField('website', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Instagram</label>
                        <AdminInput value={editData.instagram || ''} onChange={e => updateField('instagram', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Email (read-only)</label>
                        <AdminInput className="bg-zinc-50 dark:bg-zinc-800/50" value={vendor.email || ''} disabled />
                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Location Name</label>
                        <AdminInput value={editData.location_name || ''} onChange={e => updateField('location_name', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Location Details</label>
                        <AdminInput value={editData.location_details || ''} onChange={e => updateField('location_details', e.target.value)} />
                    </div>
                </div>
            </div>

            <div className="space-y-4 mt-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Arabic Description</h3>
                <textarea
                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 transition-all duration-200 outline-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 min-h-[80px] resize-vertical"
                    value={editData.description_ar || ''}
                    onChange={e => updateField('description_ar', e.target.value)}
                />
            </div>

            <div className="px-6 py-4 flex justify-end">
                <AdminButton
                    onClick={() => onSave({
                        business_name: editData.business_name,
                        category: editData.category,
                        slug: editData.slug,
                        country: editData.country,
                        whatsapp_number: editData.whatsapp_number,
                        website: editData.website,
                        instagram: editData.instagram,
                        location_name: editData.location_name,
                        location_details: editData.location_details,
                        description_ar: editData.description_ar,
                    })}
                    disabled={saving}
                    isLoading={saving}
                >
                    <Save size={14} className="mr-1" />
                    Save Changes
                </AdminButton>
            </div>
        </div>
    );
}
