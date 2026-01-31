import * as React from 'react';
import { Section, Text, Heading, Button, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface EventSoldOutTemplateProps {
    vendorName: string;
    eventName: string;
    eventId: string;
    soldCount: number;
    locale?: 'ar' | 'en';
}

export default function EventSoldOutTemplate({
    vendorName,
    eventName,
    eventId,
    soldCount,
    locale = 'ar',
}: EventSoldOutTemplateProps) {
    // Bilingual content - Arabic first, then English
    const content = {
        titleAr: 'تهانينا! 🎉',
        titleEn: 'Congratulations! 🎉',
        subtitleAr: `فعاليتك "${eventName}" اكتملت الحجوزات!`,
        subtitleEn: `Your event "${eventName}" is fully booked!`,
        greetingAr: `مرحباً ${vendorName}،`,
        greetingEn: `Hi ${vendorName},`,
        messageAr: `عمل رائع! لقد بعت جميع التذاكر البالغ عددها ${soldCount} لهذه الفعالية.`,
        messageEn: `Incredible work! You have sold all ${soldCount} tickets for this event.`,
        buttonAr: 'عرض إحصائيات الفعالية',
        buttonEn: 'View Event Stats',
    };

    return (
        <EmailLayout preview={`🎉 ${content.titleAr} | ${content.titleEn}: ${eventName}`} locale={locale}>
            <Section className="bg-purple-50 rounded-3xl p-4 border border-purple-100">
                {/* Arabic Section (Primary) */}
                <Section className="mb-6" dir="rtl">
                    <Heading className="text-2xl font-black mb-4 text-purple-900 font-[Cairo]" style={{ textAlign: 'right' }}>
                        {content.titleAr}
                    </Heading>

                    <Heading className="text-lg font-bold mb-4 text-purple-800 font-[Cairo]" style={{ textAlign: 'right' }}>
                        {content.subtitleAr}
                    </Heading>

                    <Text className="text-purple-900 text-base mb-6 leading-relaxed font-[Cairo]" style={{ textAlign: 'right' }}>
                        {content.greetingAr} {content.messageAr}
                    </Text>
                </Section>

                <Hr className="border-purple-200 my-6" />

                {/* English Section */}
                <Section className="mb-6" dir="ltr">
                    <Heading className="text-2xl font-black mb-4 text-purple-900">
                        {content.titleEn}
                    </Heading>

                    <Heading className="text-lg font-bold mb-4 text-purple-800">
                        {content.subtitleEn}
                    </Heading>

                    <Text className="text-purple-900 text-base mb-6 leading-relaxed">
                        {content.greetingEn} {content.messageEn}
                    </Text>
                </Section>

                <Section className="mt-8 text-center">
                    <Button
                        href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist'}/dashboard/vendor/events/${eventId}`}
                        className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl block w-full text-center no-underline"
                    >
                        {content.buttonAr} | {content.buttonEn}
                    </Button>
                </Section>
            </Section>
        </EmailLayout>
    );
}
