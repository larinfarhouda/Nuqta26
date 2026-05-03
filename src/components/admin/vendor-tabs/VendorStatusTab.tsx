'use client';

import { Calendar } from 'lucide-react';
import { colors, sectionStyle, font, badgeStyle } from '../admin-tokens';
import type { AdminVendorDetail } from '@/types/admin.types';

interface Props {
    vendor: AdminVendorDetail;
}

export default function VendorStatusTab({ vendor }: Props) {
    const statusVariant = vendor.status === 'approved' ? 'success' : vendor.status === 'suspended' ? 'danger' : 'warning';
    const verifiedVariant = vendor.is_verified ? 'success' : 'danger';

    return (
        <div>
            <div style={sectionStyle}>
                <h3 style={font.sectionSubtitle}>Account Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                        padding: '20px', borderRadius: '14px',
                        border: `1px solid ${colors.border}`, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '8px' }}>STATUS</div>
                        <span style={badgeStyle(statusVariant)}>
                            {vendor.status || 'pending'}
                        </span>
                    </div>
                    <div style={{
                        padding: '20px', borderRadius: '14px',
                        border: `1px solid ${colors.border}`, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '8px' }}>VERIFIED</div>
                        <span style={badgeStyle(verifiedVariant)}>
                            {vendor.is_verified ? 'Yes' : 'No'}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                    <div style={{
                        padding: '20px', borderRadius: '14px',
                        border: `1px solid ${colors.border}`, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '8px' }}>EVENTS</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: colors.text.primary }}>{vendor.eventCount}</div>
                    </div>
                    <div style={{
                        padding: '20px', borderRadius: '14px',
                        border: `1px solid ${colors.border}`, textAlign: 'center',
                    }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: colors.text.muted, marginBottom: '8px' }}>BOOKINGS</div>
                        <div style={{ fontSize: '24px', fontWeight: 800, color: colors.text.primary }}>{vendor.bookingCount}</div>
                    </div>
                </div>

                <div style={font.caption}>
                    <Calendar size={12} style={{ display: 'inline', marginRight: '4px' }} />
                    Joined: {vendor.created_at ? new Date(vendor.created_at).toLocaleDateString() : 'Unknown'}
                </div>
            </div>
        </div>
    );
}
