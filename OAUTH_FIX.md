# OAuth Vendor Redirect Fix

## Issue
When vendors logged in using Google OAuth, they were being redirected to the user dashboard instead of the vendor dashboard.

## Root Cause
The auth callback route (`/auth/callback/route.ts`) was only checking `user.user_metadata?.role` to determine where to redirect users. However, for OAuth signups (Google, Facebook, etc.), the `user_metadata.role` is often not set or defaults to 'user', even if the profile in the database has `role: 'vendor'`.

## Screenshot
![OAuth redirect error](file:///Users/larin/.gemini/antigravity/brain/37757cff-8ebc-4749-8d40-ce4f1ece7164/uploaded_media_1770039718637.png)

## Solution
Updated the auth callback to query the `profiles` table to get the actual role:

```typescript
// Before - only checking metadata
let finalRole = user.user_metadata?.role;

// After - checking profiles table first
const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

let finalRole = profile?.role || user.user_metadata?.role || 'user';
```

## Changes Made
Updated [auth/callback/route.ts](file:///Users/larin/NuqtaIST/nuqta/src/app/auth/callback/route.ts#L18-L25):
- Added query to `profiles` table to fetch actual role
- Fallback chain: profiles table → user_metadata → default to 'user'
- More reliable redirect logic for all authentication methods

## Testing
Please test the following:

1. **Existing Vendor with OAuth**:
   - Log out completely
   - Log in with Google using your vendor account
   - ✅ Should redirect to `/dashboard/vendor`

2. **New OAuth Signup**:
   - Use a new Google account
   - Sign up from register page as vendor
   - ✅ Should redirect to `/dashboard/vendor`

3. **Regular Email Login** (should still work):
   - Log in with email/password as vendor
   - ✅ Should redirect to `/dashboard/vendor`

## Impact
- ✅ Fixes vendor OAuth redirects
- ✅ More reliable role detection
- ✅ Works for all authentication methods (email, Google, Facebook)
- ✅ No breaking changes to existing functionality
