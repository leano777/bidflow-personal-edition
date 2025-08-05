// Test Pricing Engine - BF-002 Validation

import { PricingService } from './index';
import { EstimateRequest } from './types';

// Test cases covering the main measurement types
const TEST_ESTIMATES: EstimateRequest[] = [
  // Linear Feet Tests
  {
    description: 'chain link fence around backyard',
    quantity: 150,
    measurementType: 'linear',
    location: 'California'
  },
  {
    description: 'wood privacy fence installation',
    quantity: 200,
    measurementType: 'linear',
    location: 'San Francisco Bay Area'
  },
  {
    description: 'baseboard trim installation',
    quantity: 80,
    measurementType: 'linear'
  },

  // Square Feet Tests
  {
    description: 'hardwood flooring installation',
    quantity: 500,
    measurementType: 'square',
    location: 'Los Angeles'
  },
  {
    description: 'interior wall painting',
    quantity: 800,
    measurementType: 'square'
  },
  {
    description: 'ceramic tile flooring',
    quantity: 300,
    measurementType: 'square',
    qualityLevel: 'premium'
  },
  {
    description: 'asphalt shingle roof installation',
    quantity: 1200,
    measurementType: 'square',
    urgency: 'rush'
  },

  // Cubic Feet/Yards Tests
  {
    description: 'concrete driveway installation',
    quantity: 15,
    measurementType: 'cubic',
    location: 'San Diego'
  },
  {
    description: 'standard excavation',
    quantity: 25,
    measurementType: 'cubic'
  },

  // Count Tests
  {
    description: 'electrical outlet installation',
    quantity: 8,
    measurementType: 'count'
  },
  {
    description: 'plumbing fixture installation',
    quantity: 3,
    measurementType: 'count'
  },
  {
    description: 'interior door installation',
    quantity: 5,
    measurementType: 'count'
  }
];

export async function runPricingTests(): Promise<{
  success: boolean;
  results: any[];
  summary: any;
  errors: string[];
}> {
  console.log('🧪 Running Pricing Engine Tests...\n');
  
  const pricingService = new PricingService();
  const results: any[] = [];
  const errors: string[] = [];
  
  try {
    // Test database stats
    const dbStats = pricingService.getDatabaseStats();
    console.log('📊 Database Stats:');
    console.log(`  - Total Rules: ${dbStats.totalRules}`);
    console.log(`  - Active Rules: ${dbStats.activeRules}`);
    console.log(`  - Categories: ${dbStats.categories}`);
    console.log(`  - Materials: ${dbStats.materials}`);
    console.log(`  - Labor Rates: ${dbStats.laborRates}\n`);

    // Test individual estimates
    console.log('🔍 Testing Individual Estimates:\n');
    
    for (let i = 0; i < TEST_ESTIMATES.length; i++) {
      const request = TEST_ESTIMATES[i];
      
      try {
        console.log(`${i + 1}. Testing: "${request.description}"`);
        console.log(`   Quantity: ${request.quantity} ${request.measurementType}`);
        
        const result = await pricingService.generateEstimate(request);
        
        console.log(`   ✅ Category: ${result.aiAnalysis.suggestedCategory}`);
        console.log(`   ✅ Complexity: ${result.aiAnalysis.complexityLevel}`);
        console.log(`   ✅ Total Cost: $${result.calculation.lineItemTotal.toFixed(2)}`);
        console.log(`   ✅ Unit Cost: $${(result.calculation.lineItemTotal / request.quantity).toFixed(2)}/${result.calculation.unit}`);
        console.log(`   ✅ Confidence: ${(result.calculation.confidenceScore * 100).toFixed(1)}%`);
        console.log(`   ✅ Material: $${result.calculation.materialTotal.toFixed(2)} | Labor: $${result.calculation.laborTotal.toFixed(2)}`);
        
        if (result.validation.warnings.length > 0) {
          console.log(`   ⚠️  Warnings: ${result.validation.warnings.join(', ')}`);
        }
        
        if (result.aiAnalysis.riskFactors.length > 0) {
          console.log(`   🚨 Risk Factors: ${result.aiAnalysis.riskFactors.join(', ')}`);
        }
        
        console.log('');
        
        results.push({
          request,
          success: true,
          calculation: result.calculation,
          aiAnalysis: result.aiAnalysis,
          validation: result.validation
        });
        
      } catch (error) {
        console.log(`   ❌ Error: ${error}`);
        console.log('');
        
        errors.push(`${request.description}: ${error}`);
        results.push({
          request,
          success: false,
          error: error
        });
      }
    }

    // Test batch processing
    console.log('📦 Testing Batch Processing:\n');
    
    try {
      const batchResult = await pricingService.generateMultipleEstimates(TEST_ESTIMATES);
      
      console.log(`✅ Batch Results:`);
      console.log(`   - Processed Items: ${batchResult.calculations.length}/${TEST_ESTIMATES.length}`);
      console.log(`   - Total Estimate: $${batchResult.totalEstimate.toFixed(2)}`);
      console.log(`   - Average Confidence: ${(batchResult.summary.averageConfidence * 100).toFixed(1)}%`);
      console.log(`   - Risk Factors: ${batchResult.summary.riskFactors.length}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Batch processing failed: ${error}\n`);
      errors.push(`Batch processing: ${error}`);
    }

    // Test search functionality
    console.log('🔍 Testing Search Functionality:\n');
    
    const searchTests = [
      ['fence', 'fencing'],
      ['flooring', 'floor'],
      ['paint', 'painting'],
      ['electrical', 'outlet']
    ];
    
    for (const keywords of searchTests) {
      const searchResults = pricingService.searchPricingRules(keywords);
      console.log(`   Search "${keywords.join(', ')}": ${searchResults.length} results`);
    }
    console.log('');

    // Summary
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    console.log('📊 Test Summary:');
    console.log(`   ✅ Successful: ${successCount}/${TEST_ESTIMATES.length}`);
    console.log(`   ❌ Failed: ${failureCount}/${TEST_ESTIMATES.length}`);
    console.log(`   📋 Success Rate: ${((successCount / TEST_ESTIMATES.length) * 100).toFixed(1)}%`);
    
    if (errors.length > 0) {
      console.log('\n❌ Errors:');
      errors.forEach(error => console.log(`   - ${error}`));
    }
    
    return {
      success: successCount === TEST_ESTIMATES.length,
      results,
      summary: {
        total: TEST_ESTIMATES.length,
        successful: successCount,
        failed: failureCount,
        successRate: (successCount / TEST_ESTIMATES.length) * 100
      },
      errors
    };
    
  } catch (error) {
    console.error('💥 Test suite failed:', error);
    return {
      success: false,
      results: [],
      summary: { total: 0, successful: 0, failed: 0, successRate: 0 },
      errors: [`Test suite failure: ${error}`]
    };
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runPricingTests()
    .then(result => {
      if (result.success) {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
      } else {
        console.log('\n💥 Some tests failed.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}