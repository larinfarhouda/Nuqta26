import type { Metadata } from "next";
import { Cairo, Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import "../globals.css";

const cairo = Cairo({
    subsets: ["arabic", "latin"],
    variable: "--font-cairo"
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: {
        default: "Nuqta | Istanbul's Arabic Event Hub",
        template: "%s | Nuqta"
    },
    description: "Discover and join vibrant community events in Istanbul. Workshops, bazaars, concerts, and more - all in one place.",
    keywords: ["Istanbul events", "Arabic community Istanbul", "workshops Istanbul", "tickets Istanbul", "Nuqta"],
    openGraph: {
        type: 'website',
        locale: 'en_US',
        url: 'https://nuqta.ist',
        siteName: 'Nuqta',
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
    },
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
            <body
                className={`${cairo.className} ${geistSans.variable} ${geistMono.variable} antialiased`}
                suppressHydrationWarning
            >
                <NextIntlClientProvider messages={messages}>
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
