/**
 * Shared Test Utilities - Index
 * Re-exports all shared testing utilities for easy importing
 */

// Constants and configuration
export * from './constants.js';
export { default as constants } from './constants.js';

// Test lifecycle management
export * from './lifecycle.js';
export { default as lifecycle } from './lifecycle.js';

// Test utilities
export * from './utilities.js';
export { default as utilities } from './utilities.js';

// Convenience re-exports for commonly used utilities
export {
  ProductValidator,
  ApiTestUtils,
  HtmlTestUtils,
  PerformanceTestUtils,
  MockUtils
} from './utilities.js';

// Common test patterns for easy importing
import { 
  TEST_TIMEOUTS,
  TEST_SERVER,
  TEST_PATTERNS,
  MOCK_RESPONSES,
  TEST_KEYWORDS
} from './constants.js';

import { 
  ProductValidator,
  ApiTestUtils,
  HtmlTestUtils,
  MockUtils
} from './utilities.js';

import lifecycle from './lifecycle.js';

// Convenience factory functions
export const createApiClient = (baseUrl) => new ApiTestUtils(baseUrl);
export const createMockProduct = (overrides) => MockUtils.createMockProduct(overrides);
export const createMockProducts = (count, overrides) => MockUtils.createMockProducts(count, overrides);

// Test environment helpers
export const setupTestEnvironment = async () => {
  await lifecycle.beforeAll();
};

export const teardownTestEnvironment = async () => {
  await lifecycle.afterAll();
};

export const withTestLifecycle = (testFn) => {
  return lifecycle.wrapTest(testFn);
};

// Common test assertions
export const assertProductValid = (product, domain) => {
  ProductValidator.validateStructure(product);
  ProductValidator.validateQuality(product, domain);
};

export const assertApiResponseValid = (response, expected) => {
  const client = new ApiTestUtils();
  client.validateResponse(response, expected);
};

export const parseAmazonHtml = (html) => {
  return HtmlTestUtils.extractProducts(html);
};

export const validateHtmlStructure = (html) => {
  return HtmlTestUtils.validateHtml(html);
};

// Default export with all utilities
export default {
  // Constants
  TEST_TIMEOUTS,
  TEST_SERVER,
  TEST_PATTERNS,
  MOCK_RESPONSES,
  TEST_KEYWORDS,
  
  // Utilities
  ProductValidator,
  ApiTestUtils,
  HtmlTestUtils,
  MockUtils,
  
  // Lifecycle
  lifecycle,
  
  // Convenience functions
  createApiClient,
  createMockProduct,
  createMockProducts,
  setupTestEnvironment,
  teardownTestEnvironment,
  withTestLifecycle,
  assertProductValid,
  assertApiResponseValid,
  parseAmazonHtml,
  validateHtmlStructure
};
