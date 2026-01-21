import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Hr, Link, Preview, Tailwind } from '@react-email/components';

interface BookingVendorTemplateProps {
    vendorName: string;
    eventName: string;
    customerName: string;
    quantity: number;
    totalAmount: number;
    bookingId: string;
}

export default function BookingVendorTemplate({
    vendorName,
    eventName,
    customerName,
    quantity,
    totalAmount,
    bookingId,
}: BookingVendorTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>New Booking: {eventName}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans text-gray-900">
                    <Container className="mx-auto py-10 px-4 max-w-xl">
                        <Section className="mb-8">
                            <Heading className="text-2xl font-black text-gray-900 m-0">Nuqta</Heading>
                        </Section>

                        <Section className="bg-teal-50 rounded-3xl p-8 border border-teal-100">
                            <Heading className="text-xl font-bold mb-4 text-teal-800">
                                New Booking Request 🚀
                            </Heading>

                            <Text className="text-teal-900 text-base mb-6 leading-relaxed">
                                Hi {vendorName}, you have a new booking for <strong>{eventName}</strong>!
                            </Text>

                            <Hr className="border-teal-200 my-6" />

                            <Section className="mb-4">
                                <Text className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-1">Customer</Text>
                                <Text className="text-lg font-bold text-teal-950 m-0">{customerName}</Text>
                            </Section>

                            <Section className="mb-4">
                                <Text className="text-sm font-bold text-teal-600 uppercase tracking-wider mb-1">Details</Text>
                                <Text className="text-base text-teal-950 m-0">{quantity} Ticket(s)</Text>
                                <Text className="text-base text-teal-950 m-0 font-bold">Total: {totalAmount} ₺</Text>
                            </Section>

                            <Section className="mt-8">
                                <Link
                                    href={`https://nuqta.com/dashboard/vendor/bookings`}
                                    className="bg-teal-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-teal-700 block text-center"
                                >
                                    Manage Bookings
                                </Link>
                            </Section>

                            <Section className="mt-6">
                                <Text className="text-xs text-teal-400">Booking ID: {bookingId}</Text>
                            </Section>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
