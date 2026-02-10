import * as React from 'react';
import { Section, Text, Heading, Hr, Row, Column } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface NewSignupAdminTemplateProps {
    userName: string;
    userEmail: string;
    userRole: 'user' | 'vendor';
    signupMethod: 'email' | 'google' | 'facebook';
    timestamp: string;
    additionalInfo?: Record<string, string>;
}

export const NewSignupAdminTemplate = ({
    userName,
    userEmail,
    userRole,
    signupMethod,
    timestamp,
    additionalInfo,
}: NewSignupAdminTemplateProps) => {
    const roleLabel = userRole === 'vendor' ? '🏢 Vendor / منظم' : '👤 Customer / مستخدم';
    const methodLabel = signupMethod === 'google' ? 'Google OAuth' : signupMethod === 'facebook' ? 'Facebook OAuth' : 'Email/Password';

    return (
        <EmailLayout locale="en" preview={`New ${userRole} signup: ${userName}`}>
            <Heading className="text-2xl font-bold text-gray-900 mx-0 my-[30px] p-0">
                🎉 New Signup Alert
            </Heading>

            <Text className="text-gray-700 text-[16px] leading-[24px]">
                A new {userRole} has signed up on Nuqta!
            </Text>

            <Section className="bg-[#f8fafc] rounded-xl p-[20px] my-[20px] border border-gray-100">
                <Row>
                    <Column>
                        <Text className="text-gray-500 text-[13px] m-0 mb-[4px] font-semibold uppercase tracking-wider">
                            Name
                        </Text>
                        <Text className="text-gray-900 text-[16px] m-0 mb-[16px] font-bold">
                            {userName}
                        </Text>
                    </Column>
                </Row>

                <Row>
                    <Column>
                        <Text className="text-gray-500 text-[13px] m-0 mb-[4px] font-semibold uppercase tracking-wider">
                            Email
                        </Text>
                        <Text className="text-gray-900 text-[16px] m-0 mb-[16px]">
                            {userEmail}
                        </Text>
                    </Column>
                </Row>

                <Row>
                    <Column>
                        <Text className="text-gray-500 text-[13px] m-0 mb-[4px] font-semibold uppercase tracking-wider">
                            Role
                        </Text>
                        <Text className="text-gray-900 text-[16px] m-0 mb-[16px]">
                            {roleLabel}
                        </Text>
                    </Column>
                </Row>

                <Row>
                    <Column>
                        <Text className="text-gray-500 text-[13px] m-0 mb-[4px] font-semibold uppercase tracking-wider">
                            Signup Method
                        </Text>
                        <Text className="text-gray-900 text-[16px] m-0 mb-[16px]">
                            {methodLabel}
                        </Text>
                    </Column>
                </Row>

                <Row>
                    <Column>
                        <Text className="text-gray-500 text-[13px] m-0 mb-[4px] font-semibold uppercase tracking-wider">
                            Time
                        </Text>
                        <Text className="text-gray-900 text-[16px] m-0 mb-[4px]">
                            {timestamp}
                        </Text>
                    </Column>
                </Row>

                {additionalInfo && Object.entries(additionalInfo).map(([key, value]) => (
                    <Row key={key}>
                        <Column>
                            <Text className="text-gray-500 text-[13px] m-0 mb-[4px] mt-[12px] font-semibold uppercase tracking-wider">
                                {key}
                            </Text>
                            <Text className="text-gray-900 text-[16px] m-0 mb-[4px]">
                                {value}
                            </Text>
                        </Column>
                    </Row>
                ))}
            </Section>

            <Hr className="border-gray-200 my-[26px] mx-0 w-full" />

            <Text className="text-gray-500 text-[14px] leading-[24px]">
                This is an automated notification from Nuqta.
            </Text>
        </EmailLayout>
    );
};

export default NewSignupAdminTemplate;
