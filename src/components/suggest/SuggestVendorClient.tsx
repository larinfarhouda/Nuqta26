'use client';

import { useState } from 'react';
import { Lightbulb, Send, Check, Instagram, Globe, MessageSquare, ArrowLeft } from 'lucide-react';
import { suggestVendor } from '@/actions/public/suggest-vendor';
import Link from 'next/link';

export default function SuggestVendorClient() {
    const [form, setForm] = useState({ business_name: '', instagram: '', website: '', reason: '' });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.business_name.trim()) return;
        setLoading(true);
        setError('');

        const result = await suggestVendor(form);
        if (result.success) {
            setSubmitted(true);
        } else {
            setError(result.error || 'Something went wrong.');
        }
        setLoading(false);
    };

    if (submitted) {
        return (
            <div style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 50%, #fdf4ff 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
            }}>
                <div style={{
                    maxWidth: '440px', width: '100%', background: '#fff', borderRadius: '24px',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '48px 32px', textAlign: 'center',
                }}>
                    <div style={{
                        width: '72px', height: '72px', borderRadius: '50%', background: '#dcfce7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                    }}>
                        <Check size={36} style={{ color: '#16a34a' }} />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
                        Thank you! 🙏
                    </h1>
                    <p style={{ fontSize: '14px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                        Your suggestion has been received. We&apos;ll reach out to <strong>{form.business_name}</strong> and
                        try to bring them to Nuqta!
                    </p>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            padding: '12px 24px', borderRadius: '12px', background: '#f1f5f9',
                            color: '#475569', fontWeight: 600, fontSize: '14px', textDecoration: 'none',
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #faf5ff 0%, #f0f9ff 50%, #fdf4ff 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
        }}>
            <div style={{
                maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08)', overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                    padding: '36px 28px', textAlign: 'center', color: '#fff',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '18px',
                        background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 14px',
                    }}>
                        <Lightbulb size={30} />
                    </div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '6px' }}>
                        Suggest a Vendor
                    </h1>
                    <p style={{ fontSize: '14px', opacity: 0.9 }}>
                        Know an amazing event organizer? Let us know!
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '28px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
                                Business / Organizer Name *
                            </label>
                            <input
                                required
                                placeholder="e.g. Art Studio Cairo"
                                value={form.business_name}
                                onChange={e => setForm({ ...form, business_name: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Instagram size={12} /> Instagram Handle
                            </label>
                            <input
                                placeholder="@handle"
                                value={form.instagram}
                                onChange={e => setForm({ ...form, instagram: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Globe size={12} /> Website (optional)
                            </label>
                            <input
                                placeholder="https://..."
                                value={form.website}
                                onChange={e => setForm({ ...form, website: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <MessageSquare size={12} /> Why should we add them?
                            </label>
                            <textarea
                                placeholder="They do amazing pottery workshops every weekend..."
                                value={form.reason}
                                onChange={e => setForm({ ...form, reason: e.target.value })}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                                    border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none',
                                    minHeight: '80px', resize: 'vertical', boxSizing: 'border-box',
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: '10px', marginTop: '14px',
                            background: '#fef2f2', border: '1px solid #fecaca',
                            color: '#991b1b', fontSize: '13px',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !form.business_name.trim()}
                        style={{
                            width: '100%', marginTop: '20px', padding: '14px',
                            borderRadius: '12px', border: 'none',
                            background: loading ? '#cbd5e1' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                            color: '#fff', fontWeight: 700, fontSize: '15px',
                            cursor: loading ? 'wait' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            boxShadow: loading ? 'none' : '0 4px 14px rgba(245, 158, 11, 0.3)',
                        }}
                    >
                        <Send size={16} /> Submit Suggestion
                    </button>
                </form>
            </div>
        </div>
    );
}
