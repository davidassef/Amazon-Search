export default {
  testMatch: ["**/*.test.js", "**/*.test.ts"],
  testTimeout: 30000,
  bail: false,
  verbose: true,
  
  // Setup files to run before tests
  setupFilesAfterEnv: ["./tests/setup.js"],
  
  // Test environment configuration
  testEnvironment: "node",
  
  // Global test variables
  globals: {
    NODE_ENV: "test",
    TEST_TIMEOUT: 30000
  },
  
  // Coverage configuration (optional)
  collectCoverage: false,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  
  // Module paths for easier imports
  moduleDirectories: ["node_modules", "tests"],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true
};
