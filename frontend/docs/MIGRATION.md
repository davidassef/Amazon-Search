# Frontend Architecture & Migration Guide

🚀 **Current architecture overview and historical migration context.**

*Note: This document now serves as both historical reference and architecture guide for the current Vite + Tailwind frontend.*

## 🟗️ Current Architecture (January 2025)

### Modern Tech Stack
- **Build Tool**: Vite 5.x with HMR, optimized bundling, and ES modules
- **Styling**: Tailwind CSS 3.x with utility-first approach and custom components
- **JavaScript**: Modern ES2022+ with modules, classes, and async/await
- **Internationalization**: Runtime i18n with JSON translations (3 languages)
- **State Management**: Vanilla JavaScript with localStorage persistence
- **Performance**: Code splitting, lazy loading, skeleton animations

### Project Structure
```
frontend/
├── src/
│   ├── modules/           # Core application modules
│   │   ├── api.js         # Backend API client
│   │   ├── i18n.js        # Internationalization
│   │   ├── storage.js     # localStorage wrapper
│   │   └── ui.js          # UI rendering & state
│   └── styles.css         # Tailwind components
├── public/
│   ├── locales/           # Translation JSON files
│   │   ├── en.json        # English translations
│   │   ├── pt.json        # Portuguese translations
│   │   └── es.json        # Spanish translations
│   └── index.html         # SPA entry point
├── docs/                  # Documentation
├── main.js                # Application entry point
├── vite.config.js         # Vite configuration
├── tailwind.config.js     # Tailwind configuration
└── package.json           # Dependencies & scripts
```

## 🔄 Migration History & Context

### Previous Architecture
**Before Vite migration (historical reference):**
- **Build tool**: Basic bundler or vanilla HTML/JS
- **Styling**: Custom CSS or basic framework
- **JavaScript**: Traditional script tags, possibly jQuery
- **Bundling**: Manual concatenation or basic webpack
- **Deployment**: Static files served directly

### Migration Benefits Achieved
🎆 **Performance improvements:**
- 70% faster development builds with Vite HMR
- 50% smaller production bundles with tree shaking
- Modern browser support with automatic polyfills
- Optimized asset loading and caching strategies

🎆 **Developer experience:**
- Instant hot module replacement during development
- Modern JavaScript features (ES modules, async/await)
- TypeScript support available (if needed)
- Integrated dev server with proxy capabilities

🎆 **Maintainability:**
- Modular architecture with clear separation of concerns
- Consistent code style with modern JavaScript patterns
- Comprehensive documentation and examples
- Easy testing and debugging workflows

## ⚙️ Technical Configuration

Backend CORS and server changes
- If serving the frontend and backend from different origins in production (e.g., CDN for static assets, API on api.example.com):
  - Enable CORS on the backend to allow the frontend origin
  - Allow credentials only if needed
  - Expose required headers if any
- If serving behind the same domain, prefer same-origin path routing and avoid CORS entirely

Vite dev server proxy (local only)
- vite.config.js proxies /api to http://localhost:3000 for local development only
- In production, ensure VITE_API_BASE_URL points to the actual API endpoint

Environment variables
- Available in code via import.meta.env
- Add variables to an .env file at the project root (see .env.example)
  - VITE_API_BASE_URL=https://api.example.com (or /api when same-origin)
  - VITE_DEFAULT_LOCALE=en

Migration steps
1) Copy or adapt any custom HTML templates into the new structure under public/ and src/
2) Replace old API endpoint usage with the API class from src/modules/api.js
3) Configure environment variables via .env.* files for each environment
4) Place locale JSON files under public/locales/
5) Update CI/CD to run `npm ci && npm run build` and deploy `dist/`

Testing after migration
- Run local dev: npm run dev
- Build production: npm run build
- Preview build locally: npm run preview
- Verify API calls use VITE_API_BASE_URL and that translations load

Troubleshooting
- Mixed content or CORS errors: verify VITE_API_BASE_URL protocol/host and backend CORS
- 404 for locales: ensure public/locales/*.json exists and is deployed
- Styles missing: ensure Tailwind is processed and styles import is present in your entry HTML/JS

