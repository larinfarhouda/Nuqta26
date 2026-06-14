import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface OnboardingDripTemplateProps {
    vendorName: string;
    step: 1 | 2 | 3 | 4 | 5;
    dashboardUrl: string;
    locale?: 'en' | 'ar';
}

const stepContent = {
    en: {
        1: {
            preview: 'Create your first event in 5 minutes',
            heading: 'Create your first event in 5 minutes ✨',
            greeting: (name: string) => `Hi ${name},`,
            body: 'Welcome aboard! Setting up your first event on Nuqta is quick and easy. Here\'s how to get started:',
            tips: [
                '1. Go to your dashboard and click "Create Event"',
                '2. Add your event details — title, date, location, and description',
                '3. Set your ticket types and pricing',
                '4. Publish and share with your audience!',
            ],
            tipNote: '💡 Tip: Add a great cover image — events with photos get 3x more bookings.',
            buttonText: 'Create Your First Event',
            cheers: 'The Nuqta Team',
        },
        2: {
            preview: 'Share your event & get your first attendees',
            heading: 'Share your event & get your first attendees 🚀',
            greeting: (name: string) => `Hi ${name},`,
            body: 'You\'ve set up your event — now it\'s time to get the word out! Here are the best ways to share:',
            tips: [
                '📱 Share your event link on WhatsApp, Instagram, and Twitter',
                '🔗 Use Nuqta\'s Smart Share feature for platform-optimized links',
                '📧 Send your event link to your mailing list or contacts',
                '📌 Pin it to your social media profiles',
            ],
            tipNote: '💡 Tip: Events shared within the first 48 hours get 5x more early registrations.',
            buttonText: 'Share Your Event',
            cheers: 'The Nuqta Team',
        },
        3: {
            preview: 'Check your analytics — see how your event is performing',
            heading: 'Check your analytics 📊',
            greeting: (name: string) => `Hi ${name},`,
            body: 'It\'s been a week since you joined Nuqta! Time to see how your events are doing. Your dashboard gives you real-time insights:',
            tips: [
                '📈 Track page views and booking conversions',
                '👥 See your attendee demographics',
                '📊 Monitor ticket sales and revenue',
                '🔔 View engagement and notification stats',
            ],
            tipNote: '💡 Tip: Check your analytics weekly to spot trends and optimize your events.',
            buttonText: 'View Analytics',
            cheers: 'The Nuqta Team',
        },
        4: {
            preview: 'Ready to grow? Upgrade for more events',
            heading: 'Ready to grow? 🌟',
            greeting: (name: string) => `Hi ${name},`,
            body: 'You\'ve been with Nuqta for two weeks now! If you\'re hitting the limits of your free plan, here\'s what you unlock with an upgrade:',
            tips: [
                '✅ Unlimited events per month (vs. 2 on Starter)',
                '✅ Advanced analytics & attendee insights',
                '✅ Custom branding on your event pages',
                '✅ Priority event placement for more visibility',
                '✅ Priority support',
            ],
            tipNote: '💡 Organizers who upgrade see an average of 40% more bookings.',
            buttonText: 'Explore Plans',
            cheers: 'The Nuqta Team',
        },
        5: {
            preview: 'How\'s it going? We\'d love your feedback',
            heading: 'How\'s it going? 💬',
            greeting: (name: string) => `Hi ${name},`,
            body: 'It\'s been a month since you joined Nuqta! We hope you\'re enjoying the platform. We\'d love to hear about your experience:',
            tips: [
                '🤔 What\'s working well for you?',
                '💡 What features would make your life easier?',
                '🐛 Run into any issues?',
                '⭐ Would you recommend Nuqta to other organizers?',
            ],
            tipNote: 'Simply reply to this email — a real person reads every response!',
            buttonText: 'Go to Dashboard',
            cheers: 'The Nuqta Team',
        },
    },
    ar: {
        1: {
            preview: 'أنشئ أول فعالية في 5 دقائق',
            heading: 'أنشئ أول فعالية في 5 دقائق ✨',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'أهلاً وسهلاً! إنشاء أول فعالية على نقطة سريع وسهل. إليك الخطوات:',
            tips: [
                '1. اذهب إلى لوحة التحكم واضغط "إنشاء فعالية"',
                '2. أضف تفاصيل الفعالية — العنوان، التاريخ، الموقع، والوصف',
                '3. حدد أنواع التذاكر والأسعار',
                '4. انشر وشارك مع جمهورك!',
            ],
            tipNote: '💡 نصيحة: أضف صورة غلاف رائعة — الفعاليات مع صور تحصل على 3 أضعاف الحجوزات.',
            buttonText: 'أنشئ أول فعالية',
            cheers: 'فريق نقطة',
        },
        2: {
            preview: 'شارك فعاليتك واحصل على أول حضور',
            heading: 'شارك فعاليتك واحصل على أول حضور 🚀',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'أنشأت فعاليتك — حان وقت نشرها! إليك أفضل طرق المشاركة:',
            tips: [
                '📱 شارك رابط الفعالية على واتساب وإنستجرام وتويتر',
                '🔗 استخدم ميزة المشاركة الذكية لروابط محسنة لكل منصة',
                '📧 أرسل رابط الفعالية لقائمة جهات الاتصال',
                '📌 ثبتها في ملفاتك على وسائل التواصل',
            ],
            tipNote: '💡 نصيحة: الفعاليات التي تُشارك خلال أول 48 ساعة تحصل على 5 أضعاف التسجيلات المبكرة.',
            buttonText: 'شارك فعاليتك',
            cheers: 'فريق نقطة',
        },
        3: {
            preview: 'تحقق من تحليلاتك — شاهد أداء فعاليتك',
            heading: 'تحقق من تحليلاتك 📊',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'مرّ أسبوع منذ انضمامك لنقطة! حان وقت رؤية أداء فعالياتك. لوحة التحكم تعطيك رؤى فورية:',
            tips: [
                '📈 تتبع المشاهدات وتحويلات الحجز',
                '👥 شاهد بيانات الحضور الديموغرافية',
                '📊 راقب مبيعات التذاكر والإيرادات',
                '🔔 عرض إحصائيات التفاعل والإشعارات',
            ],
            tipNote: '💡 نصيحة: تحقق من تحليلاتك أسبوعياً لاكتشاف الاتجاهات وتحسين فعالياتك.',
            buttonText: 'عرض التحليلات',
            cheers: 'فريق نقطة',
        },
        4: {
            preview: 'جاهز للنمو؟ ترقّ للمزيد من الفعاليات',
            heading: 'جاهز للنمو؟ 🌟',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'مرّ أسبوعان منذ انضمامك لنقطة! إذا وصلت لحدود الخطة المجانية، إليك ما تفتحه بالترقية:',
            tips: [
                '✅ فعاليات غير محدودة شهرياً (بدل 2 في خطة البداية)',
                '✅ تحليلات متقدمة ورؤى عن الحضور',
                '✅ تخصيص العلامة التجارية لصفحات فعالياتك',
                '✅ أولوية في عرض الفعاليات لمزيد من الظهور',
                '✅ دعم ذو أولوية',
            ],
            tipNote: '💡 المنظمون الذين يرقّون يشهدون زيادة 40% في الحجوزات في المتوسط.',
            buttonText: 'استكشف الخطط',
            cheers: 'فريق نقطة',
        },
        5: {
            preview: 'كيف الأمور؟ نحب نسمع رأيك',
            heading: 'كيف الأمور؟ 💬',
            greeting: (name: string) => `مرحباً ${name}،`,
            body: 'مرّ شهر منذ انضمامك لنقطة! نتمنى أنك تستمتع بالمنصة. نحب نسمع عن تجربتك:',
            tips: [
                '🤔 ما الذي يعمل بشكل جيد بالنسبة لك؟',
                '💡 ما المميزات التي ستسهل عملك؟',
                '🐛 واجهت أي مشاكل؟',
                '⭐ هل تنصح بنقطة لمنظمين آخرين؟',
            ],
            tipNote: 'رد على هذا البريد مباشرة — شخص حقيقي يقرأ كل رد!',
            buttonText: 'افتح لوحة التحكم',
            cheers: 'فريق نقطة',
        },
    },
};

export const OnboardingDripTemplate = ({
    vendorName,
    step,
    dashboardUrl,
    locale = 'en',
}: OnboardingDripTemplateProps) => {
    const t = stepContent[locale][step];

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

            {t.tips.map((tip, i) => (
                <Text key={i} className="text-gray-600 text-[14px] leading-[22px] my-[3px] pl-2">
                    {tip}
                </Text>
            ))}

            <Section className="bg-[#E0F2F1] rounded-lg p-4 my-4">
                <Text className="text-[#264653] text-[14px] leading-[20px] m-0">
                    {t.tipNote}
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

            <Hr className="border-gray-200 my-[26px] mx-0 w-full" />

            <Text className="text-gray-500 text-[14px] leading-[24px]">
                {t.cheers}
            </Text>
        </EmailLayout>
    );
};

export default OnboardingDripTemplate;
