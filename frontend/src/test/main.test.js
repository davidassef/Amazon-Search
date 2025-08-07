import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { handleSearch, displayResults, createProductCard } from '../../main'; // Assuming functions are exported

// Setup a basic DOM environment
const dom = new JSDOM(`
  <!DOCTYPE html>
  <html>
    <body>
      <input id="searchInput" />
      <button id="searchButton"><span class="button-text"></span><span class="loading-spinner"></span></button>
      <div id="resultsContainer"></div>
      <div id="productsList"></div>
      <div id="errorMessage"></div>
      <div id="loadingMessage"></div>
      <span id="resultsCount"></span>
      <span id="searchKeyword"></span>
    </body>
  </html>
`);

global.document = dom.window.document;
global.window = dom.window;

describe('Frontend Logic', () => {
  beforeEach(() => {
    // Reset mocks and DOM before each test
    vi.spyOn(global, 'fetch');
    document.getElementById('productsList').innerHTML = '';
    document.getElementById('errorMessage').style.display = 'none';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('handleSearch', () => {
    it('should call fetch with the correct URL', async () => {
      document.getElementById('searchInput').value = 'test';
      fetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, products: [] }),
      });

      await handleSearch();
      expect(fetch).toHaveBeenCalledWith('http://localhost:3000/api/scrape?keyword=test');
    });
  });

  describe('displayResults', () => {
    it('should render product cards correctly', () => {
      const products = [
        { title: 'Product 1', price: '$10', rating: '4.5', reviews: '100', imageUrl: 'url1', productUrl: 'p_url1' },
        { title: 'Product 2', price: '$20', rating: '4.0', reviews: '50', imageUrl: 'url2', productUrl: 'p_url2' },
      ];
      displayResults(products, 'test');
      const productCards = document.querySelectorAll('.product-card');
      expect(productCards.length).toBe(2);
    });
  });

  describe('createProductCard', () => {
    it('should create a product card with all details', () => {
      const product = { title: 'Test Product', price: '$99', rating: '5', reviews: '10', imageUrl: 'test.jpg', productUrl: 'test_url' };
      const card = createProductCard(product);
      expect(card.querySelector('.product-title').textContent).toBe('Test Product');
      expect(card.querySelector('.product-price').textContent).toBe('$99');
    });
  });
});
