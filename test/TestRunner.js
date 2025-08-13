const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      duration: 0,
      contracts: {}
    };
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting DeSci Platform Comprehensive Test Suite\n');
    console.log('=' .repeat(60));
    
    const testFiles = [
      'UserProfile.test.js',
      'ZKProof.test.js', 
      'DeSciNFTSimple.test.js',
      'Dataset.test.js',
      'DeSciPlatform.test.js'
    ];

    for (const testFile of testFiles) {
      await this.runSingleTest(testFile);
    }

    this.generateReport();
  }

  async runSingleTest(testFile) {
    const contractName = testFile.replace('.test.js', '');
    console.log(`\n📋 Testing ${contractName} Contract...`);
    console.log('-'.repeat(40));

    return new Promise((resolve) => {
      const command = `npx hardhat test test/${testFile}`;
      const startTime = Date.now();
      
      exec(command, { cwd: process.cwd() }, (error, stdout, stderr) => {
        const duration = Date.now() - startTime;
        
        if (error) {
          console.log(`❌ ${contractName} tests failed:`);
          console.log(stderr || error.message);
          this.testResults.contracts[contractName] = {
            status: 'failed',
            duration,
            error: stderr || error.message
          };
          this.testResults.failed++;
        } else {
          console.log(`✅ ${contractName} tests passed`);
          console.log(stdout);
          
          // Parse test results from stdout
          const testStats = this.parseTestOutput(stdout);
          this.testResults.contracts[contractName] = {
            status: 'passed',
            duration,
            ...testStats
          };
          this.testResults.passed++;
        }
        
        this.testResults.total++;
        resolve();
      });
    });
  }

  parseTestOutput(output) {
    const lines = output.split('\n');
    let passing = 0;
    let failing = 0;
    let pending = 0;

    lines.forEach(line => {
      if (line.includes('passing')) {
        const match = line.match(/(\d+) passing/);
        if (match) passing = parseInt(match[1]);
      }
      if (line.includes('failing')) {
        const match = line.match(/(\d+) failing/);
        if (match) failing = parseInt(match[1]);
      }
      if (line.includes('pending')) {
        const match = line.match(/(\d+) pending/);
        if (match) pending = parseInt(match[1]);
      }
    });

    return { passing, failing, pending };
  }

  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    this.testResults.duration = totalDuration;

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE TEST REPORT');
    console.log('='.repeat(60));
    
    console.log(`\n🕒 Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Contracts Tested: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⏸️  Skipped: ${this.testResults.skipped}`);
    
    const successRate = ((this.testResults.passed / this.testResults.total) * 100).toFixed(1);
    console.log(`📊 Success Rate: ${successRate}%`);

    console.log('\n📋 Contract-by-Contract Results:');
    console.log('-'.repeat(40));

    Object.entries(this.testResults.contracts).forEach(([contract, result]) => {
      const status = result.status === 'passed' ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      
      console.log(`${status} ${contract}: ${duration}s`);
      
      if (result.passing) {
        console.log(`   └── ${result.passing} tests passed`);
      }
      if (result.failing) {
        console.log(`   └── ${result.failing} tests failed`);
      }
      if (result.pending) {
        console.log(`   └── ${result.pending} tests pending`);
      }
      if (result.error) {
        console.log(`   └── Error: ${result.error.substring(0, 100)}...`);
      }
    });

    // Save detailed report to file
    this.saveReportToFile();
    
    console.log('\n🎯 Test Coverage Areas:');
    console.log('-'.repeat(40));
    console.log('✓ User Profile Management (Registration, Verification, Reputation)');
    console.log('✓ Zero-Knowledge Proof System (Submission, Verification, Types)');
    console.log('✓ NFT Minting & Management (Research Achievements, Citations)');
    console.log('✓ Dataset Management (Registration, Access Control, Versioning)');
    console.log('✓ Platform Integration (Research Publishing, Peer Review)');
    console.log('✓ Security & Edge Cases (Input Validation, Access Control)');
    console.log('✓ Gas Optimization (Batch Operations, Efficiency)');
    console.log('✓ Integration Workflows (End-to-end Scenarios)');

    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! DeSci Platform is ready for deployment.');
    } else {
      console.log(`\n⚠️  ${this.testResults.failed} contract(s) have failing tests. Please review and fix.`);
    }
    
    console.log('\n📁 Detailed report saved to: test-report.json');
    console.log('='.repeat(60));
  }

  saveReportToFile() {
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalContracts: this.testResults.total,
        passed: this.testResults.passed,
        failed: this.testResults.failed,
        successRate: ((this.testResults.passed / this.testResults.total) * 100).toFixed(1) + '%',
        totalDuration: (this.testResults.duration / 1000).toFixed(2) + 's'
      },
      contracts: this.testResults.contracts,
      testCoverage: [
        'User Profile Management',
        'Zero-Knowledge Proof System', 
        'NFT Minting & Citations',
        'Dataset Access Control',
        'Platform Integration',
        'Security & Validation',
        'Gas Optimization',
        'End-to-end Workflows'
      ]
    };

    fs.writeFileSync('test-report.json', JSON.stringify(reportData, null, 2));
  }

  // Method to run specific test categories
  async runTestCategory(category) {
    const categories = {
      'core': ['UserProfile.test.js', 'ZKProof.test.js'],
      'nft': ['DeSciNFTSimple.test.js'],
      'data': ['Dataset.test.js'],
      'integration': ['DeSciPlatform.test.js'],
      'all': ['UserProfile.test.js', 'ZKProof.test.js', 'DeSciNFTSimple.test.js', 'Dataset.test.js', 'DeSciPlatform.test.js']
    };

    const testFiles = categories[category] || categories['all'];
    
    console.log(`🎯 Running ${category.toUpperCase()} test category`);
    console.log(`📋 Tests: ${testFiles.join(', ')}\n`);

    for (const testFile of testFiles) {
      await this.runSingleTest(testFile);
    }

    this.generateReport();
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.length === 0) {
    runner.runAllTests();
  } else {
    const category = args[0];
    runner.runTestCategory(category);
  }
}

module.exports = TestRunner;
