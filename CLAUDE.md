# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

This is a full-stack Amazon Product Scraper application with a clear separation of concerns:

**Backend**: Node.js/Bun server (`backend/server.js`) that provides a REST API for web scraping Amazon search results using JSDOM and Axios. The server is designed to mimic browser requests with proper headers to avoid detection.

**Frontend**: Vanilla JavaScript SPA using Vite for development and Tailwind CSS for styling. The frontend (`frontend/main.js`) provides a responsive interface with internationalization support (i18next) for English, Portuguese, and Spanish.

**Key Components**:
- `scrapeAmazonProducts()` function in backend handles the core scraping logic with multiple product selector strategies
- Frontend uses modular design with exported functions for testing: `handleSearch`, `displayResults`, `createProductCard`, etc.
- Custom Tailwind theme with Amazon-inspired colors (`amazon-orange`, `amazon-darkblue`, `amazon-lightblue`)

## Development Commands

### Backend (Bun-based)
```bash
cd backend
bun install                    # Install dependencies
bun run dev                    # Start development server with auto-reload
bun run start                  # Start production server
bun test                       # Run tests (currently has Jest/Bun compatibility issues)
```

### Frontend (Vite-based)
```bash
cd frontend
bun install                    # Install dependencies  
bunx vite                      # Start development server on port 5173
bun run build                  # Build for production
bun run preview                # Preview production build
bun test                       # Run Vitest tests
bun run coverage               # Run tests with coverage report
```

### Testing Infrastructure
Current testing setup has known issues documented in `TESTS_DOC.md`:
- Backend: Jest incompatible with Bun runtime, needs migration to Bun Test
- Frontend: Vitest configured but requires proper function exports from main.js (already fixed)
- Both: Missing proper module exports for testing (backend server.js needs exports)

## Important Configuration Details

### Backend Server Architecture
- Uses Express.js with CORS middleware
- Port 3000 (configurable via PORT env var)
- Single endpoint: `GET /api/scrape?keyword=<search-term>`
- Implements multiple CSS selectors for Amazon product scraping robustness
- Headers configured to mimic real browser requests

### Frontend Build System
- Vite configuration with PostCSS/Tailwind integration
- Vitest for testing with JSDOM environment
- Source maps enabled for debugging
- CSS processing through `postcss.config.js` and `tailwind.config.js`

### Internationalization Setup
- i18next with browser language detection
- Translation files in `frontend/locales/` (en.json, pt.json, es.json)
- Language switcher in UI with localStorage persistence

## Known Issues to Address

1. **Testing Framework Compatibility**: Jest doesn't work with Bun. Either migrate to Bun Test or configure Jest properly for this environment.

2. **Backend Module Exports**: The `server.js` file needs to properly export functions for testing:
```javascript
module.exports = { app, scrapeAmazonProducts };
```

3. **Scraping Reliability**: Amazon's anti-bot measures may require rotating headers or proxies for production use.

## Development Workflow

1. Start backend: `cd backend && bun run dev`
2. Start frontend: `cd frontend && bunx vite` 
3. Access application at `http://localhost:5173`
4. API available at `http://localhost:3000/api/scrape`

The application follows a standard client-server architecture where the frontend makes HTTP requests to the backend API, which handles the actual Amazon scraping and returns structured JSON data.