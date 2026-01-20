# 🔍 Production Performance Checklist

## 🚀 Pre-Deployment Checklist

Before deploying to production, ensure these are all configured:

### ✅ Vercel/Hosting Optimizations

#### 1. **Enable Edge Caching**
In your Vercel project settings:
- ✅ Enable "Edge Network"
- ✅ Set Cache-Control headers
- ✅ Enable Image Optimization

#### 2. **Environment Variables**
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://www.nuqta.ist
```

#### 3. **Compression**
Vercel automatically enables:
- ✅ Brotli compression
- ✅ Gzip fallback
- ✅ Smart CDN caching

#### 4. **Headers Configuration**
Create `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/images/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/_next/static/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/fonts/:path*",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## 🎯 Production-Only Optimizations

### 1. **Supabase Connection Pooling**
Ensure your Supabase is using connection pooling:
```env
DATABASE_URL=postgresql://...?pgbouncer=true
```

### 2. **Image Domains Security**
Already configured in `next.config.ts` ✅

### 3. **API Route Caching**
Add caching to your server actions:
```ts
export const revalidate = 60; // Cache for 60 seconds
```

---

## 📊 Expected Production Scores

### After Deployment:
```
Mobile PageSpeed:
┌─────────────────┬──────────┬─────────┐
│ Metric          │ Score    │ Value   │
├─────────────────┼──────────┼─────────┤
│ Performance     │ 90-95 🟢 │         │
│ FCP             │ 100 🟢   │ <1.8s   │
│ LCP             │ 90+ 🟢   │ <2.5s   │
│ CLS             │ 95+ 🟢   │ <0.1    │
│ SI              │ 85+ 🟢   │ <3.4s   │
│ TBT             │ 100 🟢   │ <200ms  │
└─────────────────┴──────────┴─────────┘
```

---

## 🔧 Common Production Issues & Fixes

### Issue 1: "Render-Blocking Resources"
**Solution**: Already fixed! ✅
- Fonts have `display: swap`
- CSS is inlined for critical path
- Scripts are deferred

### Issue 2: "Eliminate Unused JavaScript"
**Solution**: Already fixed! ✅
- Dynamic imports for heavy components
- Tree-shaking enabled
- Bundle analysis shows minimal waste

### Issue 3: "Serve Images in Next-Gen Formats"
**Solution**: Already configured! ✅
```ts
formats: ['image/webp', 'image/avif']
```

### Issue 4: "Reduce Server Response Time (TTFB)"
**Check**:
- Supabase region matches Vercel region
- Connection pooling enabled
- API routes cached where appropriate

---

## 🌍 CDN & Edge Optimization

### Already Optimized:
- ✅ Next.js automatic static optimization
- ✅ Edge functions for API routes
- ✅ Image optimization on Vercel Edge
- ✅ Smart CDN for static assets

### Recommended Regions:
- **Primary**: Frankfurt (eu-central-1)
- **Backup**: Istanbul (if available)

---

## 📈 Real User Monitoring (RUM)

### Enable Web Vitals Tracking:
Add to `src/app/[locale]/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function Layout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Install packages:
```bash
npm install @vercel/analytics @vercel/speed-insights
```

---

## 🎯 Post-Deployment Verification

### 1. **Run PageSpeed Insights**
Test multiple pages:
- ✅ Homepage: `https://www.nuqta.ist`
- ✅ Vendor landing: `https://www.nuqta.ist/for-vendors`
- ✅ Event page: `https://www.nuqta.ist/events/[id]`

### 2. **Check Lighthouse**
In Chrome DevTools:
- Mobile + Slow 4G
- Desktop + Fast connection

### 3. **Monitor Core Web Vitals**
In Vercel Analytics:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1

### 4. **Test Real Devices**
- iPhone (Safari)
- Android (Chrome)
- Tablet

---

## 🚨 If Production Score is Lower

### Common Causes:

1. **DNS/SSL Issues**
   - Add `dns-prefetch` for all external domains
   - Ensure SSL certificate is valid

2. **Database Location**
   - Supabase region should be close to users
   - Check query performance

3. **API Response Times**
   - Add caching to server actions
   - Use database indexes

4. **Third-Party Scripts**
   - Check if any analytics slowing down
   - Use `next/script` with proper strategy

---

## 🎊 Success Criteria

Your production site should have:

- ✅ **All green Core Web Vitals**
- ✅ **Performance Score: 90+**
- ✅ **All metrics in green range**
- ✅ **Fast repeat visits** (<1s LCP)

---

## 📝 Next Steps

1. **Deploy** latest changes to Vercel
2. **Wait 5 minutes** for edge cache to populate
3. **Run PageSpeed** on production URL
4. **Share results** and we'll optimize further if needed

---

**Current commit**: `f5562f2`
**Ready for production**: ✅
