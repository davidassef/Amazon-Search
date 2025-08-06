const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Scrapes Amazon search results for a given keyword
 * @param {string} keyword - The search term
 * @returns {Promise<Array>} Array of product objects
 */
async function scrapeAmazonProducts(keyword) {
  try {
    // Amazon search URL with the keyword
    const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`;
    
    // Headers to mimic a real browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };

    // Fetch the Amazon search results page
    console.log(`Fetching Amazon search results for: ${keyword}`);
    const response = await axios.get(searchUrl, { headers });
    
    // Parse HTML with JSDOM
    const dom = new JSDOM(response.data);
    const document = dom.window.document;
    
    // Array to store scraped products
    const products = [];
    
    // Select product containers (Amazon uses different selectors, so we try multiple)
    const productSelectors = [
      '[data-component-type="s-search-result"]',
      '.s-result-item',
      '[data-asin]:not([data-asin=""])'
    ];
    
    let productElements = [];
    for (const selector of productSelectors) {
      productElements = document.querySelectorAll(selector);
      if (productElements.length > 0) break;
    }
    
    console.log(`Found ${productElements.length} product elements`);
    
    // Extract data from each product element
    productElements.forEach((element, index) => {
      try {
        // Skip if this is an ad or sponsored result
        if (element.querySelector('[data-component-type="sp-sponsored-result"]')) {
          return;
        }
        
        // Extract product title
        const titleElement = element.querySelector('h2 a span') || 
                            element.querySelector('.s-size-mini span') ||
                            element.querySelector('[data-cy="title-recipe-title"]') ||
                            element.querySelector('h2 span');
        
        const title = titleElement ? titleElement.textContent.trim() : 'N/A';
        
        // Extract rating (stars)
        const ratingElement = element.querySelector('.a-icon-alt') ||
                             element.querySelector('[aria-label*="star"]');
        
        let rating = 'N/A';
        if (ratingElement) {
          const ratingText = ratingElement.getAttribute('aria-label') || ratingElement.textContent;
          const ratingMatch = ratingText.match(/(\d+\.?\d*)\s*(out\s*of\s*5\s*stars?|stars?)/i);
          if (ratingMatch) {
            rating = ratingMatch[1];
          }
        }
        
        // Extract number of reviews
        const reviewsElement = element.querySelector('.a-size-base') ||
                              element.querySelector('[aria-label*="rating"]')?.parentElement?.querySelector('a') ||
                              element.querySelector('.s-underline-text');
        
        let reviews = 'N/A';
        if (reviewsElement) {
          const reviewsText = reviewsElement.textContent.trim();
          const reviewsMatch = reviewsText.match(/[\d,]+/);
          if (reviewsMatch) {
            reviews = reviewsMatch[0];
          }
        }
        
        // Extract product image URL
        const imageElement = element.querySelector('img');
        const imageUrl = imageElement ? 
          (imageElement.getAttribute('src') || imageElement.getAttribute('data-src') || 'N/A') : 'N/A';
        
        // Only add product if we have at least a title
        if (title && title !== 'N/A') {
          products.push({
            title: title.substring(0, 200), // Limit title length
            rating,
            reviews,
            imageUrl
          });
        }
        
      } catch (error) {
        console.error(`Error extracting data from product ${index}:`, error.message);
      }
    });
    
    return products;
    
  } catch (error) {
    console.error('Error scraping Amazon:', error.message);
    throw error;
  }
}

/**
 * API endpoint to scrape Amazon products
 * GET /api/scrape?keyword=searchTerm
 */
app.get('/api/scrape', async (req, res) => {
  try {
    const { keyword } = req.query;
    
    // Validate keyword parameter
    if (!keyword) {
      return res.status(400).json({
        success: false,
        error: 'Keyword parameter is required'
      });
    }
    
    if (keyword.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Keyword must be at least 2 characters long'
      });
    }
    
    console.log(`Scraping request for keyword: ${keyword}`);
    
    // Scrape Amazon products
    const products = await scrapeAmazonProducts(keyword);
    
    // Return successful response
    res.json({
      success: true,
      keyword,
      totalProducts: products.length,
      products: products.slice(0, 20) // Limit to first 20 products
    });
    
  } catch (error) {
    console.error('API Error:', error.message);
    
    // Return error response
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Amazon products',
      details: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Amazon Scraper API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * Default route
 */
app.get('/', (req, res) => {
  res.json({
    message: 'Amazon Product Scraper API',
    endpoints: {
      scrape: '/api/scrape?keyword=<search-term>',
      health: '/api/health'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Amazon Scraper API running on http://localhost:${PORT}`);
  console.log(`📡 Scrape endpoint: http://localhost:${PORT}/api/scrape?keyword=<search-term>`);
});
