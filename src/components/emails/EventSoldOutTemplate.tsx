import * as React from 'react';
import { Html, Head, Body, Container, Section, Text, Heading, Link, Preview, Tailwind } from '@react-email/components';

interface EventSoldOutTemplateProps {
    vendorName: string;
    eventName: string;
    eventId: string;
    soldCount: number;
}

export default function EventSoldOutTemplate({
    vendorName,
    eventName,
    eventId,
    soldCount,
}: EventSoldOutTemplateProps) {
    return (
        <Html>
            <Head />
            <Preview>🎉 Event Sold Out: {eventName}</Preview>
            <Tailwind>
                <Body className="bg-white font-sans text-gray-900">
                    <Container className="mx-auto py-10 px-4 max-w-xl">
                        <Section className="mb-8">
                            <Heading className="text-2xl font-black text-gray-900 m-0">Nuqta</Heading>
                        </Section>

                        <Section className="bg-purple-50 rounded-3xl p-8 border border-purple-100">
                            <Heading className="text-2xl font-black mb-4 text-purple-900">
                                Congratulations! 🎉
                            </Heading>

                            <Heading className="text-lg font-bold mb-4 text-purple-800">
                                Your event "{eventName}" is fully booked!
                            </Heading>

                            <Text className="text-purple-900 text-base mb-6 leading-relaxed">
                                Hi {vendorName}, incredible work! You have sold all <strong>{soldCount}</strong> tickets for this event.
                            </Text>

                            <Section className="mt-8">
                                <Link
                                    href={`https://nuqta.com/dashboard/vendor/events/${eventId}`}
                                    className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-purple-700 block text-center"
                                >
                                    View Event Stats
                                </Link>
                            </Section>
                        </Section>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
}
