import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

import Script from 'next/script';
import { generateSiteGraphSchema } from '@/lib/seo';
import "../globals.css";


const cairo = Cairo({
    subsets: ["arabic", "latin"],
    variable: "--font-cairo",
    display: 'swap',
    preload: true,
    weight: ['400', '700', '900'], // Reduced font weights
    fallback: ['system-ui', 'arial'],
    adjustFontFallback: true,
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
    display: 'swap',
    preload: true,
    weight: ['400', '700'], // Reduced font weights
    fallback: ['system-ui', 'sans-serif'],
    adjustFontFallback: true,
});

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#2CA58D' },
        { media: '(prefers-color-scheme: dark)', color: '#264653' }
    ],
};

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
    const { locale } = await params;
    const isArabic = locale === 'ar';

    return {
        metadataBase: new URL('https://nuqta.ist'),
        title: {
            default: isArabic
                ? 'نقطة | دليل الفعاليات والأنشطة العربية في إسطنبول'
                : "Nuqta | Istanbul's Arabic Event Hub",
            template: "%s | Nuqta"
        },
        description: isArabic
            ? 'اكتشف أفضل الفعاليات والأنشطة العربية في إسطنبول. ورش عمل، معارض فنية، بازارات وأكثر - كل شيء في مكان واحد.'
            : 'Discover and join vibrant community events in Istanbul. Workshops, bazaars, concerts, and more - all in one place.',
        keywords: isArabic
            ? ['فعاليات إسطنبول', 'المجتمع العربي إسطنبول', 'ورش عمل إسطنبول', 'تذاكر إسطنبول', 'نقطة', 'فعاليات عربية']
            : ['Istanbul events', 'Arabic community Istanbul', 'workshops Istanbul', 'tickets Istanbul', 'Nuqta', 'event marketplace', 'event ticketing', 'Istanbul Arabic events'],
        applicationName: 'Nuqta',
        authors: [{ name: 'Nuqta' }],
        creator: 'Nuqta',
        publisher: 'Nuqta',
        openGraph: {
            type: 'website',
            locale: isArabic ? 'ar_TR' : 'en_US',
            alternateLocale: isArabic ? ['en_US'] : ['ar_TR'],
            url: 'https://nuqta.ist',
            siteName: 'Nuqta',
            title: isArabic
                ? 'نقطة | دليل الفعاليات والأنشطة العربية في إسطنبول'
                : "Nuqta | Istanbul's Arabic Event Hub",
            description: isArabic
                ? 'اكتشف أفضل الفعاليات والأنشطة العربية في إسطنبول.'
                : 'Discover and join vibrant community events in Istanbul.',
            images: [{
                url: '/images/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Nuqta - Istanbul Event Marketplace'
            }],
        },
        twitter: {
            card: 'summary_large_image',
            site: '@nuqta_ist',
            title: isArabic
                ? 'نقطة | دليل الفعاليات العربية في إسطنبول'
                : "Nuqta | Istanbul's Arabic Event Hub",
            description: isArabic
                ? 'اكتشف أفضل الفعاليات العربية في إسطنبول.'
                : 'Discover and join vibrant community events in Istanbul.',
        },
        appleWebApp: {
            title: 'Nuqta',
            statusBarStyle: 'black-translucent',
            capable: true,
        },
        manifest: '/manifest.json',
        icons: {
            icon: [
                { url: '/icon0.svg', type: 'image/svg+xml' },
                { url: '/icon1.png', sizes: '192x192', type: 'image/png' }
            ],
            apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
        },
        // Uncomment and add your Google verification code when available
        // verification: {
        //     google: 'your-google-verification-code',
        // },
    };
}

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    const messages = await getMessages();
    const dir = locale === 'ar' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir}>
            <head>
                {/* Critical Resource Hints for faster font loading */}
                <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

                {/* PWA Manifest handled by metadata export */}

                {/* iOS Meta Tags handled by metadata/viewport exports */}

                {/* Theme Color handled by viewport export */}

                {/* Mobile Optimizations handled by viewport export */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="format-detection" content="telephone=no" />

                {/* Site-wide Organization + WebSite schema graph for AEO */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(generateSiteGraphSchema(locale)) }}
                />
            </head>
            <body
                className={`${cairo.className} ${geistSans.variable} antialiased`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>

                {process.env.NEXT_PUBLIC_GTM_ID && (
                    <>
                        <Script
                            id="google-tag-manager"
                            strategy="afterInteractive"
                            dangerouslySetInnerHTML={{
                                __html: `
                                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                                    })(window,document,'script','dataLayer','${process.env.NEXT_PUBLIC_GTM_ID}');
                                `,
                            }}
                        />
                        <noscript>
                            <iframe
                                src={`https://www.googletagmanager.com/ns.html?id=${process.env.NEXT_PUBLIC_GTM_ID}`}
                                height="0"
                                width="0"
                                style={{ display: 'none', visibility: 'hidden' }}
                            />
                        </noscript>
                    </>
                )}
            </body>
        </html>
    );
}
