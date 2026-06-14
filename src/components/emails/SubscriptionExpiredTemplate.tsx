import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface SubscriptionExpiredTemplateProps {
    vendorName: string;
    previousPlan: string;
    renewUrl: string;
    locale?: 'en' | 'ar';
}

export const SubscriptionExpiredTemplate = ({
    vendorName,
    previousPlan,
    renewUrl,
    locale = 'en',
}: SubscriptionExpiredTemplateProps) => {
    const content = {
        en: {
            preview: `Your ${previousPlan} plan has expired`,
            heading: 'Your subscription has expired',
            greeting: `Hi ${vendorName},`,
            intro: `Your ${previousPlan} plan on Nuqta has expired. Your account has been automatically moved to the free Starter plan.`,
            lostHeading: 'What you\'ve lost:',
            lostItems: [
                'Priority event placement & visibility',
                'Advanced analytics & attendee insights',
                'Custom branding on event pages',
                'Unlimited events per month',
                'Priority support',
            ],
            keepHeading: 'What you still have (Starter plan):',
            keepItems: [
                'Up to 2 active events',
                'Basic booking management',
                'Standard event page',
                'Email notifications',
            ],
            resubscribe: 'Want your features back? Resubscribe anytime and pick up right where you left off.',
            buttonText: 'Resubscribe',
            outro: 'Your existing events and data are safe — nothing has been deleted.',
            cheers: 'The Nuqta Team',
        },
        ar: {
            preview: `انتهى اشتراكك في خطة ${previousPlan}`,
            heading: 'انتهى اشتراكك',
            greeting: `مرحباً ${vendorName}،`,
            intro: `انتهى اشتراكك في خطة ${previousPlan} على نقطة. تم نقل حسابك تلقائياً إلى خطة البداية المجانية.`,
            lostHeading: 'ما فقدته:',
            lostItems: [
                'أولوية في عرض الفعاليات وظهورها',
                'تحليلات متقدمة ورؤى عن الحضور',
                'تخصيص العلامة التجارية لصفحات الفعاليات',
                'عدد غير محدود من الفعاليات شهرياً',
                'دعم ذو أولوية',
            ],
            keepHeading: 'ما لا يزال لديك (خطة البداية):',
            keepItems: [
                'حتى فعاليتين نشطتين',
                'إدارة حجوزات أساسية',
                'صفحة فعالية قياسية',
                'إشعارات بريد إلكتروني',
            ],
            resubscribe: 'تريد استعادة مميزاتك؟ أعد الاشتراك في أي وقت واستكمل من حيث توقفت.',
            buttonText: 'أعد الاشتراك',
            outro: 'فعالياتك وبياناتك الحالية في أمان — لم يتم حذف أي شيء.',
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

            <Section className="bg-[#FFEBEE] rounded-lg p-4 my-4">
                <Text className="text-[#C62828] text-[14px] font-semibold leading-[20px] m-0 mb-2">
                    {t.lostHeading}
                </Text>
                {t.lostItems.map((item, i) => (
                    <Text key={i} className="text-[#C62828] text-[13px] leading-[18px] my-[2px] pl-2 m-0">
                        {'✕ '}{item}
                    </Text>
                ))}
            </Section>

            <Section className="bg-[#E8F5E9] rounded-lg p-4 my-4">
                <Text className="text-[#2E7D32] text-[14px] font-semibold leading-[20px] m-0 mb-2">
                    {t.keepHeading}
                </Text>
                {t.keepItems.map((item, i) => (
                    <Text key={i} className="text-[#2E7D32] text-[13px] leading-[18px] my-[2px] pl-2 m-0">
                        {'✓ '}{item}
                    </Text>
                ))}
            </Section>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.resubscribe}
            </Text>

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3 cursor-pointer select-none"
                    href={renewUrl}
                >
                    {t.buttonText}
                </Button>
            </Section>

            <Text className="text-gray-500 text-[14px] leading-[24px]">
                {t.outro}
            </Text>

            <Hr className="border-gray-200 my-[26px] mx-0 w-full" />

            <Text className="text-gray-500 text-[14px] leading-[24px]">
                {t.cheers}
            </Text>
        </EmailLayout>
    );
};

export default SubscriptionExpiredTemplate;
