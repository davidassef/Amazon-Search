/**
 * Test Helpers - Utility functions for testing Amazon scraper
 * Provides common testing utilities, API helpers, and assertion functions
 */

const axios = require('axios');
const { JSDOM } = require('jsdom');

/**
 * HTTP Test Helpers for API testing
 */
class HttpTestHelpers {
  constructor(baseUrl = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
    this.defaultTimeout = 10000;
  }

  /**
   * Make a GET request to the API
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
        timeout: options.timeout || this.defaultTimeout,
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
   * Make a POST request to the API
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Request body data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response object
   */
  async post(endpoint, data = {}, options = {}) {
    const url = new URL(endpoint, this.baseUrl);

    try {
      const response = await axios.post(url.toString(), data, {
        timeout: options.timeout || this.defaultTimeout,
        validateStatus: () => true,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
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
   * Check if the API is healthy/running
   * @returns {Promise<boolean>} True if API is running
   */
  async isApiRunning() {
    try {
      const response = await this.get('/api/health', {}, { timeout: 2000 });
      return response.status === 200 && response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for API to be ready
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds
   * @param {number} pollInterval - Polling interval in milliseconds
   * @returns {Promise<boolean>} True if API becomes ready
   */
  async waitForApi(maxWaitTime = 30000, pollInterval = 1000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isApiRunning()) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    return false;
  }
}

/**
 * DOM Test Helpers for HTML parsing and validation
 */
class DomTestHelpers {
  /**
   * Parse HTML content using JSDOM
   * @param {string} html - HTML content
   * @returns {Object} JSDOM document object
   */
  static parseHtml(html) {
    const dom = new JSDOM(html);
    return dom.window.document;
  }

  /**
   * Extract product data from HTML using Amazon selectors
   * @param {string} html - Amazon search results HTML
   * @returns {Array} Array of extracted product objects
   */
  static extractProductsFromHtml(html) {
    const document = this.parseHtml(html);
    const products = [];
    
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    
    productElements.forEach((element, index) => {
      try {
        // Extract title
        const titleElement = element.querySelector('h2 a span') || 
                            element.querySelector('h2 span') ||
                            element.querySelector('.s-size-mini span');
        const title = titleElement ? titleElement.textContent.trim() : 'N/A';

        // Extract URL
        const linkElement = element.querySelector('h2 a[href]');
        let productUrl = 'N/A';
        if (linkElement) {
          const href = linkElement.getAttribute('href');
          if (href) {
            productUrl = href.startsWith('http') ? href : `https://www.amazon.com${href}`;
          }
        }

        // Extract price
        const priceElement = element.querySelector('.a-price .a-offscreen');
        const price = priceElement ? priceElement.textContent.trim() : 'N/A';

        // Extract rating
        const ratingElement = element.querySelector('.a-icon-alt');
        let rating = 'N/A';
        if (ratingElement) {
          const ratingText = ratingElement.textContent;
          const ratingMatch = ratingText.match(/(\\d+\\.?\\d*)\\s*(out\\s*of\\s*5\\s*stars?|von\\s*5\\s*Sternen)/i);
          if (ratingMatch) {
            rating = ratingMatch[1];
          }
        }

        // Extract reviews
        const reviewsElement = element.querySelector('.a-size-base');
        let reviews = 'N/A';
        if (reviewsElement) {
          const reviewsText = reviewsElement.textContent.trim();
          const reviewsMatch = reviewsText.match(/[\\d,.'\\s]+/);
          if (reviewsMatch) {
            reviews = reviewsMatch[0].trim();
          }
        }

        // Extract image
        const imageElement = element.querySelector('img');
        const imageUrl = imageElement ? 
          (imageElement.getAttribute('src') || imageElement.getAttribute('data-src') || 'N/A') : 'N/A';

        if (title && title !== 'N/A') {
          products.push({
            title,
            productUrl,
            price,
            rating,
            reviews,
            imageUrl
          });
        }
      } catch (error) {
        console.warn(`Error extracting product ${index}:`, error.message);
      }
    });

    return products;
  }

  /**
   * Validate HTML structure for Amazon search results
   * @param {string} html - HTML content to validate
   * @returns {Object} Validation result
   */
  static validateAmazonHtml(html) {
    const document = this.parseHtml(html);
    const errors = [];
    const warnings = [];

    // Check for basic HTML structure
    if (!html.includes('<html')) {
      errors.push('Missing HTML tag');
    }

    if (!html.includes('<body')) {
      errors.push('Missing BODY tag');
    }

    // Check for Amazon-specific elements
    const resultsContainer = document.querySelector('#s-results-list-atf') ||
                           document.querySelector('.s-search-results') ||
                           document.querySelector('.s-no-results');

    if (!resultsContainer) {
      errors.push('Missing Amazon results container');
    }

    // Check for product elements
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
 * Assertion Helpers for common test assertions
 */
class AssertionHelpers {
  /**
   * Assert that a product object has all required fields
   * @param {Object} product - Product object to validate
   * @param {Array} requiredFields - Array of required field names
   * @throws {Error} If validation fails
   */
  static assertProductStructure(product, requiredFields = ['title', 'productUrl', 'price', 'rating', 'reviews', 'imageUrl']) {
    if (!product || typeof product !== 'object') {
      throw new Error('Product must be an object');
    }

    const missingFields = requiredFields.filter(field => !(field in product));
    if (missingFields.length > 0) {
      throw new Error(`Product missing required fields: ${missingFields.join(', ')}`);
    }

    // Validate specific field types
    if (typeof product.title !== 'string' || product.title.trim().length === 0) {
      throw new Error('Product title must be a non-empty string');
    }

    if (typeof product.productUrl !== 'string' || !this.isValidUrl(product.productUrl)) {
      throw new Error('Product URL must be a valid URL string');
    }
  }

  /**
   * Assert that an API response has the expected structure
   * @param {Object} response - API response object
   * @param {Object} expected - Expected response structure
   * @throws {Error} If validation fails
   */
  static assertApiResponse(response, expected = {}) {
    if (!response || typeof response !== 'object') {
      throw new Error('Response must be an object');
    }

    // Check required API response fields
    const requiredFields = expected.requiredFields || ['success'];
    const missingFields = requiredFields.filter(field => !(field in response));
    if (missingFields.length > 0) {
      throw new Error(`API response missing required fields: ${missingFields.join(', ')}`);
    }

    // Check success field
    if (expected.success !== undefined && response.success !== expected.success) {
      throw new Error(`Expected success=${expected.success}, got success=${response.success}`);
    }

    // Check products array if expected
    if (expected.hasProducts && (!response.products || !Array.isArray(response.products))) {
      throw new Error('API response must contain products array');
    }

    if (response.products && Array.isArray(response.products)) {
      response.products.forEach((product, index) => {
        try {
          this.assertProductStructure(product);
        } catch (error) {
          throw new Error(`Product ${index + 1} validation failed: ${error.message}`);
        }
      });
    }
  }

  /**
   * Check if a string is a valid URL
   * @param {string} url - URL string to validate
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

  /**
   * Assert that a value is within expected range
   * @param {number} value - Value to check
   * @param {number} min - Minimum expected value
   * @param {number} max - Maximum expected value
   * @param {string} fieldName - Name of the field for error messages
   * @throws {Error} If value is out of range
   */
  static assertRange(value, min, max, fieldName = 'value') {
    if (typeof value !== 'number' || isNaN(value)) {
      throw new Error(`${fieldName} must be a valid number`);
    }

    if (value < min || value > max) {
      throw new Error(`${fieldName} must be between ${min} and ${max}, got ${value}`);
    }
  }

  /**
   * Assert that two arrays have the same length
   * @param {Array} actual - Actual array
   * @param {Array} expected - Expected array or expected length
   * @param {string} message - Custom error message
   * @throws {Error} If lengths don't match
   */
  static assertArrayLength(actual, expected, message = '') {
    if (!Array.isArray(actual)) {
      throw new Error('Actual value must be an array');
    }

    const expectedLength = Array.isArray(expected) ? expected.length : expected;
    if (typeof expectedLength !== 'number') {
      throw new Error('Expected length must be a number or array');
    }

    if (actual.length !== expectedLength) {
      const errorMessage = message || `Expected array length ${expectedLength}, got ${actual.length}`;
      throw new Error(errorMessage);
    }
  }
}

/**
 * Performance Test Helpers
 */
class PerformanceHelpers {
  /**
   * Measure execution time of an async function
   * @param {Function} asyncFn - Async function to measure
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<{result: any, duration: number}>} Function result and duration in ms
   */
  static async measureTime(asyncFn, ...args) {
    const startTime = process.hrtime.bigint();
    const result = await asyncFn(...args);
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    return { result, duration };
  }

  /**
   * Assert that a function completes within expected time
   * @param {Function} asyncFn - Async function to test
   * @param {number} maxDuration - Maximum allowed duration in ms
   * @param {...any} args - Arguments to pass to the function
   * @returns {Promise<any>} Function result
   * @throws {Error} If function takes too long
   */
  static async assertPerformance(asyncFn, maxDuration, ...args) {
    const { result, duration } = await this.measureTime(asyncFn, ...args);
    
    if (duration > maxDuration) {
      throw new Error(`Function took ${duration.toFixed(2)}ms, expected less than ${maxDuration}ms`);
    }

    return result;
  }
}

module.exports = {
  HttpTestHelpers,
  DomTestHelpers,
  AssertionHelpers,
  PerformanceHelpers
};
