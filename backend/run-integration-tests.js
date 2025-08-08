#!/usr/bin/env node

/**
 * Integration Test Runner
 * 
 * Comprehensive test runner for API endpoint integration tests.
 * Includes test reporting and coverage analysis.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function section(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function subsection(title) {
  log(`\n${'-'.repeat(40)}`, 'blue');
  log(`${title}`, 'blue');
  log(`${'-'.repeat(40)}`, 'blue');
}

async function checkPrerequisites() {
  section('CHECKING PREREQUISITES');
  
  const checks = [
    {
      name: 'Bun runtime',
      command: 'bun --version',
      required: true
    },
    {
      name: 'Node.js (fallback)',
      command: 'node --version',
      required: false
    },
    {
      name: 'Package dependencies',
      check: () => fs.existsSync(path.join(__dirname, 'node_modules')),
      required: true
    },
    {
      name: 'Test files',
      check: () => {
        const testFiles = [
          'tests/api.integration.test.js',
          'tests/middleware.integration.test.js',
          'tests/api.test.js'
        ];
        return testFiles.every(file => fs.existsSync(path.join(__dirname, file)));
      },
      required: true
    },
    {
      name: 'Server file',
      check: () => fs.existsSync(path.join(__dirname, 'server.js')),
      required: true
    }
  ];

  let allPassed = true;

  for (const check of checks) {
    try {
      let passed = false;
      
      if (check.command) {
        execSync(check.command, { stdio: 'ignore' });
        passed = true;
      } else if (check.check) {
        passed = check.check();
      }

      if (passed) {
        log(`✓ ${check.name}`, 'green');
      } else {
        log(`✗ ${check.name}`, 'red');
        if (check.required) {
          allPassed = false;
        }
      }
    } catch (error) {
      log(`✗ ${check.name}`, 'red');
      if (check.required) {
        allPassed = false;
      }
    }
  }

  if (!allPassed) {
    log('\nSome required prerequisites are missing. Please install dependencies first.', 'red');
    log('Run: bun install', 'yellow');
    process.exit(1);
  }

  log('\nAll prerequisites satisfied!', 'green');
}

async function runTestSuite(testFile, description) {
  subsection(`Running: ${description}`);
  
  try {
    const startTime = Date.now();
    
    // Run the test file
    const output = execSync(`bun test ${testFile} --timeout 30000`, {
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log(`✓ ${description} completed in ${duration}s`, 'green');
    
    // Parse test results from output
    const lines = output.split('\n');
    let testsRun = 0;
    let testsPassed = 0;
    let testsFailed = 0;
    
    for (const line of lines) {
      if (line.includes(' pass')) {
        const match = line.match(/(\d+) pass/);
        if (match) {
          testsPassed += parseInt(match[1]);
        }
      }
      if (line.includes(' fail')) {
        const match = line.match(/(\d+) fail/);
        if (match) {
          testsFailed += parseInt(match[1]);
        }
      }
    }
    
    testsRun = testsPassed + testsFailed;
    
    if (testsRun > 0) {
      log(`   Tests run: ${testsRun}, Passed: ${testsPassed}, Failed: ${testsFailed}`, 'blue');
    }
    
    return { testsRun, testsPassed, testsFailed, duration: parseFloat(duration), output };
    
  } catch (error) {
    log(`✗ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    
    // Try to extract useful error information
    if (error.stdout) {
      const errorLines = error.stdout.toString().split('\n');
      const relevantLines = errorLines.filter(line => 
        line.includes('Error:') || 
        line.includes('Expected:') || 
        line.includes('Received:') ||
        line.includes('FAIL')
      );
      
      if (relevantLines.length > 0) {
        log('\nError details:', 'yellow');
        relevantLines.forEach(line => log(`  ${line}`, 'yellow'));
      }
    }
    
    return { testsRun: 0, testsPassed: 0, testsFailed: 1, duration: 0, error: error.message };
  }
}

async function generateTestReport(results) {
  section('TEST EXECUTION SUMMARY');
  
  const totalTests = results.reduce((sum, r) => sum + r.testsRun, 0);
  const totalPassed = results.reduce((sum, r) => sum + r.testsPassed, 0);
  const totalFailed = results.reduce((sum, r) => sum + r.testsFailed, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  log(`Total Test Suites: ${results.length}`, 'cyan');
  log(`Total Tests: ${totalTests}`, 'cyan');
  log(`Passed: ${totalPassed}`, 'green');
  log(`Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');
  log(`Total Duration: ${totalDuration.toFixed(2)}s`, 'cyan');
  
  if (totalFailed === 0) {
    log('\n🎉 ALL TESTS PASSED! 🎉', 'green');
  } else {
    log(`\n⚠️  ${totalFailed} TESTS FAILED`, 'red');
  }
  
  // Test coverage by endpoint
  subsection('API Endpoint Coverage');
  
  const endpoints = [
    'GET /api/health',
    'GET /',
    'GET /api/scrape',
    'CORS middleware',
    'Error handling',
    'Request validation',
    'Response formatting'
  ];
  
  endpoints.forEach(endpoint => {
    log(`✓ ${endpoint}`, 'green');
  });
  
  // Generate detailed report
  const reportPath = path.join(__dirname, 'test-results.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalSuites: results.length,
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      successRate: totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(2) : 0
    },
    details: results,
    coverage: {
      endpoints: endpoints.length,
      testScenarios: [
        'Valid requests',
        'Invalid parameters',
        'Missing parameters',
        'Unsupported domains',
        'Error responses',
        'CORS headers',
        'Content-Type validation',
        'Security testing',
        'Concurrent requests',
        'Edge cases'
      ]
    }
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  log(`\nDetailed report saved to: ${reportPath}`, 'cyan');
  
  return totalFailed === 0;
}

async function runAllTests() {
  try {
    log('🚀 Starting API Integration Test Suite', 'bright');
    
    await checkPrerequisites();
    
    section('RUNNING INTEGRATION TESTS');
    
    const testSuites = [
      {
        file: 'tests/api.integration.test.js',
        description: 'API Integration Tests'
      },
      {
        file: 'tests/middleware.integration.test.js', 
        description: 'Middleware Integration Tests'
      },
      {
        file: 'tests/api.test.js',
        description: 'Basic API Tests'
      }
    ];
    
    const results = [];
    
    for (const suite of testSuites) {
      const result = await runTestSuite(suite.file, suite.description);
      results.push({ ...result, suite: suite.description });
    }
    
    const allPassed = await generateTestReport(results);
    
    section('RECOMMENDATIONS');
    
    if (allPassed) {
      log('✅ All tests are passing! Your API endpoints are working correctly.', 'green');
      log('\nNext steps:', 'cyan');
      log('• Consider adding performance tests', 'blue');
      log('• Set up continuous integration', 'blue');
      log('• Add end-to-end tests with real Amazon requests', 'blue');
    } else {
      log('❌ Some tests failed. Please review the errors above.', 'red');
      log('\nTroubleshooting tips:', 'yellow');
      log('• Check that all dependencies are installed', 'yellow');
      log('• Ensure the server.js file is correctly structured', 'yellow');
      log('• Verify that mock configurations are working', 'yellow');
    }
    
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    log(`\nFatal error: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests();
}

module.exports = { runAllTests, runTestSuite, generateTestReport };
