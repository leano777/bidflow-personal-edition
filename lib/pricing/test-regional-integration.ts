// Test and Demo for Regional Cost Database Integration
// Demonstrates CSI-based pricing, location factors, and caching performance

import { 
  EnhancedPricingService, 
  enhancedPricingService,
  EnhancedEstimateRequest,
  EnhancedPricingResult 
} from './enhanced-pricing-service';
import { PricingQuery } from './types';
import { regionalCostDB } from './regional-database';

export class RegionalPricingDemo {
  private service: EnhancedPricingService;

  constructor() {
    this.service = enhancedPricingService;
  }

  /**
   * Initialize and run comprehensive demo
   */
  async runDemo(): Promise<void> {
    console.log('🏗️  Regional Cost Database Integration Demo');
    console.log('=' * 50);

    try {
      // Initialize the service
      console.log('\n1. 🚀 Initializing services...');
      await this.service.initialize();

      // Demo 1: Basic CSI-based pricing
      console.log('\n2. 💰 Testing CSI-based pricing lookup...');
      await this.demoCSIPricing();

      // Demo 2: Location factor adjustments
      console.log('\n3. 📍 Testing location factor adjustments...');
      await this.demoLocationFactors();

      // Demo 3: Escalation indices
      console.log('\n4. 📈 Testing escalation indices...');
      await this.demoEscalationIndices();

      // Demo 4: Cache performance
      console.log('\n5. ⚡ Testing cache performance...');
      await this.demoCachePerformance();

      // Demo 5: Batch processing
      console.log('\n6. 📊 Testing batch processing...');
      await this.demoBatchProcessing();

      // Demo 6: Comparison analysis
      console.log('\n7. 📋 Testing pricing comparison...');
      await this.demoPricingComparison();

      // Demo 8: Service health check
      console.log('\n8. 🏥 Service health check...');
      await this.demoHealthCheck();

      console.log('\n✅ Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Demo CSI-based pricing lookups
   */
  private async demoCSIPricing(): Promise<void> {
    const testQueries: PricingQuery[] = [
      {
        csiCode: '03 30 00',
        zipCode: '90210',
        quantity: 10,
        unit: 'CY'
      },
      {
        csiCode: '06 10 00', 
        zipCode: '94102',
        quantity: 500,
        unit: 'LF'
      },
      {
        csiCode: '09 91 00',
        zipCode: '92101',
        quantity: 1200,
        unit: 'SF'
      }
    ];

    console.log('   Testing direct CSI pricing queries...');

    for (const query of testQueries) {
      try {
        const result = await regionalCostDB.lookupPricing(query);
        console.log(`   🔍 CSI ${query.csiCode} in ${query.zipCode}:`);
        console.log(`      Unit Price: $${result.finalPrice.unitPrice.toFixed(2)}/${query.unit}`);
        console.log(`      Extended: $${result.finalPrice.extendedPrice.toFixed(2)}`);
        console.log(`      Confidence: ${(result.confidence * 100).toFixed(1)}%`);
        console.log(`      Query Time: ${result.queryTime}ms`);
        console.log(`      Cache Hit: ${result.cacheHit ? '✅' : '❌'}`);
      } catch (error) {
        console.error(`   ❌ Failed query for CSI ${query.csiCode}:`, error);
      }
    }
  }

  /**
   * Demo location factor adjustments across different zip codes
   */
  private async demoLocationFactors(): Promise<void> {
    const baseQuery: PricingQuery = {
      csiCode: '03 30 00',
      quantity: 10,
      unit: 'CY',
      includeLocationFactors: true
    };

    const zipCodes = ['90210', '94102', '92101', '95814']; // Different CA locations

    console.log('   Comparing same item across different locations...');
    
    for (const zipCode of zipCodes) {
      try {
        const result = await regionalCostDB.lookupPricing({ ...baseQuery, zipCode });
        const locationFactor = result.appliedFactors.locationFactor;
        
        console.log(`   📍 Zip ${zipCode}:`);
        console.log(`      Base Price: $${result.basePrice.totalUnitPrice.toFixed(2)}`);
        console.log(`      Location Factor: ${locationFactor.totalFactor}x`);
        console.log(`      Adjusted Price: $${result.finalPrice.unitPrice.toFixed(2)}`);
        console.log(`      Cost Index: ${locationFactor.costIndex}`);
      } catch (error) {
        console.error(`   ❌ Failed for zip ${zipCode}:`, error);
      }
    }
  }

  /**
   * Demo escalation indices over time
   */
  private async demoEscalationIndices(): Promise<void> {
    const baseQuery: PricingQuery = {
      csiCode: '06 10 00',
      zipCode: '90210',
      quantity: 100,
      unit: 'LF',
      includeEscalation: true
    };

    const quarters = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];

    console.log('   Testing escalation across quarters...');
    
    for (const quarter of quarters) {
      try {
        const result = await regionalCostDB.lookupPricing({ 
          ...baseQuery, 
          targetQuarter: quarter 
        });
        
        const escalation = result.appliedFactors.escalationFactor;
        
        console.log(`   📈 ${quarter}:`);
        console.log(`      Base: $${result.basePrice.totalUnitPrice.toFixed(2)}`);
        console.log(`      Location Adj: $${result.locationAdjusted.totalCost.toFixed(2)}`);
        console.log(`      Final (w/ Escalation): $${result.finalPrice.unitPrice.toFixed(2)}`);
        
        if (escalation) {
          console.log(`      Escalation: ${escalation.overallInflation.toFixed(2)}%`);
        }
      } catch (error) {
        console.error(`   ❌ Failed for ${quarter}:`, error);
      }
    }
  }

  /**
   * Demo cache performance improvements
   */
  private async demoCachePerformance(): Promise<void> {
    const query: PricingQuery = {
      csiCode: '03 30 00',
      zipCode: '90210',
      quantity: 5,
      unit: 'CY'
    };

    console.log('   Testing cache performance...');

    // First query - should be cache miss
    const start1 = Date.now();
    const result1 = await regionalCostDB.lookupPricing(query);
    const time1 = Date.now() - start1;

    // Second query - should be cache hit
    const start2 = Date.now();
    const result2 = await regionalCostDB.lookupPricing(query);
    const time2 = Date.now() - start2;

    console.log(`   🔥 First query (cache miss): ${time1}ms`);
    console.log(`   ⚡ Second query (cache hit): ${time2}ms`);
    console.log(`   📈 Performance improvement: ${((time1 - time2) / time1 * 100).toFixed(1)}%`);
    console.log(`   🎯 Cache hit confirmed: ${result2.cacheHit ? '✅' : '❌'}`);

    // Test cache statistics
    const cacheStats = await regionalCostDB['cache'].getCacheStats();
    console.log(`   📊 Cache stats:`);
    console.log(`      Total Keys: ${cacheStats.totalKeys}`);
    console.log(`      Memory Usage: ${cacheStats.memoryUsage}`);
    console.log(`      Hit Rate: ${(cacheStats.hitRate * 100).toFixed(1)}%`);
  }

  /**
   * Demo enhanced pricing service with both standard and regional pricing
   */
  private async demoPricingComparison(): Promise<void> {
    const requests: EnhancedEstimateRequest[] = [
      {
        description: 'Ready-mix concrete foundation pour',
        quantity: 15,
        measurementType: 'cubic',
        unit: 'CY',
        csiCode: '03 30 00',
        zipCode: '94102', // San Francisco - high cost area
        location: 'San Francisco, CA'
      },
      {
        description: 'Interior wall painting',
        quantity: 800,
        measurementType: 'square',
        unit: 'SF',
        csiCode: '09 91 00',
        zipCode: '92101', // San Diego - moderate cost area
        location: 'San Diego, CA'
      }
    ];

    console.log('   Comparing standard vs regional pricing...');

    for (const request of requests) {
      try {
        const result = await this.service.generateEnhancedEstimate(request);
        
        console.log(`   🏗️  Item: ${request.description}`);
        console.log(`      Standard Price: $${result.standardPricing.lineItemTotal.toFixed(2)}`);
        
        if (result.regionalPricing) {
          console.log(`      Regional Price: $${result.regionalPricing.finalPrice.extendedPrice.toFixed(2)}`);
          console.log(`      Variance: $${(result.analysis.priceComparison.variance || 0).toFixed(2)}`);
          console.log(`      Difference: ${(result.analysis.priceComparison.percentageDifference || 0).toFixed(1)}%`);
        }
        
        console.log(`      Recommended: $${result.recommendedPricing.lineItemTotal.toFixed(2)}`);
        console.log(`      Source: ${result.recommendedPricing.pricingSource}`);
        console.log(`      Confidence: ${(result.recommendedPricing.confidenceScore * 100).toFixed(1)}%`);
        console.log(`      Query Time: ${result.performance.queryTime}ms`);
        
        if (result.analysis.riskFactors.length > 0) {
          console.log(`      Risk Factors: ${result.analysis.riskFactors.join(', ')}`);
        }
        
        console.log('');
      } catch (error) {
        console.error(`   ❌ Failed enhanced estimate:`, error);
      }
    }
  }

  /**
   * Demo batch processing capabilities
   */
  private async demoBatchProcessing(): Promise<void> {
    const batchRequests: EnhancedEstimateRequest[] = [
      {
        description: 'Concrete slab',
        quantity: 20,
        measurementType: 'cubic',
        csiCode: '03 30 00',
        zipCode: '90210'
      },
      {
        description: 'Framing lumber',
        quantity: 800,
        measurementType: 'linear', 
        csiCode: '06 10 00',
        zipCode: '94102'
      },
      {
        description: 'Wall painting',
        quantity: 1200,
        measurementType: 'square',
        csiCode: '09 91 00',
        zipCode: '92101'
      },
      {
        description: 'More concrete',
        quantity: 8,
        measurementType: 'cubic',
        csiCode: '03 30 00',
        zipCode: '95814'
      },
      {
        description: 'More painting',
        quantity: 600,
        measurementType: 'square',
        csiCode: '09 91 00',
        zipCode: '90210'
      }
    ];

    console.log(`   Processing batch of ${batchRequests.length} requests...`);

    try {
      const batchResult = await this.service.generateBatchEnhancedEstimates(batchRequests);
      
      console.log(`   📊 Batch Results:`);
      console.log(`      Total Items: ${batchResult.summary.totalItems}`);
      console.log(`      Successful: ${batchResult.summary.successfulEstimates}`);
      console.log(`      Failed: ${batchResult.summary.failedEstimates}`);
      console.log(`      Total Value: $${batchResult.summary.totalValue.toFixed(2)}`);
      console.log(`      Avg Confidence: ${(batchResult.summary.averageConfidence * 100).toFixed(1)}%`);
      console.log(`      Total Time: ${batchResult.summary.totalQueryTime}ms`);
      console.log(`      Cache Hit Rate: ${(batchResult.summary.cacheHitRate * 100).toFixed(1)}%`);
      console.log(`      Avg Time/Item: ${(batchResult.summary.totalQueryTime / batchResult.summary.successfulEstimates).toFixed(0)}ms`);
      
    } catch (error) {
      console.error(`   ❌ Batch processing failed:`, error);
    }
  }

  /**
   * Demo service health monitoring
   */
  private async demoHealthCheck(): Promise<void> {
    try {
      const health = await this.service.getServiceHealth();
      
      console.log(`   🏥 Service Health: ${health.status}`);
      console.log(`   📈 Component Status:`);
      console.log(`      Standard Engine: ${health.services.standardEngine}`);
      console.log(`      Regional Database: ${health.services.regionalDatabase}`);
      console.log(`      Cache: ${health.services.cache.status} (${health.services.cache.latency}ms)`);
      
      console.log(`   📊 Regional DB Stats:`);
      console.log(`      CSI Codes: ${health.statistics.regionalDB.csiCodes}`);
      console.log(`      Zip Codes: ${health.statistics.regionalDB.zipCodes}`);
      console.log(`      Location Factors: ${health.statistics.regionalDB.locationFactors}`);
      console.log(`      Escalation Indices: ${health.statistics.regionalDB.escalationIndices}`);
      console.log(`      Last Sync: ${health.statistics.regionalDB.lastSync.toISOString()}`);
      
    } catch (error) {
      console.error(`   ❌ Health check failed:`, error);
    }
  }

  /**
   * Performance benchmark for sub-100ms requirement
   */
  async benchmarkPerformance(): Promise<void> {
    console.log('\n🏃‍♂️ Performance Benchmark - Sub-100ms Goal');
    console.log('=' * 40);

    const testCases = [
      { csiCode: '03 30 00', zipCode: '90210', quantity: 10, unit: 'CY' },
      { csiCode: '06 10 00', zipCode: '94102', quantity: 500, unit: 'LF' },
      { csiCode: '09 91 00', zipCode: '92101', quantity: 800, unit: 'SF' }
    ];

    let totalTime = 0;
    let cacheHits = 0;
    const results = [];

    // Warm up cache
    console.log('🔥 Warming up cache...');
    for (const testCase of testCases) {
      await regionalCostDB.lookupPricing(testCase);
    }

    console.log('⚡ Running performance benchmark...');

    // Run benchmark
    for (let i = 0; i < 10; i++) {
      const testCase = testCases[i % testCases.length];
      const start = Date.now();
      const result = await regionalCostDB.lookupPricing(testCase);
      const queryTime = Date.now() - start;
      
      totalTime += queryTime;
      if (result.cacheHit) cacheHits++;
      results.push(queryTime);
      
      console.log(`   Query ${i + 1}: ${queryTime}ms ${result.cacheHit ? '(cached)' : '(fresh)'}`);
    }

    const avgTime = totalTime / results.length;
    const maxTime = Math.max(...results);
    const minTime = Math.min(...results);
    const sub100Count = results.filter(time => time < 100).length;

    console.log('\n📊 Performance Results:');
    console.log(`   Average Query Time: ${avgTime.toFixed(1)}ms`);
    console.log(`   Min Query Time: ${minTime}ms`);
    console.log(`   Max Query Time: ${maxTime}ms`);
    console.log(`   Cache Hit Rate: ${(cacheHits / results.length * 100).toFixed(1)}%`);
    console.log(`   Sub-100ms Queries: ${sub100Count}/${results.length} (${(sub100Count/results.length*100).toFixed(1)}%)`);
    
    if (avgTime < 100) {
      console.log('   ✅ PASSED: Average query time under 100ms');
    } else {
      console.log('   ❌ FAILED: Average query time over 100ms');
    }

    if (sub100Count >= results.length * 0.95) {
      console.log('   ✅ PASSED: 95%+ queries under 100ms');
    } else {
      console.log('   ❌ FAILED: Less than 95% queries under 100ms');
    }
  }

  /**
   * Cleanup and shutdown
   */
  async cleanup(): Promise<void> {
    await this.service.shutdown();
    console.log('🧹 Demo cleanup completed');
  }
}

// Export for easy testing
export const demo = new RegionalPricingDemo();

// CLI interface
if (require.main === module) {
  (async () => {
    await demo.runDemo();
    await demo.benchmarkPerformance();
    await demo.cleanup();
    process.exit(0);
  })().catch(error => {
    console.error('Demo failed:', error);
    process.exit(1);
  });
}
