import * as React from 'react';
import { Section, Text, Heading, Button, Hr, Link } from '@react-email/components';
import { EmailLayout } from './EmailLayout';

interface AuthActionTemplateProps {
    actionType: 'confirm-signup' | 'reset-password' | 'magic-link' | 'invite-user' | 'change-email';
    actionUrl: string; // This will become {{ .ConfirmationURL }} in the final HTML
}

export const AuthActionTemplate = ({
    actionType,
    actionUrl
}: AuthActionTemplateProps) => {

    // Content definitions for each type (Bilingual: English + Arabic)
    const content = {
        'confirm-signup': {
            preview: 'Confirm your signup | أكد تسجيلك',
            heading: 'Confirm your email address',
            headingAr: 'أكد عنوان بريدك الإلكتروني',
            body: 'Welcome to Nuqta! Please confirm your email address to complete your registration.',
            bodyAr: 'مرفباً بك في نقطة! يرجى تأكيد عنوان بريدك الإلكتروني لإكمال التسجيل.',
            button: 'Confirm Email',
            buttonAr: 'تأكيد البريد الإلكتروني'
        },
        'reset-password': {
            preview: 'Reset your password | إعادة تعيين كلمة المرور',
            heading: 'Reset your password',
            headingAr: 'إعادة تعيين كلمة المرور',
            body: 'We received a request to reset your password. If you didn\'t make this request, you can safely ignore this email.',
            bodyAr: 'تلقينا طلباً لإعادة تعيين كلمة مرورك. إذا لم تقم بهذا الطلب، يمكنك تجاهل هذا البريد بأمان.',
            button: 'Reset Password',
            buttonAr: 'إعادة تعيين كلمة المرور'
        },
        'magic-link': {
            preview: 'Sign in to Nuqta | تسجيل الدخول إلى نقطة',
            heading: 'Your magic link',
            headingAr: 'رابط تسجيل الدخول الخاص بك',
            body: 'Click the button below to sign in to your account instantly.',
            bodyAr: 'انقر على الزر أدناه لتسجيل الدخول إلى حسابك فوراً.',
            button: 'Sign In',
            buttonAr: 'تسجيل الدخول'
        },
        'invite-user': {
            preview: 'You have been invited! | تمت دعوتك!',
            heading: 'You have been invited to Nuqta',
            headingAr: 'تمت دعوتك للانضمام إلى نقطة',
            body: 'You have been invited to join Nuqta. Click the button below to accept the invitation and set up your account.',
            bodyAr: 'تمت دعوتك للانضمام إلى نقطة. انقر على الزر أدناه لقبول الدعوة وإعداد حسابك.',
            button: 'Accept Invitation',
            buttonAr: 'قبول الدعوة'
        },
        'change-email': {
            preview: 'Confirm email change | تأكيد تغيير البريد',
            heading: 'Confirm email change',
            headingAr: 'تأكيد تغيير البريد الإلكتروني',
            body: 'We received a request to change your email address. Please confirm this change by clicking the button below.',
            bodyAr: 'تلقينا طلباً لتغيير عنوان بريدك الإلكتروني. يرجى تأكيد هذا التغيير بالنقر على الزر أدناه.',
            button: 'Confirm Change',
            buttonAr: 'تأكيد التغيير'
        }
    };

    const t = content[actionType];

    return (
        <EmailLayout preview={t.preview} locale="en">
            <Section className="bg-white rounded-3xl p-4 md:p-8 border border-gray-100 text-center">
                {/* English Section */}
                <Section className="mb-6">
                    <Heading className="text-xl font-bold mb-4 text-gray-900">
                        {t.heading}
                    </Heading>
                    <Text className="text-gray-700 text-base mb-6 leading-relaxed">
                        {t.body}
                    </Text>
                </Section>

                {/* Divider */}
                <Hr className="border-gray-100 my-4" />

                {/* Arabic Section */}
                <Section className="mb-6" dir="rtl">
                    <Heading className="text-xl font-bold mb-4 text-gray-900 font-[Cairo]">
                        {t.headingAr}
                    </Heading>
                    <Text className="text-gray-700 text-base mb-6 leading-relaxed font-[Cairo]">
                        {t.bodyAr}
                    </Text>
                </Section>

                {/* Primary Button */}
                <Section className="mt-8 mb-8 text-center">
                    <Button
                        href={actionUrl}
                        className="bg-teal-600 text-white font-bold py-3 px-8 rounded-full no-underline inline-block"
                    >
                        {t.button} | {t.buttonAr}
                    </Button>
                </Section>

                <Text className="text-xs text-gray-400 mt-4">
                    If you cannot click the button, copy and paste this link into your browser:
                    <br />
                    <Link href={actionUrl} className="text-teal-600 underline break-all">
                        {actionUrl}
                    </Link>
                </Text>
            </Section>
        </EmailLayout>
    );
};

export default AuthActionTemplate;
