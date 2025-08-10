// Quantity Normalizer Testing Module - BF-005 Implementation

import { VoiceMeasurement } from './types';
import { QuantityNormalizer } from './quantity-normalizer';

/**
 * Test the quantity normalizer with sample data
 */
export async function testQuantityNormalizer(): Promise<void> {
  console.log('🔧 Quantity Normalizer Test');
  console.log('============================');

  const normalizer = new QuantityNormalizer();

  // Create sample measurements that would come from voice parsing
  const testMeasurements: VoiceMeasurement[] = [
    {
      id: 'test_1',
      rawText: '20 by 30 feet',
      parsedValue: 600,
      unit: 'SF',
      type: 'square',
      confidence: 0.9,
      context: 'living room flooring'
    },
    {
      id: 'test_2', 
      rawText: '20 feet',
      parsedValue: 20,
      unit: 'LF',
      type: 'linear',
      confidence: 0.8,
      context: 'living room length'
    },
    {
      id: 'test_3',
      rawText: '30 linear feet',
      parsedValue: 30,
      unit: 'LF',
      type: 'linear', 
      confidence: 0.85,
      context: 'living room width'
    },
    {
      id: 'test_4',
      rawText: '10 cubic yards',
      parsedValue: 10,
      unit: 'CY',
      type: 'cubic',
      confidence: 0.92,
      context: 'concrete for foundation'
    },
    {
      id: 'test_5',
      rawText: '15 square feet', 
      parsedValue: 15,
      unit: 'sq ft',
      type: 'square',
      confidence: 0.75,
      context: 'bathroom tile'
    },
    {
      id: 'test_6',
      rawText: '3 outlets',
      parsedValue: 3,
      unit: 'each',
      type: 'count',
      confidence: 0.95,
      context: 'electrical work'
    },
    {
      id: 'test_7', 
      rawText: '12 by 8 feet',
      parsedValue: 96,
      unit: 'SF',
      type: 'square',
      confidence: 0.88,
      context: 'bedroom flooring'
    },
    {
      id: 'test_8',
      rawText: '100 LF',
      parsedValue: 100,
      unit: 'LF', 
      type: 'linear',
      confidence: 0.82,
      context: 'baseboard trim'
    }
  ];

  const context = 'residential renovation project including kitchen, bathroom, and bedroom work';

  console.log(`\n📏 Testing with ${testMeasurements.length} sample measurements...`);

  try {
    // Run the normalization process
    const result = await normalizer.normalizeQuantities(testMeasurements, context);

    // Display results
    console.log('\n✅ Normalization Results:');
    console.log('========================');

    console.log(`\n📊 Quality Metrics:`);
    console.log(`- Overall Confidence: ${(result.qualityMetrics.overallConfidence * 100).toFixed(1)}%`);
    console.log(`- Normalization Success: ${(result.qualityMetrics.normalizationSuccess * 100).toFixed(1)}%`);
    console.log(`- Validation Errors: ${result.qualityMetrics.validationErrors}`);
    console.log(`- Ambiguity Count: ${result.qualityMetrics.ambiguityCount}`);
    console.log(`- Completeness Score: ${(result.qualityMetrics.completenessScore * 100).toFixed(1)}%`);

    console.log(`\n🔄 Normalized Quantities (${result.normalizedQuantities.length}):`);
    result.normalizedQuantities.forEach(nq => {
      console.log(`- ${nq.originalMeasurement.rawText} → ${nq.normalizedValue.toFixed(2)} ${nq.standardUnit}`);
      console.log(`  Conversion: ${nq.conversionSource}, Confidence: ${(nq.confidence * 100).toFixed(1)}%`);
      if (nq.validationNotes.length > 0) {
        console.log(`  Notes: ${nq.validationNotes.join(', ')}`);
      }
    });

    console.log(`\n✅ Dimension Validations (${result.dimensionValidations.length}):`);
    if (result.dimensionValidations.length > 0) {
      result.dimensionValidations.forEach(dv => {
        console.log(`- ${dv.description}`);
        console.log(`  Status: ${dv.validationLevel.toUpperCase()}, Deviation: ${(dv.deviation * 100).toFixed(1)}%`);
        if (dv.recommendations.length > 0) {
          console.log(`  Recommendations: ${dv.recommendations.join(', ')}`);
        }
      });
    } else {
      console.log('- No dimensional relationships detected in test data');
    }

    console.log(`\n⚠️ Flagged Ambiguities (${result.flaggedAmbiguities.length}):`);
    if (result.flaggedAmbiguities.length > 0) {
      result.flaggedAmbiguities.forEach(amb => {
        console.log(`- ${amb.type.toUpperCase()}: ${amb.description}`);
        console.log(`  Severity: ${amb.severity}, Requires User Confirmation: ${amb.requiresUserConfirmation}`);
        console.log(`  Action: ${amb.recommendedAction}`);
        if (amb.possibleInterpretations.length > 0) {
          console.log(`  Interpretations:`);
          amb.possibleInterpretations.forEach(interp => {
            console.log(`    - ${interp.interpretation}: ${interp.value} ${interp.unit} (${(interp.confidence * 100).toFixed(1)}%)`);
          });
        }
      });
    } else {
      console.log('- No ambiguities detected in test data');
    }

    console.log(`\n📋 Aggregated Items (${result.aggregatedItems.length}):`);
    result.aggregatedItems.forEach(item => {
      console.log(`- ${item.category}: ${item.totalQuantity.toFixed(2)} ${item.standardUnit}`);
      console.log(`  Description: ${item.description}`);
      console.log(`  Confidence: ${(item.confidence * 100).toFixed(1)}%, Sources: ${item.sourceItems.length}`);
      if (item.phase) {
        console.log(`  Phase: ${item.phase}`);
      }
      if (item.alternate) {
        console.log(`  Alternate: ${item.alternate}`);
      }
      if (item.notes.length > 0) {
        console.log(`  Notes: ${item.notes.join(', ')}`);
      }
    });

    console.log(`\n🗒️ Processing Notes:`);
    result.processingNotes.forEach(note => {
      console.log(`- ${note}`);
    });

    console.log('\n✅ Quantity Normalizer test completed successfully!');

    // Test edge cases
    console.log('\n🧪 Testing Edge Cases:');
    console.log('=====================');

    const edgeCaseMeasurements: VoiceMeasurement[] = [
      {
        id: 'edge_1',
        rawText: '15 by 20',  // Missing unit
        parsedValue: 300,
        unit: '',
        type: 'square',
        confidence: 0.6,
        context: 'room size'
      },
      {
        id: 'edge_2', 
        rawText: 'about 50 f',  // Unclear unit
        parsedValue: 50,
        unit: 'f',
        type: 'linear',
        confidence: 0.5,
        context: 'wall length'
      }
    ];

    const edgeResult = await normalizer.normalizeQuantities(edgeCaseMeasurements, 'edge case testing');
    
    console.log(`\nEdge Case Results:`);
    console.log(`- Ambiguities: ${edgeResult.flaggedAmbiguities.length}`);
    console.log(`- Validation Errors: ${edgeResult.qualityMetrics.validationErrors}`);
    console.log(`- Overall Confidence: ${(edgeResult.qualityMetrics.overallConfidence * 100).toFixed(1)}%`);

    edgeResult.flaggedAmbiguities.forEach(amb => {
      console.log(`  - ${amb.type}: ${amb.description} (${amb.severity})`);
    });

    console.log('\n✅ Edge case testing completed!');

  } catch (error) {
    console.error('❌ Quantity Normalizer test failed:', error);
  }
}

/**
 * Test dimensional validation specifically
 */
export async function testDimensionalValidation(): Promise<void> {
  console.log('\n🎯 Dimensional Validation Test');
  console.log('==============================');

  const normalizer = new QuantityNormalizer();

  // Create measurements that should validate against each other
  const dimensionTestMeasurements: VoiceMeasurement[] = [
    {
      id: 'dim_1',
      rawText: '12 feet length',
      parsedValue: 12,
      unit: 'LF', 
      type: 'linear',
      confidence: 0.9,
      context: 'room dimensions'
    },
    {
      id: 'dim_2',
      rawText: '10 feet width',
      parsedValue: 10,
      unit: 'LF',
      type: 'linear', 
      confidence: 0.9,
      context: 'room dimensions'
    },
    {
      id: 'dim_3',
      rawText: '120 square feet', 
      parsedValue: 120,
      unit: 'SF',
      type: 'square',
      confidence: 0.85,
      context: 'room dimensions'
    },
    {
      id: 'dim_4',
      rawText: '8 feet height',
      parsedValue: 8, 
      unit: 'LF',
      type: 'linear',
      confidence: 0.9,
      context: 'room dimensions'
    },
    {
      id: 'dim_5',
      rawText: '960 cubic feet',
      parsedValue: 960,
      unit: 'CF',
      type: 'cubic',
      confidence: 0.8,
      context: 'room dimensions'
    }
  ];

  const result = await normalizer.normalizeQuantities(dimensionTestMeasurements, 'dimensional validation test');

  console.log(`\n📐 Dimensional Validation Results:`);
  result.dimensionValidations.forEach(dv => {
    console.log(`- ${dv.description}`);
    console.log(`  Match: ${dv.dimensionMatch ? '✅' : '❌'}, Level: ${dv.validationLevel.toUpperCase()}`);
    console.log(`  Tolerance: ${(dv.tolerance * 100).toFixed(1)}%, Deviation: ${(dv.deviation * 100).toFixed(1)}%`);
    
    if (dv.impliedDimensions.length !== undefined) {
      console.log(`  Dimensions: L=${dv.impliedDimensions.length}, W=${dv.impliedDimensions.width}, H=${dv.impliedDimensions.height}`);
    }
    
    if (dv.calculatedArea) {
      console.log(`  Calculated Area: ${dv.calculatedArea.toFixed(2)} vs Provided: ${dv.providedTotal.toFixed(2)}`);
    }
    
    if (dv.calculatedVolume) {
      console.log(`  Calculated Volume: ${dv.calculatedVolume.toFixed(2)} vs Provided: ${dv.providedTotal.toFixed(2)}`);
    }
    
    if (dv.recommendations.length > 0) {
      console.log(`  Recommendations: ${dv.recommendations.join(', ')}`);
    }
  });

  console.log('\n✅ Dimensional validation test completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  (async () => {
    await testQuantityNormalizer();
    await testDimensionalValidation();
  })();
}
