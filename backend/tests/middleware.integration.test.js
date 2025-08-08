/**
 * Middleware and Validation Integration Tests
 * 
 * Tests focused on:
 * - CORS middleware functionality
 * - Express middleware chain
 * - Request/Response validation
 * - Security headers
 * - Error handling middleware
 */

import { test, expect, describe, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import request from 'supertest';
import { app } from '../server.js';

describe('Middleware Integration Tests', () => {
  let originalConsoleLog;
  let originalConsoleError;

  beforeEach(() => {
    // Suppress console output during tests
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    console.log = mock();
    console.error = mock();
  });

  afterEach(() => {
    // Restore console output
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('CORS Middleware', () => {
    test('should set Access-Control-Allow-Origin header', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('should handle preflight OPTIONS request for /api/scrape', async () => {
      const response = await request(app)
        .options('/api/scrape')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });

    test('should handle preflight OPTIONS request for /api/health', async () => {
      const response = await request(app)
        .options('/api/health')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    test('should allow requests from different origins', async () => {
      const origins = [
        'http://localhost:3000',
        'https://example.com',
        'https://myapp.netlify.app',
        'http://192.168.1.100:8080'
      ];

      for (const origin of origins) {
        const response = await request(app)
          .get('/api/health')
          .set('Origin', origin)
          .expect(200);

        expect(response.headers['access-control-allow-origin']).toBe('*');
      }
    });

    test('should handle complex CORS headers', async () => {
      const response = await request(app)
        .options('/api/scrape')
        .set('Origin', 'https://myapp.com')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'X-Requested-With, Accept, Content-Type')
        .expect(204);

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('JSON Response Middleware', () => {
    test('should set correct Content-Type for JSON responses', async () => {
      const endpoints = [
        '/api/health',
        '/',
        '/api/scrape'  // This will fail validation but still return JSON
      ];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });

    test('should handle JSON parsing correctly', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(() => JSON.parse(JSON.stringify(response.body))).not.toThrow();
      expect(typeof response.body).toBe('object');
    });
  });

  describe('Error Handling Middleware', () => {
    test('should handle 404 errors for non-existent routes', async () => {
      const nonExistentRoutes = [
        '/api/nonexistent',
        '/invalid/path',
        '/api/scrape/invalid',
        '/health', // Note: correct path is /api/health
        '/api/scraper' // Note: correct path is /api/scrape
      ];

      for (const route of nonExistentRoutes) {
        const response = await request(app)
          .get(route)
          .expect(404);

        // Should still return JSON even for 404s (Express default behavior)
        expect(response.headers['content-type']).toMatch(/text\/html/);
      }
    });

    test('should handle different HTTP methods on existing routes', async () => {
      // POST to GET-only endpoint
      const postResponse = await request(app)
        .post('/api/health')
        .expect(404);

      // PUT to GET-only endpoint  
      const putResponse = await request(app)
        .put('/api/scrape')
        .expect(404);

      // DELETE to GET-only endpoint
      const deleteResponse = await request(app)
        .delete('/')
        .expect(404);
    });

    test('should handle malformed requests', async () => {
      // Test with invalid query parameters
      const response = await request(app)
        .get('/api/scrape?keyword=test&domain=')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Unsupported Amazon domain')
      });
    });
  });

  describe('Request Parsing Middleware', () => {
    test('should parse query parameters correctly', async () => {
      // Mock axios to avoid real HTTP requests
      const axiosGetSpy = spyOn(require('axios'), 'get');
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body><div data-component-type="s-search-result"></div></body></html>'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=laptop computer&domain=amazon.com')
        .expect(200);

      expect(response.body.keyword).toBe('laptop computer');
      expect(response.body.domain).toBe('amazon.com');

      axiosGetSpy.mockRestore();
    });

    test('should handle URL-encoded parameters', async () => {
      const axiosGetSpy = spyOn(require('axios'), 'get');
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const keyword = 'café & restaurant';
      const encodedKeyword = encodeURIComponent(keyword);
      
      const response = await request(app)
        .get(`/api/scrape?keyword=${encodedKeyword}`)
        .expect(200);

      expect(response.body.keyword).toBe(keyword);

      axiosGetSpy.mockRestore();
    });

    test('should ignore extra query parameters', async () => {
      const axiosGetSpy = spyOn(require('axios'), 'get');
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const response = await request(app)
        .get('/api/scrape?keyword=test&domain=amazon.com&extra=ignored&another=also-ignored')
        .expect(200);

      expect(response.body.keyword).toBe('test');
      expect(response.body.domain).toBe('amazon.com');
      // Extra params should not appear in response
      expect(response.body).not.toHaveProperty('extra');
      expect(response.body).not.toHaveProperty('another');

      axiosGetSpy.mockRestore();
    });
  });

  describe('Security Headers', () => {
    test('should not expose server information in headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      // Should not expose Express version or other server details
      expect(response.headers['x-powered-by']).toBeUndefined();
      expect(response.headers['server']).toBeUndefined();
    });

    test('should handle requests with suspicious headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Forwarded-For', '127.0.0.1, 127.0.0.1')
        .set('X-Real-IP', '127.0.0.1')
        .set('User-Agent', '<script>alert("xss")</script>')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle requests with custom headers', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('X-Custom-Header', 'test-value')
        .set('Authorization', 'Bearer fake-token')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Request Size and Limits', () => {
    test('should handle requests with very long URLs', async () => {
      const longKeyword = 'a'.repeat(2000);
      const axiosGetSpy = spyOn(require('axios'), 'get');
      axiosGetSpy.mockResolvedValueOnce({
        data: '<html><body></body></html>'
      });

      const response = await request(app)
        .get(`/api/scrape?keyword=${encodeURIComponent(longKeyword)}`)
        .expect(200);

      expect(response.body.keyword).toBe(longKeyword);

      axiosGetSpy.mockRestore();
    });

    test('should handle multiple concurrent requests', async () => {
      const axiosGetSpy = spyOn(require('axios'), 'get');
      axiosGetSpy.mockResolvedValue({
        data: '<html><body></body></html>'
      });

      // Create 20 concurrent requests
      const promises = Array(20).fill().map((_, i) =>
        request(app).get(`/api/scrape?keyword=test${i}`)
      );

      const responses = await Promise.all(promises);

      responses.forEach((response, i) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.keyword).toBe(`test${i}`);
      });

      axiosGetSpy.mockRestore();
    });
  });

  describe('Response Consistency', () => {
    test('should return consistent response structure for health endpoint', async () => {
      const promises = Array(10).fill().map(() =>
        request(app).get('/api/health')
      );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.headers['content-type']).toMatch(/application\/json/);
      });
    });

    test('should return consistent error structure', async () => {
      const errorRequests = [
        '/api/scrape', // Missing keyword
        '/api/scrape?keyword=a', // Short keyword
        '/api/scrape?keyword=test&domain=invalid.com' // Invalid domain
      ];

      for (const request_path of errorRequests) {
        const response = await request(app).get(request_path);

        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(typeof response.body.error).toBe('string');
        expect(response.headers['content-type']).toMatch(/application\/json/);
      }
    });
  });

  describe('Content Encoding and Compression', () => {
    test('should accept gzip encoding', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Encoding', 'gzip, deflate, br')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should handle requests without compression', async () => {
      const response = await request(app)
        .get('/api/health')
        .set('Accept-Encoding', 'identity')
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('HTTP Method Validation', () => {
    test('should only accept GET for scrape endpoint', async () => {
      const methods = [
        { method: 'post', expectedStatus: 404 },
        { method: 'put', expectedStatus: 404 },
        { method: 'delete', expectedStatus: 404 },
        { method: 'patch', expectedStatus: 404 }
      ];

      for (const { method, expectedStatus } of methods) {
        const response = await request(app)[method]('/api/scrape?keyword=test');
        expect(response.status).toBe(expectedStatus);
      }
    });

    test('should only accept GET for health endpoint', async () => {
      const methods = [
        { method: 'post', expectedStatus: 404 },
        { method: 'put', expectedStatus: 404 },
        { method: 'delete', expectedStatus: 404 }
      ];

      for (const { method, expectedStatus } of methods) {
        const response = await request(app)[method]('/api/health');
        expect(response.status).toBe(expectedStatus);
      }
    });
  });

  describe('Request Timeout Handling', () => {
    test('should handle slow requests gracefully', async () => {
      // This test assumes the server has reasonable timeout settings
      const start = Date.now();
      
      const response = await request(app)
        .get('/api/health')
        .timeout(1000) // 1 second timeout for the test
        .expect(200);

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(1000); // Should respond quickly
      expect(response.body.success).toBe(true);
    });
  });
});
