import * as React from 'react';
import { Section, Text, Heading, Button, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface ReviewRequestTemplateProps {
    userName: string;
    eventName: string;
    reviewUrl: string;
    locale?: 'en' | 'ar';
}

export const ReviewRequestTemplate = ({
    userName,
    eventName,
    reviewUrl,
    locale = 'en',
}: ReviewRequestTemplateProps) => {
    const isRtl = locale === 'ar';

    const content = {
        en: {
            preview: `How was ${eventName}?`,
            heading: 'How was your experience? ⭐',
            greeting: `Hi ${userName},`,
            intro: `We hope you had an amazing time at "${eventName}"! Your feedback helps the community discover great events.`,
            askReview: 'It only takes a minute — tap the button below to leave a quick review:',
            cta: 'Leave a Review',
            footer: 'Thank you for being part of the Nuqta community!',
        },
        ar: {
            preview: `كيف كانت تجربتك في ${eventName}؟`,
            heading: 'كيف كانت تجربتك؟ ⭐',
            greeting: `مرحباً ${userName}،`,
            intro: `نتمنى أنك قضيت وقتاً رائعاً في "${eventName}"! رأيك يساعد المجتمع في اكتشاف الفعاليات المميزة.`,
            askReview: 'لن يأخذ الأمر سوى دقيقة — اضغط على الزر أدناه لترك تقييم سريع:',
            cta: 'اترك تقييماً',
            footer: 'شكراً لكونك جزءاً من مجتمع نقطة!',
        },
    };

    const t = content[locale];

    return (
        <EmailLayout preview={t.preview} locale={locale}>
            <Section className="bg-white rounded-3xl p-4 md:p-8 border border-gray-100">
                <Heading className="text-xl font-bold mb-4 text-gray-900">
                    {t.heading}
                </Heading>

                <Text className="text-gray-700 text-base mb-2 leading-relaxed">
                    {t.greeting}
                </Text>

                <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                    {t.intro}
                </Text>

                <Hr className="border-gray-200 my-6" />

                <Section className="mb-6 bg-amber-50 rounded-xl p-4 text-center">
                    <Text className="text-3xl m-0 mb-2">⭐⭐⭐⭐⭐</Text>
                    <Text className="text-sm text-gray-600 m-0 font-medium">
                        {t.askReview}
                    </Text>
                </Section>

                <Section className="mt-8 text-center">
                    <Button
                        href={reviewUrl}
                        className="bg-teal-600 text-white font-bold py-3 px-6 rounded-xl block w-full text-center no-underline"
                    >
                        {t.cta}
                    </Button>
                </Section>

                <Section className="mt-6 text-center">
                    <Text className="text-xs text-gray-400 mt-2">
                        {t.footer}
                    </Text>
                </Section>
            </Section>
        </EmailLayout>
    );
};

export default ReviewRequestTemplate;
