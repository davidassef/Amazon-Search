# Amazon Product Scraper

A full-stack application to scrape Amazon product listings from search results. Built with Bun (backend) and Vite (frontend).

## Features

- **Backend API** (Bun + Express): Scrapes Amazon search results and returns product data as JSON
- **Frontend Interface** (HTML + CSS + Vanilla JS + Vite): Clean, user-friendly interface to search and display products
- **Product Data Extraction**:
  - Product Title
  - Rating (stars out of five)
  - Number of reviews
  - Product image URL

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
npm install
```

## Running the Application

### Start Backend Server
```bash
cd backend
bun run server.js
```
The API will be available at `http://localhost:3000`

### Start Frontend Development Server
```bash
cd frontend
npm run dev
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
      "rating": "4.2",
      "reviews": "1,234",
      "imageUrl": "https://m.media-amazon.com/images/..."
    }
  ]
}
```

## Usage Instructions

1. Start both backend and frontend servers
2. Open the frontend URL in your browser
3. Enter a search keyword in the input field
4. Click "Search Products" button
5. View the scraped product results displayed on the page

## Error Handling

- Backend gracefully handles network errors and parsing failures
- Frontend displays user-friendly error messages
- Rate limiting and request validation implemented

## Technologies Used

- **Backend**: Bun, Express.js, Axios, JSDOM
- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Vite
- **API**: RESTful JSON API

## Development Notes

- The scraper targets Amazon's search results page structure
- Includes proper error handling and user feedback
- Responsive design for mobile and desktop
- Clean, commented code for maintainability

## License

MIT License - see LICENSE file for details
