# Configuration Guide

**Description:** Comprehensive configuration reference covering environment variables, build settings, and runtime configurations for both backend and frontend components.

**Last Updated:** January 2025

---

## Table of Contents

- [Overview](#-overview)
- [Backend Configuration](#-backend-configuration)
- [Frontend Configuration](#-frontend-configuration)
- [Internationalization Configuration](#-internationalization-configuration)
- [Testing Configuration](#-testing-configuration)
- [Production Configuration](#-production-configuration)
- [Advanced Configuration](#-advanced-configuration)
- [Configuration Validation](#-configuration-validation)
- [Configuration Checklist](#-configuration-checklist)
- [Configuration Troubleshooting](#-configuration-troubleshooting)

---

## 📋 Overview

This guide covers all configuration options for the Amazon Product Scraper, including environment variables, build configurations, and runtime settings for both backend and frontend components.

---

## 🔧 Backend Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cd backend
touch .env
```

#### Core Settings

```env
# Server Configuration
PORT=3000
NODE_ENV=development
HOST=localhost

# Request Configuration
REQUEST_TIMEOUT=10000
MAX_RETRIES=3
RETRY_DELAY=2000

# Rate Limiting
MAX_REQUESTS_PER_MINUTE=60
RATE_LIMIT_WINDOW=60000

# CORS Configuration
CORS_ORIGIN=http://localhost:5173
CORS_METHODS=GET,POST,OPTIONS
CORS_CREDENTIALS=false

# Security
TRUST_PROXY=false
```

#### Amazon Scraping Settings

```env
# Amazon Domain Configuration
DEFAULT_AMAZON_DOMAIN=amazon.com
SUPPORTED_DOMAINS=amazon.com,amazon.co.uk,amazon.de,amazon.fr

# User Agent Rotation
ROTATE_USER_AGENTS=true
RANDOM_DELAY_MIN=500
RANDOM_DELAY_MAX=1500

# Scraping Limits
MAX_PRODUCTS_PER_REQUEST=50
MAX_CONCURRENT_REQUESTS=5
```

#### Development Settings

```env
# Development Mode
DEBUG=true
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true

# Testing
TEST_MODE=false
MOCK_RESPONSES=false
```

### Server Configuration

#### Default Configuration (`backend/server.js`)

```javascript
const config = {
  port: process.env.PORT || 3000,
  host: process.env.HOST || 'localhost',
  requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
  maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
  retryDelay: parseInt(process.env.RETRY_DELAY) || 2000,
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: process.env.CORS_METHODS?.split(',') || ['GET', 'POST', 'OPTIONS'],
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60
  }
};
```

#### Custom Configuration File

Create `backend/config.js` for advanced configuration:

```javascript
const config = {
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    timeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000
  },
  
  scraping: {
    maxRetries: parseInt(process.env.MAX_RETRIES) || 3,
    retryDelay: parseInt(process.env.RETRY_DELAY) || 2000,
    randomDelayMin: parseInt(process.env.RANDOM_DELAY_MIN) || 500,
    randomDelayMax: parseInt(process.env.RANDOM_DELAY_MAX) || 1500,
    maxProductsPerRequest: parseInt(process.env.MAX_PRODUCTS_PER_REQUEST) || 50
  },
  
  amazon: {
    domains: {
      'amazon.com': { 
        baseUrl: 'https://www.amazon.com', 
        language: 'en-US,en;q=0.9' 
      },
      'amazon.co.uk': { 
        baseUrl: 'https://www.amazon.co.uk', 
        language: 'en-GB,en;q=0.9' 
      },
      // Add more domains as needed
    },
    defaultDomain: process.env.DEFAULT_AMAZON_DOMAIN || 'amazon.com'
  },
  
  security: {
    trustProxy: process.env.TRUST_PROXY === 'true',
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      credentials: process.env.CORS_CREDENTIALS === 'true'
    }
  }
};

module.exports = config;
```

---

## 🎨 Frontend Configuration

### Environment Variables

Create a `.env` file in the `frontend/` directory:

```bash
cd frontend
touch .env
```

#### Core Settings

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=30000

# Development Settings
VITE_NODE_ENV=development
VITE_DEBUG=true

# Build Configuration
VITE_BUILD_TARGET=es2015
VITE_SOURCEMAP=true

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SERVICE_WORKER=false
```

#### Internationalization Settings

```env
# i18n Configuration
VITE_DEFAULT_LANGUAGE=en
VITE_SUPPORTED_LANGUAGES=en,pt,es
VITE_LANGUAGE_DETECTION=true
VITE_FALLBACK_LANGUAGE=en
```

#### UI/UX Settings

```env
# Theme Configuration
VITE_DEFAULT_THEME=light
VITE_ENABLE_DARK_MODE=true

# Performance
VITE_ENABLE_LAZY_LOADING=true
VITE_IMAGE_OPTIMIZATION=true
VITE_CACHE_DURATION=3600000

# Search Configuration
VITE_MAX_SEARCH_RESULTS=50
VITE_DEBOUNCE_DELAY=300
```

### Vite Configuration

#### `frontend/vite.config.js`

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  // Server configuration
  server: {
    port: parseInt(process.env.VITE_PORT) || 5173,
    host: process.env.VITE_HOST || 'localhost',
    open: process.env.VITE_AUTO_OPEN === 'true',
    cors: true
  },
  
  // Build configuration
  build: {
    target: process.env.VITE_BUILD_TARGET || 'es2015',
    outDir: 'dist',
    sourcemap: process.env.VITE_SOURCEMAP === 'true',
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
    
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['i18next', 'i18next-browser-languagedetector']
        }
      }
    }
  },
  
  // Environment variables prefix
  envPrefix: 'VITE_',
  
  // Define global constants
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // CSS configuration
  css: {
    postcss: './postcss.config.js',
    devSourcemap: true
  },
  
  // Development server proxy (if needed)
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
```

### PostCSS Configuration

#### `frontend/postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    
    // Production optimizations
    ...(process.env.NODE_ENV === 'production' && {
      '@fullhuman/postcss-purgecss': {
        content: ['./index.html', './src/**/*.{js,html}'],
        defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
      },
      cssnano: {
        preset: 'default'
      }
    })
  }
};
```

### Tailwind Configuration

#### `frontend/tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c'
        },
        amazon: {
          orange: '#FF9900',
          blue: '#232F3E',
          light: '#F3F3F3'
        }
      },
      
      fontFamily: {
        sans: ['Arial', 'sans-serif']
      },
      
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px'
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      }
    }
  },
  
  plugins: [
    // Add plugins as needed
  ],
  
  // Dark mode configuration
  darkMode: process.env.VITE_ENABLE_DARK_MODE === 'true' ? 'class' : false
};
```

---

## 🌐 Internationalization Configuration

### i18n Setup

#### `frontend/i18n.js`

```javascript
import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const config = {
  // Language detection
  detection: {
    order: ['localStorage', 'navigator', 'htmlTag'],
    lookupLocalStorage: 'language',
    caches: ['localStorage']
  },
  
  // Fallback configuration
  fallbackLng: process.env.VITE_FALLBACK_LANGUAGE || 'en',
  supportedLngs: (process.env.VITE_SUPPORTED_LANGUAGES || 'en,pt,es').split(','),
  
  // Development settings
  debug: process.env.VITE_DEBUG === 'true',
  
  // Resource configuration
  resources: {
    en: { translation: await import('./locales/en.json') },
    pt: { translation: await import('./locales/pt.json') },
    es: { translation: await import('./locales/es.json') }
  },
  
  // Interpolation
  interpolation: {
    escapeValue: false
  }
};

export default config;
```

### Language Files Configuration

#### Translation File Structure

```json
{
  "ui": {
    "title": "Amazon Product Scraper",
    "searchPlaceholder": "Enter search keyword...",
    "searchButton": "Search Products",
    "loading": "Loading...",
    "error": "An error occurred"
  },
  
  "results": {
    "found": "Found {{count}} products",
    "noResults": "No products found",
    "viewOnAmazon": "View on Amazon"
  },
  
  "languages": {
    "en": "English",
    "pt": "Português", 
    "es": "Español"
  }
}
```

---

## 🧪 Testing Configuration

### Backend Testing

#### `backend/jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'node',
  
  // Test files
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js'
  ],
  
  // Environment variables for testing
  setupFiles: ['<rootDir>/tests/setup.js'],
  
  // Timeout
  testTimeout: parseInt(process.env.TEST_TIMEOUT) || 10000
};
```

### Frontend Testing

#### `frontend/vitest.config.js`

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    
    // Global test configuration
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'clover', 'json'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js'
      ]
    },
    
    // Environment variables for testing
    env: {
      VITE_API_BASE_URL: 'http://localhost:3000',
      VITE_TEST_MODE: 'true'
    }
  }
});
```

---

## 🚀 Production Configuration

### Backend Production Settings

```env
# Production Environment
NODE_ENV=production
PORT=8080
HOST=0.0.0.0

# Security
TRUST_PROXY=true
CORS_ORIGIN=https://your-domain.com

# Performance
REQUEST_TIMEOUT=15000
MAX_RETRIES=5
RATE_LIMIT_WINDOW=60000
MAX_REQUESTS_PER_MINUTE=100

# Logging
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false
```

### Frontend Production Build

```env
# Production Build
NODE_ENV=production
VITE_API_BASE_URL=https://api.your-domain.com
VITE_SOURCEMAP=false
VITE_BUILD_TARGET=es2020

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_SERVICE_WORKER=true
```

### Build Scripts

#### Package.json Scripts

```json
{
  "scripts": {
    "dev": "NODE_ENV=development bun run dev",
    "prod": "NODE_ENV=production bun start",
    "build": "NODE_ENV=production bun run build",
    "test": "NODE_ENV=test bun test"
  }
}
```

---

## 🔧 Advanced Configuration

### Custom Middleware Configuration

```javascript
// backend/middleware/config.js
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW || 60000,
  max: process.env.MAX_REQUESTS_PER_MINUTE || 60,
  message: 'Too many requests from this IP'
});

const security = helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
});

module.exports = { limiter, security };
```

### Custom Error Handling

```javascript
// backend/middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  const config = {
    development: {
      showStack: true,
      logLevel: 'debug'
    },
    production: {
      showStack: false,
      logLevel: 'error'
    }
  };
  
  const env = process.env.NODE_ENV || 'development';
  const settings = config[env];
  
  console.log(`[${settings.logLevel.toUpperCase()}]`, err.message);
  
  res.status(err.status || 500).json({
    error: err.message,
    ...(settings.showStack && { stack: err.stack })
  });
};

module.exports = errorHandler;
```

---

## ⚙️ Configuration Validation

### Environment Validation Script

Create `scripts/validate-config.js`:

```javascript
#!/usr/bin/env node

const requiredEnvVars = {
  backend: ['PORT', 'NODE_ENV'],
  frontend: ['VITE_API_BASE_URL']
};

function validateConfig(component) {
  const missing = [];
  const vars = requiredEnvVars[component] || [];
  
  vars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error(`❌ Missing ${component} environment variables:`, missing);
    process.exit(1);
  }
  
  console.log(`✅ ${component} configuration is valid`);
}

// Validate based on current directory
const component = process.cwd().includes('backend') ? 'backend' : 'frontend';
validateConfig(component);
```

Make it executable and use:

```bash
chmod +x scripts/validate-config.js
node scripts/validate-config.js
```

---

## 📋 Configuration Checklist

### Development Setup

- [ ] Backend `.env` file created
- [ ] Frontend `.env` file created  
- [ ] Ports are available (3000, 5173)
- [ ] CORS origins match
- [ ] API base URL is correct

### Production Deployment

- [ ] Production environment variables set
- [ ] Security settings configured
- [ ] Rate limiting enabled
- [ ] CORS origins restricted
- [ ] Logging configured appropriately
- [ ] SSL certificates configured

### Testing Environment

- [ ] Test environment variables set
- [ ] Mock configurations enabled
- [ ] Coverage thresholds set
- [ ] Test timeouts configured

---

## 🐛 Configuration Troubleshooting

### Common Issues

#### CORS Errors
```javascript
// Ensure CORS_ORIGIN matches frontend URL exactly
CORS_ORIGIN=http://localhost:5173  // ✅ Correct
CORS_ORIGIN=localhost:5173         // ❌ Missing protocol
```

#### Environment Variable Loading
```bash
# Load .env file in development
npm install dotenv
# Add to server.js: require('dotenv').config();
```

#### Port Conflicts
```bash
# Check for port usage
netstat -an | grep :3000
lsof -i :3000

# Use alternative ports
PORT=3001 bun run dev
```

#### Build Issues
```bash
# Clear cache and rebuild
rm -rf node_modules dist
bun install
bun run build
```

---

---

## 🔗 Related Documentation

- **Previous:** [Installation Guide](installation.md)
- **Next:** [Quick Start Guide](quick-start.md)
- **Related:** [Deployment Guide](../guides/deployment.md) | [Contributing Guide](../development/contributing.md)

---

*For deployment-specific configuration, see the [Deployment Guide](../guides/deployment.md). For development workflow configuration, see the [Contributing Guide](../development/contributing.md).*
