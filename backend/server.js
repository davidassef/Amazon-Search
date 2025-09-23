const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');
const cors = require('cors');

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/119.0.0.0 Safari/537.36'
];

const getRandomUserAgent = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Amazon domain configuration
const AMAZON_DOMAINS = {
  'amazon.com': { baseUrl: 'https://www.amazon.com', language: 'en-US,en;q=0.9' },
  'amazon.co.uk': { baseUrl: 'https://www.amazon.co.uk', language: 'en-GB,en;q=0.9' },
  'amazon.de': { baseUrl: 'https://www.amazon.de', language: 'de-DE,de;q=0.9,en;q=0.8' },
  'amazon.fr': { baseUrl: 'https://www.amazon.fr', language: 'fr-FR,fr;q=0.9,en;q=0.8' },
  'amazon.ca': { baseUrl: 'https://www.amazon.ca', language: 'en-CA,en;q=0.9,fr;q=0.8' },
  'amazon.com.au': { baseUrl: 'https://www.amazon.com.au', language: 'en-AU,en;q=0.9' },
  'amazon.co.jp': { baseUrl: 'https://www.amazon.co.jp', language: 'ja-JP,ja;q=0.9,en;q=0.8' },
  'amazon.in': { baseUrl: 'https://www.amazon.in', language: 'en-IN,en;q=0.9,hi;q=0.8' },
  'amazon.com.br': { baseUrl: 'https://www.amazon.com.br', language: 'pt-BR,pt;q=0.9,en;q=0.8', currency: 'BRL' },
  'amazon.com.mx': { baseUrl: 'https://www.amazon.com.mx', language: 'es-MX,es;q=0.9,en;q=0.8', currency: 'MXN' },
  'amazon.it': { baseUrl: 'https://www.amazon.it', language: 'it-IT,it;q=0.9,en;q=0.8', currency: 'EUR' },
  'amazon.es': { baseUrl: 'https://www.amazon.es', language: 'es-ES,es;q=0.9,en;q=0.8', currency: 'EUR' }
};

// --- Currency Conversion ---
const getExchangeRates = async (baseCurrency = 'USD') => {
  try {
    const response = await axios.get(`https://api.exchangerate.host/latest?base=${baseCurrency}`);
    return response.data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error.message);
    return null;
  }
};

const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  if (!rates || !rates[fromCurrency] || !rates[toCurrency]) {
    return null; // Not enough data to convert
  }
  // Convert amount from 'fromCurrency' to base currency (USD), then to 'toCurrency'
  const amountInBase = amount / rates[fromCurrency];
  return amountInBase * rates[toCurrency];
};


/**
 * Scrapes Amazon search results for a given keyword and domain
 * @param {string} keyword - The search term
 * @param {string} domain - The Amazon domain (e.g., 'amazon.com')
 * @returns {Promise<Array>} Array of product objects
 */
async function scrapeAmazonProducts(keyword, domain = 'amazon.com', retryCount = 0) {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  try {
    // Add random delay to avoid rate limiting
    await sleep(Math.random() * 1000 + 500); // 0.5-1.5 seconds
    
    // Validate domain
    if (!AMAZON_DOMAINS[domain]) {
      throw new Error(`Unsupported Amazon domain: ${domain}`);
    }
    
    const domainConfig = AMAZON_DOMAINS[domain];
    
    // Amazon search URL with the keyword for the specified domain
    const searchUrl = `${domainConfig.baseUrl}/s?k=${encodeURIComponent(keyword)}&ref=sr_pg_1`;
    
    // More realistic headers with rotating user agent
    const headers = {
      'User-Agent': getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': domainConfig.language,
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Cache-Control': 'max-age=0',
      'DNT': '1'
    };

    // Fetch the Amazon search results page with timeout
    console.log(`Fetching ${domain} search results for: ${keyword} (attempt ${retryCount + 1})`);
    const response = await axios.get(searchUrl, { 
      headers,
      timeout: 10000, // 10 second timeout
      maxRedirects: 5
    });
    
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
        
        // Extract product title and URL with improved selectors
        const titleLinkSelectors = [
          'h2 a[href]',
          'a[data-cy="title-recipe-title"]',
          '.s-link-style a[href]',
          'a[href*="/dp/"]',
          'a[href*="/gp/product/"]',
          '[data-asin] a[href]',
          '.s-size-mini a[href]',
          '.a-link-normal[href]'
        ];
        
        let titleLinkElement = null;
        for (const selector of titleLinkSelectors) {
          titleLinkElement = element.querySelector(selector);
          if (titleLinkElement) {
            console.log(`Found link with selector: ${selector}`);
            break;
          }
        }
        
        const titleSelectors = [
          'h2 a span',
          'h2 span',
          '.s-size-mini span',
          '[data-cy="title-recipe-title"]',
          '.a-link-normal span',
          '.s-color-base'
        ];
        
        let titleElement = null;
        if (titleLinkElement) {
          titleElement = titleLinkElement.querySelector('span');
        }
        
        if (!titleElement) {
          for (const selector of titleSelectors) {
            titleElement = element.querySelector(selector);
            if (titleElement) {
              console.log(`Found title with selector: ${selector}`);
              break;
            }
          }
        }
        
        const title = titleElement ? titleElement.textContent.trim() : 'N/A';
        
        // Extract product URL with better logic
        let productUrl = 'N/A';
        if (titleLinkElement) {
          const href = titleLinkElement.getAttribute('href');
          if (href) {
            if (href.startsWith('http')) {
              productUrl = href;
            } else if (href.startsWith('/')) {
              productUrl = `${domainConfig.baseUrl}${href}`;
            } else {
              productUrl = `${domainConfig.baseUrl}/${href}`;
            }
            console.log(`Extracted URL: ${productUrl}`);
          } else {
            console.log('Link element found but no href attribute');
          }
        } else {
          console.log(`No link found for product ${index + 1}: ${title.substring(0, 50)}...`);
        }
        
        // Fallback: Generate search URL if no specific URL found
        if (productUrl === 'N/A' && title !== 'N/A') {
          const searchTerm = title.substring(0, 100); // Limit length for URL
          productUrl = `${domainConfig.baseUrl}/s?k=${encodeURIComponent(searchTerm)}`;
          console.log(`Generated fallback search URL for: ${title.substring(0, 30)}...`);
        }
        
        // Extract rating (stars) - language agnostic and resilient
        // Support EN (star/stars), ES (estrella/estrellas), PT (estrela/estrelas)
        const ratingElement = element.querySelector('.a-icon-alt') ||
                              element.querySelector('[aria-label*="star" i]') ||
                              element.querySelector('[aria-label*="estrella" i]') ||
                              element.querySelector('[aria-label*="estrellas" i]') ||
                              element.querySelector('[aria-label*="estrela" i]') ||
                              element.querySelector('[aria-label*="estrelas" i]');
        
        let rating = 'N/A';
        if (ratingElement) {
          const ratingText = (ratingElement.getAttribute('aria-label') || ratingElement.textContent || '').trim();
          // Extract first numeric value regardless of surrounding words, normalize comma to dot
          const numMatch = ratingText.match(/\d+[\.,]?\d*/);
          if (numMatch) {
            const num = parseFloat(numMatch[0].replace(',', '.'));
            if (!Number.isNaN(num)) {
              // Clamp between 0 and 5 as Amazon ratings are 0..5
              rating = Math.max(0, Math.min(5, num)).toString();
            }
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
        
        // Extract product price
        let price = 'N/A';
        const priceSelectors = [
          '.a-price .a-offscreen',
          '#corePrice_feature_div span.a-offscreen', // More specific
          '#priceblock_ourprice', // Common selector for main price
          '.a-price-whole',
          '[data-a-price] .a-offscreen',
          '.a-text-price .a-offscreen',
          '#price .a-text-strike', // For items on sale
          '.a-color-price', // Broader fallback
        ];
        
        for (const selector of priceSelectors) {
          const priceElement = element.querySelector(selector);
          if (priceElement && priceElement.textContent.trim()) {
            price = priceElement.textContent.trim();
            break;
          }
        }
        
        // Fallback price extraction
        if (price === 'N/A') {
          const priceElements = element.querySelectorAll('.a-price, .a-color-price, .a-text-price');
          for (const priceEl of priceElements) {
            const priceText = priceEl.textContent.trim();
            if (priceText.match(/[\$£€¥₹]\d+/)) {
              price = priceText;
              break;
            }
          }
        }
        
        // Only add product if we have at least a title
        if (title && title !== 'N/A') {
          products.push({
            title: title.substring(0, 200), // Limit title length
            productUrl,
            price,
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
    
    // Retry logic for certain error types
    if (retryCount < MAX_RETRIES && 
        (error.response?.status === 503 || 
         error.response?.status === 429 ||
         error.code === 'ECONNRESET' ||
         error.code === 'ETIMEDOUT')) {
      
      const delay = RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
      console.log(`Retrying in ${delay}ms... (${retryCount + 1}/${MAX_RETRIES})`);
      
      await sleep(delay);
      return scrapeAmazonProducts(keyword, domain, retryCount + 1);
    }
    
    throw error;
  }
}

/**
 * API endpoint to scrape Amazon products
 * GET /api/scrape?keyword=searchTerm
 */
app.get('/api/scrape', async (req, res) => {
  try {
    const { keyword, domains, convert_currency: convertTo } = req.query;

    if (!keyword) {
      return res.status(400).json({ success: false, error: 'Keyword parameter is required' });
    }
    if (keyword.length < 2) {
      return res.status(400).json({ success: false, error: 'Keyword must be at least 2 characters long' });
    }

    const domainList = (domains || 'amazon.com').split(',').map(d => d.trim());
    const invalidDomains = domainList.filter(d => !AMAZON_DOMAINS[d]);
    if (invalidDomains.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Unsupported domains: ${invalidDomains.join(', ')}. Supported: ${Object.keys(AMAZON_DOMAINS).join(', ')}`
      });
    }

    console.log(`Scraping for "${keyword}" on [${domainList.join(', ')}]`);

    // Scrape all domains in parallel
    const scrapePromises = domainList.map(domain =>
      scrapeAmazonProducts(keyword, domain).then(products => ({ domain, products }))
    );
    const resultsByDomain = await Promise.all(scrapePromises);

    let rates = null;
    if (convertTo) {
      rates = await getExchangeRates('USD'); // Use USD as a stable base
    }

    const responseData = {
      success: true,
      keyword,
      domains: domainList,
      results: {},
      ratesTimestamp: rates ? new Date().toISOString() : null,
    };

    for (const result of resultsByDomain) {
      const { domain, products } = result;
      const originalCurrency = AMAZON_DOMAINS[domain].currency;

      if (convertTo && rates) {
        products.forEach(p => {
          const priceMatch = p.price.match(/[\d,.]+/);
          if (priceMatch) {
            const amount = parseFloat(priceMatch[0].replace(/,/g, ''));
            const convertedAmount = convertCurrency(amount, originalCurrency, convertTo.toUpperCase(), rates);
            p.convertedPrice = convertedAmount ? `${convertTo.toUpperCase()} ${convertedAmount.toFixed(2)}` : 'N/A';
            p.originalCurrency = originalCurrency;
          }
        });
      }
      responseData.results[domain] = {
        totalProducts: products.length,
        products: products.slice(0, 20),
      };
    }

    res.json(responseData);

  } catch (error) {
    console.error('API Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to scrape Amazon products',
      details: error.message,
    });
  }
});

/**
 * API endpoint to get latest exchange rates
 * GET /api/rates
 */
app.get('/api/rates', async (req, res) => {
  try {
    const { base } = req.query;
    const rates = await getExchangeRates(base);
    if (rates) {
      res.json({ success: true, ...rates });
    } else {
      res.status(500).json({ success: false, error: 'Failed to fetch exchange rates' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error fetching rates' });
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
      scrape: '/api/scrape?keyword=<search-term>&domains=<domains>&convertTo=<currency>',
      rates: '/api/rates?base=<currency>',
      health: '/api/health'
    }
  });
});

// Start server only if this file is run directly (not imported for testing)
let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`🚀 Amazon Scraper API running on http://localhost:${PORT}`);
    console.log(`📡 Scrape endpoint: http://localhost:${PORT}/api/scrape?keyword=<search-term>`);
  });
}

module.exports = { app, server, scrapeAmazonProducts, AMAZON_DOMAINS };
