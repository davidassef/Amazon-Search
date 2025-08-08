/**
 * Test Environment Setup and Configuration
 * This file configures the test environment for Amazon scraper backend tests
 */

// Test environment configuration
process.env.NODE_ENV = 'test';
process.env.PORT = process.env.TEST_PORT || 3001;

// Configure test timeouts
const TEST_TIMEOUTS = {
  unit: 5000,      // 5 seconds for unit tests
  integration: 15000, // 15 seconds for integration tests
  e2e: 30000       // 30 seconds for end-to-end tests
};

// Mock axios for controlled testing
const axios = require('axios');
const { JSDOM } = require('jsdom');

// Test utilities
class TestHelper {
  /**
   * Get test timeout based on test type
   * @param {string} testType - 'unit', 'integration', or 'e2e'
   * @returns {number} Timeout in milliseconds
   */
  static getTimeout(testType = 'unit') {
    return TEST_TIMEOUTS[testType] || TEST_TIMEOUTS.unit;
  }

  /**
   * Create a mock axios response for testing
   * @param {string} htmlContent - HTML content to return
   * @param {number} status - HTTP status code
   * @returns {Object} Mock response object
   */
  static createMockAxiosResponse(htmlContent, status = 200) {
    return {
      data: htmlContent,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: {
        'content-type': 'text/html; charset=UTF-8'
      }
    };
  }

  /**
   * Create a mock product for testing
   * @param {Object} options - Product options
   * @returns {Object} Mock product object
   */
  static createMockProduct(options = {}) {
    const defaults = {
      title: 'Test Product Title',
      productUrl: 'https://www.amazon.com/dp/B123456789',
      price: '$29.99',
      rating: '4.5',
      reviews: '1,234',
      imageUrl: 'https://images-na.ssl-images-amazon.com/images/test.jpg'
    };
    
    return { ...defaults, ...options };
  }

  /**
   * Create multiple mock products
   * @param {number} count - Number of products to create
   * @param {Object} baseOptions - Base options for all products
   * @returns {Array} Array of mock products
   */
  static createMockProducts(count = 5, baseOptions = {}) {
    return Array.from({ length: count }, (_, index) => 
      this.createMockProduct({
        ...baseOptions,
        title: `Test Product ${index + 1}`,
        productUrl: `https://www.amazon.com/dp/B12345678${index}`,
        price: `$${(19.99 + index * 5).toFixed(2)}`
      })
    );
  }

  /**
   * Wait for a specified amount of time (for testing async operations)
   * @param {number} ms - Milliseconds to wait
   * @returns {Promise} Promise that resolves after the specified time
   */
  static async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Validate product object structure
   * @param {Object} product - Product object to validate
   * @returns {boolean} True if product has required fields
   */
  static isValidProduct(product) {
    const requiredFields = ['title', 'productUrl', 'price', 'rating', 'reviews', 'imageUrl'];
    return requiredFields.every(field => product.hasOwnProperty(field));
  }

  /**
   * Generate random string for testing
   * @param {number} length - Length of random string
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

  /**
   * Extract products from HTML content
   * @param {string} htmlContent - HTML content to parse
   * @returns {Array} Extracted product objects
   */
  static extractProducts(htmlContent) {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    const products = [];
    const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
    
    productElements.forEach((element, index) => {
      try {
        // Extract title
        const titleElement = element.querySelector('h2 a span') || element.querySelector('h2 span');
        const title = titleElement ? titleElement.textContent.trim() : 'N/A';
        
        // Extract URL
        const linkElement = element.querySelector('h2 a') || element.querySelector('a[href]');
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
          const ratingText = ratingElement.getAttribute('aria-label') || ratingElement.textContent;
          const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*out\s*of\s*5\s*stars?/i);
          if (ratingMatch) {
            rating = ratingMatch[1];
          }
        }
        
        // Extract reviews
        const reviewsElement = element.querySelector('.a-size-base');
        const reviews = reviewsElement ? reviewsElement.textContent.trim() : 'N/A';
        
        // Extract image
        const imageElement = element.querySelector('img');
        const imageUrl = imageElement ? (imageElement.getAttribute('src') || 'N/A') : 'N/A';
        
        if (title !== 'N/A') {
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
        console.error(`Error extracting product ${index}:`, error.message);
      }
    });
    
    return products;
  }

  /**
   * Validate HTML structure for Amazon pages
   * @param {string} htmlContent - HTML content to validate
   * @returns {Object} Validation result
   */
  static validateHtml(htmlContent) {
    const { JSDOM } = require('jsdom');
    const errors = [];
    let productCount = 0;
    
    try {
      const dom = new JSDOM(htmlContent);
      const document = dom.window.document;
      
      // Check for basic structure
      if (!document.querySelector('html')) {
        errors.push('Missing html element');
      }
      
      if (!document.querySelector('head')) {
        errors.push('Missing head element');
      }
      
      if (!document.querySelector('body')) {
        errors.push('Missing body element');
      }
      
      // Check for Amazon-specific structure
      const resultsContainer = document.querySelector('#s-results-list-atf') || document.querySelector('.s-search-results');
      if (!resultsContainer) {
        errors.push('Missing Amazon search results container');
      }
      
      // Count products
      const productElements = document.querySelectorAll('[data-component-type="s-search-result"]');
      productCount = productElements.length;
      
      if (productCount === 0) {
        errors.push('No product elements found');
      }
      
      // Check product structure
      productElements.forEach((element, index) => {
        const titleElement = element.querySelector('h2') || element.querySelector('[data-cy="title-recipe-title"]');
        if (!titleElement) {
          errors.push(`Product ${index + 1}: Missing title element`);
        }
        
        const linkElement = element.querySelector('a[href]');
        if (!linkElement) {
          errors.push(`Product ${index + 1}: Missing link element`);
        }
      });
      
    } catch (error) {
      errors.push(`HTML parsing error: ${error.message}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      productCount
    };
  }

  /**
   * Measure execution time of a function
   * @param {Function} fn - Function to measure
   * @returns {Promise<Object>} Result and duration
   */
  static async measureTime(fn) {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    return {
      result,
      duration
    };
  }

  /**
   * Assert function performance within time limit
   * @param {Function} fn - Function to test
   * @param {number} maxTime - Maximum allowed time in milliseconds
   * @returns {Promise<any>} Function result
   */
  static async assertPerformance(fn, maxTime) {
    const { result, duration } = await this.measureTime(fn);
    
    if (duration > maxTime) {
      throw new Error(`Function took ${duration.toFixed(2)}ms, expected less than ${maxTime}ms`);
    }
    
    return result;
  }

  /**
   * Clean up test data and resources
   */
  static cleanup() {
    // Reset environment variables
    delete process.env.TEST_DATA_LOADED;
    
    // Clear any test timers
    if (global.testTimers) {
      global.testTimers.forEach(timer => clearTimeout(timer));
      global.testTimers = [];
    }
  }
}

// Test database configuration (using in-memory storage for testing)
class TestDatabase {
  constructor() {
    this.products = new Map();
    this.domains = new Map();
    this.searches = new Map();
  }

  /**
   * Initialize test database with mock data
   */
  async init() {
    // Load mock Amazon domains
    const domains = {
      'amazon.com': { baseUrl: 'https://www.amazon.com', language: 'en-US,en;q=0.9', currency: 'USD' },
      'amazon.co.uk': { baseUrl: 'https://www.amazon.co.uk', language: 'en-GB,en;q=0.9', currency: 'GBP' },
      'amazon.de': { baseUrl: 'https://www.amazon.de', language: 'de-DE,de;q=0.9,en;q=0.8', currency: 'EUR' },
      'amazon.fr': { baseUrl: 'https://www.amazon.fr', language: 'fr-FR,fr;q=0.9,en;q=0.8', currency: 'EUR' },
      'amazon.ca': { baseUrl: 'https://www.amazon.ca', language: 'en-CA,en;q=0.9,fr;q=0.8', currency: 'CAD' }
    };

    Object.entries(domains).forEach(([key, value]) => {
      this.domains.set(key, value);
    });

    // Load mock product scenarios
    const productScenarios = [
      {
        id: 'electronics-phone',
        keyword: 'smartphone',
        domain: 'amazon.com',
        products: TestHelper.createMockProducts(10, { 
          category: 'Electronics',
          avgPrice: 299.99 
        })
      },
      {
        id: 'books-fiction',
        keyword: 'fiction books',
        domain: 'amazon.com',
        products: TestHelper.createMockProducts(15, { 
          category: 'Books',
          avgPrice: 12.99 
        })
      },
      {
        id: 'home-kitchen',
        keyword: 'kitchen appliances',
        domain: 'amazon.com',
        products: TestHelper.createMockProducts(8, { 
          category: 'Home & Kitchen',
          avgPrice: 79.99 
        })
      }
    ];

    productScenarios.forEach(scenario => {
      this.products.set(scenario.id, scenario);
    });

    process.env.TEST_DATA_LOADED = 'true';
    console.log('✓ Test database initialized with mock data');
  }

  /**
   * Get products by scenario ID
   * @param {string} scenarioId - Scenario identifier
   * @returns {Array} Products for the scenario
   */
  getProductsByScenario(scenarioId) {
    const scenario = this.products.get(scenarioId);
    return scenario ? scenario.products : [];
  }

  /**
   * Get domain configuration
   * @param {string} domain - Amazon domain
   * @returns {Object} Domain configuration
   */
  getDomainConfig(domain) {
    return this.domains.get(domain);
  }

  /**
   * Record a search for testing analytics
   * @param {string} keyword - Search keyword
   * @param {string} domain - Amazon domain
   * @param {number} resultCount - Number of results returned
   */
  recordSearch(keyword, domain, resultCount) {
    const searchKey = `${domain}:${keyword}`;
    this.searches.set(searchKey, {
      keyword,
      domain,
      resultCount,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Clear all test data
   */
  clear() {
    this.products.clear();
    this.domains.clear();
    this.searches.clear();
    delete process.env.TEST_DATA_LOADED;
  }
}

// Global test database instance
global.testDB = new TestDatabase();

// Test configuration object
const TestConfig = {
  timeouts: TEST_TIMEOUTS,
  helper: TestHelper,
  database: global.testDB,
  
  // Environment variables for testing
  env: {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,
    LOG_LEVEL: process.env.LOG_LEVEL || 'error', // Reduce logging in tests
  },

  // Mock configuration
  mocks: {
    enableAxiosMock: false,
    enableDatabaseMock: true,
    enableNetworkDelay: false
  }
};

// Initialize test environment before tests run
async function initializeTestEnvironment() {
  console.log('🧪 Initializing test environment...');
  
  // Initialize test database
  await global.testDB.init();
  
  // Set up global error handling for tests
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });
  
  console.log('✅ Test environment initialized');
}

// Cleanup function for after tests
function cleanupTestEnvironment() {
  console.log('🧹 Cleaning up test environment...');
  
  TestHelper.cleanup();
  global.testDB.clear();
  
  console.log('✅ Test environment cleaned up');
}

// Auto-initialize if this file is imported
if (typeof global !== 'undefined' && !global.testEnvironmentInitialized) {
  global.testEnvironmentInitialized = true;
  initializeTestEnvironment().catch(console.error);
}

module.exports = {
  TestConfig,
  TestHelper,
  TestDatabase,
  initializeTestEnvironment,
  cleanupTestEnvironment
};
