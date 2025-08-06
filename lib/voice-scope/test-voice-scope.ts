// Voice-to-Scope System Test Suite - BF-003 Validation
import { 
  VoiceScopeService,
  MeasurementParser,
  ScopeOrganizer,
  TranscriptionService,
  ScopeCapture,
  VoiceMeasurement
} from './index';

class VoiceScopeTestSuite {
  private service: VoiceScopeService;
  private measurementParser: MeasurementParser;
  private scopeOrganizer: ScopeOrganizer;

  constructor() {
    this.service = new VoiceScopeService();
    this.measurementParser = new MeasurementParser();
    this.scopeOrganizer = new ScopeOrganizer();
  }

  /**
   * Run complete test suite
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Voice-to-Scope Test Suite');
    console.log('============================');
    
    const results = {
      measurementTests: 0,
      scopeTests: 0,
      integrationTests: 0,
      failedTests: 0
    };

    try {
      // Test 1: Measurement Extraction
      console.log('\n📏 Testing Measurement Extraction...');
      await this.testMeasurementExtraction();
      results.measurementTests++;
      console.log('✅ Measurement extraction tests passed');

      // Test 2: Scope Organization  
      console.log('\n🏗️ Testing Scope Organization...');
      await this.testScopeOrganization();
      results.scopeTests++;
      console.log('✅ Scope organization tests passed');

      // Test 3: Integration Tests
      console.log('\n🔗 Testing Integration...');
      await this.testIntegration();
      results.integrationTests++;
      console.log('✅ Integration tests passed');

      // Test 4: Performance Tests
      console.log('\n⚡ Testing Performance...');
      await this.testPerformance();
      console.log('✅ Performance tests passed');

      // Test 5: Feature Support
      console.log('\n🔧 Testing Feature Support...');
      this.testFeatureSupport();
      console.log('✅ Feature support tests passed');

    } catch (error) {
      console.error('❌ Test failed:', error);
      results.failedTests++;
    }

    // Summary
    console.log('\n📊 Test Results Summary');
    console.log('======================');
    console.log(`✅ Measurement Tests: ${results.measurementTests}`);
    console.log(`✅ Scope Tests: ${results.scopeTests}`);
    console.log(`✅ Integration Tests: ${results.integrationTests}`);
    console.log(`❌ Failed Tests: ${results.failedTests}`);
    console.log(`📈 Success Rate: ${((5 - results.failedTests) / 5 * 100).toFixed(1)}%`);

    if (results.failedTests === 0) {
      console.log('\n🎉 All tests passed! Voice-to-Scope system is working correctly.');
    }
  }

  /**
   * Test measurement extraction functionality
   */
  async testMeasurementExtraction(): Promise<void> {
    const testCases = [
      {
        text: "We need to install hardwood flooring in the living room that's about 20 by 15 feet",
        expectedMeasurements: [
          { value: 300, unit: 'SF', type: 'square' }
        ]
      },
      {
        text: "Install 200 linear feet of chain link fencing around the backyard",
        expectedMeasurements: [
          { value: 200, unit: 'LF', type: 'linear' }
        ]
      },
      {
        text: "The bathroom needs 3 new outlets and we should replace 2 fixtures",
        expectedMeasurements: [
          { value: 3, unit: 'EA', type: 'count' },
          { value: 2, unit: 'EA', type: 'count' }
        ]
      },
      {
        text: "Pour concrete slab 24 by 24 feet and 6 inches thick",
        expectedMeasurements: [
          { value: 576, unit: 'SF', type: 'square' }
        ]
      },
      {
        text: "Frame wall with 2x4 studs, twenty-five linear feet total",
        expectedMeasurements: [
          { value: 25, unit: 'LF', type: 'linear' }
        ]
      },
      {
        text: "Install half inch plywood subfloor in 250 square feet area",
        expectedMeasurements: [
          { value: 0.5, unit: 'IN', type: 'linear' },
          { value: 250, unit: 'SF', type: 'square' }
        ]
      }
    ];

    let passedTests = 0;
    
    for (const testCase of testCases) {
      const measurements = this.measurementParser.extractMeasurements(testCase.text);
      
      console.log(`  Input: "${testCase.text}"`);
      console.log(`  Found: ${measurements.length} measurements`);
      
      measurements.forEach(m => {
        console.log(`    - ${m.rawText}: ${m.parsedValue} ${m.unit} (${m.type}, ${(m.confidence * 100).toFixed(1)}%)`);
      });

      // Validate measurements
      if (measurements.length >= testCase.expectedMeasurements.length) {
        passedTests++;
      }
      
      console.log('');
    }

    console.log(`  Passed: ${passedTests}/${testCases.length} test cases`);
    
    if (passedTests < testCases.length * 0.8) {
      throw new Error('Measurement extraction accuracy below 80%');
    }
  }

  /**
   * Test scope organization functionality
   */
  async testScopeOrganization(): Promise<void> {
    const testScopes = [
      {
        description: "Kitchen remodel with new cabinets, countertops, and flooring",
        transcription: "We need to remodel the kitchen with new custom cabinets along the 12 foot wall. Install granite countertops about 25 square feet and hardwood flooring 200 square feet. Also need new electrical outlets and plumbing for the sink.",
        expectedCategories: ['Cabinets', 'Countertops', 'Flooring', 'Electrical', 'Plumbing']
      },
      {
        description: "Bathroom renovation project",
        transcription: "Bathroom renovation includes removing old tile about 8 by 10 feet and installing new ceramic flooring. Replace 3 plumbing fixtures including toilet, sink and shower. Need new electrical outlets and ventilation fan.",
        expectedCategories: ['Demolition', 'Flooring', 'Plumbing', 'Electrical']
      },
      {
        description: "Home addition with full construction",
        transcription: "Build new room addition 16 by 20 feet. Need foundation work, framing with 2x6 studs, roofing with asphalt shingles, electrical panel upgrade, plumbing rough-in, insulation, drywall, and interior painting.",
        expectedCategories: ['Excavation', 'Concrete', 'Framing', 'Roofing', 'Electrical', 'Plumbing', 'Insulation', 'Drywall', 'Painting']
      }
    ];

    let passedTests = 0;

    for (const testScope of testScopes) {
      console.log(`  Testing: ${testScope.description}`);
      
      // Extract measurements first
      const measurements = this.measurementParser.extractMeasurements(testScope.transcription);
      
      // Organize scope
      const analysis = await this.scopeOrganizer.organizeScope(
        testScope.transcription,
        measurements
      );

      console.log(`    Project: ${analysis.organized.projectSummary}`);
      console.log(`    Categories: ${analysis.organized.workCategories.length}`);
      console.log(`    Timeline: ${analysis.organized.estimatedTimeline}`);
      console.log(`    Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      
      // List found categories
      const foundCategories = analysis.organized.workCategories.map(cat => cat.trade);
      console.log(`    Found trades: ${foundCategories.join(', ')}`);
      
      // Check if major expected categories are found
      const foundExpected = testScope.expectedCategories.filter(expected => 
        foundCategories.some(found => found.includes(expected))
      );
      
      const coverage = foundExpected.length / testScope.expectedCategories.length;
      console.log(`    Coverage: ${(coverage * 100).toFixed(1)}% (${foundExpected.length}/${testScope.expectedCategories.length})`);
      
      if (coverage >= 0.6) { // 60% coverage minimum
        passedTests++;
      }
      
      if (analysis.warnings.length > 0) {
        console.log(`    Warnings: ${analysis.warnings.join(', ')}`);
      }
      
      console.log('');
    }

    console.log(`  Passed: ${passedTests}/${testScopes.length} scope tests`);
    
    if (passedTests < testScopes.length * 0.7) {
      throw new Error('Scope organization accuracy below 70%');
    }
  }

  /**
   * Test integration between components
   */
  async testIntegration(): Promise<void> {
    console.log('  Testing complete workflow integration...');
    
    // Create mock scope capture
    const mockCapture: ScopeCapture = {
      id: 'integration_test',
      transcription: 'We need to install hardwood flooring in the living room that\'s about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides. The bathroom needs 3 new outlets and we should replace the old toilet.',
      editedText: 'We need to install hardwood flooring in the living room that\'s about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides. The bathroom needs 3 new outlets and we should replace the old toilet.',
      contextPhotos: [],
      measurements: [],
      timestamp: new Date(),
      confidence: 0.92
    };

    // Step 1: Extract measurements
    const measurements = this.measurementParser.extractMeasurements(mockCapture.transcription);
    mockCapture.measurements = measurements;
    
    console.log(`    Extracted ${measurements.length} measurements`);

    // Step 2: Organize scope
    const analysis = await this.service.organizeScope(mockCapture);
    
    console.log(`    Organized into ${analysis.organized.workCategories.length} work categories`);
    console.log(`    Generated ${analysis.suggestions.length} suggestions`);
    console.log(`    Found ${analysis.warnings.length} warnings`);
    console.log(`    Processing time: ${analysis.processingTime}ms`);

    // Step 3: Export test
    const exportedJson = this.service.exportCapture(mockCapture, 'json');
    const exportedText = this.service.exportCapture(mockCapture, 'text');
    
    console.log(`    JSON export: ${exportedJson.length} characters`);
    console.log(`    Text export: ${exportedText.length} characters`);

    // Validation
    if (measurements.length === 0) {
      throw new Error('No measurements extracted');
    }
    
    if (analysis.organized.workCategories.length === 0) {
      throw new Error('No work categories identified');
    }
    
    if (analysis.processingTime > 5000) {
      throw new Error(`Processing time too slow: ${analysis.processingTime}ms`);
    }

    console.log('    ✅ Integration test passed');
  }

  /**
   * Test performance benchmarks
   */
  async testPerformance(): Promise<void> {
    console.log('  Running performance benchmarks...');
    
    const largeTranscription = `
      This is a comprehensive home renovation project that includes kitchen remodeling with custom cabinets along a 15 foot wall,
      granite countertops covering 30 square feet, and hardwood flooring installation for 250 square feet in the main living area.
      
      The bathroom renovation involves removing existing tile from an 8 by 10 foot area and installing new ceramic flooring.
      We need to replace 4 plumbing fixtures including toilet, sink, shower, and bathtub. Electrical work includes installing
      6 new outlets and upgrading the electrical panel.
      
      The basement finishing project requires framing 3 walls with 2x4 studs, installing 500 square feet of drywall,
      adding insulation, and painting all surfaces. Flooring will be laminate covering 400 square feet.
      
      Exterior work includes installing 150 linear feet of vinyl siding, replacing 8 windows, and installing a new front door.
      Roofing work involves replacing asphalt shingles on 1200 square feet of roof area and installing new gutters.
      
      HVAC improvements include installing new ductwork and a high-efficiency furnace. Plumbing updates involve replacing
      old pipes throughout the house and installing new fixtures in 2 additional bathrooms.
    `;

    // Test measurement extraction performance
    const startMeasurement = Date.now();
    const measurements = this.measurementParser.extractMeasurements(largeTranscription);
    const measurementTime = Date.now() - startMeasurement;
    
    console.log(`    Measurement extraction: ${measurementTime}ms (${measurements.length} measurements)`);

    // Test scope organization performance
    const startOrganization = Date.now();
    const analysis = await this.scopeOrganizer.organizeScope(largeTranscription, measurements);
    const organizationTime = Date.now() - startOrganization;
    
    console.log(`    Scope organization: ${organizationTime}ms`);
    console.log(`    Total categories: ${analysis.organized.workCategories.length}`);
    console.log(`    Total items: ${analysis.organized.workCategories.reduce((sum, cat) => sum + cat.items.length, 0)}`);

    // Performance requirements
    if (measurementTime > 1000) {
      throw new Error(`Measurement extraction too slow: ${measurementTime}ms`);
    }
    
    if (organizationTime > 3000) {
      throw new Error(`Scope organization too slow: ${organizationTime}ms`);
    }

    console.log('    ✅ Performance benchmarks passed');
  }

  /**
   * Test feature support detection
   */
  testFeatureSupport(): void {
    const support = VoiceScopeService.getSupportStatus();
    
    console.log('  Feature Support Status:');
    console.log(`    Audio Recording: ${support.audioRecording ? '✅' : '❌'}`);
    console.log(`    Real-time Transcription: ${support.realTimeTranscription ? '✅' : '❌'}`);
    console.log(`    File Transcription: ${support.fileTranscription ? '✅' : '❌'}`);
    console.log(`    Photo Capture: ${support.photoCapture ? '✅' : '❌'}`);
    
    // Basic validation
    if (!support.fileTranscription) {
      throw new Error('File transcription should always be supported');
    }

    console.log('    ✅ Feature support detection working');
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.service.dispose();
  }
}

/**
 * Run voice-to-scope system tests
 */
export async function runVoiceScopeTests(): Promise<void> {
  const testSuite = new VoiceScopeTestSuite();
  
  try {
    await testSuite.runAllTests();
  } finally {
    testSuite.dispose();
  }
}

// Export for use in other files
export default VoiceScopeTestSuite;

// Run tests if this file is executed directly
if (require.main === module) {
  runVoiceScopeTests().catch(console.error);
}
