# Project Context

## Project Summary
Nuqta is a modern event management and listing platform built with Next.js 16. It features robust internationalization support, map integration, and utilizes Supabase for authentication and data persistence.

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, clsx, tailwind-merge
- **Backend**: Supabase (Auth, Database, SSR)
- **State/Forms**: React Hook Form, Zod, @hookform/resolvers
- **UI & Animations**: Lucide React, Framer Motion
- **Maps**: @react-google-maps/api
- **Internationalization**: next-intl

## File Map
- **/src/app**: Main application routes. Uses `[locale]` folder for internationalization routing.
- **/src/actions**: Server Actions for handling backend logic and Supabase interactions.
- **/src/components**: Reusable UI components.
- **/src/messages**: JSON translation files for localization.
- **/src/utils**: Helper functions and utilities.
- **/supabase**: Database migrations (`/migrations`) and configuration.
- **middleware.ts**: Configured for `next-intl` locale matching.

## Conventions
- **Routing**: Uses Next.js App Router with a `[locale]` dynamic segment for i18n.
- **Styling**: Exclusively uses Tailwind CSS. proper class merging is handled via `clsx` and `tailwind-merge`.
- **Validation**: Zod is the standard for schema validation, especially for forms.
- **Data Fetching**: Prefers Server Actions for mutations and data handling.
- **Type Safety**: strict TypeScript interfaces are expected for all components and data models.
