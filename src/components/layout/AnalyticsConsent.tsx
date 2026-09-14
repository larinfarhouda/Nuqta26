'use client';
import { useSyncExternalStore } from 'react';
import Script from 'next/script';
import { useLocale } from 'next-intl';
const key = 'nuqta-analytics';
const subscribe = (callback: () => void) => {
    window.addEventListener('storage', callback);
    window.addEventListener('nuqta-consent', callback);
    return () => { window.removeEventListener('storage', callback); window.removeEventListener('nuqta-consent', callback); };
};
const snapshot = () => { try { return localStorage.getItem(key); } catch { return null; } };
export default function AnalyticsConsent({ gtmId }: { gtmId: string }) {
    const choice = useSyncExternalStore(subscribe, snapshot, () => null);
    const ar = useLocale() === 'ar';
    const setChoice = (value: string | null) => {
        try { if (value) localStorage.setItem(key, value); else localStorage.removeItem(key); } catch { return; }
        // Reload when withdrawing consent to unload any previously executed tags.
        if (choice === 'allow') { location.reload(); return; }
        window.dispatchEvent(new Event('nuqta-consent'));
    };
    return <>
        {choice === 'allow' && /^GTM-[A-Z0-9]+$/.test(gtmId) && <Script id="google-tag-manager" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');` }} />}
        {!choice ? <aside aria-label={ar ? 'الخصوصية' : 'Privacy'} className="fixed bottom-20 inset-x-4 z-[80] mx-auto max-w-xl rounded-2xl border bg-white p-4 shadow-xl">
            <p className="text-sm mb-3">{ar ? 'هل تسمح بتحليلات استخدام اختيارية لتحسين نقطة؟ يمكنك استخدام الموقع دونها.' : 'Allow optional usage analytics to improve Nuqta? You can use the site without them.'}</p>
            <div className="flex gap-3"><button className="rounded-lg border px-4 py-2" onClick={() => setChoice('deny')}>{ar ? 'بدون تحليلات' : 'No analytics'}</button><button className="rounded-lg border px-4 py-2" onClick={() => setChoice('allow')}>{ar ? 'السماح بالتحليلات' : 'Allow analytics'}</button></div>
        </aside> : <button className="fixed bottom-20 end-3 z-[70] rounded-lg border bg-white px-3 py-2 text-xs text-gray-600" onClick={() => setChoice(null)}>{ar ? 'إعدادات الخصوصية' : 'Privacy settings'}</button>}
    </>;
}
