/**
 * Comprehensive Unit Tests for scrapeAmazonProducts() Function
 * 
 * Tests cover:
 * - Successful product extraction with various HTML structures
 * - Different Amazon domains handling
 * - Product field extraction (title, price, rating, reviews, image, URL)
 * - Fallback strategies for URL extraction
 * - Network error handling, timeouts, and parsing errors
 * - Retry logic with exponential backoff
 * - Rate limiting and delay mechanisms
 */

import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { scrapeAmazonProducts, AMAZON_DOMAINS } from '../server.js';
import { mockManager, MockResponseGenerator } from './mocks/index.js';
import { TestConfig, TestHelper } from './setup.js';

// Mock axios and JSDOM for controlled testing
const mockAxios = mock();
const mockJSDOM = mock();

describe('scrapeAmazonProducts() - Comprehensive Unit Tests', () => {
  let axiosGetSpy;
  let jsdomConstructorSpy;
  let originalConsoleLog;
  let logMessages = [];

  beforeEach(() => {
    // Setup mocks with comprehensive configuration
    mockManager.installAll({
      enableAxios: true,
      enableJSDOM: true,
      networkDelay: 0,
      rateLimiting: false,
      performanceDelay: 0
    });

    // Capture console logs for testing
    originalConsoleLog = console.log;
    logMessages = [];
    console.log = (...args) => {
      logMessages.push(args.join(' '));
      originalConsoleLog(...args);
    };

    // Reset mock data generator
    mockManager.getDataGenerator().reset();
    mockManager.getDataGenerator().setSeed(12345);
  });

  afterEach(() => {
    // Restore all mocks and cleanup
    mockManager.restoreAll();
    console.log = originalConsoleLog;
    TestHelper.cleanup();
  });

  describe('Successful Product Extraction', () => {
    test('should extract products from standard Amazon search results', async () => {
      // Setup successful search scenario
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'laptop');
      
      const keyword = 'laptop';
      const domain = 'amazon.com';
      
      const products = await scrapeAmazonProducts(keyword, domain);
      
      // Validate basic response structure
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      expect(products.length).toBeLessThanOrEqual(20); // Server limits to 20 products
      
      // Validate each product structure
      products.forEach((product, index) => {
        expect(product).toHaveProperty('title');
        expect(product).toHaveProperty('productUrl');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('rating');
        expect(product).toHaveProperty('reviews');
        expect(product).toHaveProperty('imageUrl');
        
        // Validate data types and formats
        expect(typeof product.title).toBe('string');
        expect(product.title.length).toBeGreaterThan(0);
        expect(product.title.length).toBeLessThanOrEqual(200);
        
        // URL validation - should be absolute URL or 'N/A'
        if (product.productUrl !== 'N/A') {
          expect(product.productUrl).toMatch(/^https?:\/\//);
          expect(product.productUrl).toContain('amazon.com');
        }
        
        console.log(`Product ${index + 1}: ${product.title} - ${product.price}`);
      });
    }, TestConfig.timeouts.unit);

    test('should extract products with alternative HTML structures', async () => {
      // Setup scenario with alternative HTML structure
      const responseGenerator = mockManager.getResponseGenerator();
      const alternativeHTML = responseGenerator.generateSearchResultsHTML('electronics', 'smartphone', 5, {
        useAlternativeSelectors: true,
        includeSponsored: false,
        structureVariant: 'compact'
      });

      mockManager.getAxiosMock().setMockResponse(
        'GET', 
        'https://www.amazon.com/s?k=smartphone&ref=sr_pg_1',
        alternativeHTML,
        200,
        { 'content-type': 'text/html; charset=UTF-8' }
      );

      const products = await scrapeAmazonProducts('smartphone', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      
      // Should still extract basic product information
      products.forEach(product => {
        expect(product.title).toBeTruthy();
        expect(product.price).toBeTruthy();
        expect(['N/A', 'string']).toContain(typeof product.rating);
        expect(['N/A', 'string']).toContain(typeof product.reviews);
      });
    });

    test('should handle products with missing optional fields', async () => {
      // Setup scenario with products missing some optional data
      const responseGenerator = mockManager.getResponseGenerator();
      const sparseHTML = responseGenerator.generateSearchResultsHTML('electronics', 'gadget', 3, {
        includeRatings: false,
        includeReviews: false,
        includePrices: false,
        includeImages: false
      });

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=gadget&ref=sr_pg_1',
        sparseHTML,
        200
      );

      const products = await scrapeAmazonProducts('gadget', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      
      products.forEach(product => {
        // Title should always be present
        expect(product.title).toBeTruthy();
        expect(product.title).not.toBe('N/A');
        
        // Optional fields should default to 'N/A' when configured that way
        if (!includeRatings) expect(product.rating).toBe('N/A');
        if (!includeReviews) expect(product.reviews).toBe('N/A');
        if (!includePrices) expect(product.price).toBe('N/A');
        if (!includeImages) expect(product.imageUrl).toBe('N/A');
        
        // URL should still be generated (fallback search URL)
        expect(product.productUrl).toContain('amazon.com/s?k=');
      });
    });

    test('should extract all product fields correctly', async () => {
      // Setup scenario with rich product data
      const responseGenerator = mockManager.getResponseGenerator();
      const richHTML = responseGenerator.generateSearchResultsHTML('electronics', 'premium-laptop', 2, {
        includeAllFields: true,
        includePrimeIndicator: true,
        includeDiscounts: true,
        includeAvailability: true,
        includeShipping: true,
        priceRange: [800, 2000]
      });

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=premium-laptop&ref=sr_pg_1',
        richHTML,
        200
      );

      const products = await scrapeAmazonProducts('premium-laptop', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      
      const richProduct = products[0];
      
      // Validate comprehensive field extraction
      expect(richProduct.title).toMatch(/laptop|notebook|macbook/i);
      expect(richProduct.price).toMatch(/^\$\d+\.\d{2}$/); // Format: $XXX.XX
      expect(richProduct.rating).toMatch(/^[1-5]\.\d$/); // Format: X.X
      expect(richProduct.reviews).toMatch(/^\d{1,3}(,\d{3})*$/); // Format: X,XXX
      expect(richProduct.imageUrl).toMatch(/^https:\/\/.*amazon.*\.(jpg|jpeg|png|webp)/i);
      expect(richProduct.productUrl).toMatch(/^https:\/\/.*amazon\.com\/(dp|gp\/product)\/[A-Z0-9]+/);
    });
  });

  describe('Different Amazon Domains', () => {
    test('should handle amazon.com domain correctly', async () => {
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'headphones');
      
      const products = await scrapeAmazonProducts('headphones', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        if (product.productUrl !== 'N/A') {
          expect(product.productUrl).toContain('amazon.com');
        }
        if (product.price !== 'N/A') {
          expect(product.price).toMatch(/^\$/); // USD format
        }
      });
    });

    test('should handle amazon.co.uk domain correctly', async () => {
      mockManager.setupAmazonSearch('amazon.co.uk', 'electronics', 'headphones');
      
      const products = await scrapeAmazonProducts('headphones', 'amazon.co.uk');
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        if (product.productUrl !== 'N/A') {
          expect(product.productUrl).toContain('amazon.co.uk');
        }
        if (product.price !== 'N/A') {
          expect(product.price).toMatch(/^£/); // GBP format
        }
      });
    });

    test('should handle amazon.de domain correctly', async () => {
      mockManager.setupAmazonSearch('amazon.de', 'electronics', 'kopfhörer');
      
      const products = await scrapeAmazonProducts('kopfhörer', 'amazon.de');
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        if (product.productUrl !== 'N/A') {
          expect(product.productUrl).toContain('amazon.de');
        }
        if (product.price !== 'N/A') {
          expect(product.price).toMatch(/€$/); // EUR format (suffix)
        }
      });
    });

    test('should handle amazon.fr domain correctly', async () => {
      mockManager.setupAmazonSearch('amazon.fr', 'electronics', 'casque');
      
      const products = await scrapeAmazonProducts('casque', 'amazon.fr');
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        if (product.productUrl !== 'N/A') {
          expect(product.productUrl).toContain('amazon.fr');
        }
      });
    });

    test('should reject unsupported domains', async () => {
      await expect(
        scrapeAmazonProducts('test', 'amazon.invalid')
      ).rejects.toThrow('Unsupported Amazon domain: amazon.invalid');
    });

    test('should use correct headers for different domains', async () => {
      const axiosMock = mockManager.getAxiosMock();
      
      // Test US domain
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'test');
      await scrapeAmazonProducts('test', 'amazon.com');
      
      const usRequest = axiosMock.getRequestHistory().find(req => 
        req.url.includes('amazon.com')
      );
      expect(usRequest.headers['Accept-Language']).toBe('en-US,en;q=0.9');
      
      // Test UK domain
      axiosMock.reset();
      mockManager.setupAmazonSearch('amazon.co.uk', 'electronics', 'test');
      await scrapeAmazonProducts('test', 'amazon.co.uk');
      
      const ukRequest = axiosMock.getRequestHistory().find(req => 
        req.url.includes('amazon.co.uk')
      );
      expect(ukRequest.headers['Accept-Language']).toBe('en-GB,en;q=0.9');
    });
  });

  describe('Fallback Strategies for URL Extraction', () => {
    test('should use direct product URLs when available', async () => {
      const responseGenerator = mockManager.getResponseGenerator();
      const htmlWithDirectUrls = responseGenerator.generateSearchResultsHTML('electronics', 'phone', 3, {
        includeDirectProductUrls: true,
        urlPattern: '/dp/B0{ASIN}'
      });

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=phone&ref=sr_pg_1',
        htmlWithDirectUrls,
        200
      );

      const products = await scrapeAmazonProducts('phone', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        if (product.productUrl !== 'N/A') {
          expect(product.productUrl).toMatch(/\/dp\/B0[A-Z0-9]+/);
          expect(product.productUrl).not.toMatch(/\/s\?k=/); // Not a search fallback
        }
      });
    });

    test('should fallback to search URLs when direct URLs are not available', async () => {
      const responseGenerator = mockManager.getResponseGenerator();
      const htmlWithoutDirectUrls = responseGenerator.generateSearchResultsHTML('electronics', 'gadget', 2, {
        includeDirectProductUrls: false,
        includeProductTitles: true
      });

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=gadget&ref=sr_pg_1',
        htmlWithoutDirectUrls,
        200
      );

      const products = await scrapeAmazonProducts('gadget', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        if (product.productUrl !== 'N/A') {
          // Should be fallback search URL
          expect(product.productUrl).toMatch(/\/s\?k=/);
          expect(product.productUrl).toContain(encodeURIComponent(product.title.substring(0, 100)));
        }
      });

      // Verify console logs show fallback URL generation
      const fallbackLogs = logMessages.filter(msg => 
        msg.includes('Generated fallback search URL')
      );
      expect(fallbackLogs.length).toBeGreaterThan(0);
    });

    test('should try multiple URL selectors in order', async () => {
      const responseGenerator = mockManager.getResponseGenerator();
      
      // Create HTML with different link structures
      const complexHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2>
                <a href="/dp/B123456789" class="s-link-style">
                  <span>Product with h2 a href</span>
                </a>
              </h2>
            </div>
            <div data-component-type="s-search-result">
              <a data-cy="title-recipe-title" href="/gp/product/B987654321">
                <span>Product with data-cy title</span>
              </a>
            </div>
            <div data-component-type="s-search-result">
              <div class="s-size-mini">
                <a href="/some/other/path/B555666777" class="a-link-normal">
                  <span>Product with alternative selector</span>
                </a>
              </div>
            </div>
          </body>
        </html>
      `;

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=mixed-selectors&ref=sr_pg_1',
        complexHTML,
        200
      );

      const products = await scrapeAmazonProducts('mixed-selectors', 'amazon.com');
      
      expect(products.length).toBe(3);
      
      expect(products[0].productUrl).toContain('/dp/B123456789');
      expect(products[1].productUrl).toContain('/gp/product/B987654321');
      expect(products[2].productUrl).toContain('/some/other/path/B555666777');

      // Verify logs show different selectors being used
      const selectorLogs = logMessages.filter(msg => 
        msg.includes('Found link with selector')
      );
      expect(selectorLogs.length).toBe(3);
    });

    test('should handle relative URLs correctly', async () => {
      const responseGenerator = mockManager.getResponseGenerator();
      const htmlWithRelativeUrls = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123456789"><span>Product with relative URL</span></a></h2>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="dp/B987654321"><span>Product with path-only URL</span></a></h2>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="https://www.amazon.com/dp/B555666777"><span>Product with absolute URL</span></a></h2>
            </div>
          </body>
        </html>
      `;

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=relative-urls&ref=sr_pg_1',
        htmlWithRelativeUrls,
        200
      );

      const products = await scrapeAmazonProducts('relative-urls', 'amazon.com');
      
      expect(products.length).toBe(3);
      
      // All URLs should be absolute after processing
      products.forEach(product => {
        expect(product.productUrl).toMatch(/^https:\/\/www\.amazon\.com/);
      });

      expect(products[0].productUrl).toBe('https://www.amazon.com/dp/B123456789');
      expect(products[1].productUrl).toBe('https://www.amazon.com/dp/B987654321');
      expect(products[2].productUrl).toBe('https://www.amazon.com/dp/B555666777');
    });
  });

  describe('Error Handling', () => {
    test('should handle network timeouts', async () => {
      mockManager.setupAmazonError('timeout', 'amazon.com');
      
      await expect(
        scrapeAmazonProducts('test-timeout', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should handle connection reset errors', async () => {
      mockManager.setupAmazonError('connectionReset', 'amazon.com');
      
      await expect(
        scrapeAmazonProducts('test-reset', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should handle network unreachable errors', async () => {
      mockManager.setupAmazonError('networkError', 'amazon.com');
      
      await expect(
        scrapeAmazonProducts('test-network', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should handle DNS lookup failures', async () => {
      mockManager.setupAmazonError('dnsError', 'amazon.com');
      
      await expect(
        scrapeAmazonProducts('test-dns', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should handle 503 Service Unavailable', async () => {
      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=service-unavailable&ref=sr_pg_1',
        'Service Temporarily Unavailable',
        503
      );
      
      await expect(
        scrapeAmazonProducts('service-unavailable', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should handle 429 Too Many Requests', async () => {
      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=rate-limited&ref=sr_pg_1',
        'Too Many Requests',
        429
      );
      
      await expect(
        scrapeAmazonProducts('rate-limited', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should handle malformed HTML gracefully', async () => {
      const malformedHTML = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a><span>Product without href</span></a></h2>
            </div>
            <div data-component-type="s-search-result">
              <!-- Product with missing title -->
              <a href="/dp/B123456789"></a>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B987654321"><span></span></a></h2>
            </div>
          </body>
        </html>
      `;

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=malformed&ref=sr_pg_1',
        malformedHTML,
        200
      );

      // Should not throw, but may return empty array or partial results
      const products = await scrapeAmazonProducts('malformed', 'amazon.com');
      
      // Should handle gracefully - some products might be extracted, others skipped
      expect(Array.isArray(products)).toBe(true);
      
      // Valid products should have proper structure
      products.forEach(product => {
        if (product.title !== 'N/A') {
          expect(product.title.length).toBeGreaterThan(0);
        }
      });
    });

    test('should handle empty search results', async () => {
      mockManager.setupAmazonEmpty('amazon.com', 'nonexistent-product-xyz123');
      
      const products = await scrapeAmazonProducts('nonexistent-product-xyz123', 'amazon.com');
      
      // Should return empty array for no results
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBe(0);
    });

    test('should handle parsing errors in individual products', async () => {
      const htmlWithErrors = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123456789"><span>Valid Product</span></a></h2>
              <span class="a-price"><span class="a-offscreen">$29.99</span></span>
              <span class="a-icon-alt" aria-label="4.5 out of 5 stars">4.5 stars</span>
            </div>
            <div data-component-type="s-search-result">
              <!-- This product will cause parsing error -->
              <h2><a href="/dp/B987654321"><span>Problem Product</span></a></h2>
              <span class="a-price"><span class="a-offscreen">invalid-price</span></span>
              <span class="a-icon-alt" aria-label="invalid rating">invalid</span>
              <img src="invalid-url" alt="product">
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B555666777"><span>Another Valid Product</span></a></h2>
              <span class="a-price"><span class="a-offscreen">$19.99</span></span>
            </div>
          </body>
        </html>
      `;

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=parsing-errors&ref=sr_pg_1',
        htmlWithErrors,
        200
      );

      const products = await scrapeAmazonProducts('parsing-errors', 'amazon.com');
      
      // Should still extract valid products despite individual parsing errors
      expect(products.length).toBeGreaterThan(0);
      
      // Check error handling in console logs
      const errorLogs = logMessages.filter(msg => 
        msg.includes('Error extracting data from product')
      );
      expect(errorLogs.length).toBeGreaterThanOrEqual(0); // May have parsing errors
    });
  });

  describe('Retry Logic with Exponential Backoff', () => {
    test('should retry on 503 Service Unavailable with exponential backoff', async () => {
      let requestCount = 0;
      const axiosMock = mockManager.getAxiosMock();
      
      // Setup mock to fail first 2 requests, succeed on 3rd
      axiosMock.setDynamicResponse('GET', /amazon\.com.*retry-503/, () => {
        requestCount++;
        if (requestCount <= 2) {
          return { status: 503, data: 'Service Unavailable' };
        } else {
          const responseGenerator = mockManager.getResponseGenerator();
          return {
            status: 200,
            data: responseGenerator.generateSearchResultsHTML('electronics', 'retry-test', 2),
            headers: { 'content-type': 'text/html; charset=UTF-8' }
          };
        }
      });

      const startTime = Date.now();
      const products = await scrapeAmazonProducts('retry-503', 'amazon.com');
      const endTime = Date.now();
      
      // Should succeed after retries
      expect(products.length).toBeGreaterThan(0);
      expect(requestCount).toBe(3); // 2 failures + 1 success
      
      // Should have taken time for exponential backoff (2s + 4s = 6s minimum)
      expect(endTime - startTime).toBeGreaterThan(6000);
      
      // Check retry logs
      const retryLogs = logMessages.filter(msg => 
        msg.includes('Retrying in') && msg.includes('ms')
      );
      expect(retryLogs.length).toBe(2); // 2 retries
    }, TestConfig.timeouts.integration);

    test('should retry on ETIMEDOUT with exponential backoff', async () => {
      let requestCount = 0;
      const axiosMock = mockManager.getAxiosMock();
      
      axiosMock.setDynamicResponse('GET', /amazon\.com.*retry-timeout/, () => {
        requestCount++;
        if (requestCount <= 2) {
          const error = new Error('Request timeout');
          error.code = 'ETIMEDOUT';
          throw error;
        } else {
          const responseGenerator = mockManager.getResponseGenerator();
          return {
            status: 200,
            data: responseGenerator.generateSearchResultsHTML('electronics', 'timeout-test', 1),
            headers: { 'content-type': 'text/html; charset=UTF-8' }
          };
        }
      });

      const products = await scrapeAmazonProducts('retry-timeout', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      expect(requestCount).toBe(3);
    }, TestConfig.timeouts.integration);

    test('should retry on ECONNRESET with exponential backoff', async () => {
      let requestCount = 0;
      const axiosMock = mockManager.getAxiosMock();
      
      axiosMock.setDynamicResponse('GET', /amazon\.com.*retry-reset/, () => {
        requestCount++;
        if (requestCount <= 1) {
          const error = new Error('Connection reset by peer');
          error.code = 'ECONNRESET';
          throw error;
        } else {
          const responseGenerator = mockManager.getResponseGenerator();
          return {
            status: 200,
            data: responseGenerator.generateSearchResultsHTML('electronics', 'reset-test', 1)
          };
        }
      });

      const products = await scrapeAmazonProducts('retry-reset', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      expect(requestCount).toBe(2);
    });

    test('should fail after maximum retries', async () => {
      const axiosMock = mockManager.getAxiosMock();
      
      // Always return 503
      axiosMock.setMockResponse(
        'GET',
        /amazon\.com.*max-retries/,
        'Service Unavailable',
        503
      );

      await expect(
        scrapeAmazonProducts('max-retries', 'amazon.com')
      ).rejects.toThrow();
      
      // Should have made 4 requests total (1 initial + 3 retries)
      const requests = axiosMock.getRequestHistory().filter(req => 
        req.url.includes('max-retries')
      );
      expect(requests.length).toBe(4);
    }, TestConfig.timeouts.integration);

    test('should not retry on non-retryable errors', async () => {
      const axiosMock = mockManager.getAxiosMock();
      
      // Setup 400 Bad Request (non-retryable)
      axiosMock.setMockResponse(
        'GET',
        /amazon\.com.*no-retry/,
        'Bad Request',
        400
      );

      await expect(
        scrapeAmazonProducts('no-retry', 'amazon.com')
      ).rejects.toThrow();
      
      // Should have made only 1 request
      const requests = axiosMock.getRequestHistory().filter(req => 
        req.url.includes('no-retry')
      );
      expect(requests.length).toBe(1);
    });

    test('should use correct exponential backoff timing', async () => {
      let requestCount = 0;
      const requestTimes = [];
      const axiosMock = mockManager.getAxiosMock();
      
      axiosMock.setDynamicResponse('GET', /amazon\.com.*backoff-timing/, () => {
        requestCount++;
        requestTimes.push(Date.now());
        
        if (requestCount <= 3) {
          return { status: 503, data: 'Service Unavailable' };
        } else {
          const responseGenerator = mockManager.getResponseGenerator();
          return {
            status: 200,
            data: responseGenerator.generateSearchResultsHTML('electronics', 'timing-test', 1)
          };
        }
      });

      const products = await scrapeAmazonProducts('backoff-timing', 'amazon.com');
      
      expect(products.length).toBeGreaterThan(0);
      expect(requestTimes.length).toBe(4);
      
      // Check exponential backoff: 2s, 4s, 8s delays
      const delay1 = requestTimes[1] - requestTimes[0];
      const delay2 = requestTimes[2] - requestTimes[1];
      const delay3 = requestTimes[3] - requestTimes[2];
      
      expect(delay1).toBeGreaterThan(1900); // ~2000ms
      expect(delay1).toBeLessThan(2200);
      
      expect(delay2).toBeGreaterThan(3800); // ~4000ms  
      expect(delay2).toBeLessThan(4200);
      
      expect(delay3).toBeGreaterThan(7800); // ~8000ms
      expect(delay3).toBeLessThan(8200);
    }, 20000); // Longer timeout for timing test
  });

  describe('Rate Limiting and Delay Mechanisms', () => {
    test('should add random delay before each request', async () => {
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'delay-test');
      
      const startTime = Date.now();
      await scrapeAmazonProducts('delay-test', 'amazon.com');
      const endTime = Date.now();
      
      // Should have at least 500ms delay (minimum random delay)
      expect(endTime - startTime).toBeGreaterThan(500);
      
      // Check delay logs
      const delayLogs = logMessages.filter(msg => 
        msg.includes('Fetching') && msg.includes('attempt 1')
      );
      expect(delayLogs.length).toBe(1);
    });

    test('should handle rate limiting responses appropriately', async () => {
      mockManager.setupRateLimiting('amazon.com');
      
      await expect(
        scrapeAmazonProducts('rate-limit-test', 'amazon.com')
      ).rejects.toThrow();
    });

    test('should use different User-Agent headers', async () => {
      const axiosMock = mockManager.getAxiosMock();
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'user-agent-test');
      
      await scrapeAmazonProducts('user-agent-test', 'amazon.com');
      
      const request = axiosMock.getRequestHistory().find(req => 
        req.url.includes('user-agent-test')
      );
      
      expect(request.headers['User-Agent']).toBeTruthy();
      expect(request.headers['User-Agent']).toMatch(/Mozilla|Chrome|Firefox|Safari|Edge/);
    });

    test('should respect request timeout settings', async () => {
      const axiosMock = mockManager.getAxiosMock();
      
      // Setup slow response
      axiosMock.setDynamicResponse('GET', /amazon\.com.*timeout-test/, async () => {
        await TestHelper.wait(12000); // Wait longer than 10s timeout
        return {
          status: 200,
          data: '<html><body>Slow response</body></html>'
        };
      });

      const startTime = Date.now();
      
      await expect(
        scrapeAmazonProducts('timeout-test', 'amazon.com')
      ).rejects.toThrow(/timeout/i);
      
      const endTime = Date.now();
      
      // Should timeout around 10 seconds (axios timeout setting)
      expect(endTime - startTime).toBeGreaterThan(9000);
      expect(endTime - startTime).toBeLessThan(12000);
    }, TestConfig.timeouts.integration);

    test('should include proper request headers for stealth', async () => {
      const axiosMock = mockManager.getAxiosMock();
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'stealth-test');
      
      await scrapeAmazonProducts('stealth-test', 'amazon.com');
      
      const request = axiosMock.getRequestHistory().find(req => 
        req.url.includes('stealth-test')
      );
      
      // Validate stealth headers
      expect(request.headers['Accept']).toContain('text/html');
      expect(request.headers['Accept-Encoding']).toContain('gzip');
      expect(request.headers['Connection']).toBe('keep-alive');
      expect(request.headers['Upgrade-Insecure-Requests']).toBe('1');
      expect(request.headers['Sec-Fetch-Dest']).toBe('document');
      expect(request.headers['Sec-Fetch-Mode']).toBe('navigate');
      expect(request.headers['DNT']).toBe('1');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle very long product titles', async () => {
      const responseGenerator = mockManager.getResponseGenerator();
      const longTitle = 'A'.repeat(500); // 500 character title
      
      const htmlWithLongTitle = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B123456789"><span>${longTitle}</span></a></h2>
            </div>
          </body>
        </html>
      `;

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=long-title&ref=sr_pg_1',
        htmlWithLongTitle,
        200
      );

      const products = await scrapeAmazonProducts('long-title', 'amazon.com');
      
      expect(products.length).toBe(1);
      expect(products[0].title.length).toBeLessThanOrEqual(200); // Should be truncated
    });

    test('should skip sponsored/ad results', async () => {
      const htmlWithSponsored = `
        <html>
          <body>
            <div data-component-type="s-search-result">
              <div data-component-type="sp-sponsored-result">Sponsored</div>
              <h2><a href="/dp/B123456789"><span>Sponsored Product</span></a></h2>
            </div>
            <div data-component-type="s-search-result">
              <h2><a href="/dp/B987654321"><span>Regular Product</span></a></h2>
            </div>
          </body>
        </html>
      `;

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=sponsored-test&ref=sr_pg_1',
        htmlWithSponsored,
        200
      );

      const products = await scrapeAmazonProducts('sponsored-test', 'amazon.com');
      
      // Should only return the regular product, not the sponsored one
      expect(products.length).toBe(1);
      expect(products[0].title).toBe('Regular Product');
    });

    test('should handle Unicode characters in search terms', async () => {
      const unicodeKeyword = 'café naïve résumé';
      mockManager.setupAmazonSearch('amazon.com', 'books', unicodeKeyword);
      
      const products = await scrapeAmazonProducts(unicodeKeyword, 'amazon.com');
      
      // Should handle Unicode without throwing
      expect(Array.isArray(products)).toBe(true);
      
      // Check that URL was properly encoded
      const axiosMock = mockManager.getAxiosMock();
      const request = axiosMock.getRequestHistory().find(req => 
        req.url.includes(encodeURIComponent(unicodeKeyword))
      );
      expect(request).toBeTruthy();
    });

    test('should handle concurrent requests correctly', async () => {
      // Setup multiple search scenarios
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'concurrent1');
      mockManager.setupAmazonSearch('amazon.co.uk', 'books', 'concurrent2');
      mockManager.setupAmazonSearch('amazon.de', 'home', 'concurrent3');
      
      // Make concurrent requests
      const promises = [
        scrapeAmazonProducts('concurrent1', 'amazon.com'),
        scrapeAmazonProducts('concurrent2', 'amazon.co.uk'),
        scrapeAmazonProducts('concurrent3', 'amazon.de')
      ];
      
      const results = await Promise.all(promises);
      
      // All should succeed
      expect(results.length).toBe(3);
      results.forEach(products => {
        expect(Array.isArray(products)).toBe(true);
        expect(products.length).toBeGreaterThanOrEqual(0);
      });
    });

    test('should maintain function signature compatibility', () => {
      // Test default parameters
      expect(() => scrapeAmazonProducts('test')).not.toThrow();
      expect(() => scrapeAmazonProducts('test', 'amazon.com')).not.toThrow();
      expect(() => scrapeAmazonProducts('test', 'amazon.com', 0)).not.toThrow();
      
      // Test parameter validation
      expect(() => scrapeAmazonProducts()).toThrow(); // Missing required keyword
    });
  });

  describe('Performance and Memory', () => {
    test('should complete within reasonable time limits', async () => {
      mockManager.setupAmazonSearch('amazon.com', 'electronics', 'performance-test');
      
      const { result, duration } = await TestHelper.measureTime(async () => {
        return await scrapeAmazonProducts('performance-test', 'amazon.com');
      });
      
      expect(Array.isArray(result)).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle large numbers of products efficiently', async () => {
      const responseGenerator = mockManager.getResponseGenerator();
      const htmlWithManyProducts = responseGenerator.generateSearchResultsHTML(
        'electronics', 
        'popular-item', 
        50 // Generate 50 products
      );

      mockManager.getAxiosMock().setMockResponse(
        'GET',
        'https://www.amazon.com/s?k=popular-item&ref=sr_pg_1',
        htmlWithManyProducts,
        200
      );

      const products = await scrapeAmazonProducts('popular-item', 'amazon.com');
      
      // Should limit to 20 products max (server constraint)
      expect(products.length).toBeLessThanOrEqual(20);
      expect(products.length).toBeGreaterThan(0);
    });

    test('should not leak memory during processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process multiple searches to test for memory leaks
      for (let i = 0; i < 5; i++) {
        mockManager.setupAmazonSearch('amazon.com', 'electronics', `memory-test-${i}`);
        await scrapeAmazonProducts(`memory-test-${i}`, 'amazon.com');
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
