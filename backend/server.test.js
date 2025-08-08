import { test, expect, describe, afterEach, mock } from 'bun:test';
const request = require('supertest');
const { app } = require('./server');

describe('Amazon Scraper API', () => {

  describe('GET /api/health', () => {
    test('should return a 200 OK status and a success message', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Amazon Scraper API is running');
    });
  });

  describe('GET /api/scrape', () => {
    test('should return a 400 error if the keyword is missing', async () => {
      const response = await request(app).get('/api/scrape');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keyword parameter is required');
    });

    test('should return a 400 error if the keyword is too short', async () => {
      const response = await request(app).get('/api/scrape?keyword=a');
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Keyword must be at least 2 characters long');
    });
  });

  describe('Default Route', () => {
    test('should return API information for the root route', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Amazon Product Scraper API');
      expect(response.body.endpoints).toBeDefined();
    });
  });
});
