/**
 * Test Utils Index - Main entry point for all test utilities
 * Provides centralized access to all test helper functions and utilities
 */

const { MockDataGenerator, MockDataGenerator_Static, PRODUCT_CATEGORIES, DOMAIN_DATA } = require('./mockDataGenerator');
const { HttpTestHelpers, DomTestHelpers, AssertionHelpers, PerformanceHelpers } = require('./testHelpers');

// Re-export everything for easy access
module.exports = {
  // Mock data generators
  MockDataGenerator,
  MockDataGenerator_Static,
  PRODUCT_CATEGORIES,
  DOMAIN_DATA,
  
  // Test helpers
  HttpTestHelpers,
  DomTestHelpers,
  AssertionHelpers,
  PerformanceHelpers,
  
  // Convenience factory functions
  createMockDataGenerator: () => new MockDataGenerator(),
  createHttpClient: (baseUrl) => new HttpTestHelpers(baseUrl),
  
  // Common test data creation shortcuts
  createBasicProduct: MockDataGenerator_Static.createBasicProduct,
  createApiResponse: MockDataGenerator_Static.createApiResponse,
  
  // Validation shortcuts
  assertProduct: AssertionHelpers.assertProductStructure,
  assertApiResponse: AssertionHelpers.assertApiResponse,
  assertArrayLength: AssertionHelpers.assertArrayLength,
  assertRange: AssertionHelpers.assertRange,
  isValidUrl: AssertionHelpers.isValidUrl,
  
  // DOM shortcuts
  parseHtml: DomTestHelpers.parseHtml,
  extractProducts: DomTestHelpers.extractProductsFromHtml,
  validateHtml: DomTestHelpers.validateAmazonHtml,
  
  // Performance shortcuts
  measureTime: PerformanceHelpers.measureTime,
  assertPerformance: PerformanceHelpers.assertPerformance
};
