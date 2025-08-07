const request = require('supertest');
const { server, scrapeAmazonProducts } = require('./server'); // Import server and the function to be mocked

// Mock the scrapeAmazonProducts function
jest.mock('./server', () => {
  const originalModule = jest.requireActual('./server');
  return {
    ...originalModule,
    scrapeAmazonProducts: jest.fn(),
  };
});

describe('Amazon Scraper API', () => {
  let app;

  beforeAll(() => {
    app = server; // Use the imported server instance
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/health', () => {
    it('should return a 200 OK status and a success message', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Amazon Scraper API is running');
    });
  });

  describe('GET /api/scrape', () => {
    it('should return scraped products when a valid keyword is provided', async () => {
      const mockProducts = [
        { title: 'Laptop 1', price: '$1000' },
        { title: 'Laptop 2', price: '$1200' },
      ];
      scrapeAmazonProducts.mockResolvedValue(mockProducts);

      const response = await request(app).get('/api/scrape?keyword=laptop');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.products).toEqual(mockProducts);
      expect(scrapeAmazonProducts).toHaveBeenCalledWith('laptop');
    });

    it('should return a 400 error if the keyword is missing', async () => {
      const response = await request(app).get('/api/scrape');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword is required');
    });

    it('should return a 400 error if the keyword is too short', async () => {
      const response = await request(app).get('/api/scrape?keyword=a');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Keyword must be at least 2 characters long');
    });

    it('should handle scraping errors and return a 500 status', async () => {
      scrapeAmazonProducts.mockRejectedValue(new Error('Scraping failed'));

      const response = await request(app).get('/api/scrape?keyword=error');
      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Failed to scrape products');
    });
  });

  describe('Default Route', () => {
    it('should return API information for the root route', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Amazon Product Scraper API');
      expect(response.body.endpoints).toBeDefined();
    });
  });
});
