# API Usage Examples

**Description:** Comprehensive examples and integration patterns for using the Amazon Product Scraper API across different programming languages and scenarios.

**Last Updated:** January 2025

---

## Table of Contents

- [Overview](#-overview)
- [Quick Start Examples](#-quick-start-examples)
- [Advanced Usage Examples](#-advanced-usage-examples)
- [Frontend Integration Examples](#-frontend-integration-examples)
- [Error Handling Examples](#-error-handling-examples)
- [Performance Optimization Examples](#-performance-optimization-examples)
- [Testing Examples](#-testing-examples)
- [Production Usage Examples](#-production-usage-examples)

---

## 📋 Overview

This guide provides practical examples of using the Amazon Product Scraper API in various programming languages and scenarios. All examples include error handling, best practices, and common integration patterns.

**Base URL**: `http://localhost:3000` (development)

---

## 🚀 Quick Start Examples

### Basic Product Search

#### JavaScript (Fetch API)

```javascript
// Simple product search
async function searchProducts(keyword) {
  try {
    const response = await fetch(`http://localhost:3000/api/scrape?keyword=${encodeURIComponent(keyword)}`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error);
    }
    
    console.log(`Found ${data.products.length} products for "${keyword}"`);
    return data.products;
  } catch (error) {
    console.error('Search failed:', error.message);
    return [];
  }
}

// Usage
const laptops = await searchProducts('laptop');
laptops.forEach(product => {
  console.log(`${product.title} - ${product.price}`);
});
```

#### Python (Requests)

```python
import requests
from typing import List, Dict, Optional

def search_products(keyword: str, domain: str = 'amazon.com', limit: int = 20) -> List[Dict]:
    """Search for Amazon products by keyword"""
    url = 'http://localhost:3000/api/scrape'
    params = {
        'keyword': keyword,
        'domain': domain,
        'limit': limit
    }
    
    try:
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        if not data['success']:
            raise Exception(data['error'])
        
        print(f"Found {len(data['products'])} products for '{keyword}'")
        return data['products']
        
    except requests.RequestException as e:
        print(f"Request failed: {e}")
        return []
    except Exception as e:
        print(f"Search failed: {e}")
        return []

# Usage
products = search_products('headphones', limit=10)
for product in products:
    print(f"{product['title']} - {product['price']}")
```

#### cURL

```bash
# Basic search
curl -s "http://localhost:3000/api/scrape?keyword=laptop" | jq '.'

# Search with parameters
curl -s "http://localhost:3000/api/scrape?keyword=gaming%20mouse&domain=amazon.com&limit=5" \
  | jq '.products[] | {title: .title, price: .price, rating: .rating}'
```

---

## 🔧 Advanced Usage Examples

### Complete Integration Class (JavaScript)

```javascript
class AmazonScraper {
  constructor(baseUrl = 'http://localhost:3000', options = {}) {
    this.baseUrl = baseUrl;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }
  
  async makeRequest(endpoint, params = {}, retryCount = 0) {
    const url = new URL(endpoint, this.baseUrl);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const response = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AmazonScraper-Client/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data;
      
    } catch (error) {
      if (retryCount < this.retries && this.shouldRetry(error)) {
        console.warn(`Request failed, retrying in ${this.retryDelay}ms... (${retryCount + 1}/${this.retries})`);
        await this.delay(this.retryDelay);
        return this.makeRequest(endpoint, params, retryCount + 1);
      }
      throw error;
    }
  }
  
  shouldRetry(error) {
    return error.name === 'AbortError' || 
           error.message.includes('network') ||
           error.message.includes('timeout');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  async searchProducts(keyword, options = {}) {
    const params = {
      keyword,
      domain: options.domain || 'amazon.com',
      limit: options.limit || 20,
      page: options.page || 1
    };
    
    const data = await this.makeRequest('/api/scrape', params);
    return data.products;
  }
  
  async getHealth() {
    const data = await this.makeRequest('/api/health');
    return data;
  }
  
  async getSupportedDomains() {
    const data = await this.makeRequest('/api/domains');
    return data.domains;
  }
  
  async getSearchSuggestions(query, limit = 5) {
    const data = await this.makeRequest('/api/suggestions', { q: query, limit });
    return data.suggestions;
  }
  
  // Batch search across multiple domains
  async searchMultipleDomains(keyword, domains = ['amazon.com', 'amazon.co.uk']) {
    const promises = domains.map(domain => 
      this.searchProducts(keyword, { domain })
        .catch(error => {
          console.warn(`Search failed for ${domain}: ${error.message}`);
          return [];
        })
    );
    
    const results = await Promise.all(promises);
    
    return domains.reduce((acc, domain, index) => {
      acc[domain] = results[index];
      return acc;
    }, {});
  }
}

// Usage examples
const scraper = new AmazonScraper('http://localhost:3000', {
  timeout: 20000,
  retries: 2
});

// Basic search
const products = await scraper.searchProducts('wireless headphones');

// Multi-domain search
const multiResults = await scraper.searchMultipleDomains('laptop', [
  'amazon.com', 'amazon.co.uk', 'amazon.de'
]);

// Health check
const health = await scraper.getHealth();
console.log('API Status:', health.status);
```

### Python Integration Class

```python
import requests
import time
from typing import List, Dict, Optional, Union
from urllib.parse import urlencode

class AmazonScraperAPI:
    def __init__(self, base_url: str = 'http://localhost:3000', timeout: int = 30, retries: int = 3):
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.retries = retries
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'AmazonScraper-Python/1.0'
        })
    
    def _make_request(self, endpoint: str, params: Dict = None) -> Dict:
        """Make HTTP request with retry logic"""
        url = f"{self.base_url}{endpoint}"
        
        for attempt in range(self.retries):
            try:
                response = self.session.get(
                    url, 
                    params=params or {}, 
                    timeout=self.timeout
                )
                response.raise_for_status()
                
                data = response.json()
                if not data.get('success', False):
                    raise Exception(data.get('error', 'Unknown API error'))
                
                return data
                
            except (requests.RequestException, Exception) as e:
                if attempt == self.retries - 1:
                    raise Exception(f"Request failed after {self.retries} attempts: {e}")
                
                print(f"Attempt {attempt + 1} failed: {e}. Retrying...")
                time.sleep(2 ** attempt)  # Exponential backoff
        
        raise Exception("Max retries exceeded")
    
    def search_products(self, 
                       keyword: str, 
                       domain: str = 'amazon.com', 
                       limit: int = 20,
                       page: int = 1) -> List[Dict]:
        """Search for products by keyword"""
        params = {
            'keyword': keyword,
            'domain': domain,
            'limit': limit,
            'page': page
        }
        
        data = self._make_request('/api/scrape', params)
        return data.get('products', [])
    
    def get_health(self) -> Dict:
        """Get API health status"""
        return self._make_request('/api/health')
    
    def get_supported_domains(self) -> Dict:
        """Get list of supported Amazon domains"""
        data = self._make_request('/api/domains')
        return data.get('domains', {})
    
    def get_search_suggestions(self, query: str, limit: int = 5) -> List[str]:
        """Get search suggestions for partial query"""
        params = {'q': query, 'limit': limit}
        data = self._make_request('/api/suggestions', params)
        return data.get('suggestions', [])
    
    def search_with_pagination(self, 
                              keyword: str, 
                              domain: str = 'amazon.com',
                              max_pages: int = 3,
                              per_page: int = 20) -> List[Dict]:
        """Search products with pagination support"""
        all_products = []
        
        for page in range(1, max_pages + 1):
            try:
                products = self.search_products(
                    keyword=keyword,
                    domain=domain,
                    limit=per_page,
                    page=page
                )
                
                if not products:
                    break
                
                all_products.extend(products)
                print(f"Retrieved {len(products)} products from page {page}")
                
                # Rate limiting - be respectful
                time.sleep(1)
                
            except Exception as e:
                print(f"Failed to fetch page {page}: {e}")
                break
        
        return all_products
    
    def compare_prices_across_domains(self, 
                                    keyword: str, 
                                    domains: List[str] = None) -> Dict[str, List[Dict]]:
        """Compare prices across multiple Amazon domains"""
        if domains is None:
            domains = ['amazon.com', 'amazon.co.uk', 'amazon.de']
        
        results = {}
        
        for domain in domains:
            try:
                products = self.search_products(keyword, domain, limit=10)
                results[domain] = products
                print(f"Found {len(products)} products on {domain}")
                
                # Rate limiting between domains
                time.sleep(2)
                
            except Exception as e:
                print(f"Failed to search {domain}: {e}")
                results[domain] = []
        
        return results

# Usage examples
if __name__ == "__main__":
    # Initialize the API client
    api = AmazonScraperAPI(timeout=20, retries=2)
    
    # Basic search
    products = api.search_products('wireless mouse', limit=5)
    print(f"Found {len(products)} products")
    
    # Display results
    for i, product in enumerate(products[:3], 1):
        print(f"{i}. {product['title']}")
        print(f"   Price: {product['price']}")
        print(f"   Rating: {product['rating']} ({product['reviews']} reviews)")
        print(f"   URL: {product['productUrl']}")
        print()
    
    # Check API health
    health = api.get_health()
    print(f"API Status: {health['status']}")
    
    # Get search suggestions
    suggestions = api.get_search_suggestions('lapt')
    print(f"Suggestions for 'lapt': {suggestions}")
    
    # Compare prices across domains
    comparison = api.compare_prices_across_domains('laptop', ['amazon.com', 'amazon.co.uk'])
    for domain, products in comparison.items():
        print(f"{domain}: {len(products)} products")
```

---

## 🌐 Frontend Integration Examples

### React Component

```jsx
import React, { useState, useEffect } from 'react';

const ProductSearch = () => {
  const [keyword, setKeyword] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Debounced search suggestions
  useEffect(() => {
    if (keyword.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(keyword)}&limit=5`);
        const data = await response.json();
        
        if (data.success) {
          setSuggestions(data.suggestions);
        }
      } catch (err) {
        console.warn('Failed to fetch suggestions:', err);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [keyword]);

  const handleSearch = async (searchKeyword = keyword) => {
    if (!searchKeyword.trim()) return;

    setLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const response = await fetch(`/api/scrape?keyword=${encodeURIComponent(searchKeyword)}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setProducts(data.products);
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setKeyword(suggestion);
    setSuggestions([]);
    handleSearch(suggestion);
  };

  return (
    <div className="product-search">
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter search keyword..."
            className="search-input"
          />
          
          {suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="suggestion-item"
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <button 
          onClick={() => handleSearch()}
          disabled={loading || !keyword.trim()}
          className="search-button"
        >
          {loading ? 'Searching...' : 'Search Products'}
        </button>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {loading && (
        <div className="loading-indicator">
          Loading products...
        </div>
      )}

      <div className="products-grid">
        {products.map((product, index) => (
          <ProductCard key={index} product={product} />
        ))}
      </div>
    </div>
  );
};

const ProductCard = ({ product }) => (
  <div className="product-card">
    <img 
      src={product.imageUrl} 
      alt={product.title}
      className="product-image"
      loading="lazy"
    />
    <div className="product-info">
      <h3 className="product-title">{product.title}</h3>
      <div className="product-price">
        {product.price}
        {product.originalPrice && product.originalPrice !== product.price && (
          <span className="original-price">{product.originalPrice}</span>
        )}
        {product.discount && (
          <span className="discount">({product.discount} off)</span>
        )}
      </div>
      <div className="product-rating">
        ⭐ {product.rating} ({product.reviews} reviews)
      </div>
      {product.prime && (
        <div className="prime-badge">Prime</div>
      )}
      <a 
        href={product.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="view-product-button"
      >
        View on Amazon
      </a>
    </div>
  </div>
);

export default ProductSearch;
```

### Vue.js Component

```vue
<template>
  <div class="product-search">
    <div class="search-container">
      <input
        v-model="keyword"
        @keyup.enter="searchProducts"
        @input="handleInput"
        type="text"
        placeholder="Enter search keyword..."
        class="search-input"
      />
      
      <div v-if="suggestions.length > 0" class="suggestions">
        <div
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="selectSuggestion(suggestion)"
          class="suggestion"
        >
          {{ suggestion }}
        </div>
      </div>
      
      <button
        @click="searchProducts"
        :disabled="loading || !keyword.trim()"
        class="search-button"
      >
        {{ loading ? 'Searching...' : 'Search Products' }}
      </button>
    </div>

    <div v-if="error" class="error">
      {{ error }}
    </div>

    <div v-if="loading" class="loading">
      Loading products...
    </div>

    <div v-if="products.length > 0" class="products-grid">
      <div
        v-for="product in products"
        :key="product.id"
        class="product-card"
      >
        <img :src="product.imageUrl" :alt="product.title" />
        <div class="product-info">
          <h3>{{ product.title }}</h3>
          <div class="price">{{ product.price }}</div>
          <div class="rating">⭐ {{ product.rating }} ({{ product.reviews }})</div>
          <a
            :href="product.productUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Amazon
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductSearch',
  data() {
    return {
      keyword: '',
      products: [],
      suggestions: [],
      loading: false,
      error: null,
      suggestionTimer: null
    };
  },
  methods: {
    async searchProducts() {
      if (!this.keyword.trim()) return;

      this.loading = true;
      this.error = null;
      this.suggestions = [];

      try {
        const response = await fetch(`/api/scrape?keyword=${encodeURIComponent(this.keyword)}`);
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error);
        }

        this.products = data.products;
      } catch (err) {
        this.error = err.message;
        this.products = [];
      } finally {
        this.loading = false;
      }
    },

    handleInput() {
      if (this.suggestionTimer) {
        clearTimeout(this.suggestionTimer);
      }

      if (this.keyword.length < 2) {
        this.suggestions = [];
        return;
      }

      this.suggestionTimer = setTimeout(() => {
        this.fetchSuggestions();
      }, 300);
    },

    async fetchSuggestions() {
      try {
        const response = await fetch(`/api/suggestions?q=${encodeURIComponent(this.keyword)}&limit=5`);
        const data = await response.json();

        if (data.success) {
          this.suggestions = data.suggestions;
        }
      } catch (err) {
        console.warn('Failed to fetch suggestions:', err);
      }
    },

    selectSuggestion(suggestion) {
      this.keyword = suggestion;
      this.suggestions = [];
      this.searchProducts();
    }
  }
};
</script>
```

---

## 🔄 Error Handling Examples

### Comprehensive Error Handling (JavaScript)

```javascript
class APIError extends Error {
  constructor(message, code, status) {
    super(message);
    this.name = 'APIError';
    this.code = code;
    this.status = status;
  }
}

async function robustAPICall(endpoint, params = {}) {
  const maxRetries = 3;
  const baseDelay = 1000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const url = new URL(endpoint, 'http://localhost:3000');
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
      
      const response = await fetch(url.toString(), {
        timeout: 15000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Amazon-Scraper-Client/1.0'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new APIError(
          errorData.error || `HTTP ${response.status}`,
          errorData.code || 'HTTP_ERROR',
          response.status
        );
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new APIError(
          data.error || 'API request failed',
          data.code || 'API_ERROR',
          response.status
        );
      }
      
      return data;
      
    } catch (error) {
      console.warn(`Attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff for retryable errors
      if (shouldRetry(error)) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}

function shouldRetry(error) {
  if (error instanceof APIError) {
    // Retry on server errors and rate limiting
    return error.status >= 500 || error.status === 429;
  }
  
  // Retry on network errors
  return error.name === 'TypeError' && error.message.includes('fetch');
}

// Usage with comprehensive error handling
async function searchWithErrorHandling(keyword) {
  try {
    const data = await robustAPICall('/api/scrape', { keyword });
    return data.products;
  } catch (error) {
    if (error instanceof APIError) {
      switch (error.code) {
        case 'MISSING_PARAMETER':
          console.error('Invalid search: keyword is required');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          console.error('Rate limit exceeded. Please wait before making another request.');
          break;
        case 'SCRAPING_ERROR':
          console.error('Amazon scraping failed. The site might be temporarily unavailable.');
          break;
        default:
          console.error(`API Error: ${error.message}`);
      }
    } else {
      console.error('Network or unexpected error:', error.message);
    }
    
    return [];
  }
}
```

---

## 📊 Performance Optimization Examples

### Caching Implementation

```javascript
class CachedAmazonAPI {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  getCacheKey(endpoint, params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key];
        return result;
      }, {});
    
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }
  
  async get(endpoint, params = {}) {
    const cacheKey = this.getCacheKey(endpoint, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('Cache hit for:', cacheKey);
      return cached.data;
    }
    
    try {
      const url = new URL(endpoint, this.baseUrl);
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, value);
        }
      });
      
      const response = await fetch(url.toString());
      const data = await response.json();
      
      if (data.success) {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        
        console.log('Data cached for:', cacheKey);
      }
      
      return data;
    } catch (error) {
      // Return cached data if available, even if expired
      if (cached) {
        console.log('Using stale cache due to error:', error.message);
        return cached.data;
      }
      throw error;
    }
  }
  
  clearCache() {
    this.cache.clear();
  }
  
  async searchProducts(keyword, options = {}) {
    const data = await this.get('/api/scrape', {
      keyword,
      ...options
    });
    return data.products;
  }
}

// Usage
const api = new CachedAmazonAPI();

// First call - hits the API
const products1 = await api.searchProducts('laptop');

// Second call within 5 minutes - uses cache
const products2 = await api.searchProducts('laptop');
```

### Batch Processing

```javascript
class BatchProcessor {
  constructor(batchSize = 5, delayMs = 2000) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
    this.api = new CachedAmazonAPI();
  }
  
  async processBatch(keywords, options = {}) {
    const results = [];
    
    for (let i = 0; i < keywords.length; i += this.batchSize) {
      const batch = keywords.slice(i, i + this.batchSize);
      
      console.log(`Processing batch ${Math.floor(i / this.batchSize) + 1}: ${batch.join(', ')}`);
      
      const batchPromises = batch.map(async keyword => {
        try {
          const products = await this.api.searchProducts(keyword, options);
          return { keyword, products, success: true };
        } catch (error) {
          console.error(`Failed to search for "${keyword}":`, error.message);
          return { keyword, products: [], success: false, error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting between batches
      if (i + this.batchSize < keywords.length) {
        console.log(`Waiting ${this.delayMs}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.delayMs));
      }
    }
    
    return results;
  }
  
  generateReport(results) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const totalProducts = successful.reduce((sum, r) => sum + r.products.length, 0);
    
    console.log('\n=== Batch Processing Report ===');
    console.log(`Total searches: ${results.length}`);
    console.log(`Successful: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    console.log(`Total products found: ${totalProducts}`);
    
    if (failed.length > 0) {
      console.log('\nFailed searches:');
      failed.forEach(f => console.log(`- ${f.keyword}: ${f.error}`));
    }
    
    return {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      totalProducts
    };
  }
}

// Usage
const processor = new BatchProcessor(3, 1500); // 3 requests per batch, 1.5s delay

const keywords = [
  'laptop', 'gaming mouse', 'mechanical keyboard', 
  'webcam', 'headphones', 'monitor', 'smartphone'
];

const results = await processor.processBatch(keywords, {
  domain: 'amazon.com',
  limit: 10
});

processor.generateReport(results);
```

---

## 🧪 Testing Examples

### Unit Tests (Jest)

```javascript
const AmazonScraper = require('./amazon-scraper');

describe('AmazonScraper API', () => {
  let api;
  
  beforeAll(() => {
    api = new AmazonScraper('http://localhost:3000');
  });
  
  describe('searchProducts', () => {
    test('should return products for valid keyword', async () => {
      const products = await api.searchProducts('laptop');
      
      expect(Array.isArray(products)).toBe(true);
      expect(products.length).toBeGreaterThan(0);
      
      if (products.length > 0) {
        expect(products[0]).toHaveProperty('title');
        expect(products[0]).toHaveProperty('price');
        expect(products[0]).toHaveProperty('productUrl');
      }
    }, 30000);
    
    test('should handle invalid keywords gracefully', async () => {
      await expect(api.searchProducts('')).rejects.toThrow('Missing required parameter');
    });
    
    test('should respect domain parameter', async () => {
      const products = await api.searchProducts('laptop', { domain: 'amazon.co.uk' });
      expect(Array.isArray(products)).toBe(true);
    });
  });
  
  describe('getHealth', () => {
    test('should return health status', async () => {
      const health = await api.getHealth();
      
      expect(health).toHaveProperty('status');
      expect(['OK', 'ERROR']).toContain(health.status);
    });
  });
});
```

### Integration Tests (Python)

```python
import unittest
import asyncio
from amazon_scraper_api import AmazonScraperAPI

class TestAmazonScraperAPI(unittest.TestCase):
    def setUp(self):
        self.api = AmazonScraperAPI('http://localhost:3000')
    
    def test_search_products_success(self):
        """Test successful product search"""
        products = self.api.search_products('laptop', limit=5)
        
        self.assertIsInstance(products, list)
        if products:
            product = products[0]
            self.assertIn('title', product)
            self.assertIn('price', product)
            self.assertIn('productUrl', product)
    
    def test_search_products_empty_keyword(self):
        """Test search with empty keyword"""
        with self.assertRaises(Exception):
            self.api.search_products('')
    
    def test_health_check(self):
        """Test health endpoint"""
        health = self.api.get_health()
        
        self.assertIn('status', health)
        self.assertIn(health['status'], ['OK', 'ERROR'])
    
    def test_supported_domains(self):
        """Test supported domains endpoint"""
        domains = self.api.get_supported_domains()
        
        self.assertIsInstance(domains, dict)
        self.assertIn('amazon.com', domains)
    
    def test_search_suggestions(self):
        """Test search suggestions"""
        suggestions = self.api.get_search_suggestions('lapt', limit=3)
        
        self.assertIsInstance(suggestions, list)
        self.assertLessEqual(len(suggestions), 3)

if __name__ == '__main__':
    unittest.main()
```

---

## 🚀 Production Usage Examples

### Express.js Middleware

```javascript
const express = require('express');
const AmazonScraper = require('./amazon-scraper');

const app = express();
const scraper = new AmazonScraper();

// Rate limiting middleware
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use(limiter);
app.use(express.json());

// Product search endpoint with caching
app.get('/api/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const { domain = 'amazon.com', limit = 20 } = req.query;
    
    const cacheKey = `search:${keyword}:${domain}:${limit}`;
    
    // Check cache first (Redis recommended for production)
    let products = await getFromCache(cacheKey);
    
    if (!products) {
      products = await scraper.searchProducts(keyword, { domain, limit });
      await setCache(cacheKey, products, 300); // Cache for 5 minutes
    }
    
    res.json({
      success: true,
      keyword,
      domain,
      products,
      cached: !!products
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check with detailed metrics
app.get('/api/health', async (req, res) => {
  try {
    const health = await scraper.getHealth();
    
    res.json({
      ...health,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.listen(3001, () => {
  console.log('Amazon Scraper Proxy API running on port 3001');
});
```

---

---

## 🔗 Related Documentation

- **Previous:** [API Endpoints](endpoints.md)
- **Next:** [Deployment Guide](../guides/deployment.md)
- **Related:** [Testing Overview](../testing/testing-overview.md) | [Architecture Overview](../development/architecture-overview.md)

---

*This completes the comprehensive API usage examples. For more advanced deployment scenarios, see the [Deployment Guide](../guides/deployment.md). For API endpoint reference, see [Endpoints Documentation](endpoints.md).*
