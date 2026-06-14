import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface LeadNurtureTemplateProps {
    businessName: string;
    step: 1 | 2 | 3;
    registerUrl: string;
    locale?: 'en' | 'ar';
}

const stepContent = {
    en: {
        1: {
            preview: 'Thanks for your interest! Here\'s what Nuqta can do',
            heading: 'Welcome to Nuqta! 🎉',
            greeting: (name: string) => `Hi ${name},`,
            body: 'Thanks for your interest in Nuqta! We\'re an event management platform built for organizers like you. Here\'s what you can do:',
            features: [
                '📅 Create and manage events in minutes',
                '🎟️ Automated bookings, confirmations & reminders',
                '📊 Real-time analytics and attendee tracking',
                '🌐 Bilingual event pages (Arabic & English)',
                '📱 Mobile-friendly attendee experience',
                '💰 It\'s free to get started!',
            ],
            buttonText: 'Create Your Free Account',
            outro: 'Have questions? Reply to this email — we\'re happy to help.',
            cheers: 'The Nuqta Team',
        },
        2: {
            preview: 'See how organizers manage events on Nuqta',
            heading: 'Organizers love Nuqta 🏆',
            greeting: (name: string) => `Hi ${name},`,
            body: 'Curious about how other organizers use Nuqta? Here\'s what makes our platform special:',
            features: [
                '⭐ "Nuqta saved me hours of manual work" — Event organizer in Istanbul',
                '⭐ "Bookings went up 40% after switching to Nuqta" — Workshop host',
                '⭐ "The bilingual support is a game-changer" — Community event planner',
                '🔄 Automated reminders reduce no-shows by 35%',
                '📈 Average organizer creates their first event in under 10 minutes',
            ],
            buttonText: 'Start Your Journey',
            outro: 'Join organizers who are already saving time and growing their audience.',
            cheers: 'The Nuqta Team',
        },
        3: {
            preview: 'Ready to get started? It\'s completely free',
            heading: 'Ready to get started? 🚀',
            greeting: (name: string) => `Hi ${name},`,
            body: 'We noticed you haven\'t created your account yet. Here\'s a reminder of what you\'re missing:',
            features: [
                '✅ Free Starter plan — no credit card required',
                '✅ Create up to 2 events immediately',
                '✅ Full booking management included',
                '✅ Setup takes less than 2 minutes',
            ],
            buttonText: 'Create Free Account Now',
            outro: 'This is our last email about signing up. If you have any questions or concerns, we\'d love to hear them — just reply.',
            cheers: 'The Nuqta Team',
        },
    },
    ar: {
        1: {
            preview: 'شكراً لاهتمامك! إليك ما يمكن لنقطة فعله',
            heading: 'مرحباً بك في نقطة! 🎉',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'شكراً لاهتمامك بنقطة! نحن منصة إدارة فعاليات مصممة لمنظمين مثلك. إليك ما يمكنك فعله:',
            features: [
                '📅 أنشئ وأدر فعاليات في دقائق',
                '🎟️ حجوزات وتأكيدات وتذكيرات آلية',
                '📊 تحليلات فورية ومتابعة الحضور',
                '🌐 صفحات فعاليات ثنائية اللغة (عربي وإنجليزي)',
                '📱 تجربة حضور متوافقة مع الجوال',
                '💰 البداية مجانية!',
            ],
            buttonText: 'أنشئ حسابك المجاني',
            outro: 'عندك أسئلة؟ رد على هذا البريد — يسعدنا مساعدتك.',
            cheers: 'فريق نقطة',
        },
        2: {
            preview: 'شاهد كيف يدير المنظمون فعالياتهم على نقطة',
            heading: 'المنظمون يحبون نقطة 🏆',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'فضولي كيف يستخدم منظمون آخرون نقطة؟ إليك ما يميز منصتنا:',
            features: [
                '⭐ "نقطة وفرت عليّ ساعات من العمل اليدوي" — منظم فعاليات في إسطنبول',
                '⭐ "زادت الحجوزات 40% بعد الانتقال لنقطة" — مقدم ورش عمل',
                '⭐ "الدعم ثنائي اللغة غيّر اللعبة" — مخطط فعاليات مجتمعية',
                '🔄 التذكيرات الآلية تقلل عدم الحضور بنسبة 35%',
                '📈 المنظم العادي ينشئ أول فعالية في أقل من 10 دقائق',
            ],
            buttonText: 'ابدأ رحلتك',
            outro: 'انضم للمنظمين الذين يوفرون الوقت وينمّون جمهورهم بالفعل.',
            cheers: 'فريق نقطة',
        },
        3: {
            preview: 'جاهز للبدء؟ إنه مجاني بالكامل',
            heading: 'جاهز للبدء؟ 🚀',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'لاحظنا أنك لم تنشئ حسابك بعد. إليك تذكير بما يفوتك:',
            features: [
                '✅ خطة البداية مجانية — لا حاجة لبطاقة ائتمان',
                '✅ أنشئ حتى فعاليتين فوراً',
                '✅ إدارة حجوزات كاملة متضمنة',
                '✅ الإعداد يستغرق أقل من دقيقتين',
            ],
            buttonText: 'أنشئ حساباً مجانياً الآن',
            outro: 'هذا آخر بريد عن التسجيل. إذا عندك أي أسئلة أو ملاحظات، نحب نسمعها — فقط رد.',
            cheers: 'فريق نقطة',
        },
    },
};

export const LeadNurtureTemplate = ({
    businessName,
    step,
    registerUrl,
    locale = 'en',
}: LeadNurtureTemplateProps) => {
    const t = stepContent[locale][step];

    return (
        <EmailLayout locale={locale} preview={t.preview}>
            <Heading className="text-2xl font-bold text-gray-900 mx-0 my-[30px] p-0">
                {t.heading}
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.greeting(businessName)}
            </Text>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                {t.body}
            </Text>

            {t.features.map((feature, i) => (
                <Text key={i} className="text-gray-600 text-[14px] leading-[22px] my-[3px] pl-2">
                    {feature}
                </Text>
            ))}

            <Section className="text-center mt-[32px] mb-[32px]">
                <Button
                    className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3 cursor-pointer select-none"
                    href={registerUrl}
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

export default LeadNurtureTemplate;
