/**
 * Test Lifecycle Manager
 * Handles proper test setup, teardown, and server lifecycle management
 */

import { spawn } from 'child_process';
import { TEST_SERVER } from './constants.js';
import axios from 'axios';

class TestLifecycleManager {
  constructor() {
    this.serverProcess = null;
    this.cleanup = [];
    this.mocks = [];
    this.timers = [];
  }

  /**
   * Start test server before running tests
   * @param {number} timeout - Timeout in milliseconds to wait for server start
   * @returns {Promise<boolean>} True if server started successfully
   */
  async startTestServer(timeout = 10000) {
    if (this.serverProcess) {
      console.warn('Test server is already running');
      return true;
    }

    console.log(`🚀 Starting test server on port ${TEST_SERVER.PORT}...`);
    
    return new Promise((resolve, reject) => {
      // Set environment variables for test mode
      const env = {
        ...process.env,
        NODE_ENV: 'test',
        PORT: TEST_SERVER.PORT,
        LOG_LEVEL: 'error' // Reduce logging noise in tests
      };

      // Start the server process
      this.serverProcess = spawn('node', ['server.js'], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false
      });

      let output = '';
      let startupTimer;

      // Handle server output
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        // Check if server has started
        if (output.includes(`Server running on port ${TEST_SERVER.PORT}`) || 
            output.includes('Server is ready')) {
          clearTimeout(startupTimer);
          console.log('✅ Test server started successfully');
          resolve(true);
        }
      });

      // Handle server errors
      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('EADDRINUSE')) {
          clearTimeout(startupTimer);
          console.log('⚠️ Port already in use, assuming server is already running');
          this.serverProcess = null;
          resolve(true);
        } else {
          console.error('Server error:', error);
        }
      });

      // Handle process exit
      this.serverProcess.on('exit', (code, signal) => {
        this.serverProcess = null;
        if (code !== 0) {
          console.error(`Server process exited with code ${code}, signal ${signal}`);
        }
      });

      // Set timeout for server startup
      startupTimer = setTimeout(() => {
        console.error('❌ Server startup timeout');
        this.stopTestServer();
        reject(new Error('Test server startup timeout'));
      }, timeout);
    });
  }

  /**
   * Stop test server after tests complete
   */
  async stopTestServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping test server...');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('Force killing test server process');
          this.serverProcess.kill('SIGKILL');
          resolve();
        }, 5000);

        this.serverProcess.on('exit', () => {
          clearTimeout(timeout);
          this.serverProcess = null;
          console.log('✅ Test server stopped');
          resolve();
        });

        // Try graceful shutdown first
        this.serverProcess.kill('SIGTERM');
      });
    }
  }

  /**
   * Check if test server is running and responsive
   * @returns {Promise<boolean>} True if server is healthy
   */
  async isServerHealthy() {
    try {
      const response = await axios.get(`${TEST_SERVER.BASE_URL}/api/health`, {
        timeout: 2000
      });
      return response.status === 200 && response.data.success === true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Wait for test server to be ready
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds
   * @param {number} pollInterval - Polling interval in milliseconds
   * @returns {Promise<boolean>} True if server becomes ready
   */
  async waitForServer(maxWaitTime = 30000, pollInterval = 1000) {
    console.log('⏳ Waiting for test server to be ready...');
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      if (await this.isServerHealthy()) {
        console.log('✅ Test server is ready');
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    console.error('❌ Test server did not become ready in time');
    return false;
  }

  /**
   * Register a cleanup function to be called during teardown
   * @param {Function} cleanupFn - Cleanup function
   */
  addCleanup(cleanupFn) {
    this.cleanup.push(cleanupFn);
  }

  /**
   * Register a mock to be restored during teardown
   * @param {Object} mock - Mock object with restore method
   */
  addMock(mock) {
    this.mocks.push(mock);
  }

  /**
   * Register a timer to be cleared during teardown
   * @param {*} timer - Timer ID from setTimeout/setInterval
   */
  addTimer(timer) {
    this.timers.push(timer);
  }

  /**
   * Set up test environment before each test
   */
  async beforeEach() {
    // Ensure environment is set correctly
    process.env.NODE_ENV = 'test';
    
    // Clear any existing data
    this.cleanup = [];
    this.mocks = [];
    this.timers = [];
    
    // Suppress console output during tests (optional)
    if (process.env.SUPPRESS_TEST_OUTPUT === 'true') {
      this.originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
      };
      
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }
  }

  /**
   * Clean up test environment after each test
   */
  async afterEach() {
    // Run all registered cleanup functions
    for (const cleanupFn of this.cleanup) {
      try {
        await cleanupFn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }

    // Restore all mocks
    for (const mock of this.mocks) {
      try {
        if (mock.restore) {
          mock.restore();
        } else if (mock.mockRestore) {
          mock.mockRestore();
        }
      } catch (error) {
        console.error('Mock restore error:', error);
      }
    }

    // Clear all timers
    for (const timer of this.timers) {
      try {
        clearTimeout(timer);
        clearInterval(timer);
      } catch (error) {
        console.error('Timer clear error:', error);
      }
    }

    // Restore console if it was suppressed
    if (this.originalConsole) {
      console.log = this.originalConsole.log;
      console.warn = this.originalConsole.warn;
      console.error = this.originalConsole.error;
      this.originalConsole = null;
    }

    // Clear arrays
    this.cleanup = [];
    this.mocks = [];
    this.timers = [];
  }

  /**
   * Set up test suite before all tests
   */
  async beforeAll() {
    console.log('🧪 Setting up test environment...');
    
    // Start test server if not already running
    if (!await this.isServerHealthy()) {
      await this.startTestServer();
      await this.waitForServer();
    } else {
      console.log('✅ Test server is already running and healthy');
    }

    // Set up global error handlers
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
    });
  }

  /**
   * Clean up test suite after all tests
   */
  async afterAll() {
    console.log('🧹 Cleaning up test environment...');
    
    // Run final cleanup
    await this.afterEach();
    
    // Stop test server
    await this.stopTestServer();
    
    // Wait a bit for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✅ Test environment cleanup complete');
  }

  /**
   * Create a test timeout helper
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise} Promise that rejects after timeout
   */
  createTimeout(timeout) {
    return new Promise((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Test timeout after ${timeout}ms`));
      }, timeout);
      
      this.addTimer(timer);
    });
  }

  /**
   * Wait for a condition to be true
   * @param {Function} condition - Function that returns boolean
   * @param {number} timeout - Maximum time to wait in milliseconds
   * @param {number} interval - Check interval in milliseconds
   * @returns {Promise<boolean>} True if condition becomes true
   */
  async waitForCondition(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    return false;
  }

  /**
   * Create a safe async test wrapper that handles cleanup
   * @param {Function} testFn - Test function
   * @returns {Function} Wrapped test function
   */
  wrapTest(testFn) {
    return async (...args) => {
      try {
        await this.beforeEach();
        const result = await testFn(...args);
        return result;
      } finally {
        await this.afterEach();
      }
    };
  }
}

// Global lifecycle manager instance
const lifecycleManager = new TestLifecycleManager();

// Export convenience functions
export const {
  startTestServer,
  stopTestServer,
  isServerHealthy,
  waitForServer,
  addCleanup,
  addMock,
  addTimer,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
  createTimeout,
  waitForCondition,
  wrapTest
} = lifecycleManager;

export { lifecycleManager as default };
