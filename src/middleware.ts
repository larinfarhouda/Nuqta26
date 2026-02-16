import createMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const COOKIE_NAME = '__nuqta_ref';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export default function middleware(request: NextRequest) {
    const response = intlMiddleware(request);

    // Only set the referral cookie if it doesn't already exist
    if (!request.cookies.get(COOKIE_NAME)) {
        const url = request.nextUrl;
        const refData: Record<string, string> = {};

        // Capture UTM parameters
        for (const param of UTM_PARAMS) {
            const value = url.searchParams.get(param);
            if (value) refData[param] = value;
        }

        // Capture the HTTP Referer header (external referrer)
        const referrer = request.headers.get('referer') || '';
        if (referrer) refData.referrer = referrer;

        // Capture the landing page path
        refData.landing_page = url.pathname;

        // Only set cookie if we have meaningful data (UTM params or external referrer)
        const hasUtm = UTM_PARAMS.some((p) => url.searchParams.has(p));
        const hasExternalReferrer = referrer && !referrer.includes(url.host);

        if (hasUtm || hasExternalReferrer) {
            response.cookies.set(COOKIE_NAME, JSON.stringify(refData), {
                path: '/',
                maxAge: COOKIE_MAX_AGE,
                sameSite: 'lax',
                httpOnly: false, // Needs to be readable by client JS on the register page
            });
        }
    }

    return response;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next`, `/_vercel` or `/auth`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|auth|.*\\..*)*)']
};
