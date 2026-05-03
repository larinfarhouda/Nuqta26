'use client';

import { Save, Loader2 } from 'lucide-react';
import { inputStyle, font, sectionStyle, btnPrimary } from '../admin-tokens';

interface Props {
    editData: Record<string, any>;
    updateField: (field: string, value: any) => void;
    onSave: (updates: Record<string, any>) => void;
    saving: boolean;
}

export default function VendorPoliciesTab({ editData, updateField, onSave, saving }: Props) {
    return (
        <div>
            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Cancellation Policy</h3>
                <textarea
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    value={editData.cancellation_policy || ''}
                    onChange={e => updateField('cancellation_policy', e.target.value)}
                />
            </div>
            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Return Policy</h3>
                <textarea
                    style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                    value={editData.return_policy || ''}
                    onChange={e => updateField('return_policy', e.target.value)}
                />
            </div>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={() => onSave({
                        cancellation_policy: editData.cancellation_policy,
                        return_policy: editData.return_policy,
                    })}
                    disabled={saving}
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Policies
                </button>
            </div>
        </div>
    );
}
