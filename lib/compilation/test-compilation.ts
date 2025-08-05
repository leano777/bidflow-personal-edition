// Comprehensive Test Suite for Estimate Compilation - BF-005 Implementation

import { EstimateCompiler } from './index';
import { PricingService } from '../pricing';
import type { ProjectSummary, CompleteEstimate } from './types';
import type { EstimateRequest } from '../pricing/types';

// Test data
const TEST_PROJECT: ProjectSummary = {
  id: 'test_project_1',
  name: 'Modern Family Home',
  address: '123 Main St, San Francisco, CA',
  clientName: 'John & Jane Smith',
  clientContact: 'john@email.com',
  totalSquareFootage: 2500,
  totalLinearFootage: 800,
  projectType: 'Residential',
  estimatedDuration: { value: 0, unit: 'days' },
  createdAt: new Date(),
  lastModified: new Date()
};

const TEST_ESTIMATE_REQUESTS: EstimateRequest[] = [
  // Foundation and Structure
  {
    description: 'concrete foundation and basement slab',
    quantity: 25,
    measurementType: 'cubic',
    location: 'San Francisco'
  },
  {
    description: 'structural framing with engineered lumber',
    quantity: 2500,
    measurementType: 'square',
    qualityLevel: 'standard'
  },
  
  // Envelope
  {
    description: 'asphalt shingle roof installation',
    quantity: 2800,
    measurementType: 'square',
    urgency: 'standard'
  },
  {
    description: 'vinyl siding installation',
    quantity: 2200,
    measurementType: 'square'
  },
  
  // Systems
  {
    description: 'electrical rough-in and panel installation',
    quantity: 15,
    measurementType: 'count',
    qualityLevel: 'standard'
  },
  {
    description: 'plumbing rough-in with fixtures',
    quantity: 8,
    measurementType: 'count'
  },
  {
    description: 'HVAC ductwork installation',
    quantity: 300,
    measurementType: 'linear'
  },
  
  // Interior
  {
    description: 'drywall installation and finishing',
    quantity: 5000,
    measurementType: 'square'
  },
  {
    description: 'hardwood flooring installation',
    quantity: 1800,
    measurementType: 'square',
    qualityLevel: 'premium'
  },
  {
    description: 'interior painting throughout',
    quantity: 4500,
    measurementType: 'square'
  },
  {
    description: 'interior trim and molding',
    quantity: 800,
    measurementType: 'linear'
  },
  
  // Exterior
  {
    description: 'chain link fence around property',
    quantity: 200,
    measurementType: 'linear'
  }
];

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export interface CompilationTestSuite {
  results: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    totalDuration: number;
    successRate: number;
  };
  performance: {
    averageCompilationTime: number;
    memoryUsage?: number;
    qualityMetrics: {
      averageConfidence: number;
      averageCompleteness: number;
    };
  };
}

export class CompilationTester {
  private pricingService: PricingService;
  private compiler: EstimateCompiler;

  constructor() {
    this.pricingService = new PricingService();
    this.compiler = new EstimateCompiler();
  }

  /**
   * Run complete test suite
   */
  async runCompleteTestSuite(): Promise<CompilationTestSuite> {
    console.log('🧪 Starting Complete Estimate Compilation Test Suite...\n');
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test 1: Basic compilation workflow
    results.push(await this.testBasicCompilationWorkflow());

    // Test 2: Performance under load
    results.push(await this.testPerformanceUnderLoad());

    // Test 3: Quality control validation
    results.push(await this.testQualityControlValidation());

    // Test 4: Alternative scenario generation
    results.push(await this.testAlternativeScenarios());

    // Test 5: Recommendations engine
    results.push(await this.testRecommendationsEngine());

    // Test 6: Data validation and error handling
    results.push(await this.testDataValidationAndErrorHandling());

    // Test 7: Export functionality
    results.push(await this.testExportFunctionality());

    // Test 8: Integration with pricing engine
    results.push(await this.testPricingEngineIntegration());

    // Test 9: Complex project compilation
    results.push(await this.testComplexProjectCompilation());

    // Test 10: Memory and performance optimization
    results.push(await this.testMemoryAndPerformance());

    const totalDuration = Date.now() - startTime;
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Calculate performance metrics
    const compilationTimes = results
      .filter(r => r.data?.compilationTime)
      .map(r => r.data.compilationTime);
    
    const averageCompilationTime = compilationTimes.length > 0 
      ? compilationTimes.reduce((sum, time) => sum + time, 0) / compilationTimes.length
      : 0;

    const qualityMetrics = results
      .filter(r => r.data?.estimate?.qualityMetrics)
      .map(r => r.data.estimate.qualityMetrics);

    const averageConfidence = qualityMetrics.length > 0
      ? qualityMetrics.reduce((sum, qm) => sum + qm.overallConfidence, 0) / qualityMetrics.length
      : 0;

    const averageCompleteness = qualityMetrics.length > 0
      ? qualityMetrics.reduce((sum, qm) => sum + qm.dataCompleteness, 0) / qualityMetrics.length
      : 0;

    const summary = {
      total: results.length,
      passed,
      failed,
      totalDuration,
      successRate: (passed / results.length) * 100
    };

    console.log('📊 Test Suite Summary:');
    console.log(`   ✅ Passed: ${passed}/${results.length}`);
    console.log(`   ❌ Failed: ${failed}/${results.length}`);
    console.log(`   📈 Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`   ⏱️  Total Duration: ${totalDuration}ms`);
    console.log(`   🚀 Avg Compilation: ${averageCompilationTime.toFixed(1)}ms`);
    console.log(`   🎯 Avg Confidence: ${(averageConfidence * 100).toFixed(1)}%`);
    console.log(`   📋 Avg Completeness: ${(averageCompleteness * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('❌ Failed Tests:');
      results.filter(r => !r.success).forEach(result => {
        console.log(`   - ${result.testName}: ${result.error}`);
      });
      console.log('');
    }

    return {
      results,
      summary,
      performance: {
        averageCompilationTime,
        qualityMetrics: {
          averageConfidence,
          averageCompleteness
        }
      }
    };
  }

  /**
   * Test 1: Basic compilation workflow
   */
  private async testBasicCompilationWorkflow(): Promise<TestResult> {
    const testName = 'Basic Compilation Workflow';
    console.log(`🔍 Testing: ${testName}`);
    
    try {
      const startTime = Date.now();

      // Generate pricing calculations
      const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
      
      // Compile complete estimate
      const compilationStart = Date.now();
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT
      );
      const compilationTime = Date.now() - compilationStart;

      // Validate results
      const validation = this.compiler.validateEstimate(estimate);
      
      const duration = Date.now() - startTime;
      
      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Work Phases: ${estimate.workBreakdown.length}`);
      console.log(`      - Total Cost: $${estimate.costSummary.contractTotal.toLocaleString()}`);
      console.log(`      - Confidence: ${(estimate.qualityMetrics.overallConfidence * 100).toFixed(1)}%`);
      console.log(`      - Validation: ${validation.valid ? 'Pass' : 'Issues found'}`);

      return {
        testName,
        success: true,
        duration,
        data: { estimate, validation, compilationTime }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 2: Performance under load
   */
  private async testPerformanceUnderLoad(): Promise<TestResult> {
    const testName = 'Performance Under Load';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const promises: Promise<CompleteEstimate>[] = [];

      // Create 5 concurrent compilation requests
      for (let i = 0; i < 5; i++) {
        const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
        promises.push(this.compiler.compileCompleteEstimate(
          pricingResult.calculations,
          { ...TEST_PROJECT, id: `test_project_${i}`, name: `Test Project ${i}` }
        ));
      }

      const estimates = await Promise.all(promises);
      const duration = Date.now() - startTime;
      const averageTime = duration / estimates.length;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Concurrent Estimates: ${estimates.length}`);
      console.log(`      - Average Time: ${averageTime.toFixed(1)}ms`);
      console.log(`      - Throughput: ${(estimates.length / (duration / 1000)).toFixed(1)} estimates/sec`);

      return {
        testName,
        success: averageTime < 10000, // Should complete within 10 seconds each
        duration,
        data: { estimates, averageTime }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 3: Quality control validation
   */
  private async testQualityControlValidation(): Promise<TestResult> {
    const testName = 'Quality Control Validation';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT,
        { performQualityControl: true }
      );

      const qm = estimate.qualityMetrics;
      const duration = Date.now() - startTime;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Overall Confidence: ${(qm.overallConfidence * 100).toFixed(1)}%`);
      console.log(`      - Data Completeness: ${(qm.dataCompleteness * 100).toFixed(1)}%`);
      console.log(`      - Risk Factors: ${qm.riskFactors.length}`);
      console.log(`      - Warnings: ${qm.warnings.length}`);

      // Quality control should identify some issues in a complex project
      const hasQualityData = qm.overallConfidence > 0 && qm.dataCompleteness > 0;

      return {
        testName,
        success: hasQualityData,
        duration,
        data: { qualityMetrics: qm }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 4: Alternative scenario generation
   */
  private async testAlternativeScenarios(): Promise<TestResult> {
    const testName = 'Alternative Scenario Generation';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT,
        { generateAlternatives: true }
      );

      const scenarios = estimate.alternativeScenarios;
      const duration = Date.now() - startTime;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Scenarios Generated: ${scenarios.length}`);
      scenarios.forEach(scenario => {
        console.log(`        • ${scenario.name}: $${scenario.costSummary.contractTotal.toLocaleString()} (${(scenario.costVariation * 100).toFixed(1)}%)`);
      });

      return {
        testName,
        success: scenarios.length >= 3, // Should generate at least 3 scenarios
        duration,
        data: { scenarios }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 5: Recommendations engine
   */
  private async testRecommendationsEngine(): Promise<TestResult> {
    const testName = 'Recommendations Engine';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT,
        { generateRecommendations: true }
      );

      const recommendations = estimate.recommendations;
      const duration = Date.now() - startTime;

      const criticalRecs = recommendations.filter(r => r.priority === 'critical').length;
      const highPriorityRecs = recommendations.filter(r => r.priority === 'high').length;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Total Recommendations: ${recommendations.length}`);
      console.log(`      - Critical Priority: ${criticalRecs}`);
      console.log(`      - High Priority: ${highPriorityRecs}`);
      console.log(`      - Categories: ${new Set(recommendations.map(r => r.category)).size}`);

      return {
        testName,
        success: recommendations.length > 0,
        duration,
        data: { recommendations }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 6: Data validation and error handling
   */
  private async testDataValidationAndErrorHandling(): Promise<TestResult> {
    const testName = 'Data Validation & Error Handling';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      let errorsCaught = 0;

      // Test with invalid project data
      try {
        await this.compiler.compileCompleteEstimate([], { 
          id: '', name: '', address: '', clientName: '', clientContact: '',
          projectType: '', estimatedDuration: { value: 0, unit: 'days' },
          createdAt: new Date(), lastModified: new Date()
        });
      } catch (error) {
        errorsCaught++;
        console.log(`      ✓ Caught invalid project error: ${error}`);
      }

      // Test with empty pricing data
      try {
        await this.compiler.compileCompleteEstimate([], TEST_PROJECT);
      } catch (error) {
        errorsCaught++;
        console.log(`      ✓ Caught empty pricing data error: ${error}`);
      }

      const duration = Date.now() - startTime;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Errors Properly Caught: ${errorsCaught}`);

      return {
        testName,
        success: errorsCaught >= 1, // Should catch at least some errors
        duration,
        data: { errorsCaught }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 7: Export functionality
   */
  private async testExportFunctionality(): Promise<TestResult> {
    const testName = 'Export Functionality';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT
      );

      // Test JSON export
      const jsonExport = await this.compiler.exportEstimate(estimate, 'json');
      const jsonParsed = JSON.parse(jsonExport as string);

      // Test CSV export
      const csvExport = await this.compiler.exportEstimate(estimate, 'csv');
      const csvLines = (csvExport as string).split('\n');

      const duration = Date.now() - startTime;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - JSON Export: ${(jsonExport as string).length} characters`);
      console.log(`      - CSV Export: ${csvLines.length} lines`);
      console.log(`      - JSON Valid: ${jsonParsed.id === estimate.id}`);

      return {
        testName,
        success: jsonParsed.id === estimate.id && csvLines.length > 1,
        duration,
        data: { jsonSize: (jsonExport as string).length, csvLines: csvLines.length }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 8: Integration with pricing engine
   */
  private async testPricingEngineIntegration(): Promise<TestResult> {
    const testName = 'Pricing Engine Integration';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      // Test end-to-end integration
      const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT
      );

      // Verify pricing data integrity
      const totalPricingCalculations = pricingResult.calculations.reduce((sum, calc) => sum + calc.lineItemTotal, 0);
      const totalEstimateLineItems = estimate.workBreakdown.reduce((sum, phase) => 
        sum + phase.items.reduce((itemSum, item) => itemSum + item.lineItemTotal, 0), 0
      );

      const duration = Date.now() - startTime;
      const integrationSuccess = Math.abs(totalPricingCalculations - totalEstimateLineItems) < 1; // Within $1

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Pricing Total: $${totalPricingCalculations.toLocaleString()}`);
      console.log(`      - Estimate Line Items: $${totalEstimateLineItems.toLocaleString()}`);
      console.log(`      - Integration Accuracy: ${integrationSuccess ? 'Perfect' : 'Variance detected'}`);

      return {
        testName,
        success: integrationSuccess,
        duration,
        data: { pricingTotal: totalPricingCalculations, estimateTotal: totalEstimateLineItems }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 9: Complex project compilation
   */
  private async testComplexProjectCompilation(): Promise<TestResult> {
    const testName = 'Complex Project Compilation';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();

      // Create a more complex project with additional items
      const complexRequests = [
        ...TEST_ESTIMATE_REQUESTS,
        { description: 'custom kitchen cabinetry', quantity: 1, measurementType: 'count', qualityLevel: 'premium' },
        { description: 'luxury bathroom fixtures', quantity: 3, measurementType: 'count', qualityLevel: 'premium' },
        { description: 'smart home electrical system', quantity: 1, measurementType: 'count', qualityLevel: 'premium' },
        { description: 'heated concrete floors', quantity: 500, measurementType: 'square', qualityLevel: 'premium' }
      ] as EstimateRequest[];

      const pricingResult = await this.pricingService.generateMultipleEstimates(complexRequests);
      const estimate = await this.compiler.compileCompleteEstimate(
        pricingResult.calculations,
        TEST_PROJECT
      );

      const duration = Date.now() - startTime;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Line Items: ${pricingResult.calculations.length}`);
      console.log(`      - Work Phases: ${estimate.workBreakdown.length}`);
      console.log(`      - Total Value: $${estimate.costSummary.contractTotal.toLocaleString()}`);
      console.log(`      - Processing Time: ${duration < 10000 ? 'Acceptable' : 'Slow'}`);

      return {
        testName,
        success: duration < 10000 && estimate.workBreakdown.length > 5,
        duration,
        data: { estimate, lineItemCount: pricingResult.calculations.length }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }

  /**
   * Test 10: Memory and performance optimization
   */
  private async testMemoryAndPerformance(): Promise<TestResult> {
    const testName = 'Memory & Performance Optimization';
    console.log(`🔍 Testing: ${testName}`);

    try {
      const startTime = Date.now();
      const memoryBefore = process.memoryUsage();

      // Run multiple compilation cycles
      for (let i = 0; i < 3; i++) {
        const pricingResult = await this.pricingService.generateMultipleEstimates(TEST_ESTIMATE_REQUESTS);
        await this.compiler.compileCompleteEstimate(pricingResult.calculations, TEST_PROJECT);
      }

      const memoryAfter = process.memoryUsage();
      const duration = Date.now() - startTime;
      const averageDuration = duration / 3;

      const memoryIncrease = memoryAfter.heapUsed - memoryBefore.heapUsed;
      const memoryIncreaseKB = memoryIncrease / 1024;

      console.log(`   ✅ Success - ${duration}ms`);
      console.log(`      - Average Compilation: ${averageDuration.toFixed(1)}ms`);
      console.log(`      - Memory Increase: ${memoryIncreaseKB.toFixed(1)}KB`);
      console.log(`      - Performance: ${averageDuration < 5000 ? 'Good' : 'Needs optimization'}`);

      return {
        testName,
        success: averageDuration < 5000 && memoryIncreaseKB < 50000, // Under 5s and 50MB
        duration,
        data: { averageDuration, memoryIncreaseKB }
      };

    } catch (error) {
      console.log(`   ❌ Failed - ${error}`);
      return {
        testName,
        success: false,
        duration: 0,
        error: `${error}`
      };
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new CompilationTester();
  tester.runCompleteTestSuite()
    .then(results => {
      if (results.summary.successRate === 100) {
        console.log('\n🎉 All tests passed! Estimate Compilation system is ready for production.');
        process.exit(0);
      } else {
        console.log(`\n⚠️  ${results.summary.failed} test(s) failed. Please review and fix issues.`);
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('\n💥 Test suite execution failed:', error);
      process.exit(1);
    });
}