# Production Deployment Checklist

🚀 **Complete production readiness checklist for the Amazon Product Scraper frontend.**

This covers Vite + Tailwind CSS deployment with modern best practices for 2025.

## 📦 Build Optimization

### Core Build Process
- [ ] **Dependencies**: Run `npm ci` (not `npm install`) for reproducible builds
- [ ] **Production build**: `npm run build` completes without errors
- [ ] **Build output**: `dist/` folder contains optimized assets
- [ ] **Bundle analysis**: JavaScript chunks under 100KB each (use `npm run build -- --analyze`)
- [ ] **Asset optimization**: Images, fonts, and icons properly optimized

### Vite Configuration
```javascript
// vite.config.js production settings
export default defineConfig({
  build: {
    sourcemap: false,           // Disable for production
    minify: 'terser',          // Better compression than esbuild
    chunkSizeWarningLimit: 500, // Warn on large chunks
    rollupOptions: {
      output: {
        manualChunks: {          // Optimize chunk splitting
          vendor: ['tailwindcss']
        }
      }
    }
  }
})
```

- [ ] **Source maps**: Disabled in production (`build.sourcemap: false`)
- [ ] **Tree shaking**: Unused code eliminated (verify in build output)
- [ ] **Code splitting**: Modules split into efficient chunks
- [ ] **Asset hashing**: Files have content hashes for cache busting

## 🌐 Hosting Platform Setup

### Recommended Platforms (2025)

#### Vercel (Recommended)
```bash
# Deploy command
npm run build

# vercel.json configuration
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

#### Netlify
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
```

#### GitHub Pages
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

- [ ] **Platform chosen**: Vercel, Netlify, or GitHub Pages configured
- [ ] **Build command**: `npm run build` specified
- [ ] **Output directory**: `dist/` configured
- [ ] **Node.js version**: 18+ specified in platform settings

## ⚡ Performance & Caching

### CDN & Asset Delivery
```nginx
# Nginx configuration example
server {
  # Static assets (JS, CSS, images) - long cache
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, max-age=31536000, immutable";
    add_header Vary "Accept-Encoding";
  }
  
  # HTML files - short cache
  location ~* \.(html|json)$ {
    expires 1h;
    add_header Cache-Control "public, max-age=3600";
  }
}
```

- [ ] **Gzip compression**: Enabled for text assets (HTML, CSS, JS, JSON)
- [ ] **Brotli compression**: Enabled for better compression (if supported)
- [ ] **Asset caching**: Long cache (1 year) for hashed assets
- [ ] **HTML caching**: Short cache (1 hour) for `index.html`
- [ ] **Locale files**: Proper caching for `/locales/*.json`

### Compression Settings
```javascript
// Express.js example for custom server
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false
    return compression.filter(req, res)
  },
  level: 6,
  threshold: 1024
}))
```

- [ ] **Compression ratio**: 70%+ reduction for text assets
- [ ] **MIME types**: All relevant types included (`text/css`, `application/javascript`, `application/json`)
- [ ] **Minimum size**: Only compress files > 1KB

## 🔒 Security Configuration

### Security Headers
```nginx
# Security headers for Amazon Product Scraper
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.longlifenutri.com; base-uri 'self'; frame-ancestors 'none';";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
add_header X-Content-Type-Options "nosniff";
add_header X-Frame-Options "DENY";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=()";
```

- [ ] **CSP (Content Security Policy)**: Configured for Amazon domains and API endpoints
- [ ] **HSTS**: Strict Transport Security with preload
- [ ] **X-Content-Type-Options**: `nosniff` to prevent MIME sniffing
- [ ] **X-Frame-Options**: `DENY` to prevent clickjacking
- [ ] **Referrer Policy**: Balanced privacy and functionality
- [ ] **Permissions Policy**: Disable unused browser APIs

### HTTPS & TLS
- [ ] **HTTPS only**: All traffic redirected to HTTPS
- [ ] **TLS 1.3**: Modern TLS version enabled
- [ ] **Certificate**: Valid SSL/TLS certificate (Let's Encrypt or CA)
- [ ] **HSTS preload**: Submitted to HSTS preload list

## ⚙️ Environment Configuration

### Environment Variables
```bash
# .env.production
VITE_API_BASE_URL=https://api.longlifenutri.com
VITE_DEFAULT_LOCALE=en
```

- [ ] **API endpoint**: `VITE_API_BASE_URL` points to production API
- [ ] **Default locale**: `VITE_DEFAULT_LOCALE` set appropriately
- [ ] **No secrets**: Only `VITE_` prefixed variables (client-safe)
- [ ] **Environment specific**: Different values for staging/production

### Backend Integration
- [ ] **CORS configuration**: Backend allows frontend domain
- [ ] **API rate limiting**: Appropriate limits for production traffic
- [ ] **Error handling**: Graceful degradation when API unavailable
- [ ] **Monitoring**: API performance and error tracking

## ✅ Pre-Launch Verification

### Functionality Testing
- [ ] **Search functionality**: Product search works across all regions
- [ ] **Internationalization**: All three languages (en, pt, es) load correctly
- [ ] **Responsive design**: Works on mobile, tablet, and desktop
- [ ] **Accessibility**: Screen readers, keyboard navigation, color contrast
- [ ] **Performance**: Page loads < 3 seconds on 3G connection

### Technical Verification
```bash
# Performance audit
npm install -g lighthouse
lighthouse https://yourdomain.com --output=html

# Bundle analysis
npm run build -- --analyze

# Security scan
npm audit --production
```

- [ ] **Lighthouse score**: 90+ for Performance, Best Practices, Accessibility, SEO
- [ ] **Bundle size**: Total JavaScript < 150KB gzipped
- [ ] **Network requests**: < 20 requests for initial load
- [ ] **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] **Security audit**: No high/critical vulnerabilities

### Browser Testing
- [ ] **Chrome**: Latest version
- [ ] **Firefox**: Latest version
- [ ] **Safari**: Latest version (macOS/iOS)
- [ ] **Edge**: Latest version
- [ ] **Mobile browsers**: iOS Safari, Chrome Android

## 📊 Monitoring & Analytics

### Error Tracking
```javascript
// Optional: Sentry integration
import * as Sentry from '@sentry/browser'

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: 'YOUR_SENTRY_DSN',
    environment: 'production'
  })
}
```

- [ ] **Error tracking**: Sentry, LogRocket, or similar configured
- [ ] **Performance monitoring**: Core Web Vitals tracking
- [ ] **User analytics**: Privacy-friendly analytics (Plausible, Fathom)
- [ ] **Uptime monitoring**: Pingdom, UptimeRobot, or similar

### Log Monitoring
- [ ] **CDN logs**: Access and error logs monitored
- [ ] **Application errors**: JavaScript errors tracked
- [ ] **Performance metrics**: Load times, bundle sizes tracked
- [ ] **User behavior**: Search patterns, error rates analyzed

## 🔄 Post-Deployment

### Immediate Actions (First 24h)
- [ ] **Smoke test**: Full user journey tested
- [ ] **Performance check**: Lighthouse audit on live site
- [ ] **Error monitoring**: Check for new errors in logs
- [ ] **CDN propagation**: Verify global availability

### Ongoing Maintenance
- [ ] **Security updates**: Monthly dependency updates
- [ ] **Performance reviews**: Quarterly Lighthouse audits
- [ ] **User feedback**: Monitor support channels
- [ ] **Analytics review**: Monthly performance reports

---

## 📋 Quick Launch Checklist

**Final verification before going live:**

- [ ] Build passes: `npm run build`
- [ ] All tests pass: Manual functionality testing
- [ ] Security headers configured
- [ ] HTTPS enabled with valid certificate
- [ ] Environment variables set correctly
- [ ] CDN caching configured
- [ ] Error monitoring active
- [ ] Backup/rollback plan ready

🎉 **Ready to launch!**

---

*Last updated: January 2025 - Reflects modern deployment practices and security standards*

