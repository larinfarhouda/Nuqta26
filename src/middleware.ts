import createMiddleware from 'next-intl/middleware';
import { routing } from './navigation';
import { NextRequest, NextResponse } from 'next/server';

const intlMiddleware = createMiddleware(routing);

const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'] as const;
const COOKIE_NAME = '__nuqta_ref';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds
const COUNTRY_COOKIE = '__nuqta_country';

// Map of ISO country codes to our internal country IDs
const COUNTRY_MAP: Record<string, string> = {
    TR: 'tr',
    EG: 'eg',
};

// Common scraper/script user agents that consume CPU without being real visitors
const BLOCKED_USER_AGENTS = [
    'python-requests',
    'curl/',
    'wget/',
    'go-http-client',
    'java/',
    'urllib',
    'scrapy',
    'postmanruntime',
    'axios',
    'node-fetch'
];

// --- In-Memory IP Rate Limiter ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_MAX_REQUESTS = 50;      // max requests per window per IP

const ipRequestMap = new Map<string, { count: number; firstRequest: number }>();

// Clean up expired entries every 2 minutes to prevent memory leaks
let lastCleanup = Date.now();
function cleanupExpiredEntries() {
    const now = Date.now();
    if (now - lastCleanup < 120_000) return; // Only clean every 2 min
    lastCleanup = now;
    for (const [ip, data] of ipRequestMap) {
        if (now - data.firstRequest > RATE_LIMIT_WINDOW_MS) {
            ipRequestMap.delete(ip);
        }
    }
}

function isRateLimited(ip: string): boolean {
    cleanupExpiredEntries();
    const now = Date.now();
    const entry = ipRequestMap.get(ip);

    if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW_MS) {
        // New window
        ipRequestMap.set(ip, { count: 1, firstRequest: now });
        return false;
    }

    entry.count++;
    if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
        return true;
    }
    return false;
}

export default function middleware(request: NextRequest) {
    const userAgent = request.headers.get('user-agent')?.toLowerCase() || '';

    // Vercel's internal favicon bot — redirect straight to the static file
    // instead of rendering the entire homepage just to find the favicon
    if (userAgent.includes('vercel-favicon')) {
        return NextResponse.redirect(new URL('/favicon.ico', request.url));
    }

    // Sentry Uptime Monitor — redirect to lightweight /api/health endpoint
    // so it tests real app health without triggering a full homepage SSR render
    if (userAgent.includes('sentryuptimebot')) {
        return NextResponse.rewrite(new URL('/api/health', request.url));
    }

    // Block obvious scripts and scrapers early to save CPU time
    if (BLOCKED_USER_AGENTS.some(bot => userAgent.includes(bot))) {
        return new NextResponse('Forbidden: Access Denied', { status: 403 });
    }

    // --- IP Rate Limiting ---
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        || request.headers.get('x-real-ip')
        || 'unknown';

    if (ip !== 'unknown' && isRateLimited(ip)) {
        return new NextResponse('Too Many Requests', {
            status: 429,
            headers: { 'Retry-After': '60' },
        });
    }

    const response = intlMiddleware(request);

    // --- Request Tracing ---
    // Generate a unique requestId for distributed tracing
    const requestId = crypto.randomUUID();
    response.headers.set('x-request-id', requestId);

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

    // --- Country Detection ---
    // Only set if not already set (visitor can override via UI later)
    if (!request.cookies.get(COUNTRY_COOKIE)) {
        // Vercel provides this header on deployed environments
        const vercelCountry = request.headers.get('x-vercel-ip-country');
        const detectedCountry = vercelCountry ? COUNTRY_MAP[vercelCountry] : undefined;

        if (detectedCountry) {
            response.cookies.set(COUNTRY_COOKIE, detectedCountry, {
                path: '/',
                maxAge: 365 * 24 * 60 * 60, // 1 year
                sameSite: 'lax',
                httpOnly: false, // Needs to be readable by client JS
            });
        }
    }

    // --- Edge Caching for Public Pages ---
    // If the visitor is NOT logged in, cache public pages at Vercel's edge
    // to avoid re-running the serverless function for every bot request.
    const pathname = request.nextUrl.pathname;
    const isPublicPage = !pathname.includes('/dashboard') && !pathname.includes('/admin');
    const hasAuthCookie = request.cookies.getAll().some(c => c.name.includes('sb-') && c.name.includes('auth-token'));

    if (isPublicPage && !hasAuthCookie) {
        response.headers.set(
            'Cache-Control',
            's-maxage=60, stale-while-revalidate=300'
        );
    }

    return response;
}

export const config = {
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next`, `/_vercel` or `/auth`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    matcher: ['/((?!api|_next|_vercel|auth|.*\\..*)*)']
};
