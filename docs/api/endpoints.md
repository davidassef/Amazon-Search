# API Endpoint Reference

**Description:** Complete reference documentation for all Amazon Product Scraper API endpoints, including request/response schemas, error codes, and usage examples.

**Last Updated:** January 2025

---

## Table of Contents

- [Overview](#-overview)
- [Endpoints](#-endpoints)
  - [Product Scraping](#1-product-scraping)
  - [Health Check](#2-health-check)
  - [Supported Domains](#3-supported-domains)
  - [Search Suggestions](#4-search-suggestions)
- [Response Format](#-response-format)
- [Authentication & Rate Limiting](#-authentication--rate-limiting)
- [CORS Configuration](#-cors-configuration)
- [Error Codes](#-error-codes)
- [Testing Endpoints](#-testing-endpoints)
- [Performance Metrics](#-performance-metrics)
- [Pagination](#-pagination)
- [Development & Debugging](#-development--debugging)

---

## 📋 Overview

The Amazon Product Scraper API provides RESTful endpoints for scraping Amazon product data. The API is built with Express.js and Bun runtime, featuring comprehensive error handling, rate limiting, and CORS support.

**Base URL**: `http://localhost:3000` (development)  
**API Version**: v1  
**Content-Type**: `application/json`

---

## 🔗 Endpoints

### 1. Product Scraping

#### `GET /api/scrape`

Scrapes Amazon search results for a given keyword and returns structured product data.

**Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `keyword` | string | ✅ Yes | Search term for Amazon products | `laptop`, `headphones` |
| `domain` | string | ❌ No | Amazon domain to search | `amazon.com`, `amazon.co.uk` |
| `limit` | integer | ❌ No | Maximum number of products (1-50) | `20` |
| `page` | integer | ❌ No | Page number for pagination | `1` |

**Example Request:**

```bash
GET /api/scrape?keyword=laptop&domain=amazon.com&limit=10
```

```javascript
// Using fetch
const response = await fetch('http://localhost:3000/api/scrape?keyword=laptop');
const data = await response.json();
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "keyword": "laptop",
  "domain": "amazon.com",
  "timestamp": "2025-01-07T10:30:00.000Z",
  "totalProducts": 15,
  "processingTime": "2.1s",
  "products": [
    {
      "id": "B08XYZ123",
      "title": "Dell Inspiron 15 3000 Laptop, 15.6 inch HD Display",
      "price": "$599.99",
      "originalPrice": "$699.99",
      "discount": "14%",
      "rating": "4.2",
      "reviews": "1,234",
      "prime": true,
      "imageUrl": "https://m.media-amazon.com/images/I/71ABC123DEF.jpg",
      "productUrl": "https://amazon.com/dp/B08XYZ123",
      "availability": "In Stock",
      "shippingInfo": "FREE delivery",
      "brand": "Dell",
      "category": "Computers & Accessories"
    },
    {
      "id": "B09ABC456",
      "title": "HP Pavilion Gaming Laptop 15.6 inch",
      "price": "$749.99",
      "rating": "4.5",
      "reviews": "2,567",
      "prime": false,
      "imageUrl": "https://m.media-amazon.com/images/I/61DEF456GHI.jpg",
      "productUrl": "https://amazon.com/s?k=HP+Pavilion+Gaming+Laptop",
      "availability": "Only 3 left in stock",
      "shippingInfo": "$9.99 delivery",
      "brand": "HP",
      "category": "Computers & Accessories"
    }
  ]
}
```

**Error Responses:**

```json
// 400 Bad Request - Missing keyword
{
  "success": false,
  "error": "Missing required parameter: keyword",
  "code": "MISSING_PARAMETER",
  "timestamp": "2025-01-07T10:30:00.000Z"
}

// 400 Bad Request - Invalid domain
{
  "success": false,
  "error": "Unsupported Amazon domain: amazon.invalid",
  "code": "INVALID_DOMAIN",
  "supportedDomains": [
    "amazon.com", "amazon.co.uk", "amazon.de", 
    "amazon.fr", "amazon.ca", "amazon.com.au"
  ]
}

// 429 Too Many Requests
{
  "success": false,
  "error": "Rate limit exceeded. Please try again later.",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60
}

// 500 Internal Server Error
{
  "success": false,
  "error": "Failed to scrape Amazon products",
  "code": "SCRAPING_ERROR",
  "details": "Network timeout after 10 seconds"
}
```

---

### 2. Health Check

#### `GET /api/health`

Returns the current status of the API server and its dependencies.

**Parameters:** None

**Example Request:**

```bash
GET /api/health
```

```javascript
const response = await fetch('http://localhost:3000/api/health');
const health = await response.json();
```

**Success Response (200 OK):**

```json
{
  "status": "OK",
  "timestamp": "2025-01-07T10:30:00.000Z",
  "uptime": "2h 34m 12s",
  "version": "1.0.0",
  "environment": "development",
  "services": {
    "database": {
      "status": "connected",
      "responseTime": "5ms"
    },
    "cache": {
      "status": "available",
      "hitRate": "95%"
    },
    "amazonAccess": {
      "status": "available",
      "lastCheck": "2025-01-07T10:29:45.000Z"
    }
  },
  "system": {
    "memory": {
      "used": "145.2 MB",
      "total": "512 MB"
    },
    "cpu": {
      "usage": "23%",
      "cores": 4
    }
  }
}
```

**Error Response (503 Service Unavailable):**

```json
{
  "status": "ERROR",
  "timestamp": "2025-01-07T10:30:00.000Z",
  "errors": [
    {
      "service": "amazonAccess",
      "error": "Connection timeout",
      "lastSuccessful": "2025-01-07T09:15:30.000Z"
    }
  ]
}
```

---

### 3. Supported Domains

#### `GET /api/domains`

Returns a list of supported Amazon domains and their configurations.

**Parameters:** None

**Example Request:**

```bash
GET /api/domains
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "defaultDomain": "amazon.com",
  "domains": {
    "amazon.com": {
      "name": "Amazon US",
      "baseUrl": "https://www.amazon.com",
      "currency": "USD",
      "language": "en-US",
      "region": "North America"
    },
    "amazon.co.uk": {
      "name": "Amazon UK", 
      "baseUrl": "https://www.amazon.co.uk",
      "currency": "GBP",
      "language": "en-GB",
      "region": "Europe"
    },
    "amazon.de": {
      "name": "Amazon Germany",
      "baseUrl": "https://www.amazon.de", 
      "currency": "EUR",
      "language": "de-DE",
      "region": "Europe"
    }
  }
}
```

---

### 4. Search Suggestions

#### `GET /api/suggestions`

Returns search suggestions based on partial keyword input.

**Parameters:**

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `q` | string | ✅ Yes | Partial search query | `lapt`, `head` |
| `limit` | integer | ❌ No | Maximum suggestions (1-10) | `5` |

**Example Request:**

```bash
GET /api/suggestions?q=lapt&limit=5
```

**Success Response (200 OK):**

```json
{
  "success": true,
  "query": "lapt",
  "suggestions": [
    "laptop",
    "laptop stand",
    "laptop bag",
    "laptop cooling pad",
    "laptop accessories"
  ]
}
```

---

## 📊 Response Format

### Standard Response Structure

All API responses follow a consistent structure:

```json
{
  "success": true|false,
  "timestamp": "ISO 8601 timestamp",
  "data": {},          // Success responses
  "error": "string",   // Error responses
  "code": "ERROR_CODE" // Error responses
}
```

### Product Object Schema

```json
{
  "id": "string",           // Amazon product ID (ASIN)
  "title": "string",        // Product title
  "price": "string",        // Current price with currency
  "originalPrice": "string", // Original price (if discounted)
  "discount": "string",     // Discount percentage
  "rating": "string",       // Average rating (1-5 stars)
  "reviews": "string",      // Number of reviews
  "prime": boolean,         // Amazon Prime eligible
  "imageUrl": "string",     // Product image URL
  "productUrl": "string",   // Direct Amazon product link
  "availability": "string", // Stock status
  "shippingInfo": "string", // Shipping information
  "brand": "string",        // Product brand
  "category": "string"      // Product category
}
```

---

## 🔐 Authentication & Rate Limiting

### Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

**Future Implementation:**
- API Key authentication
- JWT token-based auth
- OAuth 2.0 support

### Rate Limiting

| Endpoint | Limit | Window | Burst |
|----------|-------|--------|-------|
| `/api/scrape` | 60 requests | 1 minute | 10 |
| `/api/health` | 300 requests | 1 minute | 50 |
| `/api/domains` | 100 requests | 1 minute | 20 |
| `/api/suggestions` | 200 requests | 1 minute | 30 |

**Rate Limit Headers:**

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1641555600
X-RateLimit-Used: 1
```

**Rate Limit Exceeded Response:**

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 60,
  "limit": 60,
  "remaining": 0,
  "reset": 1641555660
}
```

---

## 🌐 CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

```javascript
{
  "origin": ["http://localhost:5173", "http://localhost:3000"],
  "methods": ["GET", "POST", "OPTIONS"],
  "allowedHeaders": ["Content-Type", "Authorization", "X-Requested-With"],
  "credentials": false,
  "maxAge": 86400
}
```

---

## 📝 Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `MISSING_PARAMETER` | Required parameter missing | 400 |
| `INVALID_PARAMETER` | Parameter value invalid | 400 |
| `INVALID_DOMAIN` | Unsupported Amazon domain | 400 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `SCRAPING_ERROR` | Failed to scrape data | 500 |
| `NETWORK_ERROR` | Network connection failed | 502 |
| `TIMEOUT_ERROR` | Request timeout | 504 |
| `INTERNAL_ERROR` | Server internal error | 500 |

---

## 🧪 Testing Endpoints

### Using cURL

```bash
# Basic product search
curl "http://localhost:3000/api/scrape?keyword=laptop"

# Search with domain and limit
curl "http://localhost:3000/api/scrape?keyword=headphones&domain=amazon.co.uk&limit=5"

# Health check
curl "http://localhost:3000/api/health"

# Get supported domains
curl "http://localhost:3000/api/domains"

# Get search suggestions
curl "http://localhost:3000/api/suggestions?q=lapt&limit=3"
```

### Using JavaScript Fetch

```javascript
// Product search with error handling
async function searchProducts(keyword, options = {}) {
  try {
    const params = new URLSearchParams({
      keyword,
      ...options
    });
    
    const response = await fetch(`/api/scrape?${params}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    return data.products;
  } catch (error) {
    console.error('Search failed:', error);
    throw error;
  }
}

// Usage
const products = await searchProducts('laptop', {
  domain: 'amazon.com',
  limit: 10
});
```

### Using Python Requests

```python
import requests

# Product search
def search_products(keyword, domain='amazon.com', limit=20):
    url = 'http://localhost:3000/api/scrape'
    params = {
        'keyword': keyword,
        'domain': domain,
        'limit': limit
    }
    
    response = requests.get(url, params=params)
    data = response.json()
    
    if not data['success']:
        raise Exception(data['error'])
    
    return data['products']

# Health check
def check_health():
    response = requests.get('http://localhost:3000/api/health')
    return response.json()
```

---

## 📊 Performance Metrics

### Response Times

| Endpoint | Average | P95 | P99 |
|----------|---------|-----|-----|
| `/api/scrape` | 2.1s | 4.5s | 8.2s |
| `/api/health` | 15ms | 25ms | 45ms |
| `/api/domains` | 5ms | 8ms | 12ms |
| `/api/suggestions` | 150ms | 300ms | 500ms |

### Success Rates

| Endpoint | Success Rate | Error Rate |
|----------|-------------|------------|
| `/api/scrape` | 94.2% | 5.8% |
| `/api/health` | 99.9% | 0.1% |
| `/api/domains` | 99.9% | 0.1% |
| `/api/suggestions` | 97.3% | 2.7% |

---

## 🔄 Pagination

For endpoints that support pagination:

**Request:**
```bash
GET /api/scrape?keyword=laptop&page=2&limit=10
```

**Response:**
```json
{
  "success": true,
  "keyword": "laptop",
  "pagination": {
    "currentPage": 2,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPreviousPage": true,
    "totalProducts": 50,
    "productsPerPage": 10
  },
  "products": [...]
}
```

---

## 🔧 Development & Debugging

### Debug Mode

Enable debug mode with environment variable:

```bash
DEBUG=true bun run dev
```

Debug responses include additional information:

```json
{
  "success": true,
  "debug": {
    "executionTime": "2.134s",
    "memoryUsage": "145MB",
    "cacheHit": false,
    "retryCount": 1,
    "userAgent": "Mozilla/5.0...",
    "selectors": ["[data-component-type=\"s-search-result\"]"]
  },
  "products": [...]
}
```

### API Monitoring

Monitor API usage with built-in metrics:

```bash
GET /api/metrics
```

```json
{
  "requests": {
    "total": 1542,
    "success": 1456,
    "errors": 86
  },
  "responseTime": {
    "average": "1.8s",
    "min": "0.5s",
    "max": "8.9s"
  },
  "endpoints": {
    "/api/scrape": { "count": 1234, "avgTime": "2.1s" },
    "/api/health": { "count": 308, "avgTime": "15ms" }
  }
}
```

---

---

## 🔗 Related Documentation

- **Previous:** [Documentation Index](../INDEX.md)
- **Next:** [API Examples](examples.md)
- **Related:** [Deployment Guide](../guides/deployment.md) | [Testing Overview](../testing/testing-overview.md)

---

*For implementation examples and integration guides, see [API Examples](examples.md). For deployment considerations, see the [Deployment Guide](../guides/deployment.md).*
