# Quick Start Guide

**Description:** Fast-track setup and usage guide to get the Amazon Product Scraper running quickly with essential commands and examples.

**Last Updated:** January 2025

---

## Table of Contents

- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Running the Application](#-running-the-application)
- [Usage Instructions](#-usage-instructions)
- [API Usage](#-api-usage)
- [Testing](#-testing)
- [Error Handling](#-error-handling)
- [Technologies Used](#-technologies-used)

---

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

## 📖 Usage Instructions

1. Start both backend and frontend servers (see [Running the Application](#-running-the-application))
2. Open `http://localhost:5173` in your browser
3. Select your preferred language (English/Portuguese/Spanish)
4. Enter a search keyword in the input field (e.g., "laptop", "headphones", "books")
5. Click "Search Products" button or press Enter
6. View the scraped product results with images, prices, and ratings
7. Click on any product card or "View on Amazon" button to redirect to Amazon

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
  "timestamp": "2025-01-07T10:30:00Z"
}
```

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

See [Testing Documentation](../testing/testing-overview.md) for detailed testing information and current status.

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

---

## 🔗 Related Documentation

- **Previous:** [Documentation Index](../INDEX.md)
- **Next:** [Installation Guide](installation.md) | [Configuration Guide](configuration.md)
- **Related:** [API Examples](../api/examples.md) | [Testing Overview](../testing/testing-overview.md)

---

For detailed project structure and development guidelines, see the [complete README](../../README.md) in the project root.
