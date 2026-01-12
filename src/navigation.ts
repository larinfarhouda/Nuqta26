import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
    locales: ['ar', 'en'],
    defaultLocale: 'ar',
    localeDetection: false
});

export const { Link, redirect, usePathname, useRouter } =
    createNavigation(routing);
