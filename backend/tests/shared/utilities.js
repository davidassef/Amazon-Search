/**
 * Shared Test Utilities
 * Common utility functions for testing Amazon scraper
 */

import { JSDOM } from 'jsdom';
import axios from 'axios';
import { 
  TEST_PATTERNS, 
  REQUIRED_PRODUCT_FIELDS, 
  TEST_SERVER,
  PERFORMANCE_BENCHMARKS 
} from './constants.js';

/**
 * Product validation utilities
 */
export class ProductValidator {
  /**
   * Validate product object structure
   * @param {Object} product - Product to validate
   * @param {Array} requiredFields - Required fields (defaults to standard fields)
   * @throws {Error} If validation fails
   */
  static validateStructure(product, requiredFields = REQUIRED_PRODUCT_FIELDS) {
    if (!product || typeof product !== 'object') {
      throw new Error('Product must be an object');
    }

    const missingFields = requiredFields.filter(field => !(field in product));
    if (missingFields.length > 0) {
      throw new Error(`Product missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate field types
    if (typeof product.title !== 'string' || product.title.trim().length === 0) {
      throw new Error('Product title must be a non-empty string');
    }

    if (typeof product.productUrl !== 'string') {
      throw new Error('Product URL must be a string');
    }

    // Validate URL format (allow 'N/A' as fallback)
    if (product.productUrl !== 'N/A' && !this.isValidUrl(product.productUrl)) {
      throw new Error('Product URL must be a valid URL or "N/A"');
    }
  }

  /**
   * Validate product data quality
   * @param {Object} product - Product to validate
   * @param {string} domain - Expected Amazon domain
   * @throws {Error} If quality checks fail
   */
  static validateQuality(product, domain = 'amazon.com') {
    this.validateStructure(product);

    // Title quality checks
    if (product.title.length > 200) {
      throw new Error('Product title is too long (over 200 characters)');
    }

    if (product.title === 'N/A') {
      throw new Error('Product title should not be "N/A"');
    }

    // URL quality checks
    if (product.productUrl !== 'N/A') {
      if (!product.productUrl.includes(domain)) {
        throw new Error(`Product URL should contain domain "${domain}"`);
      }

      if (!TEST_PATTERNS.PRODUCT_URL.test(product.productUrl)) {
        // Allow search fallback URLs
        if (!product.productUrl.includes('/s?k=')) {
          throw new Error('Product URL format is invalid');
        }
      }
    }

    // Price format check
    if (product.price !== 'N/A') {
      const pricePattern = TEST_PATTERNS.PRICE[domain];
      if (pricePattern && !pricePattern.test(product.price)) {
        // Allow generic price patterns as fallback
        if (!product.price.match(/[\$£€¥]?\d+[.,]\d{2}[\$£€¥]?/)) {
          console.warn(`Price format may be incorrect for ${domain}: ${product.price}`);
        }
      }
    }

    // Rating validation
    if (product.rating !== 'N/A' && !TEST_PATTERNS.RATING.test(product.rating)) {
      console.warn(`Rating format may be incorrect: ${product.rating}`);
    }

    // Reviews validation  
    if (product.reviews !== 'N/A' && !TEST_PATTERNS.REVIEWS.test(product.reviews)) {
      console.warn(`Reviews format may be incorrect: ${product.reviews}`);
    }

    // Image URL validation
    if (product.imageUrl !== 'N/A') {
      if (!this.isValidUrl(product.imageUrl)) {
        throw new Error('Image URL must be valid URL or "N/A"');
      }

      if (!TEST_PATTERNS.IMAGE_URL.test(product.imageUrl)) {
        console.warn(`Image URL format may be incorrect: ${product.imageUrl}`);
      }
    }
  }

  /**
   * Check if string is valid URL
   * @param {string} url - URL to validate
   * @returns {boolean} True if valid URL
   */
  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * API testing utilities
 */
export class ApiTestUtils {
  constructor(baseUrl = TEST_SERVER.BASE_URL) {
    this.baseUrl = baseUrl;
    this.timeout = 10000;
  }

  /**
   * Make GET request with error handling
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response object
   */
  async get(endpoint, params = {}, options = {}) {
    const url = new URL(endpoint, this.baseUrl);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });

    try {
      const response = await axios.get(url.toString(), {
        timeout: options.timeout || this.timeout,
        validateStatus: () => true, // Don't throw on any status code
        ...options
      });

      return {
        status: response.status,
        data: response.data,
        headers: response.headers
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Test server is not running. Please start the server before running tests.');
      }
      throw error;
    }
  }

  /**
   * Check if API is running and healthy
   * @returns {Promise<boolean>} True if API is healthy
   */
  async isHealthy() {
    try {
      const response = await this.get('/api/health', {}, { timeout: 2000 });
      return response.status === 200 && response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for API to be ready
   * @param {number} maxWaitTime - Maximum wait time in ms
   * @param {number} pollInterval - Polling interval in ms
   * @returns {Promise<boolean>} True if API becomes ready
   */
  async waitForReady(maxWaitTime = 30000, pollInterval = 1000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isHealthy()) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    return false;
  }

  /**
   * Validate API response structure
   * @param {Object} response - API response
   * @param {Object} expected - Expected structure
   * @throws {Error} If validation fails
   */
  validateResponse(response, expected = {}) {
    if (!response || typeof response !== 'object') {
      throw new Error('Response must be an object');
    }

    // Check status code
    if (expected.status && response.status !== expected.status) {
      throw new Error(`Expected status ${expected.status}, got ${response.status}`);
    }

    // Check required fields in response data
    const requiredFields = expected.requiredFields || ['success'];
    const missingFields = requiredFields.filter(field => 
      !response.data || !(field in response.data)
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Response missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate products array if present
    if (response.data.products && Array.isArray(response.data.products)) {
      response.data.products.forEach((product, index) => {
        try {
          ProductValidator.validateStructure(product);
        } catch (error) {
          throw new Error(`Product ${index + 1} validation failed: ${error.message}`);
        }
      });
    }
  }
}

/**
 * HTML parsing and DOM utilities
 */
export class HtmlTestUtils {
  /**
   * Parse HTML string into DOM document
   * @param {string} html - HTML content
   * @returns {Document} DOM document
   */
  static parseHtml(html) {
    const dom = new JSDOM(html);
    return dom.window.document;
  }

  /**
   * Extract products from Amazon search results HTML
   * @param {string} html - Amazon search results HTML
   * @returns {Array} Array of product objects
   */
  static extractProducts(html) {
    const document = this.parseHtml(html);
    const products = [];
    
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    
    productElements.forEach((element, index) => {
      try {
        // Skip sponsored products
        if (element.querySelector('[data-component-type="sp-sponsored-result"]')) {
          return;
        }

        const product = this.extractSingleProduct(element, index);
        if (product && product.title !== 'N/A') {
          products.push(product);
        }
      } catch (error) {
        console.warn(`Error extracting product ${index}:`, error.message);
      }
    });
    
    return products;
  }

  /**
   * Extract single product from element
   * @param {Element} element - Product DOM element
   * @param {number} index - Product index
   * @returns {Object} Product object
   */
  static extractSingleProduct(element, index) {
    // Extract title - try multiple selectors
    const titleSelectors = [
      'h2 a span',
      'h2 span', 
      '.s-size-mini span',
      '[data-cy="title-recipe-title"] span'
    ];
    
    let titleElement = null;
    for (const selector of titleSelectors) {
      titleElement = element.querySelector(selector);
      if (titleElement) break;
    }
    
    const title = titleElement ? titleElement.textContent.trim() : 'N/A';

    // Extract URL - try multiple selectors
    const linkSelectors = [
      'h2 a[href]',
      '[data-cy="title-recipe-title"]',
      'a[href*="/dp/"]',
      'a[href*="/gp/product/"]'
    ];
    
    let linkElement = null;
    for (const selector of linkSelectors) {
      linkElement = element.querySelector(selector);
      if (linkElement) break;
    }
    
    let productUrl = 'N/A';
    if (linkElement) {
      const href = linkElement.getAttribute('href');
      if (href) {
        productUrl = href.startsWith('http') ? href : `https://www.amazon.com${href}`;
      }
    }

    // Generate fallback search URL if no direct URL found
    if (productUrl === 'N/A' && title !== 'N/A') {
      const searchTerm = encodeURIComponent(title.substring(0, 100));
      productUrl = `https://www.amazon.com/s?k=${searchTerm}`;
    }

    // Extract price
    const priceElement = element.querySelector('.a-price .a-offscreen');
    const price = priceElement ? priceElement.textContent.trim() : 'N/A';

    // Extract rating
    const ratingElement = element.querySelector('.a-icon-alt');
    let rating = 'N/A';
    if (ratingElement) {
      const ratingText = ratingElement.getAttribute('aria-label') || ratingElement.textContent;
      const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(out\s*of\s*5\s*stars?|von\s*5\s*Sternen)/i);
      if (ratingMatch) {
        rating = ratingMatch[1];
      }
    }

    // Extract reviews count
    const reviewsElement = element.querySelector('.a-size-base');
    let reviews = 'N/A';
    if (reviewsElement) {
      const reviewsText = reviewsElement.textContent.trim();
      const reviewsMatch = reviewsText.match(/[\d,.'\\s]+/);
      if (reviewsMatch) {
        reviews = reviewsMatch[0].trim();
      }
    }

    // Extract image URL
    const imageElement = element.querySelector('img');
    const imageUrl = imageElement ? 
      (imageElement.getAttribute('src') || imageElement.getAttribute('data-src') || 'N/A') : 'N/A';

    return {
      title: title.length > 200 ? title.substring(0, 200) + '...' : title,
      productUrl,
      price,
      rating,
      reviews,
      imageUrl
    };
  }

  /**
   * Validate HTML structure for Amazon search results
   * @param {string} html - HTML content
   * @returns {Object} Validation result
   */
  static validateHtml(html) {
    const errors = [];
    const warnings = [];
    
    // Basic HTML structure checks
    if (!html.includes('<html')) {
      errors.push('Missing HTML tag');
    }

    if (!html.includes('<body')) {
      errors.push('Missing BODY tag');
    }

    const document = this.parseHtml(html);
    
    // Check for Amazon-specific structure
    const resultsContainer = document.querySelector('#s-results-list-atf') ||
                           document.querySelector('.s-search-results') ||
                           document.querySelector('.s-no-results');

    if (!resultsContainer) {
      errors.push('Missing Amazon results container');
    }

    // Check products
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    
    if (productElements.length === 0) {
      const noResults = document.querySelector('.s-no-results');
      if (!noResults) {
        warnings.push('No products found and no "no results" message');
      }
    }

    // Validate product structure
    productElements.forEach((element, index) => {
      const hasTitle = element.querySelector('h2') || element.querySelector('.s-size-mini');
      const hasLink = element.querySelector('a[href]');
      
      if (!hasTitle) {
        warnings.push(`Product ${index + 1} missing title`);
      }
      
      if (!hasLink) {
        warnings.push(`Product ${index + 1} missing link`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      productCount: productElements.length
    };
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestUtils {
  /**
   * Measure execution time of async function
   * @param {Function} asyncFn - Function to measure
   * @param {...any} args - Function arguments
   * @returns {Promise<{result: any, duration: number}>} Result and duration
   */
  static async measureTime(asyncFn, ...args) {
    const startTime = process.hrtime.bigint();
    const result = await asyncFn(...args);
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    return { result, duration };
  }

  /**
   * Assert function completes within time limit
   * @param {Function} asyncFn - Function to test
   * @param {number} maxDuration - Max duration in ms
   * @param {...any} args - Function arguments
   * @returns {Promise<any>} Function result
   * @throws {Error} If function takes too long
   */
  static async assertPerformance(asyncFn, maxDuration, ...args) {
    const { result, duration } = await this.measureTime(asyncFn, ...args);
    
    if (duration > maxDuration) {
      throw new Error(
        `Function took ${duration.toFixed(2)}ms, expected less than ${maxDuration}ms`
      );
    }

    return result;
  }

  /**
   * Benchmark a function multiple times
   * @param {Function} asyncFn - Function to benchmark
   * @param {number} iterations - Number of iterations
   * @param {...any} args - Function arguments
   * @returns {Promise<Object>} Benchmark statistics
   */
  static async benchmark(asyncFn, iterations = 10, ...args) {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const { duration } = await this.measureTime(asyncFn, ...args);
      times.push(duration);
    }

    times.sort((a, b) => a - b);
    
    const sum = times.reduce((a, b) => a + b, 0);
    const average = sum / times.length;
    const median = times[Math.floor(times.length / 2)];
    const min = times[0];
    const max = times[times.length - 1];
    
    return {
      iterations,
      times,
      average,
      median,
      min,
      max,
      total: sum
    };
  }
}

/**
 * Mock data utilities
 */
export class MockUtils {
  /**
   * Create mock product with realistic data
   * @param {Object} overrides - Fields to override
   * @returns {Object} Mock product
   */
  static createMockProduct(overrides = {}) {
    const defaults = {
      title: 'Test Product Title',
      productUrl: 'https://www.amazon.com/dp/B123456789',
      price: '$29.99',
      rating: '4.5',
      reviews: '1,234',
      imageUrl: 'https://images-na.ssl-images-amazon.com/images/test.jpg'
    };
    
    return { ...defaults, ...overrides };
  }

  /**
   * Create multiple mock products
   * @param {number} count - Number of products
   * @param {Object} baseOverrides - Base overrides for all products
   * @returns {Array} Array of mock products
   */
  static createMockProducts(count = 5, baseOverrides = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.createMockProduct({
        ...baseOverrides,
        title: `Test Product ${index + 1}`,
        productUrl: `https://www.amazon.com/dp/B12345678${index}`,
        price: `$${(19.99 + index * 5).toFixed(2)}`
      })
    );
  }

  /**
   * Wait for specified time (for async testing)
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after delay
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string} Random string
   */
  static randomString(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Export all utilities as default
export default {
  ProductValidator,
  ApiTestUtils,
  HtmlTestUtils,
  PerformanceTestUtils,
  MockUtils
};
