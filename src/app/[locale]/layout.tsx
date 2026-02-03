import type { Metadata, Viewport } from "next";
import { Cairo, Geist } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { GoogleAnalytics } from '@next/third-parties/google';
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

export const metadata: Metadata = {
    metadataBase: new URL('https://nuqta.ist'),
    title: {
        default: "Nuqta | Istanbul's Arabic Event Hub",
        template: "%s | Nuqta"
    },
    description: "Discover and join vibrant community events in Istanbul. Workshops, bazaars, concerts, and more - all in one place.",
    keywords: ["Istanbul events", "Arabic community Istanbul", "workshops Istanbul", "tickets Istanbul", "Nuqta", "event marketplace", "event ticketing", "Istanbul Arabic events"],
    applicationName: "Nuqta",
    authors: [{ name: "Nuqta" }],
    creator: "Nuqta",
    publisher: "Nuqta",
    openGraph: {
        type: 'website',
        locale: 'en_US',
        alternateLocale: ['ar_AR'],
        url: 'https://nuqta.ist',
        siteName: 'Nuqta',
        title: "Nuqta | Istanbul's Arabic Event Hub",
        description: "Discover and join vibrant community events in Istanbul. Workshops, bazaars, concerts, and more - all in one place.",
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
        title: "Nuqta | Istanbul's Arabic Event Hub",
        description: "Discover and join vibrant community events in Istanbul.",
    },
    appleWebApp: {
        title: "Nuqta",
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
    // Add verification meta tags here once you have them:
    // verification: {
    //     google: 'your-google-verification-code',
    //     yandex: 'your-yandex-verification-code',
    // },
};

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
            </head>
            <body
                className={`${cairo.className} ${geistSans.variable} antialiased`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
                {process.env.NEXT_PUBLIC_GA_ID && (
                    <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
                )}
            </body>
        </html>
    );
}
