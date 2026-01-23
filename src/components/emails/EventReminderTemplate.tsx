import * as React from 'react';
import { Section, Text, Heading, Button, Hr, Link } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface EventReminderTemplateProps {
    userName: string;
    eventName: string;
    eventDate: string;
    eventTime?: string;
    location: string;
    locationUrl?: string;
    bookingId: string;
    ticketUrl: string;
    locale?: 'en' | 'ar';
}

export const EventReminderTemplate = ({
    userName,
    eventName,
    eventDate,
    eventTime,
    location,
    locationUrl,
    bookingId,
    ticketUrl,
    locale = 'en',
}: EventReminderTemplateProps) => {
    const isRtl = locale === 'ar';

    const content = {
        en: {
            preview: `Reminder: ${eventName} is tomorrow!`,
            heading: 'See you tomorrow! 👋',
            greeting: `Hi ${userName},`,
            intro: `This is a friendly reminder that you have an upcoming event tomorrow. We can't wait to see you there!`,
            eventDetails: 'Event Details',
            dateLabel: 'Date',
            timeLabel: 'Time',
            locationLabel: 'Location',
            viewMap: 'View on Map',
            ticketButton: 'View Booking & Tickets',
            footer: 'Need help? Contact the organizer directly or reply to this email.',
        },
        ar: {
            preview: `تذكير: ${eventName} غداً!`,
            heading: 'نراك غداً! 👋',
            greeting: `مرحباً ${userName}،`,
            intro: `هذا تذكير ودي بأن لديك فعالية قادمة غداً. نحن متشوقون لرؤيتك هناك!`,
            eventDetails: 'تفاصيل الفعالية',
            dateLabel: 'التاريخ',
            timeLabel: 'الوقت',
            locationLabel: 'الموقع',
            viewMap: 'عرض على الخريطة',
            ticketButton: 'عرض الحجز والتذاكر',
            footer: 'تحتاج مساعدة؟ تواصل مع المنظم مباشرة أو قم بالرد على هذا البريد.',
        }
    };

    const t = content[locale];

    return (
        <EmailLayout preview={t.preview} locale={locale}>
            <Section className="bg-white rounded-3xl p-4 md:p-8 border border-gray-100">
                <Heading className="text-xl font-bold mb-4 text-gray-900">
                    {t.heading}
                </Heading>

                <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                    {t.greeting}
                </Text>

                <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                    {t.intro}
                </Text>

                <Hr className="border-gray-200 my-6" />

                <Section className="mb-6 bg-gray-50 rounded-xl p-4">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">
                        {t.eventDetails}
                    </Text>

                    <Heading as="h3" className="text-lg font-bold text-teal-800 m-0 mb-4">
                        {eventName}
                    </Heading>

                    <div className="mb-2">
                        <Text className="text-sm font-bold text-gray-500 m-0 inline-block w-24">{t.dateLabel}:</Text>
                        <Text className="text-base text-gray-900 m-0 inline-block">{new Date(eventDate).toLocaleDateString()}</Text>
                    </div>

                    {eventTime && (
                        <div className="mb-2">
                            <Text className="text-sm font-bold text-gray-500 m-0 inline-block w-24">{t.timeLabel}:</Text>
                            <Text className="text-base text-gray-900 m-0 inline-block">{eventTime}</Text>
                        </div>
                    )}

                    <div className="mb-2">
                        <Text className="text-sm font-bold text-gray-500 m-0 inline-block w-24">{t.locationLabel}:</Text>
                        <Text className="text-base text-gray-900 m-0 inline-block">{location}</Text>
                        {locationUrl && (
                            <div className="mt-1">
                                <Link href={locationUrl} className="text-teal-600 text-sm font-medium underline">
                                    {t.viewMap}
                                </Link>
                            </div>
                        )}
                    </div>
                </Section>

                <Section className="mt-8 text-center">
                    <Button
                        href={ticketUrl}
                        className="bg-teal-600 text-white font-bold py-3 px-6 rounded-xl block w-full text-center no-underline"
                    >
                        {t.ticketButton}
                    </Button>
                </Section>

                <Section className="mt-6 text-center">
                    <Text className="text-xs text-gray-400">
                        Reference: {bookingId}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-2">
                        {t.footer}
                    </Text>
                </Section>
            </Section>
        </EmailLayout>
    );
};

export default EventReminderTemplate;
