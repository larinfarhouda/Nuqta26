import * as React from 'react';
import { Section, Text, Heading, Hr, Link } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface BookingUserTemplateProps {
    userName: string;
    eventName: string;
    bookingId: string;
    status: 'requested' | 'confirmed' | 'cancelled';
    eventDate?: string;
    location?: string;
    locale?: 'ar' | 'en';
}

export default function BookingUserTemplate({
    userName,
    eventName,
    bookingId,
    status,
    eventDate,
    location,
    locale = 'ar',
}: BookingUserTemplateProps) {
    const statusColor = {
        requested: '#f59e0b', // amber
        confirmed: '#10b981', // emerald
        cancelled: '#ef4444', // red
    };

    // Bilingual content - Arabic first, then English
    const content = {
        requested: {
            titleAr: 'تم استلام طلب الحجز',
            titleEn: 'Booking Request Received',
            greetingAr: `مرحباً ${userName}،`,
            greetingEn: `Hi ${userName},`,
            messageAr: `تم استلام طلب الحجز الخاص بك لـ "${eventName}". طلبك قيد المراجعة حالياً وسنقوم بإخطارك بالتحديثات قريباً.`,
            messageEn: `We have received your booking request for "${eventName}". Your request is currently under review and we'll notify you with updates soon.`,
            eventLabelAr: 'الفعالية',
            eventLabelEn: 'Event',
            dateLabelAr: 'التاريخ',
            dateLabelEn: 'Date',
            locationLabelAr: 'الموقع',
            locationLabelEn: 'Location',
            bookingIdAr: 'رقم الحجز',
            bookingIdEn: 'Booking ID',
            viewDetailsAr: 'عرض تفاصيل الحجز',
            viewDetailsEn: 'View Booking Details',
        },
        confirmed: {
            titleAr: 'تم تأكيد الحجز!',
            titleEn: 'Booking Confirmed!',
            greetingAr: `مرحباً ${userName}،`,
            greetingEn: `Hi ${userName},`,
            messageAr: `أخبار رائعة! تم تأكيد حجزك لـ "${eventName}". استعد لتجربة مذهلة!`,
            messageEn: `Great news! Your booking for "${eventName}" has been confirmed. Get ready for an amazing experience!`,
            eventLabelAr: 'الفعالية',
            eventLabelEn: 'Event',
            dateLabelAr: 'التاريخ',
            dateLabelEn: 'Date',
            locationLabelAr: 'الموقع',
            locationLabelEn: 'Location',
            bookingIdAr: 'رقم الحجز',
            bookingIdEn: 'Booking ID',
            viewDetailsAr: 'عرض تفاصيل الحجز',
            viewDetailsEn: 'View Booking Details',
        },
        cancelled: {
            titleAr: 'تم إلغاء الحجز',
            titleEn: 'Booking Cancelled',
            greetingAr: `مرحباً ${userName}،`,
            greetingEn: `Hi ${userName},`,
            messageAr: `تم إلغاء حجزك لـ "${eventName}". إذا كان لديك أي أسئلة، يرجى التواصل مع المنظم.`,
            messageEn: `Your booking for "${eventName}" has been cancelled. If you have questions, please contact the organizer.`,
            eventLabelAr: 'الفعالية',
            eventLabelEn: 'Event',
            dateLabelAr: 'التاريخ',
            dateLabelEn: 'Date',
            locationLabelAr: 'الموقع',
            locationLabelEn: 'Location',
            bookingIdAr: 'رقم الحجز',
            bookingIdEn: 'Booking ID',
            viewDetailsAr: 'عرض تفاصيل الحجز',
            viewDetailsEn: 'View Booking Details',
        },
    };

    const t = content[status];

    return (
        <EmailLayout preview={`${t.titleAr} | ${t.titleEn}: ${eventName}`} locale={locale}>
            <Section className="bg-white rounded-3xl p-4">
                {/* Arabic Section (Primary) */}
                <Section className="mb-6" dir="rtl">
                    <Heading className="text-xl font-bold mb-4 font-[Cairo]" style={{ color: statusColor[status], textAlign: 'right' }}>
                        {t.titleAr}
                    </Heading>

                    <Text className="text-gray-700 text-base mb-4 leading-relaxed font-[Cairo]" style={{ textAlign: 'right' }}>
                        {t.greetingAr}
                    </Text>

                    <Text className="text-gray-700 text-base mb-6 leading-relaxed font-[Cairo]" style={{ textAlign: 'right' }}>
                        {t.messageAr}
                    </Text>
                </Section>

                <Hr className="border-gray-200 my-6" />

                {/* English Section */}
                <Section className="mb-6" dir="ltr">
                    <Heading className="text-xl font-bold mb-4" style={{ color: statusColor[status] }}>
                        {t.titleEn}
                    </Heading>

                    <Text className="text-gray-700 text-base mb-4 leading-relaxed">
                        {t.greetingEn}
                    </Text>

                    <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                        {t.messageEn}
                    </Text>
                </Section>

                <Hr className="border-gray-200 my-6" />

                {/* Bilingual Event Details */}
                <Section className="mb-6">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                        {t.eventLabelAr} | {t.eventLabelEn}
                    </Text>
                    <Text className="text-lg font-bold text-gray-900 m-0">{eventName}</Text>
                </Section>

                {eventDate && (
                    <Section className="mb-6">
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {t.dateLabelAr} | {t.dateLabelEn}
                        </Text>
                        <Text className="text-base text-gray-900 m-0">{new Date(eventDate).toLocaleDateString()}</Text>
                    </Section>
                )}

                {location && (
                    <Section className="mb-6">
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {t.locationLabelAr} | {t.locationLabelEn}
                        </Text>
                        <Text className="text-base text-gray-900 m-0">{location}</Text>
                    </Section>
                )}

                <Section className="mb-2">
                    <Text className="text-xs text-gray-400">
                        {t.bookingIdAr} | {t.bookingIdEn}: {bookingId}
                    </Text>
                </Section>
            </Section>

            <Section className="mt-8 text-center">
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist'}/dashboard/bookings/${bookingId}`} className="text-gray-500 text-sm underline">
                    {t.viewDetailsAr} | {t.viewDetailsEn}
                </Link>
            </Section>
        </EmailLayout>
    );
}
