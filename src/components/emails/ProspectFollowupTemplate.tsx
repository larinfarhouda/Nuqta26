import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface ProspectFollowupTemplateProps {
    businessName: string;
    claimUrl: string;
    interestCount: number;
    daysSincePitch: number;
    locale?: 'en' | 'ar';
}

type Tier = 'friendly' | 'urgent' | 'final';

function getTier(days: number): Tier {
    if (days >= 14) return 'final';
    if (days >= 7) return 'urgent';
    return 'friendly';
}

const tierContent = {
    en: {
        friendly: {
            preview: (name: string) => `${name} — people are interested in your events!`,
            heading: 'People are interested! 📬',
            greeting: (name: string) => `Hi ${name},`,
            body: (count: number) => `Just a friendly reminder — we set up your Nuqta page and ${count} ${count === 1 ? 'person has' : 'people have'} already shown interest! Claim your page to start managing your events and bookings.`,
            highlight: (count: number) => `📊 ${count} ${count === 1 ? 'person is' : 'people are'} waiting to book from you`,
            buttonText: 'Claim Your Page',
            outro: 'If you have any questions, just reply to this email.',
            cheers: 'The Nuqta Team',
        },
        urgent: {
            preview: (name: string) => `${name} — last automated reminder about your Nuqta page`,
            heading: 'Don\'t miss out ⏰',
            greeting: (name: string) => `Hi ${name},`,
            body: (count: number) => `This is our last automated reminder. Your Nuqta page has attracted ${count} interested ${count === 1 ? 'person' : 'people'}. Claim it now to convert that interest into actual bookings.`,
            highlight: (count: number) => `🔥 ${count} interested ${count === 1 ? 'person' : 'people'} — don't let them slip away`,
            buttonText: 'Claim Your Page Now',
            outro: 'After this, we won\'t send automated follow-ups. Reply anytime if you need help.',
            cheers: 'The Nuqta Team',
        },
        final: {
            preview: (name: string) => `${name} — your Nuqta page will be archived soon`,
            heading: 'Final notice 📋',
            greeting: (name: string) => `Hi ${name},`,
            body: (count: number) => `We haven't heard back from you, so your Nuqta page with ${count} interested ${count === 1 ? 'person' : 'people'} will be archived soon. If you'd like to keep it active, claim it now.`,
            highlight: () => '📁 Your page will be archived if unclaimed — but you can always reactivate later',
            buttonText: 'Keep My Page Active',
            outro: 'This is our final email. We\'re here if you ever want to come back — just reach out.',
            cheers: 'The Nuqta Team',
        },
    },
    ar: {
        friendly: {
            preview: (name: string) => `${name} — الناس مهتمون بفعالياتك!`,
            heading: 'الناس مهتمون! 📬',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: (count: number) => `تذكير ودّي — أنشأنا صفحتك على نقطة و${count} ${count === 1 ? 'شخص أبدى' : 'أشخاص أبدوا'} اهتمامهم! طالب بصفحتك لتبدأ إدارة فعالياتك وحجوزاتك.`,
            highlight: (count: number) => `📊 ${count} ${count === 1 ? 'شخص ينتظر' : 'أشخاص ينتظرون'} الحجز منك`,
            buttonText: 'طالب بصفحتك',
            outro: 'إذا عندك أي أسئلة، رد على هذا البريد.',
            cheers: 'فريق نقطة',
        },
        urgent: {
            preview: (name: string) => `${name} — آخر تذكير آلي عن صفحتك على نقطة`,
            heading: 'لا تفوّت الفرصة ⏰',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: (count: number) => `هذا آخر تذكير آلي. صفحتك على نقطة جذبت ${count} ${count === 1 ? 'شخص مهتم' : 'أشخاص مهتمين'}. طالب بها الآن لتحويل هذا الاهتمام لحجوزات فعلية.`,
            highlight: (count: number) => `🔥 ${count} ${count === 1 ? 'شخص مهتم' : 'أشخاص مهتمين'} — لا تدعهم يفلتون`,
            buttonText: 'طالب بصفحتك الآن',
            outro: 'بعد هذا، لن نرسل متابعات آلية. رد في أي وقت إذا احتجت مساعدة.',
            cheers: 'فريق نقطة',
        },
        final: {
            preview: (name: string) => `${name} — صفحتك على نقطة ستُؤرشف قريباً`,
            heading: 'إشعار أخير 📋',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: (count: number) => `لم نسمع منك، لذا صفحتك على نقطة مع ${count} ${count === 1 ? 'شخص مهتم' : 'أشخاص مهتمين'} ستُؤرشف قريباً. إذا تريد الحفاظ عليها نشطة، طالب بها الآن.`,
            highlight: () => '📁 ستُؤرشف صفحتك إذا لم تُطالب بها — لكن يمكنك إعادة تفعيلها لاحقاً',
            buttonText: 'أبقِ صفحتي نشطة',
            outro: 'هذا آخر بريد منا. نحن هنا إذا أردت العودة — تواصل معنا.',
            cheers: 'فريق نقطة',
        },
    },
};

export const ProspectFollowupTemplate = ({
    businessName,
    claimUrl,
    interestCount,
    daysSincePitch,
    locale = 'en',
}: ProspectFollowupTemplateProps) => {
    const tier = getTier(daysSincePitch);
    const t = tierContent[locale][tier];

    return (
        <EmailLayout locale={locale} preview={t.preview(businessName)}>
            <Heading className="text-2xl font-bold text-gray-900 mx-0 my-[30px] p-0">
                {t.heading}
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.greeting(businessName)}
            </Text>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.body(interestCount)}
            </Text>

            <Section className="bg-[#E0F2F1] rounded-lg p-4 my-4">
                <Text className="text-[#264653] text-[15px] font-semibold leading-[22px] m-0">
                    {t.highlight(interestCount)}
                </Text>
            </Section>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3 cursor-pointer select-none"
                    href={claimUrl}
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

export default ProspectFollowupTemplate;
