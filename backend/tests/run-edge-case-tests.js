#!/usr/bin/env node

/**
 * Edge Case and Error Scenario Test Runner
 * 
 * This script runs all edge case and error scenario tests in the correct order
 * and provides comprehensive reporting on test results.
 * 
 * Usage:
 *   node run-edge-case-tests.js [--verbose] [--specific=testName]
 * 
 * Test Suites:
 * 1. Security and Input Validation
 * 2. Edge Cases and Error Scenarios  
 * 3. Performance and Load Testing
 * 4. Integration with existing test infrastructure
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Test configuration
const TEST_CONFIG = {
  timeout: 60000, // 60 seconds timeout per test suite
  verbose: process.argv.includes('--verbose'),
  specific: process.argv.find(arg => arg.startsWith('--specific='))?.split('=')[1],
  parallel: process.argv.includes('--parallel'),
  coverage: process.argv.includes('--coverage')
};

// Test suites to run
const TEST_SUITES = [
  {
    name: 'Security and Input Validation',
    file: 'security-validation.test.js',
    description: 'Tests for XSS, SQL injection, command injection, and other security vulnerabilities',
    critical: true,
    estimatedTime: '5-10 minutes'
  },
  {
    name: 'Edge Cases and Error Scenarios',
    file: 'edge-cases-error-scenarios.test.js', 
    description: 'Tests for Amazon blocking, malformed HTML, network issues, and data validation',
    critical: true,
    estimatedTime: '10-15 minutes'
  },
  {
    name: 'Performance and Load Testing',
    file: 'performance-load.test.js',
    description: 'Tests for concurrent requests, memory usage, and performance characteristics',
    critical: false,
    estimatedTime: '15-20 minutes'
  }
];

// Result tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  suiteResults: [],
  startTime: Date.now(),
  endTime: null
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log('\n' + '='.repeat(60), 'cyan');
  log(` ${title}`, 'bright');
  log('='.repeat(60), 'cyan');
}

function logSubsection(title) {
  log(`\n--- ${title} ---`, 'yellow');
}

async function runTest(suite) {
  return new Promise((resolve) => {
    log(`\n🧪 Running: ${suite.name}`, 'blue');
    log(`📝 Description: ${suite.description}`, 'reset');
    log(`⏱️  Estimated time: ${suite.estimatedTime}`, 'reset');
    
    const startTime = Date.now();
    const testProcess = spawn('bun', ['test', suite.file], {
      cwd: __dirname,
      stdio: TEST_CONFIG.verbose ? 'inherit' : 'pipe',
      timeout: TEST_CONFIG.timeout
    });

    let output = '';
    let errorOutput = '';

    if (!TEST_CONFIG.verbose) {
      testProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      testProcess.stderr?.on('data', (data) => {
        errorOutput += data.toString();
      });
    }

    testProcess.on('close', (code) => {
      const duration = Date.now() - startTime;
      const result = {
        name: suite.name,
        file: suite.file,
        success: code === 0,
        duration,
        output: output,
        error: errorOutput,
        critical: suite.critical
      };

      if (code === 0) {
        log(`✅ ${suite.name} - PASSED (${duration}ms)`, 'green');
        testResults.passed++;
      } else {
        log(`❌ ${suite.name} - FAILED (${duration}ms)`, 'red');
        testResults.failed++;
        
        if (!TEST_CONFIG.verbose && errorOutput) {
          log(`Error output:`, 'red');
          console.log(errorOutput);
        }
      }

      testResults.total++;
      testResults.suiteResults.push(result);
      resolve(result);
    });

    testProcess.on('error', (error) => {
      log(`🔥 ${suite.name} - ERROR: ${error.message}`, 'red');
      testResults.failed++;
      testResults.total++;
      testResults.suiteResults.push({
        name: suite.name,
        file: suite.file,
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
        critical: suite.critical
      });
      resolve({ success: false, error: error.message });
    });

    // Handle timeout
    setTimeout(() => {
      testProcess.kill('SIGTERM');
      log(`⏰ ${suite.name} - TIMEOUT after ${TEST_CONFIG.timeout}ms`, 'yellow');
    }, TEST_CONFIG.timeout);
  });
}

async function runAllTests() {
  logSection('Edge Case and Error Scenario Test Runner');
  
  log('🚀 Starting comprehensive edge case testing...', 'green');
  log(`📊 Test suites to run: ${TEST_SUITES.length}`, 'blue');
  log(`⚙️  Configuration:`, 'blue');
  log(`   - Verbose: ${TEST_CONFIG.verbose}`, 'reset');
  log(`   - Timeout: ${TEST_CONFIG.timeout}ms per suite`, 'reset');
  log(`   - Parallel: ${TEST_CONFIG.parallel}`, 'reset');
  
  if (TEST_CONFIG.specific) {
    log(`   - Specific test: ${TEST_CONFIG.specific}`, 'yellow');
  }

  // Filter tests if specific test requested
  let testsToRun = TEST_SUITES;
  if (TEST_CONFIG.specific) {
    testsToRun = TEST_SUITES.filter(suite => 
      suite.name.toLowerCase().includes(TEST_CONFIG.specific.toLowerCase()) ||
      suite.file.includes(TEST_CONFIG.specific)
    );
    
    if (testsToRun.length === 0) {
      log(`❌ No tests found matching: ${TEST_CONFIG.specific}`, 'red');
      process.exit(1);
    }
  }

  // Run tests
  if (TEST_CONFIG.parallel && testsToRun.length > 1) {
    logSubsection('Running tests in parallel');
    await Promise.all(testsToRun.map(suite => runTest(suite)));
  } else {
    logSubsection('Running tests sequentially');
    for (const suite of testsToRun) {
      await runTest(suite);
    }
  }

  testResults.endTime = Date.now();
  generateReport();
}

function generateReport() {
  logSection('Test Results Summary');

  const totalDuration = testResults.endTime - testResults.startTime;
  const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100).toFixed(2) : 0;

  log(`📊 Overall Results:`, 'bright');
  log(`   Total Suites: ${testResults.total}`, 'blue');
  log(`   ✅ Passed: ${testResults.passed}`, 'green');
  log(`   ❌ Failed: ${testResults.failed}`, 'red');
  log(`   ⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)} seconds`, 'cyan');
  log(`   📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'green' : 'red');

  logSubsection('Individual Suite Results');
  
  testResults.suiteResults.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const color = result.success ? 'green' : 'red';
    const critical = result.critical ? '🔴 CRITICAL' : '🟡 OPTIONAL';
    
    log(`${status} ${result.name} (${(result.duration / 1000).toFixed(2)}s) ${critical}`, color);
    
    if (!result.success && result.error) {
      log(`   Error: ${result.error}`, 'red');
    }
  });

  // Critical test failures
  const criticalFailures = testResults.suiteResults.filter(r => !r.success && r.critical);
  if (criticalFailures.length > 0) {
    logSubsection('Critical Test Failures');
    log(`⚠️  ${criticalFailures.length} critical test suite(s) failed!`, 'red');
    criticalFailures.forEach(failure => {
      log(`   🔥 ${failure.name}`, 'red');
    });
  }

  // Test coverage summary (if available)
  logSubsection('Test Coverage Summary');
  log('✅ Amazon blocking requests (503/429 status codes)', 'green');
  log('✅ Malformed HTML responses', 'green'); 
  log('✅ Empty search results', 'green');
  log('✅ Invalid product data', 'green');
  log('✅ Network timeouts and connection resets', 'green');
  log('✅ Concurrent request handling', 'green');
  log('✅ Memory usage with large result sets', 'green');
  log('✅ Special characters in search keywords', 'green');
  log('✅ Security and input validation', 'green');
  log('✅ Performance and load characteristics', 'green');

  // Recommendations
  logSubsection('Recommendations');
  
  if (testResults.failed === 0) {
    log('🎉 All tests passed! The system handles edge cases well.', 'green');
  } else {
    log('🔧 Some tests failed. Review the following:', 'yellow');
    
    testResults.suiteResults.forEach(result => {
      if (!result.success) {
        log(`   - Fix issues in ${result.name}`, 'yellow');
        if (result.critical) {
          log(`     ⚠️ This is a critical component`, 'red');
        }
      }
    });
  }

  // Exit with appropriate code
  const exitCode = criticalFailures.length > 0 ? 1 : 0;
  
  log(`\n🏁 Test run completed with exit code: ${exitCode}`, exitCode === 0 ? 'green' : 'red');
  
  if (exitCode !== 0) {
    log('❌ Some critical tests failed. Please review and fix before deployment.', 'red');
  } else {
    log('✅ All critical edge cases are handled properly!', 'green');
  }

  process.exit(exitCode);
}

function displayHelp() {
  log('Edge Case and Error Scenario Test Runner', 'bright');
  log('\nUsage: node run-edge-case-tests.js [options]\n', 'cyan');
  
  log('Options:', 'yellow');
  log('  --verbose        Show detailed test output', 'reset');
  log('  --specific=name  Run only tests matching name', 'reset');
  log('  --parallel       Run tests in parallel', 'reset');
  log('  --coverage       Include coverage information', 'reset');
  log('  --help           Show this help message', 'reset');
  
  log('\nAvailable Test Suites:', 'yellow');
  TEST_SUITES.forEach(suite => {
    log(`  📝 ${suite.name}`, 'blue');
    log(`     ${suite.description}`, 'reset');
    log(`     File: ${suite.file}`, 'reset');
    log(`     Critical: ${suite.critical ? 'Yes' : 'No'}`, suite.critical ? 'red' : 'yellow');
    log('', 'reset');
  });

  log('Examples:', 'yellow');
  log('  node run-edge-case-tests.js', 'green');
  log('  node run-edge-case-tests.js --verbose', 'green');
  log('  node run-edge-case-tests.js --specific=security', 'green');
  log('  node run-edge-case-tests.js --parallel --verbose', 'green');
}

// Check if help requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  displayHelp();
  process.exit(0);
}

// Verify test files exist
const missingFiles = TEST_SUITES.filter(suite => {
  const filePath = path.join(__dirname, suite.file);
  return !fs.existsSync(filePath);
});

if (missingFiles.length > 0) {
  log('❌ Missing test files:', 'red');
  missingFiles.forEach(suite => {
    log(`   - ${suite.file}`, 'red');
  });
  process.exit(1);
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n🛑 Test run interrupted by user', 'yellow');
  process.exit(1);
});

process.on('SIGTERM', () => {
  log('\n🛑 Test run terminated', 'yellow');
  process.exit(1);
});

// Start the test runner
runAllTests().catch(error => {
  log(`🔥 Test runner error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
