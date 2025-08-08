/**
 * JSDOM Mock - Comprehensive HTML Parsing Mocking for Amazon Scraper Tests
 * Provides controlled DOM parsing scenarios, error handling, and performance testing
 */

const { MockDataGenerator } = require('../utils/mockDataGenerator.js');

class JSDoMMock {
  constructor() {
    this.originalJSDOM = null;
    this.mockDOMs = new Map();
    this.parseHistory = [];
    this.errorScenarios = new Map();
    this.performanceDelay = 0;
    this.memoryUsageTracking = false;
    this.mockGenerator = new MockDataGenerator();
  }

  /**
   * Install JSDOM mock - replaces JSDOM with our mock implementation
   */
  install() {
    const jsdom = require('jsdom');
    this.originalJSDOM = jsdom.JSDOM;
    
    // Create mock JSDOM class
    const self = this;
    jsdom.JSDOM = class MockJSDOM {
      constructor(html = '', options = {}) {
        // We need to return an object directly rather than calling a method
        // that returns the object (to avoid Promise issues with Bun)
        const htmlHash = self.hashString(html);
        
        // Log parsing attempt
        const parseRecord = {
          html: html.substring(0, 200) + (html.length > 200 ? '...' : ''),
          htmlLength: html.length,
          options,
          timestamp: new Date().toISOString()
        };
        self.parseHistory.push(parseRecord);
        
        // Add performance delay if configured
        if (self.performanceDelay > 0) {
          const start = Date.now();
          while (Date.now() - start < self.performanceDelay) {
            // Busy wait to simulate parsing delay
          }
        }
        
        // Check for error scenarios
        if (self.errorScenarios.has(htmlHash)) {
          const errorConfig = self.errorScenarios.get(htmlHash);
          const error = new Error(errorConfig.message || 'Mock parsing error');
          if (errorConfig.code) error.code = errorConfig.code;
          if (errorConfig.name) error.name = errorConfig.name;
          throw error;
        }
        
        // Check if we have a pre-configured mock DOM for this HTML
        if (self.mockDOMs.has(htmlHash)) {
          return self.mockDOMs.get(htmlHash);
        }
        
        // Create mock window and document
        const mockDOM = self.createMockWindow(html, options);
        
        // Cache the mock DOM
        self.mockDOMs.set(htmlHash, mockDOM);
        
        return mockDOM;
      }
    };
    
    console.log('✅ JSDOM mock installed');
  }

  /**
   * Restore original JSDOM functionality
   */
  restore() {
    if (this.originalJSDOM) {
      const jsdom = require('jsdom');
      jsdom.JSDOM = this.originalJSDOM;
      this.originalJSDOM = null;
      console.log('✅ JSDOM mock restored');
    }
  }

  /**
   * Reset all mock state
   */
  reset() {
    this.mockDOMs.clear();
    this.parseHistory = [];
    this.errorScenarios.clear();
    this.performanceDelay = 0;
    this.memoryUsageTracking = false;
  }

  /**
   * Create a mock DOM instance - this is now handled directly in the MockJSDOM constructor
   * @deprecated Use the JSDOM constructor directly
   */
  createMockDOM(html, options = {}) {
    const htmlHash = this.hashString(html);
    
    // Log parsing
    const parseRecord = {
      html: html.substring(0, 200) + (html.length > 200 ? '...' : ''),
      htmlLength: html.length,
      options,
      timestamp: new Date().toISOString()
    };
    this.parseHistory.push(parseRecord);
    
    // Create and return the mock
    const mockDOM = this.createMockWindow(html, options);
    this.mockDOMs.set(htmlHash, mockDOM);
    return mockDOM;
  }

  /**
   * Create a mock window object with document
   */
  createMockWindow(html, options = {}) {
    const url = options.url || 'https://www.amazon.com';
    const document = this.createMockDocument(html);
    
    const window = {
      document,
      location: new URL(url),
      navigator: {
        userAgent: 'Mozilla/5.0 (Test Environment)'
      },
      console: global.console,
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      setInterval: global.setInterval,
      clearInterval: global.clearInterval
    };

    // Add window reference to document
    document.defaultView = window;
    document.ownerDocument = document;

    return { window };
  }

  /**
   * Create a mock document with Amazon-specific elements and methods
   */
  createMockDocument(html) {
    const elements = this.parseHTML(html);
    
    const document = {
      documentElement: elements.html || this.createElement('html'),
      body: elements.body || this.createElement('body'),
      head: elements.head || this.createElement('head'),
      
      // Core DOM methods
      createElement: this.createElement.bind(this),
      createTextNode: this.createTextNode.bind(this),
      getElementById: (id) => this.getElementById(elements, id),
      getElementsByClassName: (className) => this.getElementsByClassName(elements, className),
      getElementsByTagName: (tagName) => this.getElementsByTagName(elements, tagName),
      querySelector: (selector) => this.querySelector(elements, selector),
      querySelectorAll: (selector) => this.querySelectorAll(elements, selector),
      
      // Properties
      title: this.extractTitle(html),
      URL: 'https://www.amazon.com',
      documentURI: 'https://www.amazon.com',
      
      // Amazon-specific helpers
      _elements: elements,
      _originalHTML: html
    };

    return document;
  }

  /**
   * Parse HTML and extract elements (simplified parser for testing)
   */
  parseHTML(html) {
    const elements = {
      all: [],
      byId: new Map(),
      byClass: new Map(),
      byTag: new Map(),
      searchResults: []
    };

    // Extract Amazon search results
    const searchResultPattern = /<div[^>]*data-component-type="s-search-result"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let resultIndex = 0;

    while ((match = searchResultPattern.exec(html)) !== null) {
      const resultHtml = match[0];
      const resultElement = this.createSearchResultElement(resultHtml, resultIndex);
      elements.searchResults.push(resultElement);
      elements.all.push(resultElement);
      resultIndex++;
    }

    // Extract other common elements
    this.extractCommonElements(html, elements);

    return elements;
  }

  /**
   * Create a search result element from HTML
   */
  createSearchResultElement(html, index) {
    const element = this.createElement('div');
    element.setAttribute('data-component-type', 's-search-result');
    element.setAttribute('data-asin', this.extractASIN(html) || `B${String(index).padStart(9, '0')}`);
    element._innerHTML = html;
    element._index = index;

    // Extract and create child elements
    element.children = [];

    // Title element
    const titleMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/);
    if (titleMatch) {
      const titleElement = this.createElement('h2');
      titleElement.className = 's-size-mini';
      
      // Link inside title
      const linkMatch = titleMatch[1].match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/);
      if (linkMatch) {
        const linkElement = this.createElement('a');
        linkElement.href = linkMatch[1];
        
        // Span inside link
        const spanMatch = linkMatch[2].match(/<span[^>]*>([\s\S]*?)<\/span>/);
        if (spanMatch) {
          const spanElement = this.createElement('span');
          spanElement.textContent = this.cleanText(spanMatch[1]);
          linkElement.appendChild(spanElement);
        }
        titleElement.appendChild(linkElement);
      }
      element.appendChild(titleElement);
    }

    // Price element
    const priceMatch = html.match(/<div[^>]*class="[^"]*a-price[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    if (priceMatch) {
      const priceElement = this.createElement('div');
      priceElement.className = 'a-price';
      
      const offscreenMatch = priceMatch[1].match(/<span[^>]*class="[^"]*a-offscreen[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      if (offscreenMatch) {
        const offscreenElement = this.createElement('span');
        offscreenElement.className = 'a-offscreen';
        offscreenElement.textContent = this.cleanText(offscreenMatch[1]);
        priceElement.appendChild(offscreenElement);
      }
      element.appendChild(priceElement);
    }

    // Rating element
    const ratingMatch = html.match(/<span[^>]*class="[^"]*a-icon-alt[^"]*"[^>]*[^>]*aria-label="([^"]*)"[^>]*>/);
    if (ratingMatch) {
      const ratingElement = this.createElement('span');
      ratingElement.className = 'a-icon-alt';
      ratingElement.setAttribute('aria-label', ratingMatch[1]);
      ratingElement.textContent = ratingMatch[1];
      element.appendChild(ratingElement);
    }

    // Reviews element
    const reviewsMatch = html.match(/<span[^>]*class="[^"]*a-size-base[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    if (reviewsMatch) {
      const reviewsElement = this.createElement('span');
      reviewsElement.className = 'a-size-base';
      reviewsElement.textContent = this.cleanText(reviewsMatch[1]);
      element.appendChild(reviewsElement);
    }

    // Image element
    const imageMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/);
    if (imageMatch) {
      const imageElement = this.createElement('img');
      imageElement.src = imageMatch[1];
      imageElement.alt = imageMatch[2];
      element.appendChild(imageElement);
    }

    return element;
  }

  /**
   * Create a mock DOM element
   */
  createElement(tagName) {
    const element = {
      tagName: tagName.toUpperCase(),
      nodeName: tagName.toUpperCase(),
      nodeType: 1, // ELEMENT_NODE
      children: [],
      attributes: new Map(),
      className: '',
      id: '',
      textContent: '',
      innerHTML: '',
      
      // Methods
      appendChild: function(child) {
        this.children.push(child);
        child.parentNode = this;
        return child;
      },
      
      removeChild: function(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
          this.children.splice(index, 1);
          child.parentNode = null;
        }
        return child;
      },
      
      getAttribute: function(name) {
        return this.attributes.get(name) || null;
      },
      
      setAttribute: function(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'class') this.className = String(value);
        if (name === 'id') this.id = String(value);
      },
      
      hasAttribute: function(name) {
        return this.attributes.has(name);
      },
      
      querySelector: (selector) => this.querySelector({ all: [element] }, selector),
      querySelectorAll: (selector) => this.querySelectorAll({ all: [element] }, selector)
    };

    return element;
  }

  /**
   * Create a text node
   */
  createTextNode(text) {
    return {
      nodeType: 3, // TEXT_NODE
      textContent: text,
      nodeValue: text
    };
  }

  /**
   * Query selector implementation
   */
  querySelector(elements, selector) {
    const results = this.querySelectorAll(elements, selector);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Query selector all implementation (simplified)
   */
  querySelectorAll(elements, selector) {
    const results = [];
    
    // Handle Amazon-specific selectors
    if (selector === '[data-component-type="s-search-result"]') {
      return elements.searchResults || [];
    }
    
    if (selector.includes('h2 a[href]')) {
      elements.searchResults?.forEach(result => {
        const h2 = result.children.find(child => child.tagName === 'H2');
        if (h2) {
          const link = h2.children.find(child => child.tagName === 'A' && child.href);
          if (link) results.push(link);
        }
      });
    }
    
    if (selector.includes('.a-price .a-offscreen')) {
      elements.searchResults?.forEach(result => {
        result.children.forEach(child => {
          if (child.className.includes('a-price')) {
            const offscreen = child.children.find(c => c.className.includes('a-offscreen'));
            if (offscreen) results.push(offscreen);
          }
        });
      });
    }
    
    if (selector.includes('.a-icon-alt')) {
      elements.searchResults?.forEach(result => {
        const rating = result.children.find(child => child.className.includes('a-icon-alt'));
        if (rating) results.push(rating);
      });
    }

    if (selector.includes('.a-size-base')) {
      elements.searchResults?.forEach(result => {
        const reviews = result.children.find(child => child.className.includes('a-size-base'));
        if (reviews) results.push(reviews);
      });
    }

    if (selector === 'img') {
      elements.searchResults?.forEach(result => {
        const img = result.children.find(child => child.tagName === 'IMG');
        if (img) results.push(img);
      });
    }

    return results;
  }

  /**
   * Get element by ID
   */
  getElementById(elements, id) {
    return elements.byId.get(id) || null;
  }

  /**
   * Get elements by class name
   */
  getElementsByClassName(elements, className) {
    return elements.byClass.get(className) || [];
  }

  /**
   * Get elements by tag name
   */
  getElementsByTagName(elements, tagName) {
    return elements.byTag.get(tagName.toLowerCase()) || [];
  }

  /**
   * Extract common elements from HTML
   */
  extractCommonElements(html, elements) {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch) {
      elements.title = this.cleanText(titleMatch[1]);
    }

    // Extract body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      elements.body = this.createElement('body');
      elements.body._innerHTML = bodyMatch[1];
    }
  }

  /**
   * Extract ASIN from HTML
   */
  extractASIN(html) {
    const asinMatch = html.match(/data-asin="([^"]+)"/);
    return asinMatch ? asinMatch[1] : null;
  }

  /**
   * Extract title from HTML
   */
  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    return titleMatch ? this.cleanText(titleMatch[1]) : '';
  }

  /**
   * Clean text content (remove HTML tags, decode entities)
   */
  cleanText(text) {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Set a specific mock DOM for HTML content
   */
  setMockDOM(html, mockDOM) {
    const htmlHash = this.hashString(html);
    this.mockDOMs.set(htmlHash, mockDOM);
  }

  /**
   * Set an error scenario for specific HTML content
   */
  setErrorScenario(html, error) {
    const htmlHash = this.hashString(html);
    this.errorScenarios.set(htmlHash, {
      message: error.message || 'Mock parsing error',
      code: error.code,
      name: error.name || 'ParseError'
    });
  }

  /**
   * Set performance delay for DOM parsing
   */
  setPerformanceDelay(ms) {
    this.performanceDelay = ms;
  }

  /**
   * Enable memory usage tracking
   */
  enableMemoryTracking() {
    this.memoryUsageTracking = true;
  }

  /**
   * Get parsing history for testing
   */
  getParseHistory() {
    return [...this.parseHistory];
  }

  /**
   * Get last parse operation
   */
  getLastParse() {
    return this.parseHistory[this.parseHistory.length - 1];
  }

  /**
   * Simple string hash function for caching
   */
  hashString(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  /**
   * Create a mock DOM with specific Amazon elements
   */
  createAmazonMockDOM(searchResults = []) {
    const html = this.generateAmazonHTML(searchResults);
    const { JSDOM } = require('jsdom');
    return new JSDOM(html); // This will use our mocked JSDOM constructor
  }

  /**
   * Generate Amazon-like HTML structure
   */
  generateAmazonHTML(searchResults = []) {
    if (searchResults.length === 0) {
      searchResults = this.mockGenerator.generateProducts(5);
    }

    const resultsHtml = searchResults.map((product, index) => `
      <div data-component-type="s-search-result" data-asin="${product.asin || `B${String(index).padStart(9, '0')}`}">
        <h2 class="s-size-mini">
          <a href="${product.productUrl}">
            <span>${product.title}</span>
          </a>
        </h2>
        <div class="a-price">
          <span class="a-offscreen">${product.price}</span>
        </div>
        <span class="a-icon-alt" aria-label="${product.rating} out of 5 stars">${product.rating} out of 5 stars</span>
        <span class="a-size-base">${product.reviews}</span>
        <img src="${product.imageUrl}" alt="${product.title}" />
      </div>
    `).join('\n');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Amazon.com</title>
</head>
<body>
    <div id="s-results-list-atf">
        <div class="s-search-results">
            ${resultsHtml}
        </div>
    </div>
</body>
</html>`;
  }
}

// Export singleton instance
const jsdomMock = new JSDoMMock();

module.exports = {
  JSDoMMock,
  jsdomMock
};
