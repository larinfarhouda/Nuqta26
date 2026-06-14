import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface SubscriptionWarningTemplateProps {
    vendorName: string;
    planName: string;
    daysLeft: number;
    renewUrl: string;
    locale?: 'en' | 'ar';
}

export const SubscriptionWarningTemplate = ({
    vendorName,
    planName,
    daysLeft,
    renewUrl,
    locale = 'en',
}: SubscriptionWarningTemplateProps) => {
    const content = {
        en: {
            preview: `Your ${planName} plan expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            heading: `Your plan expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
            greeting: `Hi ${vendorName},`,
            intro: `Your ${planName} plan on Nuqta will expire in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. After expiry, your account will be downgraded to the free Starter plan.`,
            loseHeading: `What you'll lose:`,
            loseItems: [
                'Priority event placement & visibility',
                'Advanced analytics & attendee insights',
                'Custom branding on event pages',
                'Unlimited events per month',
                'Priority support',
            ],
            urgency: daysLeft === 1
                ? '⚠️ This is your final reminder — your plan expires tomorrow.'
                : daysLeft === 3
                    ? 'Time is running out — renew now to keep your features.'
                    : 'Renew before your plan expires to avoid any disruption.',
            buttonText: 'Renew Now',
            outro: 'If you have any questions about your subscription, just reply to this email.',
            cheers: 'The Nuqta Team',
        },
        ar: {
            preview: `ينتهي اشتراكك في خطة ${planName} خلال ${daysLeft} ${daysLeft > 1 ? 'أيام' : 'يوم'}`,
            heading: `ينتهي اشتراكك خلال ${daysLeft} ${daysLeft > 1 ? 'أيام' : 'يوم'}`,
            greeting: `مرحباً ${vendorName}،`,
            intro: `ينتهي اشتراكك في خطة ${planName} على نقطة خلال ${daysLeft} ${daysLeft > 1 ? 'أيام' : 'يوم'}. بعد انتهاء الاشتراك، سيتم تخفيض حسابك إلى خطة البداية المجانية.`,
            loseHeading: `ما ستفقده:`,
            loseItems: [
                'أولوية في عرض الفعاليات وظهورها',
                'تحليلات متقدمة ورؤى عن الحضور',
                'تخصيص العلامة التجارية لصفحات الفعاليات',
                'عدد غير محدود من الفعاليات شهرياً',
                'دعم ذو أولوية',
            ],
            urgency: daysLeft === 1
                ? '⚠️ هذا تذكيرك الأخير — ينتهي اشتراكك غداً.'
                : daysLeft === 3
                    ? 'الوقت ينفد — جدد الآن للحفاظ على مميزاتك.'
                    : 'جدد قبل انتهاء اشتراكك لتجنب أي انقطاع.',
            buttonText: 'جدد الآن',
            outro: 'إذا كان لديك أي أسئلة حول اشتراكك، رد على هذا البريد.',
            cheers: 'فريق نقطة',
        },
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

            <Section className="bg-[#FFF8E1] rounded-lg p-4 my-4">
                <Text className="text-[#E65100] text-[15px] font-semibold leading-[22px] m-0">
                    {t.urgency}
                </Text>
            </Section>

            <Text className="text-gray-800 text-[15px] font-semibold leading-[24px] mb-1">
                {t.loseHeading}
            </Text>

            {t.loseItems.map((item, i) => (
                <Text key={i} className="text-gray-600 text-[14px] leading-[20px] my-[2px] pl-2">
                    {'• '}{item}
                </Text>
            ))}

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3 cursor-pointer select-none"
                    href={renewUrl}
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

export default SubscriptionWarningTemplate;
