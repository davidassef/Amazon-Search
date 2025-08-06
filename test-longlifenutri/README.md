# Amazon Product Scraper

A full-stack application to scrape Amazon product listings from search results. Built with Bun (backend) and Vite (frontend).

## Features

- **Backend API** (Bun + Express): Scrapes Amazon search results and returns product data as JSON
- **Frontend Interface** (HTML + CSS + Vanilla JS + Vite): Clean, user-friendly interface to search and display products
- **Internationalization** (i18next): Multi-language support (English, Portuguese, Spanish)
- **Product Data Extraction**:
  - Product Title
  - Product Price
  - Rating (stars out of five)
  - Number of reviews
  - Product image URL
  - Direct Amazon product links
- **Enhanced UX**:
  - Clickable product cards that redirect to Amazon
  - Modern responsive design with animations
  - Language selector in header
  - Loading states and error handling
  - Mobile-optimized interface

## Project Structure

```
├── backend/           # Bun backend API
│   ├── server.js      # Express server with scraping endpoint
│   └── package.json   # Backend dependencies
├── frontend/          # Vite frontend
│   ├── index.html     # Main HTML file
│   ├── style.css      # Styling
│   ├── main.js        # Frontend logic
│   └── package.json   # Frontend dependencies
└── README.md          # This file
```

## Prerequisites

- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- [Node.js](https://nodejs.org/) - For Vite frontend

## Installation & Setup

### Prerequisites
- [Bun](https://bun.sh/) - JavaScript runtime and package manager
- Git

### 1. Clone the repository
```bash
git clone https://github.com/davidassef/test-longlifenutri
cd test-longlifenutri
```

### 2. Backend Setup (Bun)
```bash
cd backend
bun install
```

### 3. Frontend Setup (Vite)
```bash
cd ../frontend
bun install
```

## Running the Application

### Start Backend Server
```bash
cd backend
bun run dev
```
The API will be available at `http://localhost:3000`

### Start Frontend Development Server
```bash
cd frontend
bun run dev
```
The frontend will be available at `http://localhost:5173`

## API Usage

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
      "productUrl": "https://amazon.com/dp/..."
    }
  ]
}
```

## Usage Instructions

1. Start both backend and frontend servers
2. Open the frontend URL in your browser
3. Select your preferred language (English, Portuguese, or Spanish)
4. Enter a search keyword in the input field
5. Click "Search Products" button
6. View the scraped product results displayed as interactive cards
7. Click on any product card to be redirected to the Amazon product page

## Internationalization

The application supports three languages:
- **English** (default)
- **Portuguese**
- **Spanish**

Language detection is automatic based on browser settings, but users can manually change language using the selector in the header.

## Error Handling

- Backend gracefully handles network errors and parsing failures
- Frontend displays user-friendly error messages
- Rate limiting and request validation implemented

## Technologies Used

### Backend
- **Bun** - Modern JavaScript runtime and package manager
- **Express.js** - Web application framework
- **Axios** - HTTP client for making requests
- **JSDOM** - DOM implementation for server-side HTML parsing
- **CORS** - Cross-origin resource sharing middleware

### Frontend
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with gradients and animations
- **Vanilla JavaScript** - ES6+ features and modules
- **Vite** - Fast build tool and development server
- **i18next** - Internationalization framework
- **i18next-browser-languagedetector** - Browser language detection

## Development Notes

- The scraper targets Amazon's search results page structure with multiple price selector fallbacks
- Includes comprehensive error handling and user feedback systems
- Responsive design optimized for mobile and desktop devices
- Clean, well-documented code following best practices
- Modular architecture with separation of concerns
- Internationalization system with automatic language detection
- Interactive UI with clickable product cards and direct Amazon redirection

## License

MIT License - see LICENSE file for details
