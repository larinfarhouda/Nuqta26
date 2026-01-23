import * as React from 'react';
import { Section, Text, Heading, Button } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

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
        <EmailLayout preview={`🎉 Event Sold Out: ${eventName}`} locale="en">
            <Section className="bg-purple-50 rounded-3xl p-4 md:p-8 border border-purple-100">
                <Heading className="text-2xl font-black mb-4 text-purple-900">
                    Congratulations! 🎉
                </Heading>

                <Heading className="text-lg font-bold mb-4 text-purple-800">
                    Your event "{eventName}" is fully booked!
                </Heading>

                <Text className="text-purple-900 text-base mb-6 leading-relaxed">
                    Hi {vendorName}, incredible work! You have sold all <strong>{soldCount}</strong> tickets for this event.
                </Text>

                <Section className="mt-8 text-center">
                    <Button
                        href={`${process.env.NEXT_PUBLIC_APP_URL || 'https://nuqta.com'}/dashboard/vendor/events/${eventId}`}
                        className="bg-purple-600 text-white font-bold py-3 px-6 rounded-xl block w-full text-center no-underline"
                    >
                        View Event Stats
                    </Button>
                </Section>
            </Section>
        </EmailLayout>
    );
}
