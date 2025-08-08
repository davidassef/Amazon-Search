# Amazon Product Scraper Frontend

🚀 **Production-ready frontend built with Vite, Tailwind CSS, and modern JavaScript modules.**

Search for products across 12 Amazon regions with real-time results, multi-language support, and responsive design.

## ⚡ Quick Start

**Prerequisites:** Node.js 18+ and npm 9+

```bash
# Install dependencies
npm ci

# Development server (hot reload)
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

## 🌍 Features

- **Multi-region support**: 12 Amazon countries (US, UK, CA, DE, FR, IT, ES, JP, AU, IN, BR, MX)
- **Internationalization**: English, Portuguese, and Spanish
- **Real-time search**: Debounced input with suggestions from search history
- **Responsive design**: Mobile-first grid layout with skeleton loading
- **Accessibility**: Keyboard navigation, proper ARIA labels, semantic HTML
- **Performance**: Code splitting, lazy loading, optimized builds

## ⚙️ Environment Variables

Create a `.env` file (see `.env.example`):

```bash
VITE_API_BASE_URL=/api          # Backend API endpoint
VITE_DEFAULT_LOCALE=en          # Default language (en|pt|es)
```

## 🏗️ Architecture

**Modern modular JavaScript architecture:**

```
src/
├── modules/
│   ├── api.js      # Backend API client with AbortController support
│   ├── i18n.js     # Internationalization with dynamic loading
│   ├── storage.js  # localStorage wrapper with error handling
│   └── ui.js       # UI rendering and state management
├── styles.css      # Tailwind components and custom styles
└── main.js         # Application entry point

public/
├── locales/        # Translation files (en.json, pt.json, es.json)
└── index.html      # SPA entry point
```

**Key Technologies:**
- **Vite**: Lightning-fast dev server and optimized production builds
- **Tailwind CSS**: Utility-first styling with custom Amazon-inspired typography
- **ES Modules**: Modern JavaScript with native imports/exports
- **Web APIs**: Fetch, AbortController, localStorage, Intersection Observer

## 🚀 Deployment

See [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) for production deployment guide.

**Recommended platforms:**
- **Frontend**: Vercel, Netlify, or GitHub Pages
- **Backend**: Render, Railway, or any Node.js hosting

## 📚 Documentation

- [`docs/COMPONENTS.md`](docs/COMPONENTS.md) - Module APIs and UI patterns
- [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) - Production deployment guide
- [`CONTRIBUTING.md`](CONTRIBUTING.md) - Development guidelines

## 🤝 Contributing

We welcome contributions! Please see [`CONTRIBUTING.md`](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see LICENSE file for details.

---

*Built with ❤️ using Vite, Tailwind CSS, and modern web standards*
*Last updated: January 2025*

