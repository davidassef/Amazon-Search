/**
 * Mock Manager - Central coordination of all mocking utilities
 * Provides easy setup, configuration, and cleanup of comprehensive mocks
 */

const { axiosMock } = require('./axios.mock.js');
const { jsdomMock } = require('./jsdom.mock.js');
const { MockResponseGenerator } = require('./mockResponses.js');
const { MockDataGenerator } = require('../utils/mockDataGenerator.js');

class MockManager {
  constructor() {
    this.axiosMock = axiosMock;
    this.jsdomMock = jsdomMock;
    this.responseGenerator = new MockResponseGenerator();
    this.dataGenerator = new MockDataGenerator();
    
    this.isInstalled = false;
    this.configurations = new Map();
    this.scenarios = new Map();
  }

  /**
   * Install all mocks with specified configuration
   */
  installAll(config = {}) {
    const {
      enableAxios = true,
      enableJSDOM = true,
      networkDelay = 0,
      rateLimiting = false,
      performanceDelay = 0
    } = config;

    console.log('🔧 Installing comprehensive mocks...');

    try {
      if (enableAxios) {
        this.axiosMock.install();
        if (networkDelay > 0) {
          this.axiosMock.setNetworkDelay(networkDelay);
        }
        if (rateLimiting) {
          this.axiosMock.enableRateLimiting();
        }
      }

      if (enableJSDOM) {
        this.jsdomMock.install();
        if (performanceDelay > 0) {
          this.jsdomMock.setPerformanceDelay(performanceDelay);
        }
      }

      this.isInstalled = true;
      this.configurations.set('current', config);
      console.log('✅ All mocks installed successfully');

    } catch (error) {
      console.error('❌ Failed to install mocks:', error);
      throw new Error(`Mock installation failed: ${error.message}`);
    }
  }

  /**
   * Restore all mocks to their original state
   */
  restoreAll() {
    console.log('🔄 Restoring all mocks...');

    try {
      this.axiosMock.restore();
      this.jsdomMock.restore();
      
      this.isInstalled = false;
      this.configurations.clear();
      console.log('✅ All mocks restored successfully');

    } catch (error) {
      console.error('❌ Failed to restore mocks:', error);
      throw new Error(`Mock restoration failed: ${error.message}`);
    }
  }

  /**
   * Reset all mock state while keeping them installed
   */
  resetAll() {
    console.log('🔄 Resetting all mock state...');

    this.axiosMock.reset();
    this.jsdomMock.reset();
    this.responseGenerator.clearCache();
    this.dataGenerator.reset();
    this.scenarios.clear();

    console.log('✅ All mock state reset');
  }

  /**
   * Setup a complete test scenario with pre-configured responses
   */
  setupScenario(scenarioName, config = {}) {
    const {
      domain = 'amazon.com',
      category = 'electronics',
      searchTerm = 'test',
      productCount = 5,
      responseType = 'successful',
      errorType = null,
      customResponses = {},
      networkConditions = {}
    } = config;

    console.log(`🎭 Setting up scenario: ${scenarioName}`);

    // Configure network conditions
    if (networkConditions.delay) {
      this.axiosMock.setNetworkDelay(networkConditions.delay);
    }
    if (networkConditions.rateLimiting) {
      this.axiosMock.enableRateLimiting();
    } else {
      this.axiosMock.disableRateLimiting();
    }

    // Setup responses based on scenario type
    if (errorType) {
      this.setupErrorScenario(errorType, domain, searchTerm);
    } else {
      this.setupSuccessScenario(responseType, domain, category, searchTerm, productCount);
    }

    // Apply custom responses
    Object.entries(customResponses).forEach(([url, response]) => {
      this.axiosMock.setMockResponse('GET', url, response.data, response.status, response.headers);
    });

    // Store scenario configuration
    this.scenarios.set(scenarioName, {
      domain,
      category,
      searchTerm,
      productCount,
      responseType,
      errorType,
      customResponses,
      networkConditions,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Scenario "${scenarioName}" configured`);
  }

  /**
   * Setup error scenario responses
   */
  setupErrorScenario(errorType, domain, searchTerm) {
    const baseUrl = `https://www.${domain}`;
    const searchUrl = `${baseUrl}/s?k=${encodeURIComponent(searchTerm)}`;
    
    const errorResponses = this.responseGenerator.getErrorResponses();
    const errorResponse = errorResponses[errorType];

    if (errorResponse) {
      this.axiosMock.setMockResponse('GET', searchUrl, errorResponse.data, errorResponse.status, errorResponse.headers);
    } else {
      // Setup error scenario with axios mock error handling
      const errorConfig = this.getErrorConfig(errorType);
      this.axiosMock.setErrorScenario('GET', searchUrl, errorConfig);
    }
  }

  /**
   * Setup successful scenario responses
   */
  setupSuccessScenario(responseType, domain, category, searchTerm, productCount) {
    const baseUrl = `https://www.${domain}`;
    const searchUrl = `${baseUrl}/s?k=${encodeURIComponent(searchTerm)}`;
    
    let responseData;
    
    // Get appropriate response based on type
    switch (responseType) {
      case 'successful':
        const searchResponses = this.responseGenerator.getAmazonSearchResponses();
        responseData = searchResponses.successfulSearch;
        break;
        
      case 'noResults':
        const noResultsResponses = this.responseGenerator.getAmazonSearchResponses();
        responseData = noResultsResponses.noResults;
        break;
        
      case 'limitedResults':
        const limitedResponses = this.responseGenerator.getAmazonSearchResponses();
        responseData = limitedResponses.limitedResults;
        break;
        
      case 'sponsored':
        const sponsoredResponses = this.responseGenerator.getAmazonSearchResponses();
        responseData = sponsoredResponses.sponsoredResults;
        break;
        
      case 'domainSpecific':
        const domainResponses = this.responseGenerator.getDomainSpecificResponses();
        responseData = domainResponses[domain]?.[category];
        break;
        
      case 'luxuryItems':
      case 'budgetItems':
      case 'highRatedItems':
      case 'lowRatedItems':
      case 'popularItems':
      case 'newItems':
      case 'outOfStock':
        const productResponses = this.responseGenerator.getProductTypeResponses();
        responseData = productResponses[responseType];
        break;
        
      default:
        // Generate custom response
        responseData = {
          status: 200,
          headers: { 'content-type': 'text/html; charset=UTF-8' },
          data: this.responseGenerator.generateSearchResultsHTML(category, searchTerm, productCount)
        };
    }

    if (responseData) {
      this.axiosMock.setMockResponse('GET', searchUrl, responseData.data, responseData.status, responseData.headers);
    }
  }

  /**
   * Get error configuration for specific error types
   */
  getErrorConfig(errorType) {
    const errorConfigs = {
      timeout: {
        code: 'ETIMEDOUT',
        message: 'Request timeout',
        maxRetries: 2
      },
      connectionReset: {
        code: 'ECONNRESET',
        message: 'Connection reset by peer',
        maxRetries: 3
      },
      networkError: {
        code: 'ENETUNREACH',
        message: 'Network unreachable',
        maxRetries: 1
      },
      dnsError: {
        code: 'ENOTFOUND',
        message: 'DNS lookup failed',
        maxRetries: 0
      }
    };

    return errorConfigs[errorType] || {
      message: 'Unknown network error',
      maxRetries: 0
    };
  }

  /**
   * Quick setup methods for common scenarios
   */
  setupAmazonSearch(domain = 'amazon.com', category = 'electronics', searchTerm = 'smartphone') {
    return this.setupScenario('amazonSearch', {
      domain,
      category,
      searchTerm,
      responseType: 'successful',
      productCount: 8
    });
  }

  setupAmazonError(errorType = 'rateLimited', domain = 'amazon.com') {
    return this.setupScenario('amazonError', {
      domain,
      errorType,
      searchTerm: 'test'
    });
  }

  setupAmazonEmpty(domain = 'amazon.com', searchTerm = 'nonexistent-product') {
    return this.setupScenario('amazonEmpty', {
      domain,
      searchTerm,
      responseType: 'noResults'
    });
  }

  setupAmazonSlow(domain = 'amazon.com', delay = 2000) {
    return this.setupScenario('amazonSlow', {
      domain,
      responseType: 'successful',
      networkConditions: { delay }
    });
  }

  setupRateLimiting(domain = 'amazon.com') {
    return this.setupScenario('rateLimiting', {
      domain,
      responseType: 'successful',
      networkConditions: { rateLimiting: true }
    });
  }

  /**
   * Validation and testing utilities
   */
  validateMockSetup() {
    const issues = [];
    
    // Check if mocks are installed
    if (!this.isInstalled) {
      issues.push('Mocks are not installed');
    }

    // Validate axios mock
    try {
      const axios = require('axios');
      if (typeof axios.get !== 'function') {
        issues.push('Axios mock not properly installed');
      }
    } catch (error) {
      issues.push(`Axios validation failed: ${error.message}`);
    }

    // Validate JSDOM mock
    try {
      const { JSDOM } = require('jsdom');
      const testDOM = new JSDOM('<html><body>Test</body></html>');
      if (!testDOM.window || !testDOM.window.document) {
        issues.push('JSDOM mock not properly installed');
      }
    } catch (error) {
      issues.push(`JSDOM validation failed: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Get comprehensive mock status and statistics
   */
  getStatus() {
    return {
      installed: this.isInstalled,
      configurations: Object.fromEntries(this.configurations),
      scenarios: Object.fromEntries(this.scenarios),
      axios: {
        installed: this.axiosMock.originalAxios !== null,
        requestHistory: this.axiosMock.getRequestHistory().length,
        errorScenarios: this.axiosMock.errorScenarios.size,
        mockResponses: this.axiosMock.mockResponses.size
      },
      jsdom: {
        installed: this.jsdomMock.originalJSDOM !== null,
        parseHistory: this.jsdomMock.getParseHistory().length,
        cachedDOMs: this.jsdomMock.mockDOMs.size,
        errorScenarios: this.jsdomMock.errorScenarios.size
      }
    };
  }

  /**
   * Export test data for use in tests
   */
  exportTestData() {
    return {
      products: this.dataGenerator.generateProducts(20),
      scenarios: this.dataGenerator.generateTestScenarios(),
      domains: this.dataGenerator.generateDomainTestData(),
      errors: this.dataGenerator.generateErrorScenarios(),
      responses: {
        amazon: this.responseGenerator.getAmazonSearchResponses(),
        errors: this.responseGenerator.getErrorResponses(),
        domains: this.responseGenerator.getDomainSpecificResponses(),
        products: this.responseGenerator.getProductTypeResponses()
      }
    };
  }

  /**
   * Get specific mock instance
   */
  getAxiosMock() {
    return this.axiosMock;
  }

  getJSDoMMock() {
    return this.jsdomMock;
  }

  getResponseGenerator() {
    return this.responseGenerator;
  }

  getDataGenerator() {
    return this.dataGenerator;
  }
}

// Create and export singleton instance
const mockManager = new MockManager();

// Export individual components and utilities
module.exports = {
  MockManager,
  mockManager,
  
  // Direct access to individual mocks
  axiosMock,
  jsdomMock,
  MockResponseGenerator,
  MockDataGenerator,
  
  // Convenience functions
  setupMocks: (config) => mockManager.installAll(config),
  restoreMocks: () => mockManager.restoreAll(),
  resetMocks: () => mockManager.resetAll(),
  
  // Quick scenario setup functions
  setupAmazonSearch: (domain, category, searchTerm) => mockManager.setupAmazonSearch(domain, category, searchTerm),
  setupAmazonError: (errorType, domain) => mockManager.setupAmazonError(errorType, domain),
  setupAmazonEmpty: (domain, searchTerm) => mockManager.setupAmazonEmpty(domain, searchTerm),
  setupAmazonSlow: (domain, delay) => mockManager.setupAmazonSlow(domain, delay),
  setupRateLimiting: (domain) => mockManager.setupRateLimiting(domain),
  
  // Validation and status
  validateMocks: () => mockManager.validateMockSetup(),
  getMockStatus: () => mockManager.getStatus(),
  
  // Test data export
  getTestData: () => mockManager.exportTestData()
};
