// Test Composite Pricing Engine - Step 7 Implementation

import { 
  CompositePricingEngine, 
  CostAssembly, 
  ScopeLine, 
  DetailedBreakdownTable,
  CompositeRateAnalysis 
} from './composite-pricing-engine';
import { 
  PricingDatabase, 
  PricingRule, 
  CONSTRUCTION_CATEGORIES 
} from './types';

// Sample cost assemblies for testing
const sampleCostAssemblies: CostAssembly[] = [
  {
    id: 'concrete_001',
    code: '03.30.53.40',
    description: 'Concrete Slab on Grade, 4" thick, reinforced',
    category: CONSTRUCTION_CATEGORIES.CONCRETE,
    unit: 'SF',
    
    laborComponent: {
      totalHours: 0,
      crewMakeup: [],
      totalLaborCost: 0,
      laborRate: 45,
      skillMix: {
        foreman: 0.15,
        journeyman: 0.50,
        apprentice: 0.25,
        laborer: 0.10
      }
    },
    
    materialComponent: {
      materials: [
        {
          id: 'concrete_mix',
          name: '4000 PSI Concrete Mix',
          specification: '4000 PSI, 3/4" aggregate',
          unit: 'CY',
          quantityPerAssemblyUnit: 0.012, // SF to CY conversion
          unitCost: 120,
          totalCost: 0,
          wasteFactor: 0.05,
          csiCode: '03.30.53'
        },
        {
          id: 'rebar',
          name: '#4 Rebar',
          specification: 'Grade 60, deformed',
          unit: 'LB',
          quantityPerAssemblyUnit: 2.5, // lbs per SF
          unitCost: 0.85,
          totalCost: 0,
          wasteFactor: 0.10
        },
        {
          id: 'vapor_barrier',
          name: '6 mil Vapor Barrier',
          specification: 'Polyethylene sheeting',
          unit: 'SF',
          quantityPerAssemblyUnit: 1.1, // 10% overlap
          unitCost: 0.25,
          totalCost: 0,
          wasteFactor: 0.15
        }
      ],
      totalMaterialCost: 0,
      wasteAllowance: 0.10,
      quantityBreaks: [
        {
          minQuantity: 0,
          maxQuantity: 1000,
          unitPrice: 8.50,
          description: 'Small quantities'
        },
        {
          minQuantity: 1001,
          maxQuantity: 5000,
          unitPrice: 7.75,
          description: 'Medium quantities'
        },
        {
          minQuantity: 5001,
          unitPrice: 7.25,
          description: 'Large quantities'
        }
      ],
      supplierInfo: {
        name: 'ABC Ready Mix',
        contact: '555-CONCRETE',
        deliveryTime: '2-3 days',
        minimumOrder: 500,
        terms: 'Net 30'
      }
    },
    
    equipmentComponent: {
      equipment: [
        {
          id: 'concrete_pump',
          name: 'Concrete Pump Truck',
          type: 'rented',
          hoursPerUnit: 0.05, // hours per SF
          hourlyRate: 175,
          totalHours: 0,
          totalCost: 0,
          operator: {
            required: true,
            skillLevel: 'Certified Operator',
            hourlyRate: 45
          }
        },
        {
          id: 'power_screed',
          name: 'Power Screed',
          type: 'owned',
          hoursPerUnit: 0.02,
          hourlyRate: 25,
          totalHours: 0,
          totalCost: 0
        }
      ],
      totalEquipmentCost: 0,
      mobilizationCost: 350,
      operatingCostPerHour: 200,
      setupTime: 2
    },
    
    productivityRate: 200, // SF per day
    crewSize: 4,
    wasteFactor: 0.05,
    setupTime: 1,
    
    compositeRate: 8.75, // $/SF
    costBook: 'RSMeans 2024',
    regionCode: 'CA_SF_BAY',
    lastUpdated: new Date()
  },
  
  {
    id: 'framing_001',
    code: '06.11.10.10',
    description: 'Wood Frame Wall, 2x6 studs @ 16" OC',
    category: CONSTRUCTION_CATEGORIES.FRAMING,
    unit: 'LF',
    
    laborComponent: {
      totalHours: 0,
      crewMakeup: [],
      totalLaborCost: 0,
      laborRate: 52,
      skillMix: {
        foreman: 0.20,
        journeyman: 0.60,
        apprentice: 0.20,
        laborer: 0.00
      }
    },
    
    materialComponent: {
      materials: [
        {
          id: 'studs_2x6',
          name: '2x6 Studs',
          specification: 'SPF, construction grade',
          unit: 'EA',
          quantityPerAssemblyUnit: 0.75, // studs per LF
          unitCost: 8.50,
          totalCost: 0,
          wasteFactor: 0.10
        },
        {
          id: 'plates_2x6',
          name: '2x6 Plates',
          specification: 'SPF, construction grade',
          unit: 'LF',
          quantityPerAssemblyUnit: 2.0, // top and bottom plate
          unitCost: 2.25,
          totalCost: 0,
          wasteFactor: 0.15
        },
        {
          id: 'nails_framing',
          name: 'Framing Nails',
          specification: '16d common, hot dipped galvanized',
          unit: 'LB',
          quantityPerAssemblyUnit: 0.25,
          unitCost: 3.50,
          totalCost: 0,
          wasteFactor: 0.20
        }
      ],
      totalMaterialCost: 0,
      wasteAllowance: 0.12,
      quantityBreaks: [],
      supplierInfo: {
        name: 'Home Depot Pro',
        contact: '555-LUMBER',
        deliveryTime: 'Same day',
        terms: 'Net 15'
      }
    },
    
    equipmentComponent: {
      equipment: [
        {
          id: 'framing_nailer',
          name: 'Pneumatic Framing Nailer',
          type: 'owned',
          hoursPerUnit: 0.15,
          hourlyRate: 5,
          totalHours: 0,
          totalCost: 0
        },
        {
          id: 'air_compressor',
          name: 'Air Compressor',
          type: 'owned',
          hoursPerUnit: 0.15,
          hourlyRate: 8,
          totalHours: 0,
          totalCost: 0
        }
      ],
      totalEquipmentCost: 0,
      mobilizationCost: 0,
      operatingCostPerHour: 13,
      setupTime: 0.5
    },
    
    productivityRate: 80, // LF per day
    crewSize: 2,
    wasteFactor: 0.10,
    setupTime: 0.5,
    
    compositeRate: 12.50, // $/LF
    costBook: 'RSMeans 2024',
    regionCode: 'CA_SF_BAY',
    lastUpdated: new Date()
  }
];

// Sample cost book ratios for reverse engineering
const sampleCostBookRatios = {
  '03.30.53.40': {
    laborPercentage: 0.35,
    materialPercentage: 0.45,
    equipmentPercentage: 0.12,
    overheadAndProfitPercentage: 0.08,
    averageLaborRate: 45,
    equipmentHoursPerUnit: 0.07
  },
  '06.11.10.10': {
    laborPercentage: 0.55,
    materialPercentage: 0.35,
    equipmentPercentage: 0.03,
    overheadAndProfitPercentage: 0.07,
    averageLaborRate: 52,
    equipmentHoursPerUnit: 0.15
  }
};

// Sample scope lines for testing
const sampleScopeLines: ScopeLine[] = [
  {
    id: 'scope_001',
    description: 'Pour 4 inch concrete slab with rebar in basement',
    quantity: 1200,
    unit: 'SF',
    category: CONSTRUCTION_CATEGORIES.CONCRETE,
    compositeRate: 8.75, // Will be reverse-engineered
    notes: 'Access may be limited, pump truck required',
    priority: 'required'
  },
  {
    id: 'scope_002',
    description: 'Frame exterior walls with 2x6 studs',
    quantity: 240,
    unit: 'LF',
    category: CONSTRUCTION_CATEGORIES.FRAMING,
    compositeRate: 12.50, // Will be reverse-engineered
    notes: 'Standard residential framing',
    priority: 'required'
  },
  {
    id: 'scope_003',
    description: 'Install electrical outlets in living areas',
    quantity: 24,
    unit: 'EA',
    category: CONSTRUCTION_CATEGORIES.ELECTRICAL,
    notes: 'Standard 20A GFCI outlets',
    priority: 'required'
  },
  {
    id: 'scope_004',
    description: 'Custom tile work in master bathroom',
    quantity: 150,
    unit: 'SF',
    category: CONSTRUCTION_CATEGORIES.FLOORING,
    compositeRate: 25.00, // High-end composite rate to reverse-engineer
    notes: 'Imported Italian marble tiles',
    priority: 'optional'
  }
];

// Mock pricing database
const mockDatabase: PricingDatabase = {
  rules: [],
  materials: [],
  labor: [],
  lastSync: new Date()
};

export class CompositePricingEngineTest {
  private engine: CompositePricingEngine;

  constructor() {
    this.engine = new CompositePricingEngine(
      mockDatabase,
      sampleCostAssemblies,
      sampleCostBookRatios
    );
  }

  /**
   * Run comprehensive test suite
   */
  async runTests(): Promise<void> {
    console.log('🧪 Running Composite Pricing Engine Tests...\n');

    try {
      // Test 1: Basic scope line processing
      await this.testBasicScopeProcessing();
      
      // Test 2: Composite rate reverse engineering
      await this.testCompositeRateDecomposition();
      
      // Test 3: Cost assembly matching
      await this.testCostAssemblyMatching();
      
      // Test 4: Export functionality
      await this.testExportFunctionality();
      
      // Test 5: Crew makeup calculations
      await this.testCrewMakeupCalculations();
      
      console.log('✅ All tests completed successfully!\n');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      throw error;
    }
  }

  /**
   * Test basic scope line processing
   */
  private async testBasicScopeProcessing(): Promise<void> {
    console.log('1️⃣ Testing Basic Scope Line Processing...');
    
    const results = await this.engine.processScopeLines(sampleScopeLines);
    
    console.log(`   ✓ Processed ${results.length} scope lines`);
    
    for (const result of results) {
      console.log(`   ✓ ${result.description}`);
      console.log(`     - Assembly: ${result.assemblyCode} (${result.assemblyDescription})`);
      console.log(`     - Total Cost: $${result.totalCost.toFixed(2)}`);
      console.log(`     - Unit Cost: $${result.unitCost.toFixed(2)}/${result.unit}`);
      console.log(`     - Labor Hours: ${result.laborBreakdown.totalHours.toFixed(1)}`);
      console.log(`     - Confidence: ${(result.confidenceScore * 100).toFixed(1)}%\n`);
    }
  }

  /**
   * Test composite rate decomposition
   */
  private async testCompositeRateDecomposition(): Promise<void> {
    console.log('2️⃣ Testing Composite Rate Decomposition...');
    
    const results = await this.engine.processScopeLines(sampleScopeLines);
    
    for (const result of results) {
      if (result.compositeAnalysis) {
        const analysis = result.compositeAnalysis;
        console.log(`   ✓ Reverse-engineered composite rate for: ${result.description}`);
        console.log(`     - Original Rate: $${analysis.originalCompositeRate.toFixed(2)}/${analysis.unit}`);
        console.log(`     - Labor Share: $${analysis.laborShare.amount.toFixed(2)} (${analysis.laborShare.percentage.toFixed(1)}%)`);
        console.log(`     - Material Share: $${analysis.materialShare.amount.toFixed(2)} (${analysis.materialShare.percentage.toFixed(1)}%)`);
        console.log(`     - Equipment Share: $${analysis.equipmentShare.amount.toFixed(2)} (${analysis.equipmentShare.percentage.toFixed(1)}%)`);
        console.log(`     - OH&P: $${analysis.overheadAndProfit.amount.toFixed(2)} (${analysis.overheadAndProfit.percentage.toFixed(1)}%)`);
        console.log(`     - Confidence: ${(analysis.confidenceScore * 100).toFixed(1)}%`);
        console.log(`     - Method: ${analysis.analysisMethod}`);
        console.log(`     - Source: ${analysis.costBookSource}\n`);
      }
    }
  }

  /**
   * Test cost assembly matching
   */
  private async testCostAssemblyMatching(): Promise<void> {
    console.log('3️⃣ Testing Cost Assembly Matching...');
    
    // Test with a scope line that should match existing assembly
    const testScope: ScopeLine = {
      id: 'test_001',
      description: 'concrete foundation slab with reinforcement',
      quantity: 500,
      unit: 'SF',
      priority: 'required'
    };
    
    const results = await this.engine.processScopeLines([testScope]);
    const result = results[0];
    
    console.log(`   ✓ Matched scope: "${testScope.description}"`);
    console.log(`     - To assembly: ${result.assemblyCode}`);
    console.log(`     - Description: ${result.assemblyDescription}`);
    console.log(`     - Confidence: ${(result.confidenceScore * 100).toFixed(1)}%\n`);
    
    // Test with a scope line that should create generic assembly
    const genericScope: ScopeLine = {
      id: 'test_002',
      description: 'install custom space-age quantum flooring system',
      quantity: 100,
      unit: 'SF',
      priority: 'optional'
    };
    
    const genericResults = await this.engine.processScopeLines([genericScope]);
    const genericResult = genericResults[0];
    
    console.log(`   ✓ Created generic assembly for: "${genericScope.description}"`);
    console.log(`     - Assembly code: ${genericResult.assemblyCode}`);
    console.log(`     - Confidence: ${(genericResult.confidenceScore * 100).toFixed(1)}%\n`);
  }

  /**
   * Test export functionality
   */
  private async testExportFunctionality(): Promise<void> {
    console.log('4️⃣ Testing Export Functionality...');
    
    const results = await this.engine.processScopeLines([sampleScopeLines[0]]);
    const breakdown = results[0];
    
    // Test JSON export
    const jsonExport = this.engine.exportBreakdownTable(breakdown, 'json');
    console.log(`   ✓ JSON export generated (${jsonExport.length} characters)`);
    
    // Test CSV export
    const csvExport = this.engine.exportBreakdownTable(breakdown, 'csv');
    const csvLines = csvExport.split('\n').length;
    console.log(`   ✓ CSV export generated (${csvLines} lines)`);
    
    // Test estimator format
    const estimatorExport = this.engine.exportBreakdownTable(breakdown, 'estimator_format');
    console.log(`   ✓ Estimator format generated`);
    console.log(`     - Labor items: ${estimatorExport.labor.crew.length}`);
    console.log(`     - Material items: ${estimatorExport.materials.length}`);
    console.log(`     - Equipment items: ${estimatorExport.equipment.length}\n`);
  }

  /**
   * Test crew makeup calculations
   */
  private async testCrewMakeupCalculations(): Promise<void> {
    console.log('5️⃣ Testing Crew Makeup Calculations...');
    
    const results = await this.engine.processScopeLines(sampleScopeLines.slice(0, 2));
    
    for (const result of results) {
      console.log(`   ✓ Crew breakdown for: ${result.description}`);
      console.log(`     - Total hours: ${result.laborBreakdown.totalHours.toFixed(1)}`);
      console.log(`     - Total cost: $${result.laborBreakdown.totalCost.toFixed(2)}`);
      console.log(`     - Productivity: ${result.laborBreakdown.productivityRate} ${result.unit}/day`);
      
      for (const member of result.laborBreakdown.crew) {
        console.log(`     - ${member.quantity}x ${member.skillLevel}: ${member.totalHours.toFixed(1)} hrs @ $${member.hourlyRate}/hr = $${member.totalCost.toFixed(2)}`);
      }
      console.log('');
    }
  }

  /**
   * Generate sample report
   */
  async generateSampleReport(): Promise<string> {
    console.log('📊 Generating Sample Pricing Report...\n');
    
    const results = await this.engine.processScopeLines(sampleScopeLines);
    
    let report = '# CONSTRUCTION PRICING BREAKDOWN REPORT\n';
    report += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    
    let totalProjectCost = 0;
    let totalLaborHours = 0;
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const scopeLine = sampleScopeLines[i];
      
      report += `## ${i + 1}. ${result.description}\n`;
      report += `**Quantity:** ${result.quantity} ${result.unit}\n`;
      report += `**Assembly:** ${result.assemblyCode} - ${result.assemblyDescription}\n`;
      report += `**Priority:** ${scopeLine.priority.toUpperCase()}\n\n`;
      
      // Cost breakdown
      report += '### Cost Breakdown:\n';
      report += `- **Labor:** $${result.laborBreakdown.totalCost.toFixed(2)} (${result.laborBreakdown.totalHours.toFixed(1)} hours)\n`;
      report += `- **Materials:** $${result.materialBreakdown.totalCost.toFixed(2)}\n`;
      report += `- **Equipment:** $${result.equipmentBreakdown.totalCost.toFixed(2)}\n`;
      report += `- **Direct Cost:** $${result.directCost.toFixed(2)}\n`;
      report += `- **Overhead & Profit:** $${result.overheadAndProfit.toFixed(2)}\n`;
      report += `- **Total Cost:** $${result.totalCost.toFixed(2)}\n`;
      report += `- **Unit Cost:** $${result.unitCost.toFixed(2)}/${result.unit}\n\n`;
      
      // Crew details
      if (result.laborBreakdown.crew.length > 0) {
        report += '### Labor Crew:\n';
        for (const member of result.laborBreakdown.crew) {
          report += `- ${member.quantity}x ${member.skillLevel} @ $${member.hourlyRate}/hr\n`;
        }
        report += '\n';
      }
      
      // Composite rate analysis if available
      if (result.compositeAnalysis) {
        const analysis = result.compositeAnalysis;
        report += '### Composite Rate Analysis:\n';
        report += `- **Original Rate:** $${analysis.originalCompositeRate.toFixed(2)}/${analysis.unit}\n`;
        report += `- **Labor Component:** $${analysis.laborShare.amount.toFixed(2)} (${analysis.laborShare.percentage.toFixed(1)}%)\n`;
        report += `- **Material Component:** $${analysis.materialShare.amount.toFixed(2)} (${analysis.materialShare.percentage.toFixed(1)}%)\n`;
        report += `- **Equipment Component:** $${analysis.equipmentShare.amount.toFixed(2)} (${analysis.equipmentShare.percentage.toFixed(1)}%)\n`;
        report += `- **Overhead & Profit:** $${analysis.overheadAndProfit.amount.toFixed(2)} (${analysis.overheadAndProfit.percentage.toFixed(1)}%)\n`;
        report += `- **Analysis Confidence:** ${(analysis.confidenceScore * 100).toFixed(1)}%\n\n`;
      }
      
      report += `**Confidence Score:** ${(result.confidenceScore * 100).toFixed(1)}%\n`;
      report += `**Data Source:** ${result.dataSource}\n\n`;
      report += '---\n\n';
      
      totalProjectCost += result.totalCost;
      totalLaborHours += result.laborBreakdown.totalHours;
    }
    
    // Project summary
    report += '## PROJECT SUMMARY\n';
    report += `**Total Project Cost:** $${totalProjectCost.toFixed(2)}\n`;
    report += `**Total Labor Hours:** ${totalLaborHours.toFixed(1)} hours\n`;
    report += `**Average Hourly Rate:** $${totalLaborHours > 0 ? (totalProjectCost / totalLaborHours).toFixed(2) : '0.00'}/hour\n`;
    report += `**Number of Line Items:** ${results.length}\n\n`;
    
    // Recommendations
    report += '## RECOMMENDATIONS\n';
    report += '- Review composite rate assumptions with cost book data\n';
    report += '- Verify labor rates with current market conditions\n';
    report += '- Consider bulk pricing for materials on larger quantities\n';
    report += '- Evaluate equipment rental vs. purchase for longer projects\n';
    report += '- Apply regional cost adjustments as needed\n\n';
    
    console.log(report);
    return report;
  }

  /**
   * Test individual methods for debugging
   */
  async testIndividualFeatures(): Promise<void> {
    console.log('🔧 Testing Individual Features...\n');
    
    // Test cost assembly search
    const concreteAssemblies = this.engine.searchAssembliesByCategory(CONSTRUCTION_CATEGORIES.CONCRETE);
    console.log(`✓ Found ${concreteAssemblies.length} concrete assemblies`);
    
    const framingAssemblies = this.engine.searchAssembliesByCategory(CONSTRUCTION_CATEGORIES.FRAMING);
    console.log(`✓ Found ${framingAssemblies.length} framing assemblies`);
    
    // Test available assemblies
    const allAssemblies = this.engine.getAvailableAssemblies();
    console.log(`✓ Total available assemblies: ${allAssemblies.length}\n`);
    
    // Test cost book ratios update
    this.engine.updateCostBookRatios({
      'TEST.CODE': {
        laborPercentage: 0.40,
        materialPercentage: 0.40,
        equipmentPercentage: 0.10,
        overheadAndProfitPercentage: 0.10,
        averageLaborRate: 50
      }
    });
    console.log('✓ Cost book ratios updated\n');
  }
}

// Export test runner
export async function runCompositePricingTests(): Promise<void> {
  const testSuite = new CompositePricingEngineTest();
  
  await testSuite.runTests();
  await testSuite.testIndividualFeatures();
  await testSuite.generateSampleReport();
  
  console.log('🎉 Composite Pricing Engine testing completed!\n');
}

// Example usage
if (require.main === module) {
  runCompositePricingTests().catch(console.error);
}
