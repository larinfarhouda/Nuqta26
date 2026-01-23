'use client';

import { useState } from 'react';

const templates = [
    { id: 'welcome-en', name: 'Welcome (English)' },
    { id: 'welcome-ar', name: 'Welcome (Arabic)' },
    { id: 'notification', name: 'Notification (Generic)' },
    { id: 'booking-user-confirmed', name: 'Booking: User (Confirmed)' },
    { id: 'booking-user-requested', name: 'Booking: User (Requested)' },
    { id: 'booking-user-cancelled', name: 'Booking: User (Cancelled)' },
    { id: 'booking-vendor', name: 'Booking: Vendor Notification' },
    { id: 'sold-out', name: 'Vendor: Event Sold Out' },
    { id: 'reminder-en', name: 'Reminder: 24hrs (English)' },
    { id: 'reminder-ar', name: 'Reminder: 24hrs (Arabic)' },
    { id: 'auth-confirm', name: 'Auth: Confirm Signup' },
    { id: 'auth-reset', name: 'Auth: Reset Password' },
    { id: 'auth-magic', name: 'Auth: Magic Link' },
    { id: 'auth-invite', name: 'Auth: Invite User' },
    { id: 'auth-change-email', name: 'Auth: Change Email' },
];

export default function EmailPreviewPage() {
    const [selected, setSelected] = useState(templates[0].id);

    return (
        <div className="flex h-screen w-full font-sans bg-gray-100 text-gray-900">
            <div className="w-80 border-r border-gray-200 bg-white flex flex-col shadow-lg z-10">
                <div className="p-6 border-b border-gray-100 bg-white">
                    <h1 className="font-bold text-xl text-gray-800 tracking-tight">Email Templates</h1>
                    <p className="text-xs text-gray-500 mt-1">Select a template to preview</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelected(t.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                 ${selected === t.id
                                    ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200 shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {t.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm z-10">
                    <span className="font-medium text-gray-700">Preview</span>
                    <div className="text-xs text-gray-400">
                        {selected}
                    </div>
                </div>

                <div className="flex-1 p-8 overflow-hidden bg-gray-100 flex justify-center items-center">
                    <div className="mockup-window border border-gray-200 bg-white shadow-2xl rounded-xl overflow-hidden w-full max-w-[800px] h-[calc(100vh-10rem)]">
                        <iframe
                            key={selected}
                            src={`/api/email-preview?template=${selected}`}
                            className="w-full h-full border-0"
                            title="Email Preview"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
