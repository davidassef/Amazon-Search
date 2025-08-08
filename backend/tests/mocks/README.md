# Comprehensive Mocking System Documentation

This directory contains a complete mocking infrastructure for testing the Amazon scraper backend. The system provides controlled mocking for `axios` HTTP requests, `jsdom` HTML parsing, and comprehensive test scenarios.

## 🚀 Quick Start

```javascript
import { setupMocks, resetMocks, restoreMocks, setupAmazonSearch } from './mocks/index.js';

// Setup mocks for your test
beforeEach(() => {
  setupMocks({
    enableAxios: true,
    enableJSDOM: true,
    networkDelay: 0,
    rateLimiting: false
  });
});

// Clean up after test
afterEach(() => {
  resetMocks();
});

// Setup a common scenario
test('should scrape Amazon products', async () => {
  setupAmazonSearch('amazon.com', 'electronics', 'smartphone');
  
  const axios = require('axios');
  const response = await axios.get('https://www.amazon.com/s?k=smartphone');
  
  expect(response.status).toBe(200);
  expect(response.data).toContain('data-component-type="s-search-result"');
});
```

## 📁 File Structure

```
tests/mocks/
├── index.js              # Main mock manager and utilities
├── axios.mock.js         # Axios HTTP request mocking
├── jsdom.mock.js         # JSDOM HTML parsing mocking  
├── mockResponses.js      # Pre-defined response scenarios
└── README.md            # This documentation
```

## 🔧 Core Components

### 1. Mock Manager (`index.js`)

The central coordinator for all mocking functionality.

#### Basic Setup
```javascript
import { setupMocks, restoreMocks, resetMocks } from './mocks/index.js';

// Install all mocks
setupMocks({
  enableAxios: true,       // Mock axios requests
  enableJSDOM: true,       // Mock JSDOM parsing
  networkDelay: 0,         // Network delay in ms
  rateLimiting: false,     // Enable rate limiting simulation
  performanceDelay: 0      // DOM parsing delay in ms
});

// Reset mock state (keep installed)
resetMocks();

// Completely restore original functionality
restoreMocks();
```

#### Quick Scenario Setup
```javascript
import { 
  setupAmazonSearch,
  setupAmazonError,
  setupAmazonEmpty,
  setupAmazonSlow,
  setupRateLimiting 
} from './mocks/index.js';

// Standard successful search
setupAmazonSearch('amazon.com', 'electronics', 'smartphone');

// Error scenario
setupAmazonError('rateLimited', 'amazon.com');

// Empty results
setupAmazonEmpty('amazon.com', 'nonexistent-product');

// Network delay
setupAmazonSlow('amazon.com', 2000); // 2 second delay

// Rate limiting
setupRateLimiting('amazon.com');
```

### 2. Axios Mock (`axios.mock.js`)

Intercepts and controls HTTP requests made by axios.

#### Features
- ✅ Request interception and logging
- ✅ Custom response generation
- ✅ Error scenario simulation
- ✅ Network delay simulation
- ✅ Rate limiting simulation
- ✅ Retry logic testing
- ✅ Domain-specific responses

#### Usage Examples
```javascript
import { axiosMock } from './mocks/axios.mock.js';

// Set custom response for specific URL
axiosMock.setMockResponse(
  'GET', 
  'https://www.amazon.com/s?k=test',
  '<html>Custom HTML</html>',
  200,
  { 'content-type': 'text/html' }
);

// Set error scenario
axiosMock.setErrorScenario('GET', 'https://www.amazon.com/s?k=test', {
  code: 'ETIMEDOUT',
  message: 'Request timeout',
  maxRetries: 3
});

// Enable rate limiting
axiosMock.enableRateLimiting();

// Set network delay
axiosMock.setNetworkDelay(1000); // 1 second delay

// Get request history
const history = axiosMock.getRequestHistory();
console.log(`Made ${history.length} requests`);
```

### 3. JSDOM Mock (`jsdom.mock.js`)

Controls HTML parsing and DOM creation.

#### Features
- ✅ DOM parsing simulation
- ✅ Amazon-specific element generation
- ✅ Performance delay simulation
- ✅ Parse error scenarios
- ✅ Memory usage tracking
- ✅ Parsing history logging

#### Usage Examples
```javascript
import { jsdomMock } from './mocks/jsdom.mock.js';

// Generate Amazon-like HTML
const products = [
  {
    title: 'iPhone 15 Pro',
    price: '$999.99',
    rating: '4.5',
    reviews: '1,234',
    productUrl: 'https://www.amazon.com/dp/B123456789',
    imageUrl: 'https://images.amazon.com/test.jpg',
    asin: 'B123456789'
  }
];

const html = jsdomMock.generateAmazonHTML(products);

// Set performance delay
jsdomMock.setPerformanceDelay(100); // 100ms parsing delay

// Set error scenario for specific HTML
jsdomMock.setErrorScenario(html, {
  name: 'ParseError',
  message: 'Failed to parse HTML'
});

// Get parsing history
const history = jsdomMock.getParseHistory();
console.log(`Parsed ${history.length} documents`);
```

### 4. Response Generator (`mockResponses.js`)

Generates realistic Amazon HTML responses for various scenarios.

#### Available Response Types

**Search Result Types:**
- `successfulSearch` - Normal search with products
- `limitedResults` - Few search results
- `noResults` - Empty search results
- `sponsoredResults` - Results with sponsored products
- `missingPrices` - Products without price information
- `missingRatings` - Products without ratings
- `malformedHTML` - Broken HTML for error testing
- `largeResponse` - Many products (50+)

**Error Response Types:**
- `rateLimited` - 429 Too Many Requests
- `forbidden` - 403 Access Denied
- `serviceUnavailable` - 503 Service Unavailable
- `notFound` - 404 Not Found
- `internalError` - 500 Internal Server Error

**Product Type Responses:**
- `luxuryItems` - High-priced products ($1000+)
- `budgetItems` - Low-priced products ($5-25)
- `highRatedItems` - 4.5+ star products
- `lowRatedItems` - 1-2.5 star products
- `popularItems` - High review count products
- `newItems` - Low review count products
- `outOfStock` - Unavailable products

#### Usage Examples
```javascript
import { MockResponseGenerator } from './mocks/mockResponses.js';

const generator = new MockResponseGenerator();

// Get specific response type
const responses = generator.getAmazonSearchResponses();
const successResponse = responses.successfulSearch;

const errorResponses = generator.getErrorResponses();
const rateLimitedResponse = errorResponses.rateLimited;

const productResponses = generator.getProductTypeResponses();
const luxuryResponse = productResponses.luxuryItems;

// Generate domain-specific responses
const domainResponses = generator.getDomainSpecificResponses();
const ukResponse = domainResponses['amazon.co.uk'].electronics;
```

## 🎯 Common Test Scenarios

### Testing Successful Scraping
```javascript
test('should scrape products successfully', async () => {
  setupAmazonSearch('amazon.com', 'electronics', 'smartphone');
  
  const axios = require('axios');
  const { JSDOM } = require('jsdom');
  
  const response = await axios.get('https://www.amazon.com/s?k=smartphone');
  const dom = new JSDOM(response.data);
  const document = dom.window.document;
  
  const products = document.querySelectorAll('[data-component-type="s-search-result"]');
  expect(products.length).toBeGreaterThan(0);
});
```

### Testing Error Handling
```javascript
test('should handle rate limiting', async () => {
  setupAmazonError('rateLimited', 'amazon.com');
  
  const axios = require('axios');
  
  try {
    await axios.get('https://www.amazon.com/s?k=test');
    fail('Should have thrown error');
  } catch (error) {
    expect(error.response.status).toBe(429);
    expect(error.response.headers['retry-after']).toBe('60');
  }
});
```

### Testing Multiple Domains
```javascript
test('should handle different domains', async () => {
  setupAmazonSearch('amazon.co.uk', 'electronics', 'laptop');
  setupAmazonSearch('amazon.de', 'books', 'roman');
  
  const axios = require('axios');
  
  const [ukResponse, deResponse] = await Promise.all([
    axios.get('https://www.amazon.co.uk/s?k=laptop'),
    axios.get('https://www.amazon.de/s?k=roman')
  ]);
  
  expect(ukResponse.data).toContain('£'); // UK currency
  expect(deResponse.data).toContain('€'); // Euro currency
});
```

### Testing Network Conditions
```javascript
test('should simulate slow network', async () => {
  setupAmazonSlow('amazon.com', 1000); // 1 second delay
  
  const axios = require('axios');
  const startTime = Date.now();
  
  const response = await axios.get('https://www.amazon.com/s?k=test');
  const duration = Date.now() - startTime;
  
  expect(duration).toBeGreaterThan(900);
  expect(response.status).toBe(200);
});
```

### Testing Rate Limiting
```javascript
test('should simulate rate limiting', async () => {
  setupRateLimiting('amazon.com');
  
  const axios = require('axios');
  const requests = [];
  
  // Make multiple requests
  for (let i = 0; i < 10; i++) {
    requests.push(
      axios.get('https://www.amazon.com/s?k=test').catch(err => err)
    );
  }
  
  const results = await Promise.all(requests);
  
  const successes = results.filter(r => r.status === 200);
  const rateLimited = results.filter(r => r.response?.status === 429);
  
  expect(successes.length).toBeGreaterThan(0);
  expect(rateLimited.length).toBeGreaterThan(0);
});
```

## 🔍 Advanced Features

### Custom Scenario Configuration
```javascript
import { mockManager } from './mocks/index.js';

mockManager.setupScenario('customScenario', {
  domain: 'amazon.com',
  category: 'electronics',
  searchTerm: 'custom-product',
  productCount: 10,
  responseType: 'successful',
  networkConditions: {
    delay: 500,
    rateLimiting: true
  },
  customResponses: {
    'https://www.amazon.com/s?k=special': {
      data: '<html>Special response</html>',
      status: 200,
      headers: { 'x-special': 'true' }
    }
  }
});
```

### Mock Validation and Status
```javascript
import { validateMocks, getMockStatus } from './mocks/index.js';

// Validate mock installation
const validation = validateMocks();
if (!validation.isValid) {
  console.error('Mock validation failed:', validation.issues);
}

// Get detailed mock status
const status = getMockStatus();
console.log('Mock Status:', {
  installed: status.installed,
  requestCount: status.axios.requestHistory,
  parseCount: status.jsdom.parseHistory,
  scenarios: Object.keys(status.scenarios)
});
```

### Request and Parse History
```javascript
// Get axios request history
const axiosMock = mockManager.getAxiosMock();
const requests = axiosMock.getRequestHistory();
console.log(`Made ${requests.length} HTTP requests`);

// Get JSDOM parse history  
const jsdomMock = mockManager.getJSDoMMock();
const parses = jsdomMock.getParseHistory();
console.log(`Parsed ${parses.length} HTML documents`);
```

## 🧪 Testing Best Practices

### 1. Always Clean Up
```javascript
afterEach(() => {
  resetMocks(); // Reset state between tests
});

after(() => {
  restoreMocks(); // Restore originals after all tests
});
```

### 2. Use Specific Scenarios
```javascript
// Good: Specific scenario
setupAmazonSearch('amazon.com', 'electronics', 'iPhone');

// Avoid: Generic setup that might not match test expectations
setupMocks();
```

### 3. Test Error Conditions
```javascript
test('should handle various error conditions', async () => {
  const scenarios = ['rateLimited', 'forbidden', 'serviceUnavailable'];
  
  for (const errorType of scenarios) {
    resetMocks();
    setupAmazonError(errorType, 'amazon.com');
    
    // Test error handling for each scenario
    // ...
  }
});
```

### 4. Validate Mock Responses
```javascript
test('should generate realistic product data', async () => {
  setupAmazonSearch('amazon.com', 'electronics', 'smartphone');
  
  const axios = require('axios');
  const response = await axios.get('https://www.amazon.com/s?k=smartphone');
  
  // Validate response structure
  expect(response.status).toBe(200);
  expect(response.data).toContain('data-component-type="s-search-result"');
  expect(response.headers['content-type']).toContain('text/html');
  
  // Parse and validate products
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM(response.data);
  const products = dom.window.document.querySelectorAll('[data-component-type="s-search-result"]');
  
  expect(products.length).toBeGreaterThan(0);
  expect(products.length).toBeLessThanOrEqual(20);
});
```

## 🚨 Troubleshooting

### Mock Not Working
1. Ensure mocks are installed: `setupMocks()`
2. Check validation: `validateMocks()`
3. Verify scenario setup matches your test URLs

### Memory Issues
1. Reset mocks between tests: `resetMocks()`
2. Restore mocks after test suite: `restoreMocks()`
3. Check parsing history size: `jsdomMock.getParseHistory().length`

### Performance Issues
1. Reduce network delays: `setupMocks({ networkDelay: 0 })`
2. Disable rate limiting: `axiosMock.disableRateLimiting()`
3. Use smaller response datasets

### Debug Information
```javascript
// Check mock status
const status = getMockStatus();
console.log('Mock Debug Info:', status);

// Check request history
const axiosMock = mockManager.getAxiosMock();
console.log('Recent requests:', axiosMock.getRequestHistory().slice(-5));

// Check parsing history
const jsdomMock = mockManager.getJSDoMMock();
console.log('Recent parses:', jsdomMock.getParseHistory().slice(-5));
```

## 📚 API Reference

### Main Functions
- `setupMocks(config)` - Install all mocks with configuration
- `restoreMocks()` - Restore original functionality
- `resetMocks()` - Reset mock state
- `validateMocks()` - Validate mock installation
- `getMockStatus()` - Get comprehensive mock status

### Quick Setup Functions
- `setupAmazonSearch(domain, category, searchTerm)` - Standard search scenario
- `setupAmazonError(errorType, domain)` - Error scenario
- `setupAmazonEmpty(domain, searchTerm)` - Empty results scenario
- `setupAmazonSlow(domain, delay)` - Network delay scenario
- `setupRateLimiting(domain)` - Rate limiting scenario

### Mock Instances
- `mockManager.getAxiosMock()` - Get axios mock instance
- `mockManager.getJSDoMMock()` - Get JSDOM mock instance
- `mockManager.getResponseGenerator()` - Get response generator
- `mockManager.getDataGenerator()` - Get data generator

This comprehensive mocking system provides everything needed to test the Amazon scraper thoroughly and reliably! 🎉
