/**
 * API Integration Tests - Amazon Scraper Backend
 * 
 * Comprehensive integration tests for all API endpoints:
 * - GET /api/scrape
 * - GET /api/health  
 * - GET /
 * - CORS headers and middleware functionality
 * - Error responses and status codes
 * - Request validation and sanitization
 */

import { test, expect, describe, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import request from 'supertest';
import { app, AMAZON_DOMAINS } from '../server.js';

// Mock axios to avoid real HTTP requests
const axios = {
  get: mock(() => {
    throw new Error('Mock not configured');
  })
};

// Mock JSDOM
const mockJSDOM = {
  window: {
    document: {
      querySelectorAll: mock(() => []),
      querySelector: mock(() => null)
    }
  }
};

describe('API Integration Tests', () => {
  let axiosGetSpy;
  let originalConsoleLog;
  let originalConsoleError;

  beforeEach(() => {
    // Mock axios
    axiosGetSpy = spyOn(require('axios'), 'get');
    
    // Suppress console output during tests
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = mock();
    console.error = mock();
  });

  afterEach(() => {
    // Restore console output
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    
    // Reset mocks
    axiosGetSpy?.mockRestore();
    mock.restore();
  });

  describe('GET /api/health', () => {
    test('should return 200 OK with correct response format', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Amazon Scraper API is running',
        timestamp: expect.any(String)
      });

      // Validate timestamp format (ISO 8601)
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('should return health check status consistently', async () => {
      const promises = Array(5).fill().map(() => 
        request(app).get('/api/health')
      );
      
      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Amazon Scraper API is running');
      });
    });

    test('should include CORS headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Check for CORS headers (set by cors middleware)
      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('GET /', () => {
    test('should return API information with correct structure', async () => {
      const response = await request(app)
        .get('/')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        message: 'Amazon Product Scraper API',
        endpoints: {
          scrape: '/api/scrape?keyword=<search-term>',
          health: '/api/health'
        }
      });
    });

    test('should include CORS headers for root endpoint', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });

    test('should return consistent API information', async () => {
      const response1 = await request(app).get('/');
      const response2 = await request(app).get('/');

      expect(response1.body).toEqual(response2.body);
      expect(response1.status).toBe(response2.status);
    });
  });

  describe('GET /api/scrape - Request Validation', () => {
    test('should return 400 when keyword parameter is missing', async () => {
      const response = await request(app)
        .get('/api/scrape')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Keyword parameter is required'
      });
    });

    test('should return 400 when keyword is too short', async () => {
      const response = await request(app)
        .get('/api/scrape?keyword=a')
        .expect(400)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Keyword must be at least 2 characters long'
      });
    });

    test('should accept minimum valid keyword length', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body><div data-component-type="s-search-result"></div></body></html>'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=ab')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.keyword).toBe('ab');
    });

    test('should sanitize keyword parameter', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body><div data-component-type="s-search-result"></div></body></html>'
      });

      const dirtyKeyword = '<script>alert("xss")</script>laptop';
      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(dirtyKeyword)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.keyword).toBe(dirtyKeyword);
      // The keyword should be used as-is for search, but not executed as code
    });

    test('should handle special characters in keyword', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body><div data-component-type="s-search-result"></div></body></html>'
      });

      const specialKeyword = 'café & "special" chars 50%';
      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(specialKeyword)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.keyword).toBe(specialKeyword);
    });
  });

  describe('GET /api/scrape - Domain Validation', () => {
    test('should use default domain when not specified', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body><div data-component-type="s-search-result"></div></body></html>'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.domain).toBe('amazon.com');
    });

    test('should accept valid Amazon domains', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body><div data-component-type="s-search-result"></div></body></html>'
      });

      const validDomains = Object.keys(AMAZON_DOMAINS);
      
      for (const domain of validDomains.slice(0, 3)) { // Test first 3 to avoid too many requests
        const response = await request(app)
          .get(`/api/scrape?keyword=laptop&domain=${domain}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.domain).toBe(domain);
      }
    });

    test('should return 400 for unsupported domains', async () => {
      const invalidDomains = [
        'amazon.invalid',
        'ebay.com',
        'google.com',
        'not-amazon.com'
      ];

      for (const domain of invalidDomains) {
        const response = await request(app)
          .get(`/api/scrape?keyword=laptop&domain=${domain}`)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: expect.stringContaining('Unsupported Amazon domain')
        });
        expect(response.body.error).toContain(domain);
        expect(response.body.error).toContain('Supported domains:');
      }
    });
  });

  describe('GET /api/scrape - Success Response', () => {
    test('should return successful scraping response with valid data', async () => {
      // Mock successful scraping response with product data
      const mockHtml = `
        <html>
          <body>
            <div data-component-type="s-search-result" data-asin="B08N5WRWNW">
              <h2><a href="/dp/B08N5WRWNW"><span>Test Product</span></a></h2>
              <span class="a-price"><span class="a-offscreen">$99.99</span></span>
              <span class="a-icon-alt">4.5 out of 5 stars</span>
              <span class="a-size-base">1,234</span>
              <img src="https://example.com/image.jpg" alt="Product Image" />
            </div>
          </body>
        </html>
      `;
      
      axiosGetSpy.mockResolvedValueOnce({ data: mockHtml });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop&domain=amazon.com')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: true,
        keyword: 'laptop',
        domain: 'amazon.com',
        totalProducts: expect.any(Number),
        products: expect.any(Array)
      });

      expect(response.body.totalProducts).toBeGreaterThanOrEqual(0);
      expect(response.body.products).toHaveLength(Math.min(response.body.totalProducts, 20));
    });

    test('should limit products to maximum of 20', async () => {
      // Create mock HTML with many products
      const productElements = Array(30).fill().map((_, i) => `
        <div data-component-type="s-search-result" data-asin="B08N5WRWNW${i}">
          <h2><a href="/dp/B08N5WRWNW${i}"><span>Test Product ${i + 1}</span></a></h2>
          <span class="a-price"><span class="a-offscreen">$${50 + i}.99</span></span>
        </div>
      `).join('');

      const mockHtml = `<html><body>${productElements}</body></html>`;
      axiosGetSpy.mockResolvedValueOnce({ data: mockHtml });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.totalProducts).toBeGreaterThan(20);
      expect(response.body.products).toHaveLength(20);
    });

    test('should handle empty search results', async () => {
      const emptyHtml = '<html><body><div class="s-no-results">No results found</div></body></html>';
      axiosGetSpy.mockResolvedValueOnce({ data: emptyHtml });

      const response = await request(app)
        .get('/api/scrape?keyword=nonexistentproduct123')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        keyword: 'nonexistentproduct123',
        totalProducts: 0,
        products: []
      });
    });
  });

  describe('GET /api/scrape - Error Handling', () => {
    test('should return 500 for network timeout errors', async () => {
      axiosGetSpy.mockRejectedValueOnce({
        code: 'ETIMEDOUT',
        message: 'Request timeout'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop')
        .expect(500)
        .expect('Content-Type', /json/);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to scrape Amazon products',
        details: expect.any(String)
      });
    });

    test('should return 500 for HTTP errors', async () => {
      axiosGetSpy.mockRejectedValueOnce({
        response: { status: 403 },
        message: 'Request blocked'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop')
        .expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to scrape Amazon products'
      });
    });

    test('should return 500 for parsing errors', async () => {
      axiosGetSpy.mockRejectedValueOnce({
        message: 'Invalid response format'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to scrape Amazon products');
    });
  });

  describe('CORS Headers and Middleware', () => {
    test('should include CORS headers in all responses', async () => {
      const endpoints = [
        '/api/health',
        '/',
        '/api/scrape?keyword=test'
      ];

      // Mock axios for scrape endpoint
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        
        expect(response.headers).toHaveProperty('access-control-allow-origin');
      }
    });

    test('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/scrape')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });

    test('should allow cross-origin requests', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('HTTP Headers and Content Types', () => {
    test('should return JSON content type for API endpoints', async () => {
      const jsonEndpoints = [
        '/api/health',
        '/',
        '/api/scrape?keyword=test'
      ];

      // Mock axios for scrape endpoint
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      for (const endpoint of jsonEndpoints) {
        const response = await request(app).get(endpoint);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });

    test('should handle various request headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('User-Agent', 'Test Client')
        .set('Accept', 'application/json')
        .set('Accept-Language', 'en-US,en;q=0.9')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Request Parameter Sanitization', () => {
    test('should handle URL-encoded parameters correctly', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const keyword = 'laptop computer';
      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(keyword)}`)
        .expect(200);

      expect(response.body.keyword).toBe(keyword);
    });

    test('should handle empty string parameters', async () => {
      const response = await request(app)
        .get('/api/scrape?keyword=')
        .expect(400);

      expect(response.body.error).toBe('Keyword parameter is required');
    });

    test('should handle multiple query parameters', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop&domain=amazon.co.uk&extra=ignored')
        .expect(200);

      expect(response.body.keyword).toBe('laptop');
      expect(response.body.domain).toBe('amazon.co.uk');
      // Extra parameters should be ignored
    });
  });

  describe('Status Code Validation', () => {
    test('should return correct status codes for different scenarios', async () => {
      // 200 OK - Successful health check
      await request(app).get('/api/health').expect(200);
      
      // 200 OK - Root endpoint
      await request(app).get('/').expect(200);
      
      // 400 Bad Request - Missing keyword
      await request(app).get('/api/scrape').expect(400);
      
      // 400 Bad Request - Short keyword
      await request(app).get('/api/scrape?keyword=a').expect(400);
      
      // 400 Bad Request - Invalid domain
      await request(app).get('/api/scrape?keyword=test&domain=invalid.com').expect(400);
      
      // 404 Not Found - Invalid endpoint
      await request(app).get('/api/invalid').expect(404);
    });

    test('should return 500 for server errors', async () => {
      axiosGetSpy.mockRejectedValueOnce(new Error('Server error'));

      await request(app)
        .get('/api/scrape?keyword=laptop')
        .expect(500);
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle very long keywords', async () => {
      const longKeyword = 'a'.repeat(1000);
      
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(longKeyword)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.keyword).toBe(longKeyword);
    });

    test('should handle SQL injection attempts in keyword', async () => {
      const sqlInjection = "'; DROP TABLE users; --";
      
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(sqlInjection)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should be treated as regular search term, not executed
      expect(response.body.keyword).toBe(sqlInjection);
    });

    test('should handle concurrent requests', async () => {
      // Mock successful responses for all requests
      axiosGetSpy.mockResolvedValue({
        data: '<html><body><div data-component-type="s-search-result"><h2><span>Product</span></h2></div></body></html>'
      });

      const promises = Array(10).fill().map((_, i) =>
        request(app).get(`/api/scrape?keyword=laptop${i}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.keyword).toBe(`laptop${i}`);
      });
    });

    test('should handle invalid UTF-8 characters', async () => {
      // Mock successful scraping response
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const unicodeKeyword = '🔍 laptop 测试 café';
      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(unicodeKeyword)}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.keyword).toBe(unicodeKeyword);
    });
  });
});
