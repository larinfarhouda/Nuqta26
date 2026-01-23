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
}

export default function BookingUserTemplate({
    userName,
    eventName,
    bookingId,
    status,
    eventDate,
    location,
}: BookingUserTemplateProps) {
    const statusColor = {
        requested: '#f59e0b', // amber
        confirmed: '#10b981', // emerald
        cancelled: '#ef4444', // red
    };

    const statusText = {
        requested: 'Booking Request Received',
        confirmed: 'Booking Confirmed!',
        cancelled: 'Booking Cancelled',
    };

    const description = {
        requested: `We have received your booking request for "${eventName}". We are waiting for the organizer to review it.`,
        confirmed: `Great news! Your booking for "${eventName}" has been confirmed. Get ready for an amazing experience!`,
        cancelled: `Your booking for "${eventName}" has been cancelled. If you have questions, please contact the organizer.`,
    };

    return (
        <EmailLayout preview={`${statusText[status]}: ${eventName}`} locale="en">
            <Section className="bg-white rounded-3xl p-4 md:p-8">
                <Heading className="text-xl font-bold mb-4" style={{ color: statusColor[status] }}>
                    {statusText[status]}
                </Heading>

                <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                    Hi {userName},
                </Text>

                <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                    {description[status]}
                </Text>

                <Hr className="border-gray-200 my-6" />

                <Section className="mb-6">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Event</Text>
                    <Text className="text-lg font-bold text-gray-900 m-0">{eventName}</Text>
                </Section>

                {eventDate && (
                    <Section className="mb-6">
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Date</Text>
                        <Text className="text-base text-gray-900 m-0">{new Date(eventDate).toLocaleDateString()}</Text>
                    </Section>
                )}

                {location && (
                    <Section className="mb-6">
                        <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">Location</Text>
                        <Text className="text-base text-gray-900 m-0">{location}</Text>
                    </Section>
                )}

                <Section className="mb-2">
                    <Text className="text-xs text-gray-400">Booking ID: {bookingId}</Text>
                </Section>
            </Section>

            <Section className="mt-8 text-center">
                <Link href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.com'}/dashboard/bookings/${bookingId}`} className="text-gray-500 text-sm hover:text-gray-900 underline">
                    View Booking Details
                </Link>
            </Section>
        </EmailLayout>
    );
}
