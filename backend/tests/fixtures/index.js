/**
 * Fixtures Index - Manages HTML fixtures for testing Amazon scraper
 * This module provides easy access to mock HTML responses from different Amazon domains
 */

const fs = require('fs');
const path = require('path');

/**
 * Load HTML fixture from file
 * @param {string} filename - Name of the fixture file
 * @returns {string} HTML content of the fixture
 */
function loadFixture(filename) {
  const fixturePath = path.join(__dirname, filename);
  
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`Fixture file not found: ${filename}`);
  }
  
  return fs.readFileSync(fixturePath, 'utf-8');
}

// Pre-defined fixture mappings
const FIXTURES = {
  // Amazon.com fixtures
  'amazon.com': {
    smartphones: 'amazon-com-search.html',
    empty: 'amazon-empty-search.html'
  },
  
  // Amazon.co.uk fixtures  
  'amazon.co.uk': {
    laptops: 'amazon-co-uk-search.html',
    empty: 'amazon-empty-search.html'
  },
  
  // Amazon.de fixtures
  'amazon.de': {
    books: 'amazon-de-search.html',
    empty: 'amazon-empty-search.html'
  }
};

/**
 * Get fixture content by domain and category
 * @param {string} domain - Amazon domain (e.g., 'amazon.com')
 * @param {string} category - Product category or 'empty' for no results
 * @returns {string} HTML content
 */
function getFixture(domain, category) {
  if (!FIXTURES[domain]) {
    throw new Error(`No fixtures available for domain: ${domain}`);
  }
  
  if (!FIXTURES[domain][category]) {
    throw new Error(`No fixture available for ${domain}/${category}`);
  }
  
  return loadFixture(FIXTURES[domain][category]);
}

/**
 * Get all available domains with fixtures
 * @returns {Array<string>} List of available domains
 */
function getAvailableDomains() {
  return Object.keys(FIXTURES);
}

/**
 * Get all available categories for a domain
 * @param {string} domain - Amazon domain
 * @returns {Array<string>} List of available categories
 */
function getAvailableCategories(domain) {
  if (!FIXTURES[domain]) {
    return [];
  }
  
  return Object.keys(FIXTURES[domain]);
}

/**
 * Generate mock response data for testing axios calls
 * @param {string} domain - Amazon domain
 * @param {string} category - Product category
 * @param {Object} options - Additional options for the response
 * @returns {Object} Mock axios response object
 */
function createMockResponse(domain, category, options = {}) {
  const htmlContent = getFixture(domain, category);
  
  const response = {
    data: htmlContent,
    status: options.status || 200,
    statusText: options.statusText || 'OK',
    headers: {
      'content-type': 'text/html; charset=UTF-8',
      'content-length': htmlContent.length.toString(),
      ...options.headers
    },
    config: {
      url: options.url || `https://www.${domain}/s?k=test`,
      method: 'GET',
      ...options.config
    }
  };
  
  return response;
}

/**
 * Create a mock error response for testing error scenarios
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @returns {Object} Mock error response
 */
function createMockErrorResponse(status, message) {
  const error = new Error(message);
  error.response = {
    status,
    statusText: getStatusText(status),
    data: `<html><body><h1>${status} ${getStatusText(status)}</h1><p>${message}</p></body></html>`,
    headers: {
      'content-type': 'text/html; charset=UTF-8'
    }
  };
  
  return error;
}

/**
 * Get HTTP status text for a given status code
 * @param {number} status - HTTP status code
 * @returns {string} Status text
 */
function getStatusText(status) {
  const statusTexts = {
    400: 'Bad Request',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    503: 'Service Unavailable'
  };
  
  return statusTexts[status] || 'Unknown';
}

/**
 * Validate fixture content (basic checks)
 * @param {string} htmlContent - HTML content to validate
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateFixture(htmlContent) {
  const errors = [];
  
  // Check if it's valid HTML
  if (!htmlContent.includes('<html')) {
    errors.push('Missing HTML tag');
  }
  
  if (!htmlContent.includes('<body')) {
    errors.push('Missing BODY tag');
  }
  
  // Check for Amazon-specific elements
  if (!htmlContent.includes('s-results-list-atf') && !htmlContent.includes('s-no-results')) {
    errors.push('Missing Amazon results container');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

module.exports = {
  loadFixture,
  getFixture,
  getAvailableDomains,
  getAvailableCategories,
  createMockResponse,
  createMockErrorResponse,
  validateFixture,
  FIXTURES
};
