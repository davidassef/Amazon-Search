/**
 * Edge Cases and Error Scenarios Test Suite
 * Comprehensive testing for failure scenarios and edge cases
 * 
 * Test Coverage:
 * - Amazon blocking requests (503/429 status codes)
 * - Malformed HTML responses
 * - Empty search results
 * - Invalid product data
 * - Network timeouts and connection resets
 * - Concurrent request handling
 * - Memory usage with large result sets
 * - Special characters in search keywords
 */

import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
const request = require('supertest');
const { app, scrapeAmazonProducts } = require('../server');
const axios = require('axios');

// Mock axios for controlled testing
const mockAxios = {
  get: mock(() => Promise.resolve({ data: '<html></html>' })),
  create: mock(() => mockAxios)
};

describe('Edge Cases and Error Scenarios', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    mockAxios.get.mockClear();
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks?.();
  });

  describe('Amazon Blocking Requests (503/429 Status Codes)', () => {
    
    test('should handle 503 Service Unavailable with retry logic', async () => {
      // Mock 503 response followed by successful response
      mockAxios.get
        .mockResolvedValueOnce({
          response: {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'retry-after': '2' }
          }
        })
        .mockRejectedValueOnce({
          response: {
            status: 503,
            statusText: 'Service Unavailable'
          }
        })
        .mockResolvedValueOnce({
          status: 200,
          data: generateValidAmazonHTML()
        });

      // Replace axios with our mock
      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        expect(products).toBeDefined();
        expect(Array.isArray(products)).toBe(true);
        expect(mockAxios.get).toHaveBeenCalledTimes(3); // Initial + 2 retries
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle 429 Too Many Requests with exponential backoff', async () => {
      // Mock 429 responses followed by success
      mockAxios.get
        .mockRejectedValueOnce({
          response: {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'retry-after': '60' }
          }
        })
        .mockRejectedValueOnce({
          response: {
            status: 429,
            statusText: 'Too Many Requests'
          }
        })
        .mockResolvedValueOnce({
          status: 200,
          data: generateValidAmazonHTML()
        });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const startTime = Date.now();
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        const duration = Date.now() - startTime;
        
        expect(products).toBeDefined();
        expect(mockAxios.get).toHaveBeenCalledTimes(3);
        // Should have waited for exponential backoff
        expect(duration).toBeGreaterThan(2000); // At least 2 seconds
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should fail after maximum retries on persistent 503 errors', async () => {
      // Mock persistent 503 errors
      mockAxios.get.mockRejectedValue({
        response: {
          status: 503,
          statusText: 'Service Unavailable'
        }
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        await expect(scrapeAmazonProducts('test keyword', 'amazon.com')).rejects.toThrow();
        expect(mockAxios.get).toHaveBeenCalledTimes(4); // Initial + 3 retries
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle Amazon CAPTCHA/bot detection pages', async () => {
      const captchaHTML = `
        <html>
          <head><title>Robot Check</title></head>
          <body>
            <h1>Please enable cookies and reload the page.</h1>
            <p>This page appears when Google automatically detects requests coming from your computer network which appear to be in violation of the Terms of Service.</p>
            <form id="captcha-form">
              <input type="text" name="captcha" />
              <button type="submit">Continue shopping</button>
            </form>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: captchaHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        // Should return empty array when encountering CAPTCHA
        expect(products).toEqual([]);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('API endpoint should handle 503 errors gracefully', async () => {
      // Mock scrapeAmazonProducts to throw 503 error
      const originalScrape = require('../server').scrapeAmazonProducts;
      const mockScrape = mock(() => {
        const error = new Error('Service Unavailable');
        error.response = { status: 503 };
        throw error;
      });
      
      require('../server').scrapeAmazonProducts = mockScrape;

      try {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'test' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Failed to scrape Amazon products');
      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });
  });

  describe('Malformed HTML Responses', () => {
    
    test('should handle completely malformed HTML', async () => {
      const malformedHTML = `
        <html><head><title>Amazon</title
        <body>
          <div class="s-search-results
            <div data-component-type="s-search-result"
              <h2><a href="/dp/B123"><span>Broken Product</span></a>
              <span class="a-price">$99.99
            </div>
        </body>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: malformedHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        // Should still attempt to extract what it can
        expect(Array.isArray(products)).toBe(true);
        // May or may not find products depending on how malformed the HTML is
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle HTML with missing essential elements', async () => {
      const incompleteHTML = `
        <html>
          <head><title>Amazon Search Results</title></head>
          <body>
            <div class="s-search-results">
              <!-- Missing product containers -->
              <div class="s-no-results">
                <span>No search results</span>
              </div>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: incompleteHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        expect(products).toEqual([]);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle HTML with corrupted encoding', async () => {
      const corruptedHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123"><span>Pr�duct w�th corr�pted ch�racters &#65533;</span></a></h2>
              <span class="a-price">��99.99</span>
              <span class="a-icon-alt">4.� out of 5 stars</span>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: corruptedHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        expect(Array.isArray(products)).toBe(true);
        
        if (products.length > 0) {
          // Should handle corrupted characters gracefully
          expect(products[0].title).toContain('Product');
          expect(products[0].price).toBeDefined();
        }
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle HTML with nested malformed structures', async () => {
      const nestedMalformedHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2>
                <a href="/dp/B123">
                  <span>Product Title
                    <div>
                      <span>Nested broken content
                        <div class="price">
                          <span class="a-price">$99.99</span>
                      </div>
                  </span>
                </a>
              </h2>
              <div class="rating">
                <span class="a-icon-alt">4.5 out of
              </div>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: nestedMalformedHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test keyword', 'amazon.com');
        expect(Array.isArray(products)).toBe(true);
        // Should extract what it can from malformed structure
      } finally {
        axios.get = originalAxios;
      }
    });
  });

  describe('Empty Search Results', () => {
    
    test('should handle Amazon "No results" page', async () => {
      const noResultsHTML = `
        <html>
          <head><title>Amazon.com: no results</title></head>
          <body>
            <div class="s-desktop-width-max">
              <div class="sg-col-20-of-24">
                <div class="s-no-results">
                  <span class="a-color-state a-text-bold">No results for</span>
                  <span class="a-color-state a-text-bold">nonexistentproduct12345xyz</span>
                </div>
                <div class="s-suggestion-container">
                  <span>Try checking your spelling or use more general terms</span>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: noResultsHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('nonexistentproduct12345xyz', 'amazon.com');
        expect(products).toEqual([]);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle search with only sponsored results (no organic)', async () => {
      const sponsoredOnlyHTML = `
        <html>
          <body>
            <div class="s-search-results">
              <div data-component-type="sp-sponsored-result">
                <h2><a href="/dp/B456"><span>Sponsored Product</span></a></h2>
                <span class="a-price">$199.99</span>
              </div>
              <!-- No organic results -->
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: sponsoredOnlyHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('sponsored only', 'amazon.com');
        // Should skip sponsored results and return empty array
        expect(products).toEqual([]);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('API should handle empty results gracefully', async () => {
      // Mock to return empty array
      const originalScrape = require('../server').scrapeAmazonProducts;
      require('../server').scrapeAmazonProducts = mock(() => Promise.resolve([]));

      try {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'nonexistent' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.products).toEqual([]);
        expect(res.body.totalProducts).toBe(0);
      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });
  });

  describe('Invalid Product Data', () => {
    
    test('should handle products with missing titles', async () => {
      const missingTitleHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123"><span></span></a></h2>
              <span class="a-price">$99.99</span>
              <span class="a-icon-alt">4.5 out of 5 stars</span>
            </div>
            <div data-component-type="s-search-result">
              <!-- No title element at all -->
              <span class="a-price">$149.99</span>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: missingTitleHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test', 'amazon.com');
        // Should filter out products without titles
        expect(products).toEqual([]);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle products with malformed prices', async () => {
      const malformedPricesHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123"><span>Product with Invalid Price</span></a></h2>
              <span class="a-price">Price not available</span>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B456"><span>Product with Weird Price</span></a></h2>
              <span class="a-price">$abc.def</span>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B789"><span>Product with No Price</span></a></h2>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: malformedPricesHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test', 'amazon.com');
        expect(Array.isArray(products)).toBe(true);
        
        products.forEach(product => {
          expect(product).toHaveProperty('price');
          // Price should be either valid or 'N/A'
          expect(product.price).toBeDefined();
        });
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle products with invalid ratings', async () => {
      const invalidRatingsHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123"><span>Product with Invalid Rating</span></a></h2>
              <span class="a-icon-alt">Not rated</span>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B456"><span>Product with Weird Rating</span></a></h2>
              <span class="a-icon-alt">abc out of xyz stars</span>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B789"><span>Product with Extreme Rating</span></a></h2>
              <span class="a-icon-alt">999 out of 5 stars</span>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: invalidRatingsHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test', 'amazon.com');
        expect(Array.isArray(products)).toBe(true);
        
        products.forEach(product => {
          expect(product).toHaveProperty('rating');
          // Rating should be valid number string or 'N/A'
          if (product.rating !== 'N/A') {
            const rating = parseFloat(product.rating);
            expect(rating).toBeGreaterThanOrEqual(0);
            expect(rating).toBeLessThanOrEqual(5);
          }
        });
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle products with broken URLs', async () => {
      const brokenURLsHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href=""><span>Product with Empty URL</span></a></h2>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="invalid-url"><span>Product with Invalid URL</span></a></h2>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/"><span>Product with Incomplete URL</span></a></h2>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: brokenURLsHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('test', 'amazon.com');
        expect(Array.isArray(products)).toBe(true);
        
        products.forEach(product => {
          expect(product).toHaveProperty('productUrl');
          expect(product.productUrl).toBeDefined();
          // Should either be a valid URL or fallback search URL
          expect(product.productUrl).not.toBe('');
        });
      } finally {
        axios.get = originalAxios;
      }
    });
  });

  describe('Network Timeouts and Connection Resets', () => {
    
    test('should handle network timeouts', async () => {
      mockAxios.get.mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        await expect(scrapeAmazonProducts('test', 'amazon.com')).rejects.toThrow();
        expect(mockAxios.get).toHaveBeenCalledTimes(4); // Should retry 3 times
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle connection resets', async () => {
      mockAxios.get.mockRejectedValue({
        code: 'ECONNRESET',
        message: 'Connection reset by peer'
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        await expect(scrapeAmazonProducts('test', 'amazon.com')).rejects.toThrow();
        expect(mockAxios.get).toHaveBeenCalledTimes(4); // Should retry 3 times
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle DNS resolution failures', async () => {
      mockAxios.get.mockRejectedValue({
        code: 'ENOTFOUND',
        message: 'getaddrinfo ENOTFOUND invalid.amazon.com'
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        await expect(scrapeAmazonProducts('test', 'amazon.com')).rejects.toThrow();
        // DNS errors should not trigger retries
        expect(mockAxios.get).toHaveBeenCalledTimes(1);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('API should handle network errors gracefully', async () => {
      const originalScrape = require('../server').scrapeAmazonProducts;
      require('../server').scrapeAmazonProducts = mock(() => {
        const error = new Error('Network timeout');
        error.code = 'ETIMEDOUT';
        throw error;
      });

      try {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'test' });

        expect(res.status).toBe(500);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toBe('Failed to scrape Amazon products');
      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });
  });

  describe('Concurrent Request Handling', () => {
    
    test('should handle multiple simultaneous requests', async () => {
      const requests = [];
      
      for (let i = 0; i < 5; i++) {
        requests.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `test${i}` })
        );
      }

      const responses = await Promise.all(requests);
      
      responses.forEach((res, index) => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.keyword).toBe(`test${index}`);
      });
    });

    test('should handle concurrent requests with failures', async () => {
      const originalScrape = require('../server').scrapeAmazonProducts;
      let callCount = 0;
      
      require('../server').scrapeAmazonProducts = mock(async (keyword) => {
        callCount++;
        if (callCount % 2 === 0) {
          throw new Error('Simulated failure');
        }
        return [];
      });

      try {
        const requests = [];
        
        for (let i = 0; i < 6; i++) {
          requests.push(
            request(app)
              .get('/api/scrape')
              .query({ keyword: `test${i}` })
              .catch(err => err.response)
          );
        }

        const responses = await Promise.all(requests);
        
        // Should have mix of success and failures
        const successes = responses.filter(res => res.body?.success === true);
        const failures = responses.filter(res => res.body?.success === false);
        
        expect(successes.length).toBe(3);
        expect(failures.length).toBe(3);
      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });

    test('should handle request queue overflow', async () => {
      // Simulate many concurrent requests
      const requests = [];
      
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `concurrent${i}` })
            .timeout(5000) // 5 second timeout
        );
      }

      const startTime = Date.now();
      const responses = await Promise.allSettled(requests);
      const duration = Date.now() - startTime;

      // All requests should complete within reasonable time
      expect(duration).toBeLessThan(30000); // 30 seconds max
      
      const fulfilled = responses.filter(r => r.status === 'fulfilled');
      const rejected = responses.filter(r => r.status === 'rejected');
      
      // Most should succeed, some might timeout
      expect(fulfilled.length).toBeGreaterThan(15);
      expect(rejected.length).toBeLessThan(5);
    });
  });

  describe('Memory Usage with Large Result Sets', () => {
    
    test('should handle large HTML response without memory overflow', async () => {
      // Generate large HTML with many products
      const largeHTML = generateLargeAmazonHTML(100); // 100 products
      
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: largeHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const initialMemory = process.memoryUsage().heapUsed;
        
        const products = await scrapeAmazonProducts('large dataset', 'amazon.com');
        
        const finalMemory = process.memoryUsage().heapUsed;
        const memoryIncrease = finalMemory - initialMemory;
        
        expect(Array.isArray(products)).toBe(true);
        expect(products.length).toBeLessThanOrEqual(20); // API limits to 20
        
        // Memory increase should be reasonable (less than 50MB)
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should limit product results to prevent memory issues', async () => {
      const manyProductsHTML = generateLargeAmazonHTML(200);
      
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: manyProductsHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('many products', 'amazon.com');
        
        // Should be limited by API response limit
        expect(products.length).toBeLessThanOrEqual(20);
      } finally {
        axios.get = originalAxios;
      }
    });

    test('should handle extremely long product titles', async () => {
      const longTitle = 'A'.repeat(10000); // 10KB title
      const longTitleHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123"><span>${longTitle}</span></a></h2>
              <span class="a-price">$99.99</span>
            </div>
          </body>
        </html>
      `;

      mockAxios.get.mockResolvedValue({
        status: 200,
        data: longTitleHTML
      });

      const originalAxios = axios.get;
      axios.get = mockAxios.get;

      try {
        const products = await scrapeAmazonProducts('long title', 'amazon.com');
        
        expect(products.length).toBe(1);
        // Should be truncated to 200 characters
        expect(products[0].title.length).toBeLessThanOrEqual(200);
      } finally {
        axios.get = originalAxios;
      }
    });
  });

  describe('Special Characters in Search Keywords', () => {
    
    test('should handle Unicode characters', async () => {
      const unicodeKeywords = [
        'café',
        'naïve',
        'résumé',
        '北京',
        'تسوق',
        'прода́жа',
        'Ελλάδα',
        'हिन्दी'
      ];

      for (const keyword of unicodeKeywords) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.keyword).toBe(keyword);
      }
    });

    test('should handle special URL characters', async () => {
      const specialKeywords = [
        'AT&T',
        'C++',
        'R&D',
        '50% off',
        '$100',
        '#hashtag',
        'user@domain.com',
        'https://example.com'
      ];

      for (const keyword of specialKeywords) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.keyword).toBe(keyword);
      }
    });

    test('should handle HTML entities and injection attempts', async () => {
      const maliciousKeywords = [
        '<script>alert("xss")</script>',
        '&lt;img src=x onerror=alert(1)&gt;',
        '"><script>alert("xss")</script>',
        'javascript:alert(1)',
        '\'; DROP TABLE products; --',
        '{{7*7}}',
        '${7*7}',
        '<iframe src="javascript:alert(1)"></iframe>'
      ];

      for (const keyword of maliciousKeywords) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Keyword should be properly escaped/sanitized
        expect(res.body.keyword).toBe(keyword);
      }
    });

    test('should handle extremely long keywords', async () => {
      const longKeyword = 'a'.repeat(10000); // 10KB keyword

      const res = await request(app)
        .get('/api/scrape')
        .query({ keyword: longKeyword });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.keyword).toBe(longKeyword);
    });

    test('should handle whitespace and control characters', async () => {
      const whitespaceKeywords = [
        '   leading spaces',
        'trailing spaces   ',
        'multiple    spaces',
        '\ttab\tcharacters\t',
        '\nnewline\ncharacters\n',
        '\r\ncarriage\r\nreturns\r\n',
        'mixed\t \n\r whitespace'
      ];

      for (const keyword of whitespaceKeywords) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    test('should handle emoji and special Unicode', async () => {
      const emojiKeywords = [
        '📱 smartphone',
        'laptop 💻',
        '🎮 gaming',
        '👟 running shoes',
        '📚 books',
        'coffee ☕',
        '🏠 home decor',
        '🚗 car accessories'
      ];

      for (const keyword of emojiKeywords) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.keyword).toBe(keyword);
      }
    });
  });

  describe('Comprehensive Error Recovery', () => {
    
    test('should recover from multiple consecutive failures', async () => {
      let attemptCount = 0;
      
      const originalScrape = require('../server').scrapeAmazonProducts;
      require('../server').scrapeAmazonProducts = mock(async (keyword) => {
        attemptCount++;
        
        if (attemptCount <= 3) {
          const error = new Error(`Failure attempt ${attemptCount}`);
          error.response = { status: 503 };
          throw error;
        }
        
        return [{ title: 'Recovery success', price: '$99.99', rating: '4.5', reviews: '100', productUrl: 'https://amazon.com/dp/B123', imageUrl: 'test.jpg' }];
      });

      try {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'recovery test' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.products).toHaveLength(1);
      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });

    test('should maintain service stability under stress', async () => {
      const requests = [];
      
      // Mix of successful and failing requests
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: i % 3 === 0 ? 'fail' : 'success' })
        );
      }

      const responses = await Promise.allSettled(requests);
      const fulfilled = responses.filter(r => r.status === 'fulfilled').length;
      
      // Service should handle mixed load gracefully
      expect(fulfilled).toBeGreaterThan(5);
    });
  });
});

// Helper functions

function generateValidAmazonHTML() {
  return `
    <html>
      <head><title>Amazon.com: Test Search</title></head>
      <body>
        <div class="s-search-results">
          <div data-component-type="s-search-result">
            <h2><a href="/dp/B123456789"><span>Test Product 1</span></a></h2>
            <span class="a-price"><span class="a-offscreen">$99.99</span></span>
            <span class="a-icon-alt">4.5 out of 5 stars</span>
            <span class="a-size-base">1,234</span>
            <img src="https://test.com/image1.jpg" alt="Product 1" />
          </div>
          <div data-component-type="s-search-result">
            <h2><a href="/dp/B987654321"><span>Test Product 2</span></a></h2>
            <span class="a-price"><span class="a-offscreen">$149.99</span></span>
            <span class="a-icon-alt">4.2 out of 5 stars</span>
            <span class="a-size-base">567</span>
            <img src="https://test.com/image2.jpg" alt="Product 2" />
          </div>
        </div>
      </body>
    </html>
  `;
}

function generateLargeAmazonHTML(productCount) {
  let html = `
    <html>
      <head><title>Amazon.com: Large Search</title></head>
      <body>
        <div class="s-search-results">
  `;
  
  for (let i = 1; i <= productCount; i++) {
    html += `
          <div data-component-type="s-search-result">
            <h2><a href="/dp/B${i.toString().padStart(9, '0')}"><span>Large Dataset Product ${i}</span></a></h2>
            <span class="a-price"><span class="a-offscreen">$${(Math.random() * 500 + 10).toFixed(2)}</span></span>
            <span class="a-icon-alt">${(Math.random() * 2 + 3).toFixed(1)} out of 5 stars</span>
            <span class="a-size-base">${Math.floor(Math.random() * 10000)}</span>
            <img src="https://test.com/image${i}.jpg" alt="Product ${i}" />
          </div>
    `;
  }
  
  html += `
        </div>
      </body>
    </html>
  `;
  
  return html;
}
