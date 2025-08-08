/**
 * Comprehensive Test Example - Amazon Scraper Backend
 * This test demonstrates the usage of the complete testing infrastructure
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
import { TestConfig, TestHelper } from './setup.js';
import { 
  MockDataGenerator,
  HttpTestHelpers,
  AssertionHelpers,
  createMockDataGenerator,
  createHttpClient
} from './utils/index.js';
import { getFixture, createMockResponse } from './fixtures/index.js';

// Test configuration
const httpClient = createHttpClient('http://localhost:3001');
const mockGenerator = createMockDataGenerator();

describe('Amazon Scraper - Comprehensive Testing Suite', () => {
  
  beforeEach(async () => {
    // Reset mock data generator
    mockGenerator.reset();
    mockGenerator.setSeed(12345);
    
    // Ensure test database is initialized
    if (!process.env.TEST_DATA_LOADED) {
      await global.testDB.init();
    }
  });

  afterEach(async () => {
    // Clean up any test data
    TestHelper.cleanup();
  });

  describe('Mock Data Generation', () => {
    test('should generate consistent mock products with seed', () => {
      const products1 = mockGenerator.generateProducts(3, { domain: 'amazon.com', category: 'electronics' });
      
      mockGenerator.setSeed(12345); // Reset to same seed
      const products2 = mockGenerator.generateProducts(3, { domain: 'amazon.com', category: 'electronics' });
      
      // Products should be identical due to consistent seeding
      expect(products1).toEqual(products2);
      
      // Validate product structure
      products1.forEach(product => {
        AssertionHelpers.assertProductStructure(product);
        expect(product.title).toMatch(/Apple|Samsung|Google|Sony|Dell|HP|Lenovo|Microsoft/);
        expect(product.price).toMatch(/^\$\d+\.\d{2}$/);
        expect(product.rating).toMatch(/^\d+\.\d$/);
      });
    });

    test('should generate domain-specific data', () => {
      const usProducts = mockGenerator.generateProducts(2, { domain: 'amazon.com' });
      const ukProducts = mockGenerator.generateProducts(2, { domain: 'amazon.co.uk' });
      const deProducts = mockGenerator.generateProducts(2, { domain: 'amazon.de' });
      
      // Check currency formatting
      expect(usProducts[0].price).toMatch(/^\$/);
      expect(ukProducts[0].price).toMatch(/^£/);
      expect(deProducts[0].price).toMatch(/€$/);
      
      // Check URLs
      expect(usProducts[0].productUrl).toContain('amazon.com');
      expect(ukProducts[0].productUrl).toContain('amazon.co.uk');
      expect(deProducts[0].productUrl).toContain('amazon.de');
    });

    test('should generate error scenarios', () => {
      const errorScenarios = mockGenerator.generateErrorScenarios();
      
      expect(errorScenarios).toHaveLength(5);
      expect(errorScenarios[0]).toEqual({
        name: 'Network Timeout',
        error: { code: 'ETIMEDOUT', message: 'Request timeout' },
        shouldRetry: true
      });
      
      const nonRetryableError = errorScenarios.find(scenario => !scenario.shouldRetry);
      expect(nonRetryableError).toBeDefined();
    });
  });

  describe('Fixture Management', () => {
    test('should load Amazon.com fixture correctly', () => {
      const htmlContent = getFixture('amazon.com', 'smartphones');
      
      expect(htmlContent).toContain('<html');
      expect(htmlContent).toContain('s-results-list-atf');
      expect(htmlContent).toContain('data-component-type="s-search-result"');
      expect(htmlContent).toContain('iPhone 13 Pro');
    });

    test('should create mock responses for different domains', () => {
      const usResponse = createMockResponse('amazon.com', 'smartphones');
      const ukResponse = createMockResponse('amazon.co.uk', 'laptops');
      const deResponse = createMockResponse('amazon.de', 'books');
      
      expect(usResponse.status).toBe(200);
      expect(usResponse.data).toContain('iPhone 13 Pro');
      
      expect(ukResponse.data).toContain('MacBook Air');
      expect(deResponse.data).toContain('Der Alchemist');
    });

    test('should handle empty search results', () => {
      const emptyResponse = createMockResponse('amazon.com', 'empty');
      
      expect(emptyResponse.data).toContain('No results for');
      expect(emptyResponse.data).toContain('s-no-results');
    });
  });

  describe('HTTP Test Helpers', () => {
    test('should check API health', async () => {
      // This test requires the server to be running
      const isRunning = await httpClient.isApiRunning();
      
      if (isRunning) {
        const response = await httpClient.get('/api/health');
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
      } else {
        console.warn('Test server is not running, skipping HTTP tests');
      }
    });

    test('should handle API validation errors', async () => {
      const isRunning = await httpClient.isApiRunning();
      
      if (isRunning) {
        // Test missing keyword parameter
        const response = await httpClient.get('/api/scrape');
        expect(response.status).toBe(400);
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain('Keyword parameter is required');
        
        // Test keyword too short
        const shortKeywordResponse = await httpClient.get('/api/scrape', { keyword: 'a' });
        expect(shortKeywordResponse.status).toBe(400);
        expect(shortKeywordResponse.data.error).toContain('at least 2 characters');
      }
    });
  });

  describe('DOM Helpers and HTML Parsing', () => {
    test('should extract products from HTML fixtures', () => {
      const htmlContent = getFixture('amazon.com', 'smartphones');
      const products = TestHelper.extractProducts(htmlContent);
      
      expect(products.length).toBeGreaterThan(0);
      expect(products.length).toBeLessThanOrEqual(5);
      
      products.forEach(product => {
        AssertionHelpers.assertProductStructure(product);
        expect(product.title).toBeTruthy();
        expect(product.productUrl).toMatch(/^https:\/\/.*amazon\.com/);
        expect(product.price).toMatch(/\$/);
      });
    });

    test('should validate HTML structure', () => {
      const validHtml = getFixture('amazon.com', 'smartphones');
      const validation = TestHelper.validateHtml(validHtml);
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
      expect(validation.productCount).toBeGreaterThan(0);
      
      // Test with invalid HTML
      const invalidHtml = '<div>Not proper Amazon HTML</div>';
      const invalidValidation = TestHelper.validateHtml(invalidHtml);
      
      expect(invalidValidation.isValid).toBe(false);
      expect(invalidValidation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Testing', () => {
    test('should measure function execution time', async () => {
      const slowFunction = async () => {
        await TestHelper.wait(100);
        return 'result';
      };
      
      const { result, duration } = await TestHelper.measureTime(slowFunction);
      
      expect(result).toBe('result');
      expect(duration).toBeGreaterThan(90);
      expect(duration).toBeLessThan(200);
    });

    test('should validate performance requirements', async () => {
      const fastFunction = async () => {
        await TestHelper.wait(10);
        return 'fast';
      };
      
      // Should complete within 50ms
      const result = await TestHelper.assertPerformance(fastFunction, 50);
      expect(result).toBe('fast');
      
      // Test performance failure (uncomment to test)
      // await expect(TestHelper.assertPerformance(fastFunction, 5)).rejects.toThrow('Function took');
    });
  });

  describe('Test Database Operations', () => {
    test('should access mock test data', () => {
      const electronicsScenario = global.testDB.getProductsByScenario('electronics-phone');
      
      expect(electronicsScenario).toHaveLength(10);
      expect(electronicsScenario[0]).toHaveProperty('title');
      expect(electronicsScenario[0]).toHaveProperty('category', 'Electronics');
    });

    test('should get domain configurations', () => {
      const usConfig = global.testDB.getDomainConfig('amazon.com');
      const ukConfig = global.testDB.getDomainConfig('amazon.co.uk');
      
      expect(usConfig).toEqual({
        baseUrl: 'https://www.amazon.com',
        language: 'en-US,en;q=0.9',
        currency: 'USD'
      });
      
      expect(ukConfig.currency).toBe('GBP');
    });

    test('should record search analytics', () => {
      global.testDB.recordSearch('test-keyword', 'amazon.com', 5);
      
      // Verify the search was recorded (in a real scenario, you'd query the database)
      expect(global.testDB.searches.has('amazon.com:test-keyword')).toBe(true);
    });
  });

  describe('Integration with Real API (if server running)', () => {
    test('should perform complete API integration test', async () => {
      const isRunning = await httpClient.isApiRunning();
      
      if (!isRunning) {
        console.warn('Test server not running, skipping integration test');
        return;
      }
      
      // Test successful API call
      const response = await httpClient.get('/api/scrape', { 
        keyword: 'test',
        domain: 'amazon.com' 
      });
      
      if (response.status === 200) {
        // API succeeded - validate response structure
        AssertionHelpers.assertApiResponse(response.data, {
          success: true,
          requiredFields: ['success', 'keyword', 'domain', 'totalProducts', 'products'],
          hasProducts: true
        });
        
        expect(response.data.keyword).toBe('test');
        expect(response.data.domain).toBe('amazon.com');
        expect(Array.isArray(response.data.products)).toBe(true);
        
      } else if (response.status === 500) {
        // API failed (expected in test environment without real scraping)
        expect(response.data.success).toBe(false);
        expect(response.data.error).toContain('Failed to scrape Amazon products');
      }
    }, TestConfig.timeouts.integration);
  });
});

describe('Error Handling and Edge Cases', () => {
  test('should handle various error scenarios', () => {
    const generator = createMockDataGenerator();
    
    // Test with invalid category
    const products = generator.generateProducts(1, { category: 'nonexistent' });
    expect(products).toHaveLength(1);
    expect(products[0]).toHaveProperty('title');
    
    // Test with invalid domain (should fallback to amazon.com)
    const invalidDomainProducts = generator.generateProducts(1, { domain: 'invalid.domain' });
    expect(invalidDomainProducts[0].price).toMatch(/^\$/); // Should use USD format
  });

  test('should validate input parameters', () => {
    expect(() => {
      AssertionHelpers.assertProductStructure(null);
    }).toThrow('Product must be an object');
    
    expect(() => {
      AssertionHelpers.assertProductStructure({ title: '' });
    }).toThrow('Product title must be a non-empty string');
    
    expect(() => {
      AssertionHelpers.assertArrayLength('not-array', 5);
    }).toThrow('Actual value must be an array');
  });
});
