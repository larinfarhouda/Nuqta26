import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface WelcomeTemplateProps {
    name: string;
    actionUrl: string;
    locale?: 'en' | 'ar';
}

export const WelcomeTemplate = ({
    name,
    actionUrl,
    locale = 'en',
}: WelcomeTemplateProps) => {
    const isRtl = locale === 'ar';

    const content = {
        en: {
            preview: 'Welcome to Nuqta!',
            heading: 'Welcome to Nuqta',
            greeting: `Hi ${name},`,
            intro: 'Thanks for joining Nuqta! We’re thrilled to have you on board. Explore the best events and vendors in Istanbul.',
            buttonText: 'Get Started',
            outro: 'If you have any questions, feel free to reply to this email.',
            cheers: 'The Nuqta Team',
        },
        ar: {
            preview: 'مرفباً بك في نقطة!',
            heading: 'مرحباً بك في نقطة',
            greeting: `مرحباً ${name}،`,
            intro: 'شكراً لانضمامك إلى نقطة! نحن سعداء بوجودك معنا. استكشف أفضل الفعاليات والموردين في إسطنبول.',
            buttonText: 'ابدأ الآن',
            outro: 'إذا كان لديك أي أسئلة، لا تتردد في الرد على هذا البريد الإلكتروني.',
            cheers: 'فريق نقطة',
        }
    };

    const t = content[locale];

    return (
        <EmailLayout locale={locale} preview={t.preview}>
            <Heading className="text-2xl font-bold text-gray-900 mx-0 my-[30px] p-0">
                {t.heading}
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.greeting}
            </Text>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.intro}
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3 cursor-pointer select-none"
                    href={actionUrl}
                >
                    {t.buttonText}
                </Button>
            </Section>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.outro}
            </Text>

            <Hr className="border-gray-200 my-[26px] mx-0 w-full" />

            <Text className="text-gray-500 text-[14px] leading-[24px]">
                {t.cheers}
            </Text>
        </EmailLayout>
    );
};

export default WelcomeTemplate;
