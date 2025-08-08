# Testing Infrastructure - Amazon Scraper Backend

This directory contains a comprehensive testing infrastructure for the Amazon Scraper backend application. The testing setup provides robust utilities, mock data, and fixtures for thorough testing of all application components.

## 📁 Directory Structure

```
tests/
├── setup.js                 # Main test environment configuration
├── fixtures/                # Mock HTML responses from Amazon
│   ├── index.js             # Fixture management utilities
│   ├── amazon-com-search.html
│   ├── amazon-co-uk-search.html
│   ├── amazon-de-search.html
│   └── amazon-empty-search.html
├── utils/                   # Test utility functions
│   ├── index.js            # Main utils export
│   ├── mockDataGenerator.js # Mock product data generation
│   └── testHelpers.js      # HTTP, DOM, and assertion helpers
├── .env.test               # Test environment variables
├── comprehensive.test.js   # Complete example test suite
└── README.md              # This documentation file
```

## 🚀 Getting Started

### Prerequisites

- Bun runtime installed
- Backend server dependencies installed

### Running Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run with verbose output
bun test --verbose

# Run specific test file
bun test tests/comprehensive.test.js
```

## 🛠 Core Components

### 1. Test Setup (`tests/setup.js`)

The main configuration file that initializes the test environment:

- **TestConfig**: Global configuration object with timeouts and settings
- **TestHelper**: Utility class with common test functions
- **TestDatabase**: In-memory test database for mock data
- Environment variable configuration
- Global error handling

```javascript
import { TestConfig, TestHelper } from './tests/setup.js';

// Access test timeouts
const timeout = TestConfig.timeouts.integration; // 15000ms

// Use helper functions
const products = TestHelper.createMockProducts(5);
await TestHelper.wait(1000);
```

### 2. Mock Data Generation (`tests/utils/mockDataGenerator.js`)

Comprehensive mock data generation for testing:

```javascript
import { MockDataGenerator } from './tests/utils/index.js';

const generator = new MockDataGenerator();

// Generate products for different domains
const usProducts = generator.generateProducts(5, { 
  domain: 'amazon.com', 
  category: 'electronics' 
});

// Generate with consistent seeding for reproducible tests
generator.setSeed(12345);
const products1 = generator.generateProducts(3);
generator.setSeed(12345);
const products2 = generator.generateProducts(3);
// products1 === products2
```

**Features:**
- Domain-specific pricing and formatting
- Category-based product generation
- Consistent seeding for reproducible results
- Error scenario generation
- ASIN and URL generation

### 3. Test Fixtures (`tests/fixtures/`)

Real Amazon HTML responses for different domains and scenarios:

```javascript
import { getFixture, createMockResponse } from './tests/fixtures/index.js';

// Load HTML fixture
const html = getFixture('amazon.com', 'smartphones');

// Create mock Axios response
const mockResponse = createMockResponse('amazon.de', 'books', {
  status: 200,
  headers: { 'custom-header': 'value' }
});
```

**Available Fixtures:**
- `amazon.com` - smartphones
- `amazon.co.uk` - laptops  
- `amazon.de` - books (German)
- `amazon-empty-search` - No results found

### 4. Test Helpers (`tests/utils/testHelpers.js`)

#### HTTP Test Helpers
```javascript
import { HttpTestHelpers } from './tests/utils/index.js';

const client = new HttpTestHelpers('http://localhost:3001');

// Check if API is running
const isRunning = await client.isApiRunning();

// Make API requests
const response = await client.get('/api/scrape', { keyword: 'test' });
const postResponse = await client.post('/api/data', { data: 'test' });
```

#### DOM Test Helpers
```javascript
import { DomTestHelpers } from './tests/utils/index.js';

// Parse HTML and extract products
const products = DomTestHelpers.extractProductsFromHtml(htmlContent);

// Validate Amazon HTML structure
const validation = DomTestHelpers.validateAmazonHtml(html);
console.log(validation.isValid, validation.errors);
```

#### Assertion Helpers
```javascript
import { AssertionHelpers } from './tests/utils/index.js';

// Validate product structure
AssertionHelpers.assertProductStructure(product);

// Validate API response format
AssertionHelpers.assertApiResponse(response, {
  success: true,
  hasProducts: true
});

// Range validation
AssertionHelpers.assertRange(value, 1, 100, 'price');
```

#### Performance Helpers
```javascript
import { PerformanceHelpers } from './tests/utils/index.js';

// Measure execution time
const { result, duration } = await PerformanceHelpers.measureTime(asyncFunction);

// Assert performance requirements
const result = await PerformanceHelpers.assertPerformance(
  asyncFunction, 
  1000, // max 1 second
  ...args
);
```

## 📝 Writing Tests

### Basic Test Structure

```javascript
import { test, expect, describe, beforeEach } from 'bun:test';
import { TestHelper, createMockDataGenerator } from './tests/utils/index.js';

describe('Your Test Suite', () => {
  beforeEach(async () => {
    // Setup before each test
    await global.testDB.init();
  });

  test('should test something', () => {
    const mockData = TestHelper.createMockProduct();
    expect(mockData).toHaveProperty('title');
  });
});
```

### Using Mock Data

```javascript
test('should handle different product categories', () => {
  const generator = createMockDataGenerator();
  
  const electronics = generator.generateProducts(3, { category: 'electronics' });
  const books = generator.generateProducts(3, { category: 'books' });
  
  electronics.forEach(product => {
    expect(parseInt(product.price.replace('$', ''))).toBeGreaterThan(50);
  });
});
```

### Testing with Fixtures

```javascript
test('should parse Amazon HTML correctly', () => {
  const html = getFixture('amazon.com', 'smartphones');
  const products = extractProducts(html);
  
  expect(products.length).toBeGreaterThan(0);
  products.forEach(product => {
    assertProduct(product);
  });
});
```

### API Integration Tests

```javascript
test('should handle API requests correctly', async () => {
  const client = createHttpClient();
  const isRunning = await client.isApiRunning();
  
  if (isRunning) {
    const response = await client.get('/api/scrape', { keyword: 'test' });
    assertApiResponse(response.data);
  }
});
```

## 🔧 Configuration

### Environment Variables (`.env.test`)

Key configuration options:
- `NODE_ENV=test` - Sets test environment
- `TEST_PORT=3001` - Test server port
- `TEST_TIMEOUT_*` - Various timeout configurations
- `LOG_LEVEL=error` - Reduced logging during tests

### Test Database

The in-memory test database provides:
- Mock product scenarios by category
- Domain configurations for different Amazon sites
- Search analytics tracking

```javascript
// Access test data
const products = global.testDB.getProductsByScenario('electronics-phone');
const domainConfig = global.testDB.getDomainConfig('amazon.de');

// Record test data
global.testDB.recordSearch('keyword', 'amazon.com', 5);
```

## 🎯 Test Categories

### 1. Unit Tests
- Individual function testing
- Mock data validation
- Utility function testing
- **Timeout**: 5 seconds

### 2. Integration Tests  
- API endpoint testing
- Database integration
- Service interaction testing
- **Timeout**: 15 seconds

### 3. End-to-End Tests
- Complete workflow testing
- Real scraping scenarios (when enabled)
- Performance testing
- **Timeout**: 30 seconds

## 🧪 Best Practices

### 1. Test Isolation
- Use `beforeEach`/`afterEach` for cleanup
- Reset mock generators between tests
- Clear test database state

### 2. Reproducible Tests
- Use seeded random data generation
- Avoid depending on external services
- Use consistent test fixtures

### 3. Comprehensive Coverage
- Test happy paths and edge cases
- Validate error handling
- Test different domains and locales

### 4. Performance Testing
- Measure critical path performance
- Test timeout handling
- Validate resource cleanup

## 📊 Example Test Output

```bash
✓ Mock Data Generation
  ✓ should generate consistent mock products with seed
  ✓ should generate domain-specific data
  ✓ should generate error scenarios

✓ Fixture Management  
  ✓ should load Amazon.com fixture correctly
  ✓ should create mock responses for different domains
  ✓ should handle empty search results

✓ HTTP Test Helpers
  ✓ should check API health
  ✓ should handle API validation errors

✅ All tests passed (15 passed, 0 failed)
⏱️  Test duration: 2.45s
```

## 🤝 Contributing

When adding new tests:
1. Follow the existing naming conventions
2. Add appropriate mock data and fixtures
3. Include both success and error scenarios
4. Update documentation for new utilities
5. Ensure tests are isolated and reproducible

## 🐛 Troubleshooting

### Common Issues

1. **"Test server not running"**
   - Start the backend server: `bun run dev`
   - Or use mock-only tests

2. **"Fixture file not found"**
   - Check fixture file paths in `tests/fixtures/`
   - Verify fixture name spelling

3. **"Mock data inconsistency"**
   - Reset generator seed: `generator.setSeed(12345)`
   - Clear generator state: `generator.reset()`

4. **Performance test failures**
   - Increase timeout values in test config
   - Check system performance during testing

This testing infrastructure provides a solid foundation for comprehensive testing of the Amazon scraper backend application. Use the provided utilities and examples to create robust, maintainable tests.
