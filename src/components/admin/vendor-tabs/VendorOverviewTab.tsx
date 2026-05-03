'use client';

import { Save, Loader2 } from 'lucide-react';
import {
    colors, inputStyle, font, sectionStyle, btnPrimary,
} from '../admin-tokens';

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
            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Business Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={font.label}>Business Name</label>
                        <input style={inputStyle} value={editData.business_name || ''} onChange={e => updateField('business_name', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Category</label>
                        <select style={inputStyle} value={editData.category || ''} onChange={e => updateField('category', e.target.value)}>
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={font.label}>Slug</label>
                        <input style={inputStyle} value={editData.slug || ''} onChange={e => updateField('slug', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Country</label>
                        <input style={inputStyle} value={editData.country || ''} onChange={e => updateField('country', e.target.value)} />
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Contact & Social</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={font.label}>WhatsApp</label>
                        <input style={inputStyle} value={editData.whatsapp_number || ''} onChange={e => updateField('whatsapp_number', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Website</label>
                        <input style={inputStyle} value={editData.website || ''} onChange={e => updateField('website', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Instagram</label>
                        <input style={inputStyle} value={editData.instagram || ''} onChange={e => updateField('instagram', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Email (read-only)</label>
                        <input style={{ ...inputStyle, background: colors.cardAlt }} value={vendor.email || ''} disabled />
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Location</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                        <label style={font.label}>Location Name</label>
                        <input style={inputStyle} value={editData.location_name || ''} onChange={e => updateField('location_name', e.target.value)} />
                    </div>
                    <div>
                        <label style={font.label}>Location Details</label>
                        <input style={inputStyle} value={editData.location_details || ''} onChange={e => updateField('location_details', e.target.value)} />
                    </div>
                </div>
            </div>

            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Arabic Description</h3>
                <textarea
                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                    value={editData.description_ar || ''}
                    onChange={e => updateField('description_ar', e.target.value)}
                />
            </div>

            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
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
                    style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}
                >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Changes
                </button>
            </div>
        </div>
    );
}
