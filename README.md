# Amazon Product Scraper

[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white)](https://bun.sh/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/docs/Web/JavaScript)
[![MIT License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**Description:** A full-stack web application for scraping Amazon product listings from search results, featuring a modern responsive interface and comprehensive API.

**Last Updated:** August 2025

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [API Usage](#-api-usage)
- [Documentation](#-documentation)
- [Usage Instructions](#-usage-instructions)
- [Testing](#-testing)
- [Error Handling](#-error-handling)
- [Technologies Used](#-technologies-used)
- [Recent Improvements](#-recent-improvements)
- [Development Notes](#-development-notes)
- [License](#-license)
- [Contributing](#-contributing)

---

## 🎯 Overview

A full-stack application to scrape Amazon product listings from search results. Built with Bun (backend) and Vite (frontend).

## 📱 Preview

### Desktop Version
https://github.com/davidassef/Amazon-Search/assets/videos/Preview%20Desktop.webm

<details>
<summary>📱 Mobile Version</summary>

https://github.com/davidassef/Amazon-Search/assets/videos/Preview%20Mobile.webm

</details>

> 💡 **Quick Demo**: Watch the desktop version above to see the full application in action, including real-time search, responsive design, and multi-language support.

## ✨ Features

- **🔧 Backend API** (Bun + Express): Scrapes Amazon search results and returns product data as JSON
- **💻 Frontend Interface** (HTML + Tailwind CSS + Vanilla JS + Vite): Modern, responsive interface to search and display products
- **🌐 Internationalization** (i18next): Multi-language support (English, Portuguese, Spanish)
- **📊 Product Data Extraction**:
  - Product Title
  - Product Price
  - Rating (stars out of five)
  - Number of reviews
  - Product image URL
  - Direct Amazon product links with fallback search URLs
- **🎨 Enhanced UX**:
  - Clickable product cards that redirect to Amazon
  - Modern responsive design with Tailwind CSS
  - Beautiful animations and hover effects
  - Language selector with persistence
  - Loading states and error handling
  - Mobile-optimized interface
  - Amazon-inspired color scheme
  - Visual indicators for direct vs search links

## 📁 Project Structure

```
├── backend/                    # Bun backend API
│   ├── server.js              # Express server with scraping endpoint
│   ├── package.json           # Backend dependencies
│   ├── jest.config.js         # Jest testing configuration
│   ├── server.test.js         # Server unit tests
│   └── tests/                 # Additional test files
│       └── api.test.js        # API endpoint tests
├── frontend/                   # Vite frontend
│   ├── index.html             # Main HTML file
│   ├── main.js                # Frontend logic with i18n
│   ├── i18n.js                # Internationalization setup
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js         # Vite configuration
│   ├── vitest.config.js       # Vitest testing configuration
│   ├── locales/               # Translation files
│   │   ├── en.json            # English translations
│   │   ├── pt.json            # Portuguese translations
│   │   └── es.json            # Spanish translations
│   └── src/                   # Source files
│       ├── style.css          # Tailwind CSS styling
│       └── test/              # Frontend test files
│           ├── main.test.js   # Main functions tests
│           └── setup.js       # Test setup configuration
├── CLAUDE.md                  # Claude Code development guide
├── docs/                      # Documentation
│   ├── development/           # Development guides
│   ├── getting-started/       # Getting started guides
│   └── testing/               # Testing documentation
└── README.md                 # This file
```

## 📋 Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Node.js](https://nodejs.org/) - For Vite frontend (optional, Bun can handle most tasks)

## 🚀 Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/davidassef/Amazon-Search
cd Amazon-Search
```

### 2. Backend Setup (Bun)
```bash
cd backend
bun install
```

### 3. Frontend Setup (Vite + Tailwind CSS)
```bash
cd ../frontend
bun install
```

## ▶️ Running the Application

### Start Backend Server
```bash
cd backend
bun run dev      # Development with auto-reload
# OR
bun start        # Production mode
```
The API will be available at `http://localhost:3000`

### Start Frontend Development Server
```bash
cd frontend
bun run dev      # Start Vite development server
```
The frontend will be available at `http://localhost:5173`

### Alternative: Run both servers simultaneously
```bash
# Terminal 1 - Backend
cd backend && bun run dev

# Terminal 2 - Frontend  
cd frontend && bun run dev
```

## 🔗 API Usage

### Scrape Products Endpoint
```
GET /api/scrape?keyword=<search-term>
```

**Example Request:**
```bash
curl "http://localhost:3000/api/scrape?keyword=laptop"
```

**Example Response:**
```json
{
  "success": true,
  "keyword": "laptop",
  "products": [
    {
      "title": "Dell Inspiron 15 3000 Laptop",
      "price": "$599.99",
      "rating": "4.2",
      "reviews": "1,234",
      "imageUrl": "https://m.media-amazon.com/images/...",
      "productUrl": "https://amazon.com/dp/B08XYZ123"
    }
  ]
}
```

### Health Check Endpoint
```
GET /api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2025-08-07T10:30:00Z"
}
```

## 📚 Documentation

For comprehensive guides and detailed information, visit our **[📖 Complete Documentation Index](docs/INDEX.md)**

### Quick Links
- **🚀 [Quick Start Guide](docs/getting-started/quick-start.md)** - Fast setup and first run
- **🔗 [API Reference](docs/INDEX.md#-api-documentation)** - Detailed API documentation
- **📱 [Mobile-First Design](docs/development/mobile-first-architecture.md)** - Responsive architecture
- **🧪 [Testing Guide](docs/testing/testing-overview.md)** - Testing setup and troubleshooting
- **⚡ [Performance Guide](frontend/PERFORMANCE_OPTIMIZATIONS.md)** - Optimization techniques

> 💡 **New to the project?** Start with the [Quick Start Guide](docs/getting-started/quick-start.md) for a guided setup experience.

---

## 📖 Usage Instructions

1. Start both backend and frontend servers (see [Running the Application](#-running-the-application))
2. Open `http://localhost:5173` in your browser
3. Select your preferred language (English/Portuguese/Spanish)
4. Enter a search keyword in the input field (e.g., "laptop", "headphones", "books")
5. Click "Search Products" button or press Enter
6. View the scraped product results with images, prices, and ratings
7. Click on any product card or "View on Amazon" button to redirect to Amazon

## 🔧 Testing

### Frontend Tests (Vitest)
```bash
cd frontend
bun test                # Run tests
bun run coverage        # Generate coverage report
bun test --watch        # Watch mode
```

### Backend Tests (Jest - requires fixes)
```bash
cd backend
bun test                # Currently needs Jest/Bun compatibility fixes
```

See [Testing Documentation](docs/testing/testing-overview.md) for detailed testing information and current status.

## 🛡️ Error Handling

- **Backend**: Gracefully handles network errors, parsing failures, and invalid requests
- **Frontend**: Displays user-friendly error messages with internationalization
- **Robust URL extraction**: Multiple CSS selectors with fallback search URLs
- **Rate limiting**: Request validation and error recovery implemented
- **CORS**: Properly configured for cross-origin requests

## 🔧 Technologies Used

- **Backend**: Bun, Express.js, Axios, JSDOM, CORS
- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript, Vite, i18next
- **Testing**: Jest (backend), Vitest (frontend), JSDOM
- **Development**: Hot reload, watch mode, development servers
- **API**: RESTful JSON API with comprehensive error handling

## 🌟 Recent Improvements

- ✅ **i18n System**: Complete internationalization with language persistence
- ✅ **FOUC Fix**: Optimized CSS loading to prevent flash of unstyled content
- ✅ **URL Extraction**: Enhanced backend with multiple CSS selectors and fallbacks
- ✅ **Visual Indicators**: Distinguished direct links vs search links
- ✅ **Testing Setup**: Added comprehensive testing infrastructure
- ✅ **Documentation**: Complete project documentation and guides

## 🏗️ Development Notes

- The scraper targets Amazon's search results page structure with robust fallbacks
- Includes comprehensive error handling and user feedback
- Responsive design optimized for mobile and desktop
- Clean, well-documented code with proper separation of concerns
- Modular architecture supporting easy testing and maintenance
- Amazon-inspired design with modern UI/UX patterns

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests to ensure everything works
5. Submit a pull request

For detailed development guidelines, see our [📖 Complete Documentation](docs/INDEX.md) including:
- [Contributing Guidelines](docs/development/contributing.md)
- [Development Best Practices](.github/instructions/Agent%20Instructions.instructions.md)
- [Project Objectives](docs/development/project-objectives.md)
