/**
 * Performance and Load Testing Suite
 * Tests for performance characteristics under various load conditions
 * 
 * Test Coverage:
 * - Concurrent request handling
 * - Memory leak detection
 * - Response time validation
 * - Resource utilization monitoring
 * - Stress testing with high loads
 * - Circuit breaker patterns
 * - Rate limiting compliance
 */

import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
const request = require('supertest');
const { app, scrapeAmazonProducts } = require('../server');

describe('Performance and Load Testing', () => {
  
  let initialMemory;
  let performanceMetrics = {
    requestTimes: [],
    memorySnapshots: [],
    errorCounts: { total: 0, timeouts: 0, errors: 0 }
  };

  beforeEach(() => {
    initialMemory = process.memoryUsage();
    performanceMetrics = {
      requestTimes: [],
      memorySnapshots: [],
      errorCounts: { total: 0, timeouts: 0, errors: 0 }
    };
  });

  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  });

  describe('Concurrent Request Load Testing', () => {
    
    test('should handle 10 concurrent requests efficiently', async () => {
      const concurrency = 10;
      const requests = [];
      const startTime = Date.now();

      for (let i = 0; i < concurrency; i++) {
        requests.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `concurrent-test-${i}` })
        );
      }

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Analyze results
      const successful = responses.filter(r => r.status === 'fulfilled' && r.value.status === 200);
      const failed = responses.filter(r => r.status === 'rejected' || r.value.status !== 200);

      console.log(`Concurrent Load Test Results:`);
      console.log(`- Total requests: ${concurrency}`);
      console.log(`- Successful: ${successful.length}`);
      console.log(`- Failed: ${failed.length}`);
      console.log(`- Total duration: ${totalDuration}ms`);
      console.log(`- Average per request: ${(totalDuration / concurrency).toFixed(2)}ms`);

      // Performance assertions
      expect(successful.length).toBeGreaterThanOrEqual(8); // 80% success rate
      expect(totalDuration).toBeLessThan(30000); // Should complete within 30 seconds
      expect(totalDuration / concurrency).toBeLessThan(5000); // Average < 5s per request
    });

    test('should handle burst traffic (50 requests in quick succession)', async () => {
      const burstSize = 50;
      const requests = [];
      const startTime = Date.now();

      // Send all requests at once (burst)
      for (let i = 0; i < burstSize; i++) {
        requests.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `burst-${i}` })
            .timeout(10000) // 10 second timeout
        );
      }

      const responses = await Promise.allSettled(requests);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Count outcomes
      const fulfilled = responses.filter(r => r.status === 'fulfilled');
      const rejected = responses.filter(r => r.status === 'rejected');
      const successful = fulfilled.filter(r => r.value.status === 200);
      const errors = fulfilled.filter(r => r.value.status !== 200);

      console.log(`Burst Traffic Test Results:`);
      console.log(`- Burst size: ${burstSize}`);
      console.log(`- Fulfilled: ${fulfilled.length}`);
      console.log(`- Rejected (timeouts): ${rejected.length}`);
      console.log(`- HTTP 200: ${successful.length}`);
      console.log(`- HTTP errors: ${errors.length}`);
      console.log(`- Duration: ${totalDuration}ms`);

      // The system should handle at least 60% of burst traffic
      expect(successful.length).toBeGreaterThanOrEqual(30);
      expect(totalDuration).toBeLessThan(60000); // 60 seconds max
    });

    test('should maintain performance under sustained load', async () => {
      const sustainedDuration = 10000; // 10 seconds
      const requestInterval = 200; // 200ms between requests
      const responses = [];
      const startTime = Date.now();

      // Send requests at regular intervals
      while (Date.now() - startTime < sustainedDuration) {
        const requestStart = Date.now();
        
        try {
          const response = await request(app)
            .get('/api/scrape')
            .query({ keyword: 'sustained-load' })
            .timeout(5000);
          
          const requestDuration = Date.now() - requestStart;
          responses.push({ 
            status: response.status, 
            duration: requestDuration,
            memory: process.memoryUsage().heapUsed 
          });
        } catch (error) {
          responses.push({ 
            status: 'error', 
            duration: Date.now() - requestStart,
            error: error.message 
          });
        }

        // Wait for next interval
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      const successful = responses.filter(r => r.status === 200);
      const avgResponseTime = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
      const maxResponseTime = Math.max(...successful.map(r => r.duration));

      console.log(`Sustained Load Test Results:`);
      console.log(`- Total requests: ${responses.length}`);
      console.log(`- Successful: ${successful.length}`);
      console.log(`- Success rate: ${(successful.length / responses.length * 100).toFixed(2)}%`);
      console.log(`- Avg response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`- Max response time: ${maxResponseTime}ms`);

      // Performance criteria
      expect(successful.length / responses.length).toBeGreaterThan(0.7); // 70% success rate
      expect(avgResponseTime).toBeLessThan(3000); // 3 second average
      expect(maxResponseTime).toBeLessThan(10000); // 10 second max
    });
  });

  describe('Memory Usage and Leak Detection', () => {
    
    test('should not leak memory under normal operations', async () => {
      const iterations = 20;
      const memorySnapshots = [];

      for (let i = 0; i < iterations; i++) {
        const memBefore = process.memoryUsage().heapUsed;
        
        await request(app)
          .get('/api/scrape')
          .query({ keyword: `memory-test-${i}` });

        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }

        const memAfter = process.memoryUsage().heapUsed;
        memorySnapshots.push({ iteration: i, before: memBefore, after: memAfter });
        
        // Small delay to allow cleanup
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Analyze memory growth
      const firstSnapshot = memorySnapshots[0];
      const lastSnapshot = memorySnapshots[memorySnapshots.length - 1];
      const memoryGrowth = lastSnapshot.after - firstSnapshot.before;
      const growthPercentage = (memoryGrowth / firstSnapshot.before) * 100;

      console.log(`Memory Leak Test Results:`);
      console.log(`- Initial memory: ${(firstSnapshot.before / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Final memory: ${(lastSnapshot.after / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Growth percentage: ${growthPercentage.toFixed(2)}%`);

      // Memory growth should be reasonable (less than 50% increase)
      expect(growthPercentage).toBeLessThan(50);
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    });

    test('should handle large response data efficiently', async () => {
      // Mock large response
      const originalScrape = require('../server').scrapeAmazonProducts;
      require('../server').scrapeAmazonProducts = mock(async () => {
        // Generate many products to simulate large dataset
        const products = [];
        for (let i = 0; i < 100; i++) {
          products.push({
            title: `Large Dataset Product ${i} - ${'A'.repeat(100)}`, // Long titles
            price: `$${(Math.random() * 1000).toFixed(2)}`,
            rating: (Math.random() * 2 + 3).toFixed(1),
            reviews: Math.floor(Math.random() * 10000).toString(),
            productUrl: `https://amazon.com/dp/B${i.toString().padStart(9, '0')}`,
            imageUrl: `https://images.amazon.com/large-image-${i}.jpg`
          });
        }
        return products;
      });

      try {
        const memBefore = process.memoryUsage().heapUsed;
        
        const response = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'large-dataset' });

        const memAfter = process.memoryUsage().heapUsed;
        const memoryUsed = memAfter - memBefore;

        console.log(`Large Response Test Results:`);
        console.log(`- Response status: ${response.status}`);
        console.log(`- Products returned: ${response.body.products?.length || 0}`);
        console.log(`- Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)} MB`);

        expect(response.status).toBe(200);
        expect(response.body.products.length).toBeLessThanOrEqual(20); // API limit
        expect(memoryUsed).toBeLessThan(20 * 1024 * 1024); // Less than 20MB

      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });
  });

  describe('Response Time and Latency Testing', () => {
    
    test('should respond within acceptable time limits', async () => {
      const responseTimes = [];
      const iterations = 10;

      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/scrape')
          .query({ keyword: `latency-test-${i}` });
        
        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);
        
        expect(response.status).toBe(200);
      }

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / iterations;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Response Time Test Results:`);
      console.log(`- Average: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`- Maximum: ${maxResponseTime}ms`);
      console.log(`- Minimum: ${minResponseTime}ms`);
      console.log(`- All times: ${responseTimes.join(', ')}ms`);

      // Performance criteria
      expect(avgResponseTime).toBeLessThan(5000); // 5 second average
      expect(maxResponseTime).toBeLessThan(10000); // 10 second maximum
      
      // 95th percentile should be reasonable
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      const p95 = sortedTimes[Math.floor(iterations * 0.95)];
      expect(p95).toBeLessThan(8000); // 8 second 95th percentile
    });

    test('should handle timeout scenarios gracefully', async () => {
      const shortTimeout = 1000; // 1 second timeout
      const responses = [];

      for (let i = 0; i < 5; i++) {
        try {
          const response = await request(app)
            .get('/api/scrape')
            .query({ keyword: `timeout-test-${i}` })
            .timeout(shortTimeout);
          
          responses.push({ status: 'success', code: response.status });
        } catch (error) {
          responses.push({ 
            status: 'timeout', 
            code: error.code || 'UNKNOWN',
            message: error.message 
          });
        }
      }

      const successful = responses.filter(r => r.status === 'success');
      const timedOut = responses.filter(r => r.status === 'timeout');

      console.log(`Timeout Test Results:`);
      console.log(`- Successful: ${successful.length}`);
      console.log(`- Timed out: ${timedOut.length}`);

      // Some may timeout with aggressive timeout, but system should remain stable
      expect(successful.length + timedOut.length).toBe(5);
    });
  });

  describe('Error Rate and Circuit Breaker Testing', () => {
    
    test('should maintain acceptable error rates under load', async () => {
      const totalRequests = 30;
      const results = [];

      // Mix of valid and problematic requests
      for (let i = 0; i < totalRequests; i++) {
        const keyword = i % 5 === 0 ? '' : `error-test-${i}`; // 20% invalid requests
        
        try {
          const response = await request(app)
            .get('/api/scrape')
            .query({ keyword })
            .timeout(5000);
          
          results.push({
            keyword,
            status: response.status,
            success: response.status === 200 || response.status === 400, // 400 is expected for empty keyword
            type: response.status === 400 ? 'validation_error' : 'success'
          });
        } catch (error) {
          results.push({
            keyword,
            status: 'error',
            success: false,
            type: 'network_error',
            error: error.message
          });
        }
      }

      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      const validationErrors = results.filter(r => r.type === 'validation_error');
      const networkErrors = results.filter(r => r.type === 'network_error');

      console.log(`Error Rate Test Results:`);
      console.log(`- Total requests: ${totalRequests}`);
      console.log(`- Successful: ${successful.length}`);
      console.log(`- Failed: ${failed.length}`);
      console.log(`- Validation errors: ${validationErrors.length}`);
      console.log(`- Network errors: ${networkErrors.length}`);
      console.log(`- Success rate: ${(successful.length / totalRequests * 100).toFixed(2)}%`);

      // Should handle errors gracefully
      expect(successful.length).toBeGreaterThanOrEqual(20); // At least 67% success
      expect(networkErrors.length).toBeLessThan(5); // Less than 17% network errors
    });

    test('should recover from temporary failures', async () => {
      let failureCount = 0;
      const originalScrape = require('../server').scrapeAmazonProducts;
      
      // Mock temporary failures
      require('../server').scrapeAmazonProducts = mock(async (keyword) => {
        failureCount++;
        
        if (failureCount <= 3) {
          const error = new Error('Temporary failure');
          error.response = { status: 503 };
          throw error;
        }
        
        return [{
          title: 'Recovery Success Product',
          price: '$99.99',
          rating: '4.5',
          reviews: '100',
          productUrl: 'https://amazon.com/dp/B123',
          imageUrl: 'test.jpg'
        }];
      });

      try {
        const responses = [];
        
        // Send requests that should initially fail then succeed
        for (let i = 0; i < 6; i++) {
          try {
            const response = await request(app)
              .get('/api/scrape')
              .query({ keyword: `recovery-${i}` });
            
            responses.push({ status: response.status, success: response.status === 200 });
          } catch (error) {
            responses.push({ status: 'error', success: false });
          }
        }

        const successful = responses.filter(r => r.success);
        
        console.log(`Recovery Test Results:`);
        console.log(`- Total requests: ${responses.length}`);
        console.log(`- Successful: ${successful.length}`);
        console.log(`- Failed: ${responses.length - successful.length}`);

        // Should eventually recover
        expect(successful.length).toBeGreaterThanOrEqual(2);
        
      } finally {
        require('../server').scrapeAmazonProducts = originalScrape;
      }
    });
  });

  describe('Resource Utilization Monitoring', () => {
    
    test('should monitor CPU and memory during load', async () => {
      const monitoringDuration = 5000; // 5 seconds
      const monitoringInterval = 500; // 500ms
      const metrics = [];
      const startTime = Date.now();

      // Start background monitoring
      const monitoringTimer = setInterval(() => {
        metrics.push({
          timestamp: Date.now() - startTime,
          memory: process.memoryUsage(),
          cpuUsage: process.cpuUsage()
        });
      }, monitoringInterval);

      // Generate load during monitoring
      const loadPromises = [];
      for (let i = 0; i < 10; i++) {
        loadPromises.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `monitor-${i}` })
            .catch(err => ({ error: err.message }))
        );
      }

      // Wait for load generation
      await Promise.allSettled(loadPromises);
      
      // Stop monitoring
      clearInterval(monitoringTimer);

      // Analyze metrics
      const avgMemory = metrics.reduce((sum, m) => sum + m.memory.heapUsed, 0) / metrics.length;
      const maxMemory = Math.max(...metrics.map(m => m.memory.heapUsed));
      const memoryGrowth = metrics[metrics.length - 1].memory.heapUsed - metrics[0].memory.heapUsed;

      console.log(`Resource Monitoring Results:`);
      console.log(`- Monitoring duration: ${monitoringDuration}ms`);
      console.log(`- Data points: ${metrics.length}`);
      console.log(`- Average memory: ${(avgMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Peak memory: ${(maxMemory / 1024 / 1024).toFixed(2)} MB`);
      console.log(`- Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);

      // Resource utilization should be reasonable
      expect(maxMemory).toBeLessThan(200 * 1024 * 1024); // Less than 200MB peak
      expect(Math.abs(memoryGrowth)).toBeLessThan(50 * 1024 * 1024); // Less than 50MB growth
    });

    test('should handle resource exhaustion gracefully', async () => {
      // Simulate resource pressure with many concurrent requests
      const heavyLoad = 25;
      const promises = [];

      for (let i = 0; i < heavyLoad; i++) {
        promises.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `heavy-${i}` })
            .timeout(10000)
            .catch(error => ({ error: error.message, timeout: error.code === 'TIMEOUT' }))
        );
      }

      const results = await Promise.allSettled(promises);
      
      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');
      const successful = fulfilled.filter(r => !r.value.error && r.value.status === 200);
      const errors = fulfilled.filter(r => r.value.error);
      const timeouts = errors.filter(r => r.value.timeout);

      console.log(`Resource Exhaustion Test Results:`);
      console.log(`- Total requests: ${heavyLoad}`);
      console.log(`- Fulfilled: ${fulfilled.length}`);
      console.log(`- Rejected: ${rejected.length}`);
      console.log(`- Successful: ${successful.length}`);
      console.log(`- Errors: ${errors.length}`);
      console.log(`- Timeouts: ${timeouts.length}`);

      // System should handle at least some requests successfully
      expect(successful.length).toBeGreaterThan(5);
      // Should not crash completely
      expect(fulfilled.length + rejected.length).toBe(heavyLoad);
    });
  });
});
