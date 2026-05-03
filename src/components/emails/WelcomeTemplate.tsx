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
            preview: 'Welcome to Nuqta — Your Events, Automated',
            heading: 'Welcome to Nuqta',
            greeting: `Hi ${name},`,
            intro: 'Your account is ready. Nuqta automates your event management — bookings, confirmations, reminders, and attendee tracking — so you can focus on creating unforgettable experiences.',
            buttonText: 'Go to Dashboard',
            outro: 'Need help getting started? Reply to this email and a real person will respond.',
            cheers: 'The Nuqta Team',
        },
        ar: {
            preview: 'مرحباً بك في نقطة — فعالياتك، بأتمتة كاملة',
            heading: 'مرحباً بك في نقطة',
            greeting: `مرحباً ${name}،`,
            intro: 'حسابك جاهز. نقطة تؤتمت إدارة فعالياتك — الحجوزات، التأكيدات، التذكيرات، ومتابعة الحضور — حتى تركز أنت على صناعة تجارب لا تُنسى.',
            buttonText: 'افتح لوحة التحكم',
            outro: 'تحتاج مساعدة؟ رد على هذا البريد وسنرد عليك شخصياً.',
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
