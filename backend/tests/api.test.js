const request = require('supertest');
const { app, server } = require('../server');

// Mocking axios and jsdom to avoid actual external requests during tests
jest.mock('axios');
jest.mock('jsdom');

describe('Scraping API', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/health', () => {
    it('should return 200 OK and a success message', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('message', 'API is healthy');
    });
  });

  describe('GET /api/scrape', () => {
    it('should return 400 if keyword is missing', async () => {
      const res = await request(app).get('/api/scrape');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Search keyword is required');
    });

    it('should return 400 if keyword is too short', async () => {
      const res = await request(app).get('/api/scrape?keyword=a');
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Keyword must be at least 2 characters long');
    });

    it('should return 500 if scraping fails', async () => {
      // We can simulate a failure by having our mocked axios reject the promise
      const axios = require('axios');
      axios.get.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/api/scrape?keyword=fail');
      expect(res.statusCode).toEqual(500);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Failed to scrape Amazon');
    });

    it('should return scraped products on success', async () => {
      const axios = require('axios');
      const { JSDOM } = require('jsdom');
      
      // Mock the successful response from Amazon
      const mockHtml = `
        <html><body>
          <div data-component-type="s-search-result">
            <h2 class="a-size-mini"><a class="a-link-normal" href="/product-link-1"><span class="a-text-normal">Product 1</span></a></h2>
            <span class="a-icon-alt">4.5 out of 5 stars</span>
            <span class="a-size-base">1,234</span>
            <span class="a-price-whole">100</span><span class="a-price-fraction">99</span>
            <img class="s-image" src="image-url-1" />
          </div>
          <div data-component-type="s-search-result">
            <h2 class="a-size-mini"><a class="a-link-normal" href="/product-link-2"><span class="a-text-normal">Product 2</span></a></h2>
            <span class="a-icon-alt">4.0 out of 5 stars</span>
            <span class="a-size-base">567</span>
            <span class="a-price-whole">250</span><span class="a-price-fraction">00</span>
            <img class="s-image" src="image-url-2" />
          </div>
        </body></html>
      `;
      axios.get.mockResolvedValue({ data: mockHtml });

      // Mock JSDOM
      const dom = new JSDOM(mockHtml);
      global.DOMParser = dom.window.DOMParser;


      const res = await request(app).get('/api/scrape?keyword=laptop');
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.keyword).toBe('laptop');
      expect(res.body.products).toBeInstanceOf(Array);
      expect(res.body.products.length).toBe(2);
      
      // Check first product
      expect(res.body.products[0].title).toBe('Product 1');
      expect(res.body.products[0].rating).toBe('4.5');
      expect(res.body.products[0].reviews).toBe('1,234');
      expect(res.body.products[0].price).toBe('$100.99');
      expect(res.body.products[0].imageUrl).toBe('image-url-1');
      expect(res.body.products[0].productUrl).toContain('https://www.amazon.com/product-link-1');
    });
  });
});
