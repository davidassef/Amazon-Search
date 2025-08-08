/**
 * Mock Responses - Pre-defined response scenarios for comprehensive testing
 * Provides mock data for various Amazon domains, product types, error conditions, and edge cases
 */

const { MockDataGenerator } = require('../utils/mockDataGenerator.js');

class MockResponseGenerator {
  constructor() {
    this.mockGenerator = new MockDataGenerator();
    this.responseCache = new Map();
  }

  /**
   * Generate mock responses for different Amazon search result structures
   */
  getAmazonSearchResponses() {
    return {
      // Standard successful search with products
      successfulSearch: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-001',
          'server': 'Server'
        },
        data: this.generateSearchResultsHTML('electronics', 'smartphone', 8)
      },

      // Search with few results
      limitedResults: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-002'
        },
        data: this.generateSearchResultsHTML('books', 'rare book', 2)
      },

      // Empty search results
      noResults: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-003'
        },
        data: this.generateNoResultsHTML('nonexistent product xyz123')
      },

      // Search results with sponsored products
      sponsoredResults: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-004'
        },
        data: this.generateSponsoredResultsHTML('clothing', 'running shoes', 6, 2)
      },

      // Search results with missing prices
      missingPrices: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-005'
        },
        data: this.generateIncompleteResultsHTML('home', 'kitchen appliances', 5, ['price'])
      },

      // Search results with missing ratings
      missingRatings: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-006'
        },
        data: this.generateIncompleteResultsHTML('electronics', 'new gadget', 4, ['rating', 'reviews'])
      },

      // Malformed HTML structure
      malformedHTML: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-007'
        },
        data: this.generateMalformedHTML()
      },

      // Large response (many products)
      largeResponse: {
        status: 200,
        headers: {
          'content-type': 'text/html; charset=UTF-8',
          'x-amzn-requestid': 'MOCK-REQUEST-ID-008'
        },
        data: this.generateSearchResultsHTML('electronics', 'popular item', 50)
      }
    };
  }

  /**
   * Generate mock error responses
   */
  getErrorResponses() {
    return {
      // Rate limiting (429)
      rateLimited: {
        status: 429,
        headers: {
          'retry-after': '60',
          'content-type': 'text/html',
          'x-amzn-requestid': 'ERROR-REQUEST-ID-001'
        },
        data: `
          <html>
            <head><title>Sorry! Something went wrong!</title></head>
            <body>
              <h1>Sorry! Something went wrong!</h1>
              <p>To discuss automated access to Amazon data please contact <a href="mailto:api-services-support@amazon.com">api-services-support@amazon.com</a>.</p>
            </body>
          </html>
        `
      },

      // Access denied (403)
      forbidden: {
        status: 403,
        headers: {
          'content-type': 'text/html',
          'x-amzn-requestid': 'ERROR-REQUEST-ID-002'
        },
        data: `
          <html>
            <head><title>Amazon.com</title></head>
            <body>
              <h1>Access Denied</h1>
              <p>You don't have permission to access this resource.</p>
            </body>
          </html>
        `
      },

      // Service unavailable (503)
      serviceUnavailable: {
        status: 503,
        headers: {
          'content-type': 'text/html',
          'retry-after': '300',
          'x-amzn-requestid': 'ERROR-REQUEST-ID-003'
        },
        data: `
          <html>
            <head><title>Amazon.com</title></head>
            <body>
              <h1>Service Temporarily Unavailable</h1>
              <p>The service is temporarily overloaded. Please try again later.</p>
            </body>
          </html>
        `
      },

      // Not found (404)
      notFound: {
        status: 404,
        headers: {
          'content-type': 'text/html',
          'x-amzn-requestid': 'ERROR-REQUEST-ID-004'
        },
        data: `
          <html>
            <head><title>Page Not Found</title></head>
            <body>
              <h1>Page Not Found</h1>
              <p>The page you requested could not be found.</p>
            </body>
          </html>
        `
      },

      // Internal server error (500)
      internalError: {
        status: 500,
        headers: {
          'content-type': 'text/html',
          'x-amzn-requestid': 'ERROR-REQUEST-ID-005'
        },
        data: `
          <html>
            <head><title>Internal Server Error</title></head>
            <body>
              <h1>Internal Server Error</h1>
              <p>An internal error occurred. Please try again later.</p>
            </body>
          </html>
        `
      }
    };
  }

  /**
   * Generate mock responses for different Amazon domains
   */
  getDomainSpecificResponses() {
    const domains = ['amazon.com', 'amazon.co.uk', 'amazon.de', 'amazon.fr', 'amazon.ca'];
    const responses = {};

    domains.forEach(domain => {
      responses[domain] = {
        electronics: {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'x-amzn-requestid': `MOCK-${domain.toUpperCase()}-001`
          },
          data: this.generateDomainSpecificHTML(domain, 'electronics', 'laptop', 6)
        },
        books: {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'x-amzn-requestid': `MOCK-${domain.toUpperCase()}-002`
          },
          data: this.generateDomainSpecificHTML(domain, 'books', 'fiction', 8)
        },
        home: {
          status: 200,
          headers: {
            'content-type': 'text/html; charset=UTF-8',
            'x-amzn-requestid': `MOCK-${domain.toUpperCase()}-003`
          },
          data: this.generateDomainSpecificHTML(domain, 'home', 'kitchen', 5)
        }
      };
    });

    return responses;
  }

  /**
   * Generate various product type responses
   */
  getProductTypeResponses() {
    return {
      // High-priced luxury items
      luxuryItems: {
        status: 200,
        data: this.generateLuxuryProductsHTML()
      },

      // Budget/discount items
      budgetItems: {
        status: 200,
        data: this.generateBudgetProductsHTML()
      },

      // Products with extreme ratings
      highRatedItems: {
        status: 200,
        data: this.generateHighRatedProductsHTML()
      },

      // Products with low ratings
      lowRatedItems: {
        status: 200,
        data: this.generateLowRatedProductsHTML()
      },

      // Products with massive review counts
      popularItems: {
        status: 200,
        data: this.generatePopularProductsHTML()
      },

      // New products with few reviews
      newItems: {
        status: 200,
        data: this.generateNewProductsHTML()
      },

      // Out of stock items
      outOfStock: {
        status: 200,
        data: this.generateOutOfStockHTML()
      }
    };
  }

  /**
   * Generate standard Amazon search results HTML
   * @param {string} category - Product category
   * @param {string} searchTerm - Search term
   * @param {number} productCount - Number of products to generate
   * @param {object} options - Generation options
   */
  generateSearchResultsHTML(category, searchTerm, productCount, options = {}) {
    const {
      useAlternativeSelectors = false,
      includeSponsored = true,
      structureVariant = 'standard',
      includeRatings = true,
      includeReviews = true,
      includePrices = true,
      includeImages = true,
      includeAllFields = false,
      includePrimeIndicator = false,
      includeDiscounts = false,
      includeAvailability = false,
      includeShipping = false,
      priceRange = null,
      includeDirectProductUrls = true,
      includeProductTitles = true,
      urlPattern = '/dp/{ASIN}'
    } = options;

    const products = this.mockGenerator.generateProducts(productCount, { category });
    
    // Apply options to products
    products.forEach((product, index) => {
      if (!includeRatings) product.rating = 'N/A';
      if (!includeReviews) product.reviews = 'N/A';
      if (!includePrices) product.price = 'N/A';
      if (!includeImages) product.imageUrl = 'N/A';
      
      if (priceRange && includePrices) {
        const [min, max] = priceRange;
        const price = (Math.random() * (max - min) + min).toFixed(2);
        product.price = `$${price}`;
      }
      
      if (!includeDirectProductUrls) {
        product.productUrl = 'N/A'; // Will generate fallback later
      } else if (urlPattern) {
        const asin = product.asin || `B${String(index).padStart(9, '0')}`;
        product.productUrl = `https://www.amazon.com${urlPattern.replace('{ASIN}', asin)}`;
      }
    });
    
    const resultsHtml = products.map((product, index) => {
      const asin = product.asin || `B${String(index).padStart(9, '0')}`;
      
      // Handle different selector patterns
      let linkHtml = '';
      let titleHtml = '';
      
      if (useAlternativeSelectors) {
        linkHtml = `<a data-cy="title-recipe-title" href="${product.productUrl}">`;
        titleHtml = `<span>${product.title}</span>`;
      } else {
        linkHtml = `<a class="a-link-normal s-underline-text s-underline-link-text s-link-style a-text-normal" href="${product.productUrl}">`;
        titleHtml = `<span class="a-size-medium a-color-base a-text-normal">${product.title}</span>`;
      }
      
      const imageHtml = includeImages && product.imageUrl !== 'N/A' ? 
        `<img class="s-image" src="${product.imageUrl}" alt="${product.title}">` : '';
      
      const priceHtml = includePrices && product.price !== 'N/A' ? `
        <div class="a-price" data-a-price='{"range":false,"value":${product.price.replace(/[^0-9.]/g, '')}}'>
          <span class="a-offscreen">${product.price}</span>
          <span aria-hidden="true">
            <span class="a-price-symbol">${product.price.charAt(0)}</span>
            <span class="a-price-whole">${product.price.slice(1).split('.')[0]}</span>
            <span class="a-price-decimal">.</span>
            <span class="a-price-fraction">${product.price.includes('.') ? product.price.split('.')[1] : '00'}</span>
          </span>
        </div>` : '';
      
      const ratingHtml = includeRatings && product.rating !== 'N/A' ? 
        `<span aria-label="${product.rating} out of 5 stars" class="a-icon-alt">${product.rating} out of 5 stars</span>` : '';
      
      const reviewsHtml = includeReviews && product.reviews !== 'N/A' ? `
        <a class="a-link-normal" href="#" aria-label="${product.reviews}">
          <span class="a-size-base s-underline-text">${product.reviews}</span>
        </a>` : '';
      
      if (structureVariant === 'compact') {
        return `
          <div data-component-type="s-search-result" data-asin="${asin}" class="s-result-item">
            ${imageHtml}
            <h2 class="s-size-mini">
              ${linkHtml}
                ${titleHtml}
              </a>
            </h2>
            ${priceHtml}
            ${ratingHtml}
            ${reviewsHtml}
          </div>
        `;
      }
      
      return `
        <div data-component-type="s-search-result" data-asin="${asin}" class="sg-col-4-of-24 sg-col-4-of-12 s-result-item">
          <div class="sg-col-inner">
            <div class="s-widget-container s-spacing-small">
              <div class="s-product-image-container">
                ${imageHtml}
              </div>
              <div class="sg-row">
                <div class="sg-col-12-of-16">
                  <div class="sg-row">
                    <div class="sg-col">
                      <h2 class="a-size-mini a-spacing-none a-color-base s-size-mini s-inline s-color-base">
                        ${linkHtml}
                          ${titleHtml}
                        </a>
                      </h2>
                    </div>
                  </div>
                  <div class="sg-row">
                    <div class="sg-col">
                      <div class="a-row a-size-small">
                        ${ratingHtml}
                        ${reviewsHtml}
                      </div>
                    </div>
                  </div>
                  <div class="sg-row">
                    <div class="sg-col">
                      ${priceHtml}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Amazon.com : ${searchTerm}</title>
    <meta name="description" content="Online shopping for ${searchTerm}">
</head>
<body>
    <div id="a-page">
        <div class="s-desktop-width-max s-desktop-content s-wide-grid-style sg-row">
            <div class="sg-col-20-of-24 s-matching-dir sg-col-16-of-20 sg-col sg-col-8-of-12 sg-col-12-of-16">
                <div class="sg-col-inner">
                    <div id="search">
                        <div id="s-results-list-atf" class="s-main-slot s-result-list s-search-results sg-row">
                            ${resultsHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML for no results found
   */
  generateNoResultsHTML(searchTerm) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Amazon.com : ${searchTerm}</title>
</head>
<body>
    <div id="a-page">
        <div class="s-desktop-width-max s-desktop-content">
            <div class="sg-row">
                <div class="sg-col-12-of-16">
                    <div class="s-no-results-view">
                        <div class="a-row">
                            <div class="a-column a-span12">
                                <div class="s-no-results">
                                    <div class="a-row">
                                        <h1 class="a-size-base s-bold">
                                            No results for <span class="a-color-state a-text-bold">"${searchTerm}"</span>
                                        </h1>
                                    </div>
                                    <div class="a-row a-spacing-mini">
                                        <div class="a-column a-span12">
                                            <div class="s-suggestion-container">
                                                <span class="s-suggestion-text">Try checking your spelling or use more general terms</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML with sponsored results
   */
  generateSponsoredResultsHTML(category, searchTerm, productCount, sponsoredCount) {
    const regularProducts = this.mockGenerator.generateProducts(productCount - sponsoredCount, { category });
    const sponsoredProducts = this.mockGenerator.generateProducts(sponsoredCount, { category });

    // Mark sponsored products
    sponsoredProducts.forEach(product => {
      product.isSponsored = true;
      product.title = `[Sponsored] ${product.title}`;
    });

    const allProducts = [...sponsoredProducts, ...regularProducts];
    
    const resultsHtml = allProducts.map((product, index) => {
      const sponsoredClass = product.isSponsored ? ' s-sponsored-item' : '';
      const sponsoredLabel = product.isSponsored ? '<span class="a-size-base a-color-secondary">Sponsored</span>' : '';
      
      return `
        <div data-component-type="${product.isSponsored ? 'sp-sponsored-result' : 's-search-result'}" data-asin="${product.asin || `B${String(index).padStart(9, '0')}`}" class="s-result-item${sponsoredClass}">
          ${sponsoredLabel}
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
          <img src="${product.imageUrl}" alt="${product.title}">
        </div>
      `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html>
<head><title>Amazon.com : ${searchTerm}</title></head>
<body>
    <div id="s-results-list-atf">
        <div class="s-search-results">
            ${resultsHtml}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate HTML with incomplete product information
   */
  generateIncompleteResultsHTML(category, searchTerm, productCount, missingFields) {
    const products = this.mockGenerator.generateProducts(productCount, { category });
    
    const resultsHtml = products.map((product, index) => {
      // Remove specified fields
      missingFields.forEach(field => {
        if (field === 'price') product.price = 'N/A';
        if (field === 'rating') product.rating = 'N/A';
        if (field === 'reviews') product.reviews = 'N/A';
        if (field === 'image') product.imageUrl = 'N/A';
      });

      const priceHtml = product.price !== 'N/A' ? `
        <div class="a-price">
          <span class="a-offscreen">${product.price}</span>
        </div>` : '';

      const ratingHtml = product.rating !== 'N/A' ? `
        <span class="a-icon-alt" aria-label="${product.rating} out of 5 stars">${product.rating} out of 5 stars</span>` : '';

      const reviewsHtml = product.reviews !== 'N/A' ? `
        <span class="a-size-base">${product.reviews}</span>` : '';

      const imageHtml = product.imageUrl !== 'N/A' ? `
        <img src="${product.imageUrl}" alt="${product.title}">` : '';

      return `
        <div data-component-type="s-search-result" data-asin="${product.asin || `B${String(index).padStart(9, '0')}`}">
          <h2 class="s-size-mini">
            <a href="${product.productUrl}">
              <span>${product.title}</span>
            </a>
          </h2>
          ${priceHtml}
          ${ratingHtml}
          ${reviewsHtml}
          ${imageHtml}
        </div>
      `;
    }).join('\n');

    return `
<!DOCTYPE html>
<html>
<head><title>Amazon.com : ${searchTerm}</title></head>
<body>
    <div id="s-results-list-atf">
        <div class="s-search-results">
            ${resultsHtml}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate malformed HTML for testing error handling
   */
  generateMalformedHTML() {
    return `
<!DOCTYPE html>
<html>
<head><title>Malformed Test Page</title></head>
<body>
    <div id="s-results-list-atf">
        <div class="s-search-results">
            <!-- Missing closing tag -->
            <div data-component-type="s-search-result" data-asin="B123456789">
                <h2 class="s-size-mini">
                    <a href="/dp/B123456789"
                        <span>Incomplete Product Title
                </h2>
                <div class="a-price"
                    <span class="a-offscreen">$29.99</span>
                <!-- Missing closing divs -->
            
            <!-- Broken structure -->
            <div data-component-type="s-search-result" data-asin="B987654321">
                <h2 class="s-size-mini">
                    <span>Another Product</span>
                </h2>
                <div class="a-price">
                    <span class="a-offscreen">$invalid-price$</span>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate domain-specific HTML with localized content
   */
  generateDomainSpecificHTML(domain, category, searchTerm, productCount) {
    const products = this.mockGenerator.generateProducts(productCount, { domain, category });
    
    // Add domain-specific customizations
    products.forEach(product => {
      if (domain === 'amazon.de') {
        product.title = product.title.replace(/and/g, 'und');
      } else if (domain === 'amazon.fr') {
        product.title = product.title.replace(/and/g, 'et');
      }
    });

    const baseUrl = `https://www.${domain}`;
    const resultsHtml = products.map((product, index) => `
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
        <img src="${product.imageUrl}" alt="${product.title}">
      </div>
    `).join('\n');

    return `
<!DOCTYPE html>
<html lang="${domain === 'amazon.de' ? 'de' : domain === 'amazon.fr' ? 'fr' : 'en'}">
<head>
    <meta charset="UTF-8">
    <title>${baseUrl} : ${searchTerm}</title>
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

  /**
   * Generate luxury products HTML (high prices)
   */
  generateLuxuryProductsHTML() {
    const products = [];
    for (let i = 0; i < 5; i++) {
      products.push(this.mockGenerator.generateProduct({ 
        category: 'electronics',
        priceOverride: `$${(1000 + Math.random() * 4000).toFixed(2)}`
      }));
    }
    return this.generateProductsHTML(products, 'luxury items');
  }

  /**
   * Generate budget products HTML (low prices)
   */
  generateBudgetProductsHTML() {
    const products = [];
    for (let i = 0; i < 8; i++) {
      products.push(this.mockGenerator.generateProduct({ 
        category: 'home',
        priceOverride: `$${(5 + Math.random() * 20).toFixed(2)}`
      }));
    }
    return this.generateProductsHTML(products, 'budget items');
  }

  /**
   * Generate high-rated products HTML
   */
  generateHighRatedProductsHTML() {
    const products = [];
    for (let i = 0; i < 6; i++) {
      products.push(this.mockGenerator.generateProduct({ 
        category: 'books',
        ratingOverride: (4.5 + Math.random() * 0.5).toFixed(1)
      }));
    }
    return this.generateProductsHTML(products, 'highly rated items');
  }

  /**
   * Generate low-rated products HTML
   */
  generateLowRatedProductsHTML() {
    const products = [];
    for (let i = 0; i < 4; i++) {
      products.push(this.mockGenerator.generateProduct({ 
        category: 'clothing',
        ratingOverride: (1.0 + Math.random() * 2.5).toFixed(1)
      }));
    }
    return this.generateProductsHTML(products, 'low rated items');
  }

  /**
   * Generate popular products HTML (high review counts)
   */
  generatePopularProductsHTML() {
    const products = [];
    for (let i = 0; i < 7; i++) {
      const reviewCount = Math.floor(10000 + Math.random() * 90000);
      products.push(this.mockGenerator.generateProduct({ 
        category: 'electronics',
        reviewsOverride: reviewCount.toLocaleString()
      }));
    }
    return this.generateProductsHTML(products, 'popular items');
  }

  /**
   * Generate new products HTML (low review counts)
   */
  generateNewProductsHTML() {
    const products = [];
    for (let i = 0; i < 5; i++) {
      const reviewCount = Math.floor(1 + Math.random() * 50);
      products.push(this.mockGenerator.generateProduct({ 
        category: 'electronics',
        reviewsOverride: reviewCount.toString()
      }));
    }
    return this.generateProductsHTML(products, 'new items');
  }

  /**
   * Generate out of stock HTML
   */
  generateOutOfStockHTML() {
    const products = [];
    for (let i = 0; i < 3; i++) {
      products.push(this.mockGenerator.generateProduct({ 
        category: 'home',
        priceOverride: 'Currently unavailable'
      }));
    }
    return this.generateProductsHTML(products, 'out of stock items');
  }

  /**
   * Helper method to generate HTML from products array
   */
  generateProductsHTML(products, searchTerm) {
    const resultsHtml = products.map((product, index) => `
      <div data-component-type="s-search-result" data-asin="${product.asin || `B${String(index).padStart(9, '0')}`}">
        <h2 class="s-size-mini">
          <a href="${product.productUrl}">
            <span>${product.title}</span>
          </a>
        </h2>
        <div class="a-price">
          <span class="a-offscreen">${product.priceOverride || product.price}</span>
        </div>
        <span class="a-icon-alt" aria-label="${product.ratingOverride || product.rating} out of 5 stars">${product.ratingOverride || product.rating} out of 5 stars</span>
        <span class="a-size-base">${product.reviewsOverride || product.reviews}</span>
        <img src="${product.imageUrl}" alt="${product.title}">
      </div>
    `).join('\n');

    return `
<!DOCTYPE html>
<html>
<head><title>Amazon.com : ${searchTerm}</title></head>
<body>
    <div id="s-results-list-atf">
        <div class="s-search-results">
            ${resultsHtml}
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Get response by type and scenario
   */
  getResponse(type, scenario) {
    const responses = this[`get${type.charAt(0).toUpperCase() + type.slice(1)}Responses`]();
    return responses[scenario] || null;
  }

  /**
   * Clear response cache
   */
  clearCache() {
    this.responseCache.clear();
  }
}

module.exports = {
  MockResponseGenerator
};
