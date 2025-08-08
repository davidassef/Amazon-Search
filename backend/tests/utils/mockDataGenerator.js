/**
 * Mock Data Generator for Amazon Scraper Tests
 * Generates realistic test data for products, domains, and search scenarios
 */

// Sample product data for different categories
const PRODUCT_CATEGORIES = {
  electronics: {
    keywords: ['smartphone', 'laptop', 'tablet', 'headphones', 'camera', 'smartwatch'],
    brands: ['Apple', 'Samsung', 'Google', 'Sony', 'Dell', 'HP', 'Lenovo', 'Microsoft'],
    priceRange: [50, 2000],
    titles: [
      'iPhone 15 Pro Max (256GB)',
      'Samsung Galaxy S24 Ultra',
      'MacBook Air M2 (512GB)',
      'Dell XPS 13 Plus',
      'Sony WH-1000XM5 Headphones',
      'iPad Pro 12.9-inch',
      'Surface Pro 9',
      'Google Pixel 8 Pro'
    ]
  },
  
  books: {
    keywords: ['fiction', 'mystery', 'romance', 'science fiction', 'biography', 'cookbook'],
    authors: ['Stephen King', 'J.K. Rowling', 'Agatha Christie', 'Dan Brown', 'Malcolm Gladwell'],
    priceRange: [5, 35],
    titles: [
      'The Seven Husbands of Evelyn Hugo',
      'Where the Crawdads Sing',
      'The Thursday Murder Club',
      'Atomic Habits',
      'The Silent Patient',
      'Educated: A Memoir',
      'The Midnight Library',
      'Project Hail Mary'
    ]
  },
  
  home: {
    keywords: ['kitchen', 'furniture', 'decor', 'appliances', 'bedding', 'storage'],
    brands: ['KitchenAid', 'Instant Pot', 'Ninja', 'Hamilton Beach', 'Cuisinart', 'Breville'],
    priceRange: [15, 500],
    titles: [
      'Instant Pot Pro 10-in-1 Pressure Cooker',
      'KitchenAid Stand Mixer',
      'Ninja Foodi Air Fryer',
      'Bamboo Cutting Board Set',
      'Memory Foam Mattress Topper',
      'Storage Ottoman Bench',
      'LED Desk Lamp with USB',
      'Essential Oil Diffuser'
    ]
  },
  
  clothing: {
    keywords: ['t-shirt', 'jeans', 'dress', 'jacket', 'sneakers', 'boots'],
    brands: ['Nike', 'Adidas', 'Levi\'s', 'Calvin Klein', 'Under Armour', 'Puma'],
    priceRange: [10, 200],
    titles: [
      'Men\'s Classic Fit Polo Shirt',
      'Women\'s High-Waisted Jeans',
      'Unisex Running Sneakers',
      'Waterproof Rain Jacket',
      'Comfortable Cotton T-Shirt',
      'Leather Ankle Boots',
      'Yoga Leggings',
      'Casual Button-Down Shirt'
    ]
  }
};

// Domain-specific data
const DOMAIN_DATA = {
  'amazon.com': {
    currency: 'USD',
    currencySymbol: '$',
    language: 'en-US',
    reviewFormat: '#,###',
    dateFormat: 'MM/DD/YYYY'
  },
  'amazon.co.uk': {
    currency: 'GBP',
    currencySymbol: '£',
    language: 'en-GB',
    reviewFormat: '#,###',
    dateFormat: 'DD/MM/YYYY'
  },
  'amazon.de': {
    currency: 'EUR',
    currencySymbol: '€',
    language: 'de-DE',
    reviewFormat: '#.###',
    dateFormat: 'DD.MM.YYYY'
  },
  'amazon.fr': {
    currency: 'EUR',
    currencySymbol: '€',
    language: 'fr-FR',
    reviewFormat: '# ###',
    dateFormat: 'DD/MM/YYYY'
  },
  'amazon.ca': {
    currency: 'CAD',
    currencySymbol: 'C$',
    language: 'en-CA',
    reviewFormat: '#,###',
    dateFormat: 'DD/MM/YYYY'
  }
};

class MockDataGenerator {
  constructor() {
    this.usedAsins = new Set();
    this.seedValue = 12345; // For consistent randomness in tests
  }

  /**
   * Generate a consistent pseudo-random number (for testing reproducibility)
   * @param {number} seed - Optional seed value
   * @returns {number} Pseudo-random number between 0 and 1
   */
  seededRandom(seed = this.seedValue) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Generate a unique Amazon ASIN
   * @returns {string} ASIN (Amazon Standard Identification Number)
   */
  generateASIN() {
    let asin;
    do {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      asin = 'B';
      for (let i = 0; i < 9; i++) {
        const randomIndex = Math.floor(this.seededRandom(this.seedValue++) * chars.length);
        asin += chars[randomIndex];
      }
    } while (this.usedAsins.has(asin));
    
    this.usedAsins.add(asin);
    return asin;
  }

  /**
   * Generate a random price for a given domain and category
   * @param {string} domain - Amazon domain
   * @param {string} category - Product category
   * @returns {string} Formatted price string
   */
  generatePrice(domain = 'amazon.com', category = 'electronics') {
    const domainInfo = DOMAIN_DATA[domain] || DOMAIN_DATA['amazon.com'];
    const categoryInfo = PRODUCT_CATEGORIES[category] || PRODUCT_CATEGORIES.electronics;
    
    const [minPrice, maxPrice] = categoryInfo.priceRange;
    const randomPrice = minPrice + (this.seededRandom(this.seedValue++) * (maxPrice - minPrice));
    const price = Math.round(randomPrice * 100) / 100; // Round to 2 decimal places
    
    // Format price based on domain
    if (domain === 'amazon.de' || domain === 'amazon.fr') {
      return `${price.toFixed(2).replace('.', ',')} ${domainInfo.currencySymbol}`;
    } else {
      return `${domainInfo.currencySymbol}${price.toFixed(2)}`;
    }
  }

  /**
   * Generate a random rating
   * @returns {string} Rating as string (e.g., "4.3")
   */
  generateRating() {
    const rating = 3.0 + (this.seededRandom(this.seedValue++) * 2.0); // 3.0 to 5.0
    return (Math.round(rating * 10) / 10).toFixed(1);
  }

  /**
   * Generate a random number of reviews
   * @param {string} domain - Amazon domain (affects format)
   * @returns {string} Formatted review count
   */
  generateReviewCount(domain = 'amazon.com') {
    const domainInfo = DOMAIN_DATA[domain] || DOMAIN_DATA['amazon.com'];
    const count = Math.floor(10 + (this.seededRandom(this.seedValue++) * 10000));
    
    // Format based on domain locale
    if (domain === 'amazon.de') {
      return count.toLocaleString('de-DE');
    } else if (domain === 'amazon.fr') {
      return count.toLocaleString('fr-FR');
    } else {
      return count.toLocaleString('en-US');
    }
  }

  /**
   * Generate a product title
   * @param {string} category - Product category
   * @param {Object} options - Additional options
   * @returns {string} Product title
   */
  generateProductTitle(category = 'electronics', options = {}) {
    const categoryInfo = PRODUCT_CATEGORIES[category] || PRODUCT_CATEGORIES.electronics;
    const titles = categoryInfo.titles;
    const brands = categoryInfo.brands || [];
    
    let title;
    if (options.useTemplate) {
      const titleIndex = Math.floor(this.seededRandom(this.seedValue++) * titles.length);
      title = titles[titleIndex];
    } else {
      // Generate custom title
      const brandIndex = Math.floor(this.seededRandom(this.seedValue++) * brands.length);
      const titleIndex = Math.floor(this.seededRandom(this.seedValue++) * titles.length);
      title = `${brands[brandIndex]} ${titles[titleIndex]}`;
    }
    
    // Add random descriptors
    const colors = ['Black', 'White', 'Silver', 'Blue', 'Red', 'Gold', 'Gray'];
    const colorIndex = Math.floor(this.seededRandom(this.seedValue++) * colors.length);
    
    if (this.seededRandom(this.seedValue++) > 0.5) {
      title += ` - ${colors[colorIndex]}`;
    }
    
    return title;
  }

  /**
   * Generate a product URL
   * @param {string} domain - Amazon domain
   * @param {string} asin - Product ASIN
   * @returns {string} Product URL
   */
  generateProductUrl(domain, asin) {
    return `https://www.${domain}/dp/${asin}`;
  }

  /**
   * Generate an image URL
   * @param {string} asin - Product ASIN
   * @returns {string} Image URL
   */
  generateImageUrl(asin) {
    const imageIds = ['61bK6PMOC3L', '71gr4dqx6CL', '61F52LwYxoL', '51EF5AoAZ9L', '61gx3LKwQDL'];
    const imageId = imageIds[Math.floor(this.seededRandom(this.seedValue++) * imageIds.length)];
    return `https://m.media-amazon.com/images/I/${imageId}._AC_UY218_.jpg`;
  }

  /**
   * Generate a complete mock product
   * @param {Object} options - Product generation options
   * @returns {Object} Mock product object
   */
  generateProduct(options = {}) {
    const {
      domain = 'amazon.com',
      category = 'electronics',
      asin = this.generateASIN()
    } = options;

    return {
      title: this.generateProductTitle(category, options),
      productUrl: this.generateProductUrl(domain, asin),
      price: this.generatePrice(domain, category),
      rating: this.generateRating(),
      reviews: this.generateReviewCount(domain),
      imageUrl: this.generateImageUrl(asin),
      asin
    };
  }

  /**
   * Generate multiple products
   * @param {number} count - Number of products to generate
   * @param {Object} options - Generation options
   * @returns {Array} Array of mock products
   */
  generateProducts(count = 5, options = {}) {
    const products = [];
    for (let i = 0; i < count; i++) {
      products.push(this.generateProduct(options));
    }
    return products;
  }

  /**
   * Generate test scenarios for different product categories
   * @returns {Object} Test scenarios object
   */
  generateTestScenarios() {
    const scenarios = {};
    
    Object.keys(PRODUCT_CATEGORIES).forEach(category => {
      const categoryInfo = PRODUCT_CATEGORIES[category];
      scenarios[category] = {
        keywords: categoryInfo.keywords,
        products: this.generateProducts(8, { category }),
        expectedProductCount: 8,
        domain: 'amazon.com'
      };
    });
    
    return scenarios;
  }

  /**
   * Generate test data for different Amazon domains
   * @returns {Object} Domain test data
   */
  generateDomainTestData() {
    const domainData = {};
    
    Object.keys(DOMAIN_DATA).forEach(domain => {
      domainData[domain] = {
        domain,
        config: DOMAIN_DATA[domain],
        products: this.generateProducts(5, { domain }),
        searchKeywords: ['test', 'product', 'item']
      };
    });
    
    return domainData;
  }

  /**
   * Generate error scenarios for testing
   * @returns {Array} Array of error scenarios
   */
  generateErrorScenarios() {
    return [
      {
        name: 'Network Timeout',
        error: { code: 'ETIMEDOUT', message: 'Request timeout' },
        shouldRetry: true
      },
      {
        name: 'Rate Limited',
        error: { response: { status: 429 }, message: 'Too many requests' },
        shouldRetry: true
      },
      {
        name: 'Server Error',
        error: { response: { status: 500 }, message: 'Internal server error' },
        shouldRetry: true
      },
      {
        name: 'Forbidden',
        error: { response: { status: 403 }, message: 'Access denied' },
        shouldRetry: false
      },
      {
        name: 'Not Found',
        error: { response: { status: 404 }, message: 'Page not found' },
        shouldRetry: false
      }
    ];
  }

  /**
   * Reset the generator (clear used ASINs, reset seed)
   */
  reset() {
    this.usedAsins.clear();
    this.seedValue = 12345;
  }

  /**
   * Set seed for reproducible results
   * @param {number} seed - Seed value
   */
  setSeed(seed) {
    this.seedValue = seed;
  }
}

// Static helper functions
const MockDataGenerator_Static = {
  /**
   * Create a basic mock product with minimal data
   * @param {Object} overrides - Fields to override
   * @returns {Object} Mock product
   */
  createBasicProduct(overrides = {}) {
    return {
      title: 'Test Product',
      productUrl: 'https://www.amazon.com/dp/B123456789',
      price: '$29.99',
      rating: '4.5',
      reviews: '1,234',
      imageUrl: 'https://m.media-amazon.com/images/I/test.jpg',
      ...overrides
    };
  },

  /**
   * Create an API response mock
   * @param {Array} products - Products array
   * @param {Object} options - Response options
   * @returns {Object} Mock API response
   */
  createApiResponse(products, options = {}) {
    return {
      success: options.success !== false,
      keyword: options.keyword || 'test',
      domain: options.domain || 'amazon.com',
      totalProducts: products.length,
      products: products.slice(0, options.limit || 20),
      ...options.additionalFields
    };
  }
};

module.exports = {
  MockDataGenerator,
  MockDataGenerator_Static,
  PRODUCT_CATEGORIES,
  DOMAIN_DATA
};
