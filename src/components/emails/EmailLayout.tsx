import * as React from 'react';
import { Html, Head, Body, Container, Section, Img, Text, Tailwind, Font, Preview } from '@react-email/components';

interface EmailLayoutProps {
    children: React.ReactNode;
    locale?: 'en' | 'ar';
    preview?: string;
}

export const EmailLayout = ({ children, locale = 'en', preview }: EmailLayoutProps) => {
    const isRtl = locale === 'ar';
    const dir = isRtl ? 'rtl' : 'ltr';

    // TODO: Replace with your actual production URL where the logo is hosted
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.com';
    const logoUrl = `${baseUrl}/nuqta_logo_transparent.png`;

    return (
        <Html lang={locale} dir={dir}>
            <Head>
                <Font
                    fontFamily="Cairo"
                    fallbackFontFamily="Verdana"
                    webFont={{
                        url: 'https://fonts.gstatic.com/s/cairo/v28/SLXGcQnb6wsTS5WaXyNOrts.woff2',
                        format: 'woff2',
                    }}
                    fontWeight={400}
                    fontStyle="normal"
                />
                <style>
                    {`
            .direction-rtl { direction: rtl; }
            .direction-ltr { direction: ltr; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
          `}
                </style>
            </Head>
            {preview && <Preview>{preview}</Preview>}
            <Tailwind
                config={{
                    theme: {
                        extend: {
                            colors: {
                                primary: '#2CA58D',
                                secondary: '#E0F2F1',
                                accent: '#264653',
                                background: '#ffffff',
                                foreground: '#171717',
                            },
                            fontFamily: {
                                sans: ['Cairo', 'Verdana', 'sans-serif'],
                            },
                        },
                    },
                }}
            >
                <Body className="bg-[#f8fafc] font-sans my-auto mx-auto px-2">
                    <Container className="border border-gray-200 bg-white rounded-2xl my-[40px] mx-auto p-[20px] max-w-[465px] shadow-sm">
                        <Section className="mt-[20px] mb-[32px]">
                            <Img
                                src={logoUrl}
                                width="120"
                                height="auto"
                                alt="Nuqta"
                                className="mx-auto"
                            />
                        </Section>

                        <Section className={isRtl ? "text-right direction-rtl" : "text-left direction-ltr"}>
                            {children}
                        </Section>

                        <Section className="mt-[32px] pt-[32px] border-t border-gray-100">
                            <Text className="text-gray-400 text-[12px] leading-relaxed text-center">
                                © {new Date().getFullYear()} Nuqta. {isRtl ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
                            </Text>
                            <Text className="text-gray-400 text-[12px] leading-relaxed text-center mt-2">
                                Istanbul, Turkey
                            </Text>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default EmailLayout;
