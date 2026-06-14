import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface ReEngagementTemplateProps {
    vendorName: string;
    daysSinceActive: number;
    dashboardUrl: string;
    locale?: 'en' | 'ar';
}

type Tier = 'soft' | 'urgent' | 'empathetic';

function getTier(days: number): Tier {
    if (days >= 60) return 'empathetic';
    if (days >= 30) return 'urgent';
    return 'soft';
}

const tierContent = {
    en: {
        soft: {
            preview: 'We miss you! Your attendees are looking for events',
            heading: 'We miss you! 👋',
            greeting: (name: string) => `Hi ${name},`,
            body: 'It\'s been a couple of weeks since your last visit. Your attendees are out there looking for great events — and your Nuqta page is ready to go!',
            highlight: '🎯 Did you know? Vendors who post events regularly get 60% more bookings.',
            buttonText: 'Create an Event',
            outro: 'We\'re here if you need anything — just reply to this email.',
            cheers: 'The Nuqta Team',
        },
        urgent: {
            preview: 'Your Nuqta page is still live — time to add an event?',
            heading: 'Your page is still live 📍',
            greeting: (name: string) => `Hi ${name},`,
            body: 'It\'s been a month since you last used Nuqta. Your page is still active and people are finding it — but there are no upcoming events to book.',
            highlight: '⏰ Now is a great time to plan your next event. The platform is set up, your audience is waiting!',
            buttonText: 'Add an Event',
            outro: 'Need help getting back on track? Reply to this email and we\'ll assist you.',
            cheers: 'The Nuqta Team',
        },
        empathetic: {
            preview: 'Is everything OK? We\'d love your feedback',
            heading: 'Is everything OK? 💙',
            greeting: (name: string) => `Hi ${name},`,
            body: 'It\'s been a while since we\'ve seen you on Nuqta, and we wanted to check in. Whether you\'ve been busy, found another solution, or something didn\'t work right — we\'d genuinely love to hear from you.',
            highlight: '💬 Your feedback helps us build a better platform for everyone. What could we do better?',
            buttonText: 'Visit Your Dashboard',
            outro: 'Simply reply to this email with your thoughts — a real person reads every response.',
            cheers: 'The Nuqta Team',
        },
    },
    ar: {
        soft: {
            preview: 'اشتقنا لك! جمهورك يبحث عن فعاليات',
            heading: 'اشتقنا لك! 👋',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'مرّ أسبوعان منذ زيارتك الأخيرة. جمهورك يبحث عن فعاليات رائعة — وصفحتك على نقطة جاهزة!',
            highlight: '🎯 هل تعلم؟ المنظمون الذين ينشرون فعاليات بانتظام يحصلون على 60% حجوزات أكثر.',
            buttonText: 'أنشئ فعالية',
            outro: 'نحن هنا إذا احتجت أي شيء — رد على هذا البريد.',
            cheers: 'فريق نقطة',
        },
        urgent: {
            preview: 'صفحتك على نقطة لا تزال نشطة — حان وقت إضافة فعالية؟',
            heading: 'صفحتك لا تزال نشطة 📍',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'مرّ شهر منذ آخر استخدام لنقطة. صفحتك لا تزال نشطة والناس يجدونها — لكن لا توجد فعاليات قادمة للحجز.',
            highlight: '⏰ الآن وقت رائع لتخطيط فعاليتك القادمة. المنصة جاهزة، وجمهورك ينتظر!',
            buttonText: 'أضف فعالية',
            outro: 'تحتاج مساعدة للعودة؟ رد على هذا البريد وسنساعدك.',
            cheers: 'فريق نقطة',
        },
        empathetic: {
            preview: 'هل كل شيء بخير؟ نحب نسمع رأيك',
            heading: 'هل كل شيء بخير؟ 💙',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'مرّ وقت منذ آخر زيارة لك على نقطة، وأردنا أن نطمئن عليك. سواء كنت مشغولاً، أو وجدت حلاً آخر، أو واجهت مشكلة — نحب نسمع منك بصدق.',
            highlight: '💬 ملاحظاتك تساعدنا نبني منصة أفضل للجميع. ما الذي يمكننا تحسينه؟',
            buttonText: 'زيارة لوحة التحكم',
            outro: 'رد على هذا البريد مباشرة — شخص حقيقي يقرأ كل رد.',
            cheers: 'فريق نقطة',
        },
    },
};

export const ReEngagementTemplate = ({
    vendorName,
    daysSinceActive,
    dashboardUrl,
    locale = 'en',
}: ReEngagementTemplateProps) => {
    const tier = getTier(daysSinceActive);
    const t = tierContent[locale][tier];

    return (
        <EmailLayout locale={locale} preview={t.preview}>
            <Heading className="text-2xl font-bold text-gray-900 mx-0 my-[30px] p-0">
                {t.heading}
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.greeting(vendorName)}
            </Text>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.body}
            </Text>

            <Section className="bg-[#E0F2F1] rounded-lg p-4 my-4">
                <Text className="text-[#264653] text-[14px] leading-[20px] m-0">
                    {t.highlight}
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3 cursor-pointer select-none"
                    href={dashboardUrl}
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

export default ReEngagementTemplate;
