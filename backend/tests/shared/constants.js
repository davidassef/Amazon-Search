/**
 * Shared Test Constants and Configuration
 * Centralized configuration for all test files
 */

// Test timeout configuration
export const TEST_TIMEOUTS = {
  unit: 5000,       // 5 seconds for unit tests
  integration: 15000, // 15 seconds for integration tests
  e2e: 30000,       // 30 seconds for end-to-end tests
  performance: 10000 // 10 seconds for performance tests
};

// Test server configuration
export const TEST_SERVER = {
  PORT: process.env.TEST_PORT || 3001,
  HOST: process.env.TEST_HOST || 'localhost',
  BASE_URL: `http://${process.env.TEST_HOST || 'localhost'}:${process.env.TEST_PORT || 3001}`
};

// Amazon domain configurations for testing
export const TEST_DOMAINS = {
  'amazon.com': { 
    baseUrl: 'https://www.amazon.com', 
    language: 'en-US,en;q=0.9', 
    currency: 'USD',
    currencySymbol: '$'
  },
  'amazon.co.uk': { 
    baseUrl: 'https://www.amazon.co.uk', 
    language: 'en-GB,en;q=0.9', 
    currency: 'GBP',
    currencySymbol: '£'
  },
  'amazon.de': { 
    baseUrl: 'https://www.amazon.de', 
    language: 'de-DE,de;q=0.9,en;q=0.8', 
    currency: 'EUR',
    currencySymbol: '€'
  },
  'amazon.fr': { 
    baseUrl: 'https://www.amazon.fr', 
    language: 'fr-FR,fr;q=0.9,en;q=0.8', 
    currency: 'EUR',
    currencySymbol: '€'
  },
  'amazon.ca': { 
    baseUrl: 'https://www.amazon.ca', 
    language: 'en-CA,en;q=0.9,fr;q=0.8', 
    currency: 'CAD',
    currencySymbol: 'C$'
  }
};

// Test data patterns
export const TEST_PATTERNS = {
  // Valid Amazon product URL patterns
  PRODUCT_URL: /^https:\/\/.*amazon\.(com|co\.uk|de|fr|ca)\/(dp|gp\/product)\/[A-Z0-9]+/,
  
  // Price patterns for different domains
  PRICE: {
    'amazon.com': /^\$\d+\.\d{2}$/,
    'amazon.co.uk': /^£\d+\.\d{2}$/,
    'amazon.de': /^\d+,\d{2}€$/,
    'amazon.fr': /^\d+,\d{2}€$/,
    'amazon.ca': /^C?\$\d+\.\d{2}$/
  },
  
  // Rating pattern (e.g., "4.5")
  RATING: /^[1-5]\.\d$/,
  
  // Reviews pattern (e.g., "1,234" or "1.234")
  REVIEWS: /^\d{1,3}[,.']\d{3}$|^\d{1,4}$/,
  
  // Image URL pattern
  IMAGE_URL: /^https:\/\/.*\.(jpg|jpeg|png|webp)$/i
};

// Common test keywords for different categories
export const TEST_KEYWORDS = {
  electronics: ['laptop', 'smartphone', 'headphones', 'tablet', 'mouse'],
  books: ['fiction', 'programming', 'cookbook', 'biography'],
  home: ['coffee mug', 'pillow', 'lamp', 'blanket'],
  sports: ['running shoes', 'yoga mat', 'dumbbells', 'tennis racket'],
  
  // Special test cases
  special: {
    unicode: 'café naïve résumé',
    numbers: 'iphone 13 pro',
    symbols: 'c++ programming',
    long: 'this is a very long search term with many words to test handling',
    short: 'ab',
    invalid: '<script>alert("xss")</script>laptop'
  }
};

// Mock response templates
export const MOCK_RESPONSES = {
  SUCCESS: {
    success: true,
    message: 'Products found',
    keyword: '',
    domain: '',
    products: []
  },
  
  ERROR_MISSING_KEYWORD: {
    success: false,
    error: 'Keyword parameter is required'
  },
  
  ERROR_SHORT_KEYWORD: {
    success: false,
    error: 'Keyword must be at least 2 characters long'
  },
  
  ERROR_INVALID_DOMAIN: {
    success: false,
    error: 'Unsupported Amazon domain'
  },
  
  HEALTH_CHECK: {
    success: true,
    message: 'Amazon Scraper API is running',
    timestamp: new Date().toISOString()
  },
  
  API_INFO: {
    message: 'Amazon Product Scraper API',
    endpoints: {
      scrape: '/api/scrape?keyword=<search-term>',
      health: '/api/health'
    }
  }
};

// Test product structure template
export const TEST_PRODUCT_SCHEMA = {
  title: 'string',
  productUrl: 'string',
  price: 'string',
  rating: 'string',
  reviews: 'string',
  imageUrl: 'string'
};

// Required fields for product validation
export const REQUIRED_PRODUCT_FIELDS = Object.keys(TEST_PRODUCT_SCHEMA);

// Performance benchmarks
export const PERFORMANCE_BENCHMARKS = {
  API_RESPONSE: 2000,    // API should respond within 2 seconds
  SCRAPING: 5000,        // Scraping should complete within 5 seconds
  HTML_PARSING: 500,     // HTML parsing should be under 500ms
  MEMORY_LIMIT: 100      // Memory usage should not exceed 100MB per test
};

// Error scenarios for testing
export const ERROR_SCENARIOS = {
  NETWORK_TIMEOUT: {
    name: 'Network Timeout',
    error: { code: 'ETIMEDOUT', message: 'Request timeout' },
    shouldRetry: true
  },
  CONNECTION_RESET: {
    name: 'Connection Reset',
    error: { code: 'ECONNRESET', message: 'Connection reset by peer' },
    shouldRetry: true
  },
  NETWORK_UNREACHABLE: {
    name: 'Network Unreachable',
    error: { code: 'ENETUNREACH', message: 'Network is unreachable' },
    shouldRetry: true
  },
  DNS_ERROR: {
    name: 'DNS Lookup Failed',
    error: { code: 'ENOTFOUND', message: 'getaddrinfo ENOTFOUND' },
    shouldRetry: false
  },
  HTTP_503: {
    name: 'Service Unavailable',
    error: { status: 503, message: 'Service Temporarily Unavailable' },
    shouldRetry: true
  },
  HTTP_429: {
    name: 'Rate Limited',
    error: { status: 429, message: 'Too Many Requests' },
    shouldRetry: false
  }
};

export default {
  TEST_TIMEOUTS,
  TEST_SERVER,
  TEST_DOMAINS,
  TEST_PATTERNS,
  TEST_KEYWORDS,
  MOCK_RESPONSES,
  TEST_PRODUCT_SCHEMA,
  REQUIRED_PRODUCT_FIELDS,
  PERFORMANCE_BENCHMARKS,
  ERROR_SCENARIOS
};
