import { Link } from '@/navigation';

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const ar = locale === 'ar';
    const sections = ar ? [
        ['دور نقطة', 'توفر نقطة صفحات للفعاليات وأدوات للحجز وإدارة الضيوف. المنظم المذكور في صفحة الفعالية مسؤول عن تقديم الفعالية وصحة معلوماتها وسلامتها والتصاريح اللازمة لها.'],
        ['الحجز والدفع', 'راجع الموعد والمكان والسعر والعملة والسعة وشروط الحضور قبل الحجز. في نظام الدفع اليدوي الحالي تدفع للمنظم مباشرة؛ رفع إثبات الدفع لا يعني تأكيد الحجز. انتظر تأكيد المنظم بعد التحقق من استلام المبلغ.'],
        ['الإلغاء والاسترداد', 'تظهر سياسة إلغاء الفعالية في صفحة الحجز. تواصل مع المنظم لطلبات الإلغاء أو الاسترداد أو عند تغيير الموعد أو إلغاء الفعالية. إذا لم تكن السياسة واضحة، اطلب توضيحها قبل الدفع. لا تلغي هذه الشروط حقوقك المقررة بموجب القانون المطبق.'],
        ['مسؤوليات المنظم', 'استخدم معلومات صحيحة وصفحات وصورًا تملك حق نشرها. وضّح السعر وشروط الحضور والإلغاء، وحدّث عدد المقاعد، وتحقق من الدفع الفعلي قبل التأكيد. استخدم بيانات الحضور لأغراض الحجز ولا ترسل لهم تسويقًا دون الموافقات اللازمة.'],
        ['الخطة المجانية والعروض المدفوعة', 'يمكنك البدء بالخطة المجانية ضمن الحدود المعروضة. لا يلزم شراء اشتراك لحجز فعاليات أو تجربة الخطة المجانية. راجع السعر ودورة الفوترة وشروط التجديد والإلغاء المعروضة قبل قبول عرض مدفوع.'],
        ['الاستخدام والدعم', 'لا تنشر فعاليات مضللة أو غير قانونية ولا تحاول الوصول إلى بيانات الآخرين. قد نراجع أو نزيل المحتوى المخالف. للإبلاغ عن مشكلة في المنصة أو طلب مساعدة في نزاع، راسل info@nuqta.ist مع رقم الحجز؛ لا ترسل بيانات بطاقتك أو كلمة المرور.'],
    ] : [
        ['Nuqta’s role', 'Nuqta provides event pages, registration and guest-management tools. The organizer identified on an event page is responsible for delivering the event, accurate information, safety and any required permissions.'],
        ['Bookings and payments', 'Check the date, venue, price, currency, capacity and attendance requirements before booking. In the current manual payment flow, you pay the organizer directly. Uploading a receipt does not confirm your booking: wait for the organizer to verify receipt of funds and confirm it.'],
        ['Cancellations and refunds', 'Review the event’s cancellation policy before paying. Contact the organizer for cancellations, refunds, postponements or cancelled events. If a policy is unclear, request clarification before payment. These terms do not remove rights you have under applicable law.'],
        ['Organizer responsibilities', 'Provide accurate details and use content you have permission to publish. Explain prices, attendance requirements and cancellation terms, keep capacity up to date, and check actual payment before confirming bookings. Use attendee data for registration purposes and obtain required permissions before sending marketing.'],
        ['Free plan and paid offers', 'You can start with the Free plan within its displayed limits. A subscription is not required to book events or try the Free plan. Review the price, billing period, renewal and cancellation terms shown before accepting a paid offer.'],
        ['Use and support', 'Do not post misleading or unlawful events or access other users’ data. We may review or remove content that violates these terms. For platform problems or help with a dispute, contact info@nuqta.ist with your booking reference; never send card credentials or passwords.'],
    ];
    return <article className="mx-auto max-w-3xl px-6 pt-32 pb-20 space-y-8">
        <h1 className="text-3xl font-bold">{ar ? 'شروط الاستخدام والحجز' : 'Terms of use and booking'}</h1>
        <p className="text-sm text-gray-500">{ar ? 'آخر تحديث: 14 سبتمبر 2026' : 'Updated September 14, 2026'}</p>
        {sections.map(([title, text]) => <section key={title}><h2 className="text-xl font-bold mb-3">{title}</h2><p className="leading-relaxed text-gray-700">{text}</p></section>)}
        <Link href="/privacy" className="text-primary underline">{ar ? 'سياسة الخصوصية' : 'Privacy policy'}</Link>
    </article>;
}
