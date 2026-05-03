'use client';

import { Save, Loader2, Building, ExternalLink } from 'lucide-react';
import { inputStyle, font, sectionStyle, btnPrimary } from '../admin-tokens';

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
            <div style={sectionStyle}>
                <h3 style={{ ...font.sectionSubtitle, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Building size={16} /> Bank Details
                </h3>
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                        <label style={font.label}>Bank Name</label>
                        <input style={inputStyle} value={editData.bank_name || ''} onChange={e => updateField('bank_name', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Account Holder Name</label>
                        <input style={inputStyle} value={editData.bank_account_name || ''} onChange={e => updateField('bank_account_name', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>IBAN</label>
                        <input style={inputStyle} value={editData.bank_iban || ''} onChange={e => updateField('bank_iban', e.target.value)} />
                    </div>
                </div>
            </div>

            {vendor.tax_id_document && (
                <div style={sectionStyle}>
                    <h3 style={font.sectionSubtitle}>Tax ID Document</h3>
                    <a href={vendor.tax_id_document} target="_blank" style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        color: '#8b5cf6', fontSize: '13px', fontWeight: 500,
                    }}>
                        <ExternalLink size={14} /> View Document
                    </a>
                </div>
            )}

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => onSave({
                        bank_name: editData.bank_name,
                        bank_account_name: editData.bank_account_name,
                        bank_iban: editData.bank_iban,
                    })}
                    disabled={saving}
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Banking
                </button>
            </div>
        </div>
    );
}
