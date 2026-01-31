import * as React from 'react';
import { Section, Text, Heading, Hr, Button } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface BookingVendorTemplateProps {
    vendorName: string;
    eventName: string;
    customerName: string;
    quantity: number;
    totalAmount: number;
    bookingId: string;
    locale?: 'ar' | 'en';
}

export default function BookingVendorTemplate({
    vendorName,
    eventName,
    customerName,
    quantity,
    totalAmount,
    bookingId,
    locale = 'ar',
}: BookingVendorTemplateProps) {
    // Bilingual content - Arabic first, then English
    const content = {
        titleAr: 'طلب حجز جديد 🚀',
        titleEn: 'New Booking Request 🚀',
        greetingAr: `مرحباً ${vendorName}،`,
        greetingEn: `Hi ${vendorName},`,
        messageAr: `لديك طلب حجز جديد لفعالية "${eventName}" يحتاج إلى تأكيدك!`,
        messageEn: `You have a new booking for "${eventName}" that needs your confirmation!`,
        customerLabelAr: 'العميل',
        customerLabelEn: 'Customer',
        detailsLabelAr: 'التفاصيل',
        detailsLabelEn: 'Details',
        ticketsAr: 'تذكرة',
        ticketsEn: 'Ticket(s)',
        totalAr: 'المجموع',
        totalEn: 'Total',
        buttonAr: 'مراجعة وتأكيد الحجز',
        buttonEn: 'Review & Confirm Booking',
        bookingIdAr: 'رقم الحجز',
        bookingIdEn: 'Booking ID',
    };

    return (
        <EmailLayout preview={`${content.titleAr} | ${content.titleEn}: ${eventName}`} locale={locale}>
            <Section className="bg-teal-50 rounded-3xl p-4 border border-teal-100">
                {/* Arabic Section (Primary) */}
                <Section className="mb-6" dir="rtl">
                    <Heading className="text-xl font-bold mb-4 text-teal-800 font-[Cairo]" style={{ textAlign: 'right' }}>
                        {content.titleAr}
                    </Heading>

                    <Text className="text-teal-900 text-base mb-6 leading-relaxed font-[Cairo]" style={{ textAlign: 'right' }}>
                        {content.greetingAr} {content.messageAr}
                    </Text>
                </Section>

                <Hr className="border-teal-200 my-6" />

                {/* English Section */}
                <Section className="mb-6" dir="ltr">
                    <Heading className="text-xl font-bold mb-4 text-teal-800">
                        {content.titleEn}
                    </Heading>

                    <Text className="text-teal-900 text-base mb-6 leading-relaxed">
                        {content.greetingEn} {content.messageEn}
                    </Text>
                </Section>

                <Hr className="border-teal-200 my-6" />

                {/* Bilingual Details */}
                <Section className="mb-4">
                    <Text className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-1">
                        {content.customerLabelAr} | {content.customerLabelEn}
                    </Text>
                    <Text className="text-lg font-bold text-teal-950 m-0">{customerName}</Text>
                </Section>

                <Section className="mb-4">
                    <Text className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-1">
                        {content.detailsLabelAr} | {content.detailsLabelEn}
                    </Text>
                    <Text className="text-base text-teal-950 m-0">
                        {quantity} {content.ticketsAr} | {content.ticketsEn}
                    </Text>
                    <Text className="text-base text-teal-950 m-0 font-bold">
                        {content.totalAr} | {content.totalEn}: {totalAmount} ₺
                    </Text>
                </Section>

                <Section className="mt-8 text-center">
                    <Button
                        href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.ist'}/dashboard/vendor/bookings`}
                        className="bg-teal-600 text-white font-bold py-3 px-6 rounded-xl block w-full text-center no-underline"
                    >
                        {content.buttonAr} | {content.buttonEn}
                    </Button>
                </Section>

                <Section className="mt-6">
                    <Text className="text-xs text-teal-400">
                        {content.bookingIdAr} | {content.bookingIdEn}: {bookingId}
                    </Text>
                </Section>
            </Section>
        </EmailLayout>
    );
}
