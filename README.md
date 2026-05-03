<p align="center">
  <img src="public/nuqta_logo_transparent.png" alt="Nuqta Logo" width="100" />
</p>

<h1 align="center">Nuqta — Next.js Application</h1>

<p align="center">
  The core web application powering <a href="https://nuqta.ist">nuqta.ist</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1.1-black?style=flat-square&logo=next.js" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/Tests-94_passing-brightgreen?style=flat-square" />
</p>

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Architecture](#-architecture)
- [Directory Structure](#-directory-structure)
- [Routing & i18n](#-routing--i18n)
- [Layered Architecture](#-layered-architecture)
- [Components](#-component-library)
- [Services](#-services)
- [Authentication](#-authentication)
- [Email System](#-email-system)
- [Testing](#-testing)
- [Configuration](#-configuration)
- [Deployment](#-deployment)

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Set up environment (see Configuration section below)
cp .env.local.example .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## 🏗 Architecture

This app follows a **strict layered architecture** that separates presentation, business logic, and data access into distinct layers.

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER / CLIENT                         │
│                                                                  │
│   React Server Components (SSR)     Client Components (CSR)     │
│   ┌───────────────────────┐        ┌──────────────────────────┐  │
│   │ app/[locale]/page.tsx │        │ components/events/*.tsx  │  │
│   │ (Server-rendered HTML)│        │ (Interactive UI + Forms) │  │
│   └──────────┬────────────┘        └──────────┬───────────────┘  │
└──────────────┼─────────────────────────────────┼─────────────────┘
               │ import                          │ 'use server' call
               ▼                                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SERVER ACTIONS  (src/actions/)                  │
│                                                                  │
│   ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│   │ public/     │  │ vendor/      │  │ admin/               │   │
│   │ events.ts   │  │ events.ts    │  │ moderation.ts        │   │
│   │ reviews.ts  │  │ bookings.ts  │  │ vendors.ts           │   │
│   │ vendors.ts  │  │ analytics.ts │  │ users.ts             │   │
│   └──────┬──────┘  └──────┬───────┘  └──────────┬───────────┘   │
└──────────┼─────────────────┼─────────────────────┼──────────────┘
           │                 │                     │
           ▼                 ▼                     ▼
┌──────────────────────────────────────────────────────────────────┐
│                  SERVICES  (src/services/)                        │
│                                                                  │
│  EventService  │ BookingService │ VendorService │ AdminService   │
│  UserService   │ ReviewService  │ DiscountService │ ...          │
│  NotificationService │ AnalyticsService │ SubscriptionService   │
│                                                                  │
│  ✓ Business rules    ✓ Validation    ✓ Orchestration            │
│  ✗ NO direct DB calls                                            │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│               REPOSITORIES  (src/repositories/)                  │
│                                                                  │
│  BaseRepository (shared helpers)                                 │
│  EventRepo │ BookingRepo │ UserRepo │ VendorRepo │ ...          │
│                                                                  │
│  ✓ Database queries    ✓ Error mapping    ✗ NO business logic   │
└───────────────────────────────┬──────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                        SUPABASE                                  │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │ PostgreSQL   │   │ Auth         │   │ Storage             │  │
│  │ (Database)   │   │ (Email, OAuth│   │ (Images, Files)     │  │
│  │              │   │  Google SSO) │   │                     │  │
│  └──────────────┘   └──────────────┘   └─────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Key Rules

| Rule | Description |
|---|---|
| **Actions ≠ Logic** | Server actions only handle I/O — they delegate to services |
| **Services ≠ Data** | Services implement business rules — they call repositories for data |
| **Repos ≠ Rules** | Repositories only execute queries — no validation or business logic |
| **DI Everywhere** | Services receive dependencies via `ServiceFactory` (constructor injection) |

---

## 📁 Directory Structure

```
src/
├── app/                              # 📄 Next.js App Router
│   ├── [locale]/                     # 🌐 Locale-based routing
│   │   ├── (auth)/                   #    Login & Registration pages
│   │   ├── (public)/                 #    Public-facing pages
│   │   │   ├── page.tsx              #      → Homepage
│   │   │   ├── events/              #      → Event listing & details
│   │   │   ├── v/[slug]/            #      → Vendor profile pages
│   │   │   ├── for-vendors/         #      → Vendor landing page
│   │   │   ├── about/               #      → About page
│   │   │   ├── contact/             #      → Contact page
│   │   │   ├── privacy/             #      → Privacy policy
│   │   │   └── claim/               #      → Claim vendor page
│   │   ├── dashboard/
│   │   │   ├── user/                #      → Attendee dashboard
│   │   │   └── vendor/              #      → Vendor dashboard
│   │   └── admin/                   #      → Admin panel
│   │       ├── moderation/          #        Event moderation
│   │       ├── vendors/             #        Vendor management
│   │       ├── users/               #        User management
│   │       ├── bookings/            #        Booking oversight
│   │       ├── countries/           #        Country/region config
│   │       ├── subscriptions/       #        Subscription tier mgmt
│   │       ├── prospects/           #        Lead tracking
│   │       └── activity/            #        Activity logs
│   ├── api/                         # 🔌 API Routes
│   │   ├── cron/                    #    Scheduled tasks (daily-tasks)
│   │   ├── email-preview/           #    Email template previewer
│   │   └── notify-signup/           #    Webhook for new signups
│   └── auth/                        # 🔑 Auth callback handlers
│
├── actions/                          # 🎯 Server Actions
│   ├── auth.ts                      #    Authentication actions
│   ├── user.ts                      #    User profile actions
│   ├── public/                      #    Public content actions
│   │   ├── events.ts
│   │   ├── reviews.ts
│   │   └── vendors.ts
│   ├── vendor/                      #    Vendor dashboard actions
│   │   ├── events.ts
│   │   ├── bookings.ts
│   │   ├── analytics.ts
│   │   └── ...
│   └── admin/                       #    Admin actions
│       ├── moderation.ts
│       └── ...
│
├── services/                         # 💡 Business Logic
│   ├── service-factory.ts           #    Dependency injection container
│   ├── event.service.ts             #    Event CRUD + business rules
│   ├── booking.service.ts           #    Booking workflow + validation
│   ├── vendor.service.ts            #    Vendor profile management
│   ├── user.service.ts              #    User profiles + favorites
│   ├── review.service.ts            #    Reviews + rating calculation
│   ├── discount.service.ts          #    Promo codes + validation
│   ├── notification.service.ts      #    Email + push notifications
│   ├── analytics.service.ts         #    Dashboard analytics queries
│   ├── admin.service.ts             #    Admin operations
│   ├── category.service.ts          #    Event categories
│   ├── country.service.ts           #    Multi-country config
│   └── subscription-tier.service.ts #    Subscription tier logic
│
├── repositories/                     # 🗄️ Data Access
│   ├── base.repository.ts           #    Shared query helpers
│   └── [entity].repository.ts       #    One per database entity
│
├── components/                       # 🧩 React Components
│   ├── ui/                          #    Primitives (Button, Input, Modal)
│   ├── layout/                      #    Navbar, Footer, MobileNav
│   ├── home/                        #    Hero, CTA, FAQ, Categories
│   ├── events/                      #    EventCard, Search, Filters
│   ├── dashboard/                   #    Charts, Tables, Panels
│   ├── auth/                        #    LoginDialog, RegisterDialog
│   ├── vendor/                      #    Profile, Gallery, EventList
│   ├── vendor-landing/              #    Vendor conversion page
│   ├── reviews/                     #    ReviewCard, ReviewForm
│   ├── emails/                      #    React Email templates
│   ├── seo/                         #    JSON-LD, structured data
│   ├── admin/                       #    Admin panel components
│   └── claim/                       #    Claim vendor page
│
├── lib/                              # 🔧 Infrastructure
│   ├── errors/                      #    AppError, ValidationError, etc.
│   ├── logger/                      #    Structured logging (debug→error)
│   ├── cache/                       #    CacheManager (TTL + tag invalidation)
│   ├── performance/                 #    PerformanceMonitor (query timing)
│   ├── seo.ts                       #    SEO metadata helpers
│   └── gemini.ts                    #    AI integration (Instagram import)
│
├── messages/                         # 🌐 Translations
│   ├── ar.json                      #    Arabic translations
│   └── en.json                      #    English translations
│
├── types/                            # 📝 TypeScript Types
│   └── database.types.ts            #    Auto-generated Supabase types
│
├── utils/                            # 🛠 Utilities
│   ├── supabase/                    #    Supabase client helpers (server, client, middleware)
│   └── ...
│
├── hooks/                            # 🪝 Custom React Hooks
├── constants/                        # 📌 App Constants
├── middleware.ts                     # 🛡️ i18n + Auth Middleware
├── i18n.ts                          # 🌐 next-intl Configuration
└── navigation.ts                    # 🧭 Navigation Helpers
```

---

## 🌐 Routing & i18n

### URL Structure

All routes are prefixed with a locale segment:

```
https://nuqta.ist/en/events          ← English
https://nuqta.ist/ar/events          ← Arabic (RTL)
```

### Locale Configuration

```typescript
// src/i18n.ts
export const locales = ['ar', 'en'] as const;
export const defaultLocale = 'ar';
```

### How It Works

1. **Middleware** (`middleware.ts`) detects locale from URL, cookies, or `Accept-Language` header
2. **Layout** (`app/[locale]/layout.tsx`) sets `dir="rtl"` or `dir="ltr"` based on locale
3. **Components** use `useTranslations()` from `next-intl` for translated strings
4. **Translation files** live in `src/messages/ar.json` and `src/messages/en.json`

### Adding a Translation

```json
// src/messages/en.json
{
  "Events": {
    "title": "Discover Events",
    "searchPlaceholder": "Search events..."
  }
}

// src/messages/ar.json
{
  "Events": {
    "title": "اكتشف الفعاليات",
    "searchPlaceholder": "ابحث عن فعاليات..."
  }
}
```

```tsx
// In a component
import { useTranslations } from 'next-intl';

export function EventSearch() {
  const t = useTranslations('Events');
  return <input placeholder={t('searchPlaceholder')} />;
}
```

---

## 🧱 Layered Architecture

### The Service Factory

All services are instantiated through `ServiceFactory`, which handles dependency injection:

```typescript
// src/services/service-factory.ts
export class ServiceFactory {
  static createEventService(supabase: SupabaseClient) {
    const eventRepo = new EventRepository(supabase);
    const ticketRepo = new TicketRepository(supabase);
    return new EventService(eventRepo, ticketRepo);
  }

  static createBookingService(supabase: SupabaseClient) {
    const bookingRepo = new BookingRepository(supabase);
    const eventRepo = new EventRepository(supabase);
    return new BookingService(bookingRepo, eventRepo);
  }

  // ... more factories
}
```

### Creating a New Feature (End-to-End)

**Step 1: Repository** — Data access only
```typescript
// src/repositories/feature.repository.ts
export class FeatureRepository extends BaseRepository {
  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('features')
      .select('*')
      .eq('id', id)
      .single();
    return this.handleResult(data, error);
  }
}
```

**Step 2: Service** — Business logic
```typescript
// src/services/feature.service.ts
export class FeatureService {
  constructor(private featureRepo: FeatureRepository) {}

  async getFeature(id: string) {
    if (!id) throw new ValidationError('ID is required');
    const feature = await this.featureRepo.findById(id);
    if (!feature) throw new NotFoundError('Feature');
    return feature;
  }
}
```

**Step 3: Server Action** — Entry point
```typescript
// src/actions/public/features.ts
'use server';
export async function getFeature(id: string) {
  const supabase = await createClient();
  const service = ServiceFactory.createFeatureService(supabase);
  return service.getFeature(id);
}
```

**Step 4: Component** — UI
```tsx
// In a component
const feature = await getFeature(id);
```

---

## 🧩 Component Library

### Component Organization

| Directory | Purpose | Examples |
|---|---|---|
| `ui/` | Reusable primitives | Button, Input, Modal, Toast, Badge |
| `layout/` | App shell | Navbar, Footer, MobileNav, Sidebar |
| `home/` | Homepage sections | HeroSection, CategoriesGrid, FAQ |
| `events/` | Event-related | EventCard, EventSearch, EventFilters |
| `dashboard/` | Dashboard widgets | StatsCard, BookingTable, ChartWidget |
| `auth/` | Authentication | LoginDialog, RegisterDialog, MobileLogin |
| `vendor/` | Vendor profiles | VendorHero, VendorGallery, VendorEvents |
| `emails/` | Email templates | BookingConfirmation, EventReminder |
| `seo/` | SEO helpers | EventJsonLd, VendorJsonLd |

### Styling Convention

All components use Tailwind CSS with `clsx` and `tailwind-merge` for class composition:

```tsx
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Button({ variant = 'primary', className, ...props }) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-lg font-medium transition-colors',
        variant === 'primary' && 'bg-purple-600 text-white hover:bg-purple-700',
        variant === 'outline' && 'border border-gray-300 hover:bg-gray-50',
        className
      )}
      {...props}
    />
  );
}
```

---

## 🔐 Authentication

Authentication is handled by **Supabase Auth** with support for:

| Method | Status |
|---|---|
| Email + Password | ✅ Active |
| Google OAuth | ✅ Active |
| Magic Links | ✅ Active (admin impersonation) |

### Auth Flow

```
User clicks "Login"
      │
      ▼
LoginDialog (client component)
      │
      ▼
Server Action: signIn()
      │
      ▼
Supabase Auth API
      │
      ▼
Middleware intercepts response
      │
      ▼
Session cookie set → Redirect to dashboard
```

### Route Protection

The `middleware.ts` handles:
- Locale detection and redirection
- Session validation for protected routes (`/dashboard/*`, `/admin/*`)
- Role-based access control (admin vs vendor vs user)

---

## 📧 Email System

Emails are built with **React Email** and sent via **Resend**:

```
React Email Component → render() → HTML string → Resend API → Inbox
```

### Email Templates

| Template | Trigger |
|---|---|
| Booking Confirmation | New booking created |
| Event Reminder | 24h before event |
| Post-Event Review Request | Day after event ends |
| Welcome Email | New user signup |
| Vendor Signup Notification | New vendor registers |

### Previewing Emails

Visit `/api/email-preview` during development to see rendered email templates.

---

## 🧪 Testing

### Test Stack

| Tool | Purpose |
|---|---|
| **Jest** | Unit testing framework |
| **Testing Library** | React component testing |
| **Playwright** | End-to-end testing |

### Coverage Summary

```
Test Suites: 6 passed, 6 total
Tests:       94 passed, 94 total
Time:        < 1 second

Service Coverage:
  UserService     → 95.23%  ⭐
  EventService    → 91.22%  ⭐
  ReviewService   → 90.00%  ⭐
  DiscountService → 86.11%  ⭐
  BookingService  → 63.93%  ✅
```

### Running Tests

```bash
npm test                           # All tests
npm run test:watch                 # Watch mode
npm run test:coverage              # With coverage report
npm test -- event.service.test.ts  # Specific test file

# E2E Tests
npm run test:e2e                   # Run Playwright tests
npm run test:e2e:ui                # With Playwright UI
npm run test:e2e:headed            # In headed browser
npm run test:e2e:report            # View HTML report
```

---

## ⚙️ Configuration

### Key Config Files

| File | Purpose |
|---|---|
| `next.config.ts` | Next.js configuration (images, redirects, headers) |
| `tsconfig.json` | TypeScript configuration |
| `eslint.config.mjs` | ESLint rules |
| `jest.config.js` | Jest test configuration |
| `playwright.config.ts` | Playwright E2E config |
| `postcss.config.mjs` | PostCSS (Tailwind CSS) |
| `sentry.server.config.ts` | Sentry server-side config |
| `sentry.edge.config.ts` | Sentry edge runtime config |
| `vercel.json` | Vercel deployment config |

### Important Next.js Config

```typescript
// next.config.ts (key settings)
{
  images: {
    remotePatterns: [
      { hostname: '*.supabase.co' },  // Supabase storage images
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },
}
```

---

## 🚢 Deployment

### Vercel (Production)

The app is deployed on **Vercel** with:
- Automatic deployments from `main` branch
- Preview deployments for PRs
- Edge functions for middleware
- Global CDN for static assets

### Build

```bash
npm run build    # Create production build
npm start        # Start production server locally
```

### Environment Variables

All environment variables must be configured in Vercel's dashboard under **Settings → Environment Variables**.

---

## 📖 Related Documentation

| Document | Path |
|---|---|
| Root Project README | [../README.md](../README.md) |
| Architecture Deep-Dive | [../docs/architecture.md](../docs/architecture.md) |
| Developer Onboarding | [../docs/guides/getting-started.md](../docs/guides/getting-started.md) |
| Business Profile | [../BUSINESS_PROFILE.md](../BUSINESS_PROFILE.md) |

---

<p align="center">
  <sub>Part of the <a href="https://nuqta.ist">Nuqta</a> platform • Built with Next.js 16</sub>
</p>
