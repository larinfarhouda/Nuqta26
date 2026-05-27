'use client';

import { Save, Building, ExternalLink } from 'lucide-react';
import { AdminButton } from '../ui/AdminButton';
import { AdminInput } from '../ui/AdminInput';

interface Props {
    editData: Record<string, any>;
    vendor: { tax_id_document?: string | null };
    updateField: (field: string, value: any) => void;
    onSave: (updates: Record<string, any>) => void;
    saving: boolean;
}

export default function VendorBankingTab({ editData, vendor, updateField, onSave, saving }: Props) {
    return (
        <div>
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-1.5">
                    <Building size={16} /> Bank Details
                </h3>
                <div className="grid gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Bank Name</label>
                        <AdminInput value={editData.bank_name || ''} onChange={e => updateField('bank_name', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">Account Holder Name</label>
                        <AdminInput value={editData.bank_account_name || ''} onChange={e => updateField('bank_account_name', e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">IBAN</label>
                        <AdminInput value={editData.bank_iban || ''} onChange={e => updateField('bank_iban', e.target.value)} />
                    </div>
                </div>
            </div>

            {vendor.tax_id_document && (
                <div className="space-y-4 mt-6">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">Tax ID Document</h3>
                    <a
                        href={vendor.tax_id_document}
                        target="_blank"
                        className="inline-flex items-center gap-2 text-[#2CA58D] hover:text-[#1e7866] text-sm font-medium transition-colors"
                    >
                        <ExternalLink size={14} /> View Document
                    </a>
                </div>
            )}

            <div className="px-6 py-4 flex justify-end">
                <AdminButton
                    onClick={() => onSave({
                        bank_name: editData.bank_name,
                        bank_account_name: editData.bank_account_name,
                        bank_iban: editData.bank_iban,
                    })}
                    disabled={saving}
                    isLoading={saving}
                >
                    <Save size={14} className="mr-1" />
                    Save Banking
                </AdminButton>
            </div>
        </div>
    );
}
