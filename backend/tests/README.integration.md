# API Integration Tests

Comprehensive integration tests for all Amazon Scraper API endpoints with full coverage of validation, error handling, CORS, and middleware functionality.

## Test Structure

### Test Files

#### 1. `api.integration.test.js`
**Main API endpoint integration tests**

- **GET /api/scrape**: Complete testing of the scraping endpoint
  - ✅ Valid keywords with different domains
  - ✅ Missing parameters (keyword required)
  - ✅ Short keywords (minimum 2 characters)
  - ✅ Unsupported domains validation
  - ✅ Success responses with product data
  - ✅ Empty search results handling
  - ✅ Error responses (network, timeout, parsing errors)
  - ✅ Request parameter sanitization
  - ✅ Special characters and UTF-8 support
  - ✅ SQL injection prevention
  - ✅ Concurrent request handling

- **GET /api/health**: Health check endpoint testing
  - ✅ Response format validation (success, message, timestamp)
  - ✅ Status code verification (200 OK)
  - ✅ Consistent response structure
  - ✅ ISO 8601 timestamp format

- **GET /**: Root endpoint information testing
  - ✅ API information structure
  - ✅ Endpoint documentation
  - ✅ Response consistency

#### 2. `middleware.integration.test.js`
**Middleware and infrastructure testing**

- **CORS Middleware**
  - ✅ Access-Control-Allow-Origin headers
  - ✅ Preflight OPTIONS requests
  - ✅ Cross-origin request support
  - ✅ Multiple origin handling

- **Request/Response Validation**
  - ✅ JSON content-type headers
  - ✅ Query parameter parsing
  - ✅ URL encoding support
  - ✅ Malformed request handling

- **Security Testing**
  - ✅ Server information disclosure prevention
  - ✅ Suspicious header handling
  - ✅ XSS prevention in headers
  - ✅ Custom header support

- **Error Handling**
  - ✅ 404 errors for non-existent routes
  - ✅ HTTP method validation
  - ✅ Consistent error response structure

## Test Coverage

### API Endpoints Tested

| Endpoint | Method | Test Scenarios | Status |
|----------|--------|----------------|--------|
| `/api/scrape` | GET | 15+ scenarios | ✅ Complete |
| `/api/health` | GET | 3 scenarios | ✅ Complete |
| `/` | GET | 3 scenarios | ✅ Complete |
| `/*` (404s) | GET | 5+ scenarios | ✅ Complete |

### Test Categories

#### ✅ Request Validation
- [x] Required parameters
- [x] Parameter length validation
- [x] Domain validation
- [x] Special character handling
- [x] URL encoding support

#### ✅ Error Responses
- [x] 400 Bad Request (missing/invalid params)
- [x] 500 Internal Server Error (network/parsing errors)
- [x] 404 Not Found (invalid routes)
- [x] Error message consistency

#### ✅ CORS Headers
- [x] Access-Control-Allow-Origin
- [x] Access-Control-Allow-Methods
- [x] Access-Control-Allow-Headers
- [x] Preflight request handling

#### ✅ Security Testing
- [x] XSS prevention
- [x] SQL injection prevention
- [x] Server information disclosure
- [x] Header injection prevention

#### ✅ Performance & Reliability
- [x] Concurrent request handling
- [x] Long URL support
- [x] Unicode character support
- [x] Response time validation

## Running the Tests

### Quick Start

```bash
# Run all integration tests
npm run test:all-integration

# Run individual test suites
npm run test:api
npm run test:middleware

# Run both integration test files
npm run test:endpoints
```

### Detailed Commands

```bash
# Run API integration tests only
bun test tests/api.integration.test.js --timeout 30000

# Run middleware tests only  
bun test tests/middleware.integration.test.js --timeout 30000

# Run with verbose output
bun test tests/api.integration.test.js --verbose

# Run with coverage
bun test --coverage tests/api.integration.test.js
```

### Test Runner Script

The `run-integration-tests.js` script provides:

- ✅ Prerequisite checking
- ✅ Colored console output
- ✅ Test execution summary
- ✅ Coverage reporting
- ✅ JSON report generation
- ✅ Error analysis

```bash
# Use the comprehensive test runner
node run-integration-tests.js
```

## Test Results and Reporting

### Console Output
The test runner provides colored, structured output showing:
- Prerequisites validation
- Test execution progress
- Pass/fail counts per suite
- Overall summary
- Recommendations

### JSON Report
Detailed test results are saved to `test-results.json`:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalSuites": 3,
    "totalTests": 45,
    "totalPassed": 45,
    "totalFailed": 0,
    "successRate": "100.00"
  },
  "coverage": {
    "endpoints": 7,
    "testScenarios": [...]
  }
}
```

## Mock Configuration

### Axios Mocking
Tests use mocked HTTP requests to avoid external dependencies:

```javascript
const axiosGetSpy = spyOn(require('axios'), 'get');
axiosGetSpy.mockResolvedValueOnce({
  data: '<html><body>...</body></html>'
});
```

### Response Mocking
Mock HTML responses simulate different Amazon page scenarios:
- Product search results
- Empty search results
- Error responses
- Malformed HTML

## Test Scenarios Coverage

### GET /api/scrape Testing

#### Valid Requests
- ✅ Minimum valid keyword (2 chars)
- ✅ Normal keywords
- ✅ Keywords with spaces
- ✅ Special characters (café, &, %)
- ✅ Unicode characters (🔍, 测试)
- ✅ All supported Amazon domains

#### Invalid Requests
- ✅ Missing keyword parameter
- ✅ Empty keyword
- ✅ Single character keyword
- ✅ Unsupported domains
- ✅ Empty domain parameter

#### Error Handling
- ✅ Network timeout (ETIMEDOUT)
- ✅ HTTP errors (403, 500)
- ✅ Parsing errors
- ✅ Connection reset errors

#### Security Testing
- ✅ XSS in keyword parameter
- ✅ SQL injection attempts
- ✅ Very long URLs
- ✅ Malicious headers

### GET /api/health Testing

#### Response Validation
- ✅ Status code 200
- ✅ JSON content type
- ✅ Required fields (success, message, timestamp)
- ✅ ISO 8601 timestamp format
- ✅ Consistent responses

### GET / Testing

#### API Documentation
- ✅ Correct message field
- ✅ Endpoints documentation
- ✅ Response structure
- ✅ Consistency across requests

### CORS Testing

#### Headers Validation
- ✅ Access-Control-Allow-Origin: *
- ✅ Preflight OPTIONS support
- ✅ Multiple origin support
- ✅ Header consistency across endpoints

## Error Scenarios Testing

### 400 Bad Request
- Missing required parameters
- Invalid parameter values
- Unsupported domain values
- Empty parameter values

### 404 Not Found
- Non-existent API endpoints
- Wrong HTTP methods
- Typos in endpoint URLs

### 500 Internal Server Error
- Network timeouts
- HTTP request failures
- Parsing errors
- Unexpected exceptions

## Continuous Integration

### Prerequisites
- Bun runtime
- Node.js (fallback)
- All npm dependencies
- Test files present
- Server file accessible

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - uses: oven-sh/setup-bun@v1
    - run: bun install
    - run: npm run test:all-integration
```

## Best Practices Implemented

### Test Structure
- ✅ Descriptive test names
- ✅ Grouped test suites
- ✅ Setup/teardown hooks
- ✅ Proper mocking
- ✅ Isolated test cases

### Assertions
- ✅ Specific status code checks
- ✅ Response structure validation
- ✅ Header verification
- ✅ Content-type validation
- ✅ Error message validation

### Mock Management
- ✅ Axios request mocking
- ✅ Console output suppression
- ✅ Mock cleanup between tests
- ✅ Realistic mock data

### Error Handling
- ✅ Timeout configuration
- ✅ Error message extraction
- ✅ Graceful failure handling
- ✅ Detailed error reporting

## Future Enhancements

### Additional Test Scenarios
- [ ] Rate limiting tests
- [ ] Load testing
- [ ] Memory leak detection
- [ ] Database integration tests
- [ ] Cache functionality tests

### Enhanced Reporting
- [ ] HTML test reports
- [ ] Code coverage visualization
- [ ] Performance metrics
- [ ] Historical test trends

### CI/CD Improvements
- [ ] Parallel test execution
- [ ] Test result artifacts
- [ ] Slack/email notifications
- [ ] Automated deployment gates

---

## Troubleshooting

### Common Issues

1. **Tests failing with mock errors**
   - Ensure axios mocking is properly configured
   - Check mock restoration in afterEach hooks

2. **Timeout errors**
   - Increase timeout values for slow environments
   - Check server startup time

3. **CORS test failures**
   - Verify cors middleware is properly configured
   - Check Express middleware order

4. **Missing dependencies**
   - Run `bun install` or `npm install`
   - Check package.json devDependencies

### Debug Mode

```bash
# Run with verbose output
bun test --verbose tests/api.integration.test.js

# Run single test
bun test --grep "should return 200 OK" tests/api.integration.test.js
```

This comprehensive test suite ensures your Amazon Scraper API is robust, secure, and fully functional across all endpoints and edge cases.
