import * as React from 'react';
import EmailLayout from './EmailLayout';

interface ReviewReceivedTemplateProps {
    vendorName: string;
    eventName: string;
    rating: number;
    comment?: string;
    reviewUrl: string;
    locale?: 'en' | 'ar';
}

export const ReviewReceivedTemplate: React.FC<ReviewReceivedTemplateProps> = ({
    vendorName,
    eventName,
    rating,
    comment,
    reviewUrl,
    locale = 'en',
}) => {
    const isAr = locale === 'ar';

    const content = {
        en: {
            subject: 'New Review Received!',
            greeting: `Hello ${vendorName},`,
            message: `You have received a new ${rating}-star review for your event "${eventName}".`,
            reviewHeading: 'Review Details:',
            ratingLabel: 'Rating:',
            commentLabel: 'Comment:',
            cta: 'View Review in Dashboard',
            footer: 'Keep up the great work!',
        },
        ar: {
            subject: 'تقييم جديد تم استلامه!',
            greeting: `مرحباً ${vendorName}،`,
            message: `لقد تلقيت تقييماً جديداً بـ ${rating} نجوم لفعاليتك "${eventName}".`,
            reviewHeading: 'تفاصيل التقييم:',
            ratingLabel: 'التقييم:',
            commentLabel: 'التعليق:',
            cta: 'عرض التقييم في لوحة التحكم',
            footer: 'استمر في العمل الرائع!',
        },
    };

    const t = content[locale];

    return (
        <EmailLayout locale={locale}>
            <h1 style={{
                color: '#1a1a1a',
                fontSize: '24px',
                fontWeight: '900',
                textAlign: isAr ? 'right' : 'left',
                margin: '0 0 20px 0'
            }}>
                {t.subject}
            </h1>

            <p style={{
                color: '#444444',
                fontSize: '16px',
                lineHeight: '1.5',
                textAlign: isAr ? 'right' : 'left',
                margin: '0 0 16px 0'
            }}>
                {t.greeting}
            </p>

            <p style={{
                color: '#444444',
                fontSize: '16px',
                lineHeight: '1.5',
                textAlign: isAr ? 'right' : 'left',
                margin: '0 0 24px 0'
            }}>
                {t.message}
            </p>

            <div style={{
                backgroundColor: '#f9f9f9',
                borderRadius: '12px',
                padding: '20px',
                margin: '0 0 24px 0',
                border: '1px solid #eeeeee'
            }}>
                <h2 style={{
                    color: '#1a1a1a',
                    fontSize: '18px',
                    fontWeight: '700',
                    textAlign: isAr ? 'right' : 'left',
                    margin: '0 0 12px 0'
                }}>
                    {t.reviewHeading}
                </h2>

                <p style={{
                    fontSize: '16px',
                    margin: '0 0 8px 0',
                    textAlign: isAr ? 'right' : 'left'
                }}>
                    <strong>{t.ratingLabel}</strong> {rating} / 5
                </p>

                {comment && (
                    <p style={{
                        fontSize: '16px',
                        fontStyle: 'italic',
                        color: '#666666',
                        margin: '0',
                        textAlign: isAr ? 'right' : 'left'
                    }}>
                        <strong>{t.commentLabel}</strong> "{comment}"
                    </p>
                )}
            </div>

            <div style={{ textAlign: isAr ? 'right' : 'left', margin: '32px 0' }}>
                <a
                    href={reviewUrl}
                    style={{
                        backgroundColor: '#F26522',
                        borderRadius: '12px',
                        color: '#fff',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        textDecoration: 'none',
                        textAlign: 'center',
                        display: 'inline-block',
                        padding: '16px 32px',
                    }}
                >
                    {t.cta}
                </a>
            </div>

            <p style={{
                color: '#888888',
                fontSize: '14px',
                textAlign: isAr ? 'right' : 'left',
                margin: '32px 0 0 0'
            }}>
                {t.footer}
            </p>
        </EmailLayout>
    );
};

export default ReviewReceivedTemplate;
