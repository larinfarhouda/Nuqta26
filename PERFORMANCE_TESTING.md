# Testing Mobile Optimizations

## Quick Start
```bash
# Development mode
npm run dev

# Production build (to test optimizations)
npm run build
npm start
```

## Performance Testing

### 1. Chrome DevTools (Mobile Simulation)
1. Open DevTools (F12)
2. Click "Toggle device toolbar" (Ctrl+Shift+M)
3. Select a mobile device (e.g., iPhone 12)
4. Go to Network tab → Select "Slow 3G" or "Fast 3G"
5. Reload the page
6. Check:
   - Network waterfall
   - Image sizes
   - JavaScript bundle sizes
   - Page load time

### 2. Lighthouse Audit
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Select "Mobile"
4. Check "Performance"
5. Click "Analyze page load"
6. Target scores:
   - Performance: > 90
   - FCP: < 1.5s
   - LCP: < 2.5s
   - TBT: < 200ms
   - CLS: < 0.1

### 3. Network Tab Analysis
Check that:
- ✓ Hero image is `hero_community_optimized.jpg` (237KB, not 595KB PNG)
- ✓ Images are served as WebP (in modern browsers)
- ✓ Fonts load with `font-display: swap`
- ✓ Below-fold images are lazy-loaded
- ✓ Heavy components are code-split

### 4. Coverage Analysis
1. DevTools → More Tools → Coverage
2. Reload page
3. Check JavaScript and CSS usage
4. Green = used, Red = unused
5. Should see < 30% unused code on initial load

## What Changed?

### Images
- Hero image: **595KB → 237KB** (60% reduction)
- Lazy loading for all below-fold images
- WebP/AVIF support enabled
- Blur placeholders for better UX

### JavaScript
- Removed Framer Motion: **~50KB saved**
- Dynamic imports for 4 components
- Code splitting enabled
- Console.logs removed in production

### CSS
- Backdrop-filter disabled on mobile
- Simplified shadows on mobile
- Reduced animations on mobile
- Mobile-first media queries

### Fonts
- Removed GeistMono: **~25KB saved**
- Limited font weights
- Font preloading enabled
- Display swap for faster rendering

## Expected Results

### Before (Slow 3G):
- First paint: ~4-5s
- LCP: ~6-7s
- JavaScript: ~800KB
- Hero image: 595KB
- **Total: ~5-6s to interactive**

### After (Slow 3G):
- First paint: ~1.5-2s
- LCP: ~2.5-3s
- JavaScript: ~650KB (20% reduction)
- Hero image: 237KB (60% reduction)
- **Total: ~2.5-3s to interactive**

## Monitoring in Production

Add Google Analytics or Vercel Analytics to track:
- Core Web Vitals
- Real User Monitoring (RUM)
- Geographic performance
- Device-specific metrics

## Common Issues

**Images not loading?**
- Check `next.config.ts` image domains
- Verify image paths in `/public/images/`

**Fonts not loading?**
- Clear `.next` cache
- Rebuild the project

**Slow on mobile?**
- Verify mobile CSS is applied
- Check Network throttling is disabled
- Clear browser cache

**Build errors?**
- Delete `.next` folder
- Delete `node_modules`
- Run `npm install`
- Run `npm run build`
