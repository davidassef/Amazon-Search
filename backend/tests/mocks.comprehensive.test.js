/**
 * Comprehensive Mock Testing - Demonstrates full mocking capabilities
 * Tests axios, JSDOM, and response mocking for various Amazon scraping scenarios
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { 
  setupMocks, 
  restoreMocks, 
  resetMocks,
  setupAmazonSearch,
  setupAmazonError,
  setupAmazonEmpty,
  setupAmazonSlow,
  setupRateLimiting,
  validateMocks,
  getMockStatus,
  mockManager 
} from './mocks/index.js';

describe('Comprehensive Mocking System Tests', () => {

  beforeEach(async () => {
    // Setup comprehensive mocks
    setupMocks({
      enableAxios: true,
      enableJSDOM: true,
      networkDelay: 0,
      rateLimiting: false,
      performanceDelay: 0
    });
  });

  afterEach(async () => {
    // Clean up after each test
    resetMocks();
  });

  describe('Mock Installation and Validation', () => {
    test('should install all mocks successfully', () => {
      const validation = validateMocks();
      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should provide comprehensive mock status', () => {
      const status = getMockStatus();
      
      expect(status.installed).toBe(true);
      expect(status.axios.installed).toBe(true);
      expect(status.jsdom.installed).toBe(true);
      expect(status).toHaveProperty('configurations');
      expect(status).toHaveProperty('scenarios');
    });

    test('should handle mock restoration', () => {
      restoreMocks();
      const validation = validateMocks();
      
      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Mocks are not installed');
      
      // Re-install for cleanup
      setupMocks();
    });
  });

  describe('Axios Mock - HTTP Request Interception', () => {
    test('should mock successful Amazon search requests', async () => {
      setupAmazonSearch('amazon.com', 'electronics', 'smartphone');
      
      const axios = require('axios');
      const response = await axios.get('https://www.amazon.com/s?k=smartphone');
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('data-component-type="s-search-result"');
      expect(response.data).toContain('s-results-list-atf');
      expect(response.headers['content-type']).toContain('text/html');
      
      // Check request was logged
      const axiosMock = mockManager.getAxiosMock();
      const history = axiosMock.getRequestHistory();
      expect(history).toHaveLength(1);
      expect(history[0].url).toBe('https://www.amazon.com/s?k=smartphone');
    });

    test('should mock error responses correctly', async () => {
      setupAmazonError('rateLimited', 'amazon.com');
      
      const axios = require('axios');
      
      try {
        await axios.get('https://www.amazon.com/s?k=test');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.headers['retry-after']).toBe('60');
        expect(error.message).toContain('Too Many Requests');
      }
    });

    test('should simulate network delays', async () => {
      setupAmazonSlow('amazon.com', 100); // 100ms delay
      
      const axios = require('axios');
      const startTime = Date.now();
      
      const response = await axios.get('https://www.amazon.com/s?k=test');
      const duration = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(duration).toBeGreaterThanOrEqual(90); // Allow some variance
    });

    test('should simulate rate limiting', async () => {
      setupRateLimiting('amazon.com');
      
      const axios = require('axios');
      const promises = [];
      
      // Make multiple requests to trigger rate limiting
      for (let i = 0; i < 7; i++) {
        promises.push(
          axios.get('https://www.amazon.com/s?k=test').catch(err => err)
        );
      }
      
      const results = await Promise.all(promises);
      
      // First few should succeed
      const successes = results.filter(r => r.status === 200);
      const rateLimited = results.filter(r => r.response?.status === 429);
      
      expect(successes.length).toBeGreaterThan(0);
      expect(rateLimited.length).toBeGreaterThan(0);
    });

    test('should handle different Amazon domains', async () => {
      // Setup multiple domains
      setupAmazonSearch('amazon.co.uk', 'electronics', 'laptop');
      setupAmazonSearch('amazon.de', 'books', 'roman');
      
      const axios = require('axios');
      
      const [ukResponse, deResponse] = await Promise.all([
        axios.get('https://www.amazon.co.uk/s?k=laptop'),
        axios.get('https://www.amazon.de/s?k=roman')
      ]);
      
      expect(ukResponse.status).toBe(200);
      expect(ukResponse.data).toContain('£'); // UK currency
      
      expect(deResponse.status).toBe(200);
      expect(deResponse.data).toContain('€'); // Euro currency
      expect(deResponse.data).toContain('und'); // German "and"
    });

    test('should track request history accurately', async () => {
      const axios = require('axios');
      const axiosMock = mockManager.getAxiosMock();
      
      await axios.get('https://www.amazon.com/s?k=test1');
      await axios.get('https://www.amazon.com/s?k=test2');
      
      const history = axiosMock.getRequestHistory();
      expect(history).toHaveLength(2);
      
      expect(history[0].url).toBe('https://www.amazon.com/s?k=test1');
      expect(history[1].url).toBe('https://www.amazon.com/s?k=test2');
      
      expect(history[0]).toHaveProperty('timestamp');
      expect(history[0]).toHaveProperty('method');
      expect(history[0]).toHaveProperty('headers');
    });
  });

  describe('JSDOM Mock - HTML Parsing Control', () => {
    test('should mock DOM parsing with controlled elements', async () => {
      const jsdomMock = mockManager.getJSDoMMock();
      const products = [
        {
          title: 'Test Product 1',
          price: '$99.99',
          rating: '4.5',
          reviews: '1,234',
          productUrl: 'https://www.amazon.com/dp/B123456789',
          imageUrl: 'https://test.com/image1.jpg',
          asin: 'B123456789'
        }
      ];
      
      const mockHtml = jsdomMock.generateAmazonHTML(products);
      const { JSDOM } = require('jsdom');
      
      const dom = new JSDOM(mockHtml);
      const document = dom.window.document;
      
      // Verify DOM structure
      const searchResults = document.querySelectorAll('[data-component-type="s-search-result"]');
      expect(searchResults).toHaveLength(1);
      
      const titleElement = document.querySelector('h2 a span');
      expect(titleElement.textContent).toBe('Test Product 1');
      
      const priceElement = document.querySelector('.a-price .a-offscreen');
      expect(priceElement.textContent).toBe('$99.99');
      
      const ratingElement = document.querySelector('.a-icon-alt');
      expect(ratingElement.getAttribute('aria-label')).toContain('4.5 out of 5 stars');
    });

    test('should simulate DOM parsing delays', async () => {
      const jsdomMock = mockManager.getJSDoMMock();
      jsdomMock.setPerformanceDelay(50);
      
      const { JSDOM } = require('jsdom');
      const startTime = Date.now();
      
      const dom = new JSDOM('<html><body>Test</body></html>');
      const duration = Date.now() - startTime;
      
      expect(dom.window.document.body.textContent).toBe('Test');
      expect(duration).toBeGreaterThanOrEqual(40); // Allow variance
    });

    test('should mock DOM parsing errors', async () => {
      const jsdomMock = mockManager.getJSDoMMock();
      const testHtml = '<html><body>Error test</body></html>';
      
      jsdomMock.setErrorScenario(testHtml, {
        name: 'ParseError',
        message: 'Failed to parse HTML',
        code: 'PARSE_ERROR'
      });
      
      const { JSDOM } = require('jsdom');
      
      try {
        new JSDOM(testHtml);
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.name).toBe('ParseError');
        expect(error.message).toBe('Failed to parse HTML');
        expect(error.code).toBe('PARSE_ERROR');
      }
    });

    test('should track parsing history', async () => {
      const jsdomMock = mockManager.getJSDoMMock();
      const { JSDOM } = require('jsdom');
      
      new JSDOM('<html><body>Test 1</body></html>');
      new JSDOM('<html><body>Test 2</body></html>');
      
      const history = jsdomMock.getParseHistory();
      expect(history).toHaveLength(2);
      
      expect(history[0]).toHaveProperty('html');
      expect(history[0]).toHaveProperty('htmlLength');
      expect(history[0]).toHaveProperty('timestamp');
      
      expect(history[0].html).toContain('Test 1');
      expect(history[1].html).toContain('Test 2');
    });

    test('should handle complex Amazon selectors', async () => {
      const jsdomMock = mockManager.getJSDoMMock();
      const products = [
        {
          title: 'Complex Product Test',
          price: '$149.99',
          rating: '3.8',
          reviews: '5,678',
          productUrl: 'https://www.amazon.com/dp/B987654321',
          imageUrl: 'https://test.com/image2.jpg',
          asin: 'B987654321'
        }
      ];
      
      const mockHtml = jsdomMock.generateAmazonHTML(products);
      const { JSDOM } = require('jsdom');
      
      const dom = new JSDOM(mockHtml);
      const document = dom.window.document;
      
      // Test various selector patterns that the scraper uses
      const titleSelectors = [
        'h2 a span',
        'h2 span',
        '.s-size-mini span'
      ];
      
      let titleFound = false;
      for (const selector of titleSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          titleFound = true;
          expect(element.textContent).toBe('Complex Product Test');
          break;
        }
      }
      expect(titleFound).toBe(true);
      
      // Test price selectors
      const priceElement = document.querySelector('.a-price .a-offscreen');
      expect(priceElement).toBeTruthy();
      expect(priceElement.textContent).toBe('$149.99');
      
      // Test rating selector
      const ratingElement = document.querySelector('.a-icon-alt');
      expect(ratingElement).toBeTruthy();
      expect(ratingElement.getAttribute('aria-label')).toContain('3.8');
    });
  });

  describe('Response Generator - Comprehensive Scenarios', () => {
    test('should generate various product type responses', () => {
      const responseGen = mockManager.getResponseGenerator();
      const productResponses = responseGen.getProductTypeResponses();
      
      expect(productResponses).toHaveProperty('luxuryItems');
      expect(productResponses).toHaveProperty('budgetItems');
      expect(productResponses).toHaveProperty('highRatedItems');
      expect(productResponses).toHaveProperty('lowRatedItems');
      expect(productResponses).toHaveProperty('popularItems');
      expect(productResponses).toHaveProperty('newItems');
      expect(productResponses).toHaveProperty('outOfStock');
      
      // Test luxury items have high prices
      const luxuryResponse = productResponses.luxuryItems;
      expect(luxuryResponse.status).toBe(200);
      expect(luxuryResponse.data).toContain('$'); // Should contain prices
      expect(luxuryResponse.data).toContain('data-component-type="s-search-result"');
    });

    test('should generate domain-specific responses', () => {
      const responseGen = mockManager.getResponseGenerator();
      const domainResponses = responseGen.getDomainSpecificResponses();
      
      expect(domainResponses).toHaveProperty('amazon.com');
      expect(domainResponses).toHaveProperty('amazon.co.uk');
      expect(domainResponses).toHaveProperty('amazon.de');
      expect(domainResponses).toHaveProperty('amazon.fr');
      expect(domainResponses).toHaveProperty('amazon.ca');
      
      // Test UK specific response
      const ukResponse = domainResponses['amazon.co.uk'].electronics;
      expect(ukResponse.data).toContain('£'); // UK currency
      expect(ukResponse.headers['x-amzn-requestid']).toContain('AMAZON.CO.UK');
    });

    test('should generate error responses', () => {
      const responseGen = mockManager.getResponseGenerator();
      const errorResponses = responseGen.getErrorResponses();
      
      expect(errorResponses).toHaveProperty('rateLimited');
      expect(errorResponses).toHaveProperty('forbidden');
      expect(errorResponses).toHaveProperty('serviceUnavailable');
      expect(errorResponses).toHaveProperty('notFound');
      expect(errorResponses).toHaveProperty('internalError');
      
      // Test rate limited response
      const rateLimited = errorResponses.rateLimited;
      expect(rateLimited.status).toBe(429);
      expect(rateLimited.headers['retry-after']).toBe('60');
      expect(rateLimited.data).toContain('Something went wrong');
    });

    test('should generate malformed HTML for error testing', () => {
      const responseGen = mockManager.getResponseGenerator();
      const searchResponses = responseGen.getAmazonSearchResponses();
      
      const malformedResponse = searchResponses.malformedHTML;
      expect(malformedResponse.status).toBe(200);
      expect(malformedResponse.data).toContain('Malformed Test Page');
      expect(malformedResponse.data).toContain('<!-- Missing closing tag -->');
      expect(malformedResponse.data).toContain('$invalid-price$');
    });
  });

  describe('Integrated Testing Scenarios', () => {
    test('should simulate full scraping workflow with mocks', async () => {
      // Setup a complete scenario
      setupAmazonSearch('amazon.com', 'electronics', 'smartphone');
      
      const axios = require('axios');
      const { JSDOM } = require('jsdom');
      
      // Simulate the actual scraper workflow
      const response = await axios.get('https://www.amazon.com/s?k=smartphone');
      expect(response.status).toBe(200);
      
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      // Extract products like the real scraper would
      const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
      expect(productElements.length).toBeGreaterThan(0);
      
      const products = [];
      productElements.forEach(element => {
        const titleElement = element.querySelector('h2 a span');
        const priceElement = element.querySelector('.a-price .a-offscreen');
        const ratingElement = element.querySelector('.a-icon-alt');
        
        if (titleElement) {
          products.push({
            title: titleElement.textContent,
            price: priceElement ? priceElement.textContent : 'N/A',
            rating: ratingElement ? ratingElement.getAttribute('aria-label') : 'N/A'
          });
        }
      });
      
      expect(products.length).toBeGreaterThan(0);
      products.forEach(product => {
        expect(product.title).toBeTruthy();
        expect(product.price).toMatch(/\$\d+\.\d{2}/);
        expect(product.rating).toContain('out of 5 stars');
      });
    });

    test('should handle empty search results gracefully', async () => {
      setupAmazonEmpty('amazon.com', 'nonexistent-product-xyz');
      
      const axios = require('axios');
      const { JSDOM } = require('jsdom');
      
      const response = await axios.get('https://www.amazon.com/s?k=nonexistent-product-xyz');
      expect(response.status).toBe(200);
      
      const dom = new JSDOM(response.data);
      const document = dom.window.document;
      
      const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
      expect(productElements.length).toBe(0);
      
      const noResultsElement = document.querySelector('.s-no-results');
      expect(noResultsElement).toBeTruthy();
    });

    test('should simulate retry logic with error recovery', async () => {
      const axiosMock = mockManager.getAxiosMock();
      
      // Set up error scenario with limited retries
      axiosMock.setErrorScenario('GET', 'https://www.amazon.com/s?k=test', {
        code: 'ETIMEDOUT',
        message: 'Request timeout',
        maxRetries: 2
      });
      
      const axios = require('axios');
      
      // First two requests should fail
      try {
        await axios.get('https://www.amazon.com/s?k=test');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.code).toBe('ETIMEDOUT');
      }
      
      try {
        await axios.get('https://www.amazon.com/s?k=test');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.code).toBe('ETIMEDOUT');
      }
      
      // Third request should succeed (after max retries)
      const response = await axios.get('https://www.amazon.com/s?k=test');
      expect(response.status).toBe(200);
    });
  });

  describe('Mock Performance and Memory', () => {
    test('should handle large number of requests efficiently', async () => {
      setupAmazonSearch('amazon.com', 'electronics', 'test');
      
      const axios = require('axios');
      const promises = [];
      
      const startTime = Date.now();
      
      // Make 100 concurrent requests
      for (let i = 0; i < 100; i++) {
        promises.push(axios.get(`https://www.amazon.com/s?k=test${i}`));
      }
      
      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(results).toHaveLength(100);
      results.forEach(result => {
        expect(result.status).toBe(200);
      });
      
      // Should complete in reasonable time (allow for CI environment)
      expect(duration).toBeLessThan(5000);
      
      // Check request history
      const axiosMock = mockManager.getAxiosMock();
      const history = axiosMock.getRequestHistory();
      expect(history).toHaveLength(100);
    });

    test('should handle complex HTML parsing without memory leaks', async () => {
      const jsdomMock = mockManager.getJSDoMMock();
      const { JSDOM } = require('jsdom');
      
      // Generate large HTML documents and parse them
      for (let i = 0; i < 50; i++) {
        const products = [];
        for (let j = 0; j < 20; j++) {
          products.push({
            title: `Product ${i}-${j}`,
            price: `$${(Math.random() * 100).toFixed(2)}`,
            rating: '4.5',
            reviews: '1,234',
            productUrl: `https://www.amazon.com/dp/B${i}${j}`,
            imageUrl: `https://test.com/image${i}${j}.jpg`,
            asin: `B${String(i).padStart(5, '0')}${String(j).padStart(4, '0')}`
          });
        }
        
        const html = jsdomMock.generateAmazonHTML(products);
        const dom = new JSDOM(html);
        
        // Verify parsing worked
        const results = dom.window.document.querySelectorAll('[data-component-type="s-search-result"]');
        expect(results.length).toBe(20);
      }
      
      // Check parsing history
      const history = jsdomMock.getParseHistory();
      expect(history.length).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Mock Configuration and Customization', () => {
    test('should allow custom response configuration', async () => {
      const customResponse = {
        data: '<html><body><div id="custom-test">Custom Response</div></body></html>',
        status: 200,
        headers: { 'x-custom-header': 'test-value' }
      };
      
      mockManager.setupScenario('custom', {
        domain: 'amazon.com',
        customResponses: {
          'https://www.amazon.com/s?k=custom': customResponse
        }
      });
      
      const axios = require('axios');
      const response = await axios.get('https://www.amazon.com/s?k=custom');
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('Custom Response');
      expect(response.headers['x-custom-header']).toBe('test-value');
    });

    test('should support scenario switching', async () => {
      // Setup first scenario
      mockManager.setupScenario('scenario1', {
        domain: 'amazon.com',
        responseType: 'successful'
      });
      
      const axios = require('axios');
      let response = await axios.get('https://www.amazon.com/s?k=test');
      expect(response.status).toBe(200);
      expect(response.data).toContain('s-search-result');
      
      // Switch to error scenario
      mockManager.setupScenario('scenario2', {
        domain: 'amazon.com',
        errorType: 'forbidden'
      });
      
      try {
        await axios.get('https://www.amazon.com/s?k=test');
        expect(false).toBe(true); // Should not reach here
      } catch (error) {
        expect(error.response.status).toBe(403);
      }
    });

    test('should provide detailed mock status information', () => {
      setupAmazonSearch('amazon.com', 'electronics', 'test');
      
      const status = getMockStatus();
      
      expect(status).toHaveProperty('installed', true);
      expect(status).toHaveProperty('configurations');
      expect(status).toHaveProperty('scenarios');
      expect(status).toHaveProperty('axios');
      expect(status).toHaveProperty('jsdom');
      
      expect(status.axios).toHaveProperty('installed');
      expect(status.axios).toHaveProperty('requestHistory');
      expect(status.axios).toHaveProperty('mockResponses');
      
      expect(status.jsdom).toHaveProperty('installed');
      expect(status.jsdom).toHaveProperty('parseHistory');
      expect(status.jsdom).toHaveProperty('cachedDOMs');
    });
  });
});
