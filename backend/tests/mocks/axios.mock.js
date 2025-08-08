/**
 * Axios Mock - Comprehensive HTTP Request Mocking for Amazon Scraper Tests
 * Provides controlled responses for different Amazon domains, error scenarios, and rate limiting
 */

const { MockDataGenerator } = require('../utils/mockDataGenerator.js');
const { getFixture } = require('../fixtures/index.js');

class AxiosMock {
  constructor() {
    this.originalAxios = null;
    this.requestHistory = [];
    this.mockResponses = new Map();
    this.defaultDelay = 0;
    this.errorScenarios = new Map();
    this.retryCount = new Map();
    this.rateLimitingEnabled = false;
    this.requestCounts = new Map();
    this.mockGenerator = new MockDataGenerator();
  }

  /**
   * Install axios mock - replaces axios with our mock implementation
   */
  install() {
    const axios = require('axios');
    this.originalAxios = { ...axios };
    
    // Mock the main axios functions
    axios.get = this.mockGet.bind(this);
    axios.post = this.mockPost.bind(this);
    axios.put = this.mockPut.bind(this);
    axios.delete = this.mockDelete.bind(this);
    axios.request = this.mockRequest.bind(this);
    
    console.log('✅ Axios mock installed');
  }

  /**
   * Restore original axios functionality
   */
  restore() {
    if (this.originalAxios) {
      const axios = require('axios');
      Object.assign(axios, this.originalAxios);
      this.originalAxios = null;
      console.log('✅ Axios mock restored');
    }
  }

  /**
   * Reset all mock state
   */
  reset() {
    this.requestHistory = [];
    this.mockResponses.clear();
    this.errorScenarios.clear();
    this.retryCount.clear();
    this.requestCounts.clear();
    this.rateLimitingEnabled = false;
    this.defaultDelay = 0;
  }

  /**
   * Mock GET request handler
   */
  async mockGet(url, config = {}) {
    return this.mockRequest({ ...config, method: 'GET', url });
  }

  /**
   * Mock POST request handler
   */
  async mockPost(url, data, config = {}) {
    return this.mockRequest({ ...config, method: 'POST', url, data });
  }

  /**
   * Mock PUT request handler
   */
  async mockPut(url, data, config = {}) {
    return this.mockRequest({ ...config, method: 'PUT', url, data });
  }

  /**
   * Mock DELETE request handler
   */
  async mockDelete(url, config = {}) {
    return this.mockRequest({ ...config, method: 'DELETE', url });
  }

  /**
   * Main mock request handler
   */
  async mockRequest(config) {
    const { url, method = 'GET', headers = {}, timeout = 10000 } = config;
    
    // Log request for testing purposes
    const requestRecord = {
      url,
      method,
      headers,
      timestamp: new Date().toISOString(),
      config
    };
    this.requestHistory.push(requestRecord);

    // Check for rate limiting
    if (this.rateLimitingEnabled) {
      const domain = this.extractDomain(url);
      const count = this.requestCounts.get(domain) || 0;
      this.requestCounts.set(domain, count + 1);
      
      if (count > 5) { // Simulate rate limit after 5 requests
        const error = new Error('Too Many Requests');
        error.response = {
          status: 429,
          statusText: 'Too Many Requests',
          headers: {
            'retry-after': '60',
            'x-amzn-requestid': 'test-request-id'
          },
          data: 'Too Many Requests'
        };
        throw error;
      }
    }

    // Add simulated network delay
    if (this.defaultDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.defaultDelay));
    }

    // Check for specific error scenarios
    const errorKey = `${method}:${url}`;
    if (this.errorScenarios.has(errorKey)) {
      const errorConfig = this.errorScenarios.get(errorKey);
      const retryCount = this.retryCount.get(errorKey) || 0;
      
      if (retryCount < errorConfig.maxRetries) {
        this.retryCount.set(errorKey, retryCount + 1);
        const error = new Error(errorConfig.message);
        if (errorConfig.code) error.code = errorConfig.code;
        if (errorConfig.response) error.response = errorConfig.response;
        throw error;
      } else {
        // After max retries, allow success
        this.errorScenarios.delete(errorKey);
        this.retryCount.delete(errorKey);
      }
    }

    // Check for specific mock responses (exact URL match first)
    const responseKey = `${method}:${url}`;
    if (this.mockResponses.has(responseKey)) {
      const mockResponse = this.mockResponses.get(responseKey);
      return this.createResponse(mockResponse.data, mockResponse.status || 200, mockResponse.headers);
    }

    // Check for dynamic responses
    for (const [key, mockResponse] of this.mockResponses.entries()) {
      if (key.startsWith('DYNAMIC:') && key.includes(method.toUpperCase())) {
        const { pattern, handler, isDynamic } = mockResponse;
        if (isDynamic && pattern instanceof RegExp && pattern.test(url)) {
          try {
            const result = await handler();
            if (result.status) {
              return this.createResponse(result.data, result.status, result.headers || {});
            }
            return this.createResponse(result, 200);
          } catch (error) {
            throw error;
          }
        }
      }
      
      // Check for pattern responses
      if (key.startsWith('PATTERN:') && key.includes(method.toUpperCase())) {
        const { pattern, data, status, headers, isPattern } = mockResponse;
        if (isPattern && pattern instanceof RegExp && pattern.test(url)) {
          return this.createResponse(data, status || 200, headers || {});
        }
      }
    }

    // Handle Amazon search requests
    if (url.includes('amazon.') && url.includes('/s?k=')) {
      return this.handleAmazonSearch(url, config);
    }

    // Handle specific Amazon product pages
    if (url.includes('amazon.') && url.includes('/dp/')) {
      return this.handleAmazonProduct(url, config);
    }

    // Default successful response for any other requests
    return this.createResponse('<html><body>Mock response</body></html>', 200);
  }

  /**
   * Handle Amazon search page requests
   */
  async handleAmazonSearch(url, config) {
    const domain = this.extractDomain(url);
    const searchTerm = this.extractSearchTerm(url);
    const category = this.inferCategoryFromSearch(searchTerm);

    try {
      // Try to load a fixture first
      const htmlContent = getFixture(domain, category);
      return this.createResponse(htmlContent, 200, {
        'content-type': 'text/html; charset=UTF-8',
        'x-amzn-requestid': `test-${Date.now()}`
      });
    } catch (error) {
      // If no fixture available, generate mock HTML
      const mockHtml = this.generateMockAmazonHtml(domain, searchTerm, category);
      return this.createResponse(mockHtml, 200, {
        'content-type': 'text/html; charset=UTF-8',
        'x-amzn-requestid': `test-${Date.now()}`
      });
    }
  }

  /**
   * Handle Amazon product page requests
   */
  async handleAmazonProduct(url, config) {
    const mockProductHtml = this.generateMockProductPage(url);
    return this.createResponse(mockProductHtml, 200, {
      'content-type': 'text/html; charset=UTF-8',
      'x-amzn-requestid': `test-product-${Date.now()}`
    });
  }

  /**
   * Generate mock Amazon search results HTML
   */
  generateMockAmazonHtml(domain, searchTerm, category) {
    const products = this.mockGenerator.generateProducts(8, { domain, category });
    
    const productHtml = products.map((product, index) => `
      <div data-component-type="s-search-result" data-asin="${product.asin || `B${String(index).padStart(9, '0')}`}">
        <div class="s-product-image-container">
          <img src="${product.imageUrl}" alt="${product.title}" />
        </div>
        <div class="s-product-details">
          <h2 class="s-size-mini">
            <a href="${product.productUrl.replace(`https://www.${domain}`, '')}">
              <span>${product.title}</span>
            </a>
          </h2>
          <div class="a-price" data-a-price='{"range":false,"value":${product.price.replace(/[^0-9.]/g, '')}}'>
            <span class="a-offscreen">${product.price}</span>
            <span class="a-price-symbol">${product.price.charAt(0)}</span>
            <span class="a-price-whole">${product.price.slice(1).split('.')[0]}</span>
            <span class="a-price-fraction">${product.price.includes('.') ? product.price.split('.')[1] : '00'}</span>
          </div>
          <div class="a-row">
            <span class="a-icon-alt" aria-label="${product.rating} out of 5 stars">${product.rating} out of 5 stars</span>
          </div>
          <div class="a-row">
            <a href="#" class="a-link-normal">
              <span class="a-size-base">${product.reviews}</span>
            </a>
          </div>
        </div>
      </div>
    `).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Amazon.com : ${searchTerm}</title>
</head>
<body>
    <div id="s-results-list-atf">
      <div class="s-search-results">
        ${productHtml}
      </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate mock Amazon product page HTML
   */
  generateMockProductPage(url) {
    const asin = url.match(/\/dp\/([A-Z0-9]{10})/)?.[1] || 'B123456789';
    const product = this.mockGenerator.generateProduct();
    
    return `
<!DOCTYPE html>
<html>
<head>
    <title>${product.title} - Amazon</title>
</head>
<body>
    <div id="dp">
        <h1 id="productTitle">${product.title}</h1>
        <div id="priceblock_dealprice">${product.price}</div>
        <div class="a-icon-star" data-rating="${product.rating}">
            <span>${product.rating} out of 5 stars</span>
        </div>
        <div id="acrCustomerReviewText">${product.reviews} customer reviews</div>
        <div id="landingImage">
            <img src="${product.imageUrl}" alt="${product.title}" />
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Set a specific mock response for a URL
   */
  setMockResponse(method, url, data, status = 200, headers = {}) {
    const key = `${method.toUpperCase()}:${url}`;
    this.mockResponses.set(key, { data, status, headers });
  }

  /**
   * Configure an error scenario for a URL
   */
  setErrorScenario(method, url, error) {
    const key = `${method.toUpperCase()}:${url}`;
    this.errorScenarios.set(key, {
      message: error.message || 'Mock error',
      code: error.code,
      response: error.response,
      maxRetries: error.maxRetries || 0
    });
  }

  /**
   * Enable rate limiting simulation
   */
  enableRateLimiting() {
    this.rateLimitingEnabled = true;
  }

  /**
   * Disable rate limiting simulation
   */
  disableRateLimiting() {
    this.rateLimitingEnabled = false;
    this.requestCounts.clear();
  }

  /**
   * Set network delay simulation
   */
  setNetworkDelay(ms) {
    this.defaultDelay = ms;
  }

  /**
   * Get request history for testing
   */
  getRequestHistory() {
    return [...this.requestHistory];
  }

  /**
   * Get last request for testing
   */
  getLastRequest() {
    return this.requestHistory[this.requestHistory.length - 1];
  }

  /**
   * Create a mock response object
   */
  createResponse(data, status = 200, headers = {}) {
    return {
      data,
      status,
      statusText: this.getStatusText(status),
      headers: {
        'content-type': 'text/html; charset=UTF-8',
        ...headers
      },
      config: {},
      request: {}
    };
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url) {
    const match = url.match(/https?:\/\/(?:www\.)?([^\/]+)/);
    return match ? match[1] : 'unknown';
  }

  /**
   * Extract search term from Amazon search URL
   */
  extractSearchTerm(url) {
    const match = url.match(/[?&]k=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : 'test';
  }

  /**
   * Infer category from search term
   */
  inferCategoryFromSearch(searchTerm) {
    const term = searchTerm.toLowerCase();
    if (term.includes('phone') || term.includes('smartphone') || term.includes('iphone') || term.includes('samsung')) {
      return 'electronics';
    }
    if (term.includes('book') || term.includes('novel') || term.includes('read')) {
      return 'books';
    }
    if (term.includes('kitchen') || term.includes('home') || term.includes('appliance')) {
      return 'home';
    }
    if (term.includes('shirt') || term.includes('jeans') || term.includes('clothes') || term.includes('fashion')) {
      return 'clothing';
    }
    return 'electronics'; // default
  }

  /**
   * Set a dynamic response handler for pattern matching URLs
   */
  setDynamicResponse(method, urlPattern, responseHandler) {
    const key = `DYNAMIC:${method.toUpperCase()}:${urlPattern.toString()}`;
    this.mockResponses.set(key, {
      isDynamic: true,
      pattern: urlPattern,
      handler: responseHandler
    });
  }

  /**
   * Set mock response with pattern support
   */
  setMockResponse(method, url, data, status = 200, headers = {}) {
    // Handle regex patterns
    if (url instanceof RegExp) {
      const key = `PATTERN:${method.toUpperCase()}:${url.toString()}`;
      this.mockResponses.set(key, { data, status, headers, isPattern: true, pattern: url });
    } else {
      const key = `${method.toUpperCase()}:${url}`;
      this.mockResponses.set(key, { data, status, headers });
    }
  }

  /**
   * Get HTTP status text
   */
  getStatusText(status) {
    const statusTexts = {
      200: 'OK',
      400: 'Bad Request',
      403: 'Forbidden',
      404: 'Not Found',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      503: 'Service Unavailable'
    };
    return statusTexts[status] || 'Unknown';
  }
}

// Export singleton instance
const axiosMock = new AxiosMock();

module.exports = {
  AxiosMock,
  axiosMock
};
