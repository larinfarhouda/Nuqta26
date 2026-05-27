'use client';

import { Save } from 'lucide-react';
import { AdminButton } from '../ui/AdminButton';

interface Props {
    editData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    onSave: (updates: Record<string, any>) => void;
    saving: boolean;
}

export default function VendorPoliciesTab({ editData, updateField, onSave, saving }: Props) {
    return (
        <div>
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Cancellation Policy</h3>
                <textarea
                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 transition-all duration-200 outline-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 min-h-[100px] resize-vertical"
                    value={editData.cancellation_policy || ''}
                    onChange={e => updateField('cancellation_policy', e.target.value)}
                />
            </div>
            <div className="space-y-4 mt-6">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Return Policy</h3>
                <textarea
                    className="w-full px-4 py-3 text-sm rounded-2xl border-2 transition-all duration-200 outline-none bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#2CA58D] focus:ring-4 focus:ring-[#2CA58D]/10 min-h-[100px] resize-vertical"
                    value={editData.return_policy || ''}
                    onChange={e => updateField('return_policy', e.target.value)}
                />
            </div>
            <div className="px-6 py-4 flex justify-end">
                <AdminButton
                    onClick={() => onSave({
                        cancellation_policy: editData.cancellation_policy,
                        return_policy: editData.return_policy,
                    })}
                    disabled={saving}
                    isLoading={saving}
                >
                    <Save size={14} className="mr-1" />
                    Save Policies
                </AdminButton>
            </div>
        </div>
    );
}
