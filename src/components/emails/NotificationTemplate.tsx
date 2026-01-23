import * as React from 'react';
import { Section, Text, Button, Heading, Hr } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface NotificationTemplateProps {
    previewText?: string;
    heading: string;
    bodyText: string;
    actionLabel?: string;
    actionUrl?: string;
    locale?: 'en' | 'ar';
}

export const NotificationTemplate = ({
    previewText,
    heading,
    bodyText,
    actionLabel,
    actionUrl,
    locale = 'en',
}: NotificationTemplateProps) => {
    return (
        <EmailLayout locale={locale} preview={previewText || heading}>
            <Heading className="text-2xl font-bold text-gray-900 mx-0 my-[30px] p-0">
                {heading}
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[24px] whitespace-pre-wrap">
                {bodyText}
            </Text>

            {actionLabel && actionUrl && (
                <Section className="text-center mt-[32px] mb-[32px]">
                    <Button
                        className="bg-[#2CA58D] rounded-full text-white text-[16px] font-semibold no-underline text-center px-6 py-3"
                        href={actionUrl}
                    >
                        {actionLabel}
                    </Button>
                </Section>
            )}

            <Hr className="border-gray-200 my-[26px] mx-0 w-full" />

            <Text className="text-gray-500 text-[14px] leading-[24px]">
                Nuqta
            </Text>
        </EmailLayout>
    );
};

export default NotificationTemplate;
