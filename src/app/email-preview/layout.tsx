import '@/app/globals.css';

export const metadata = {
    title: 'Email Templates Preview',
    description: 'Preview email templates for Nuqta',
};

export default function EmailPreviewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="bg-gray-100 min-h-screen">
                {children}
            </body>
        </html>
    );
}
