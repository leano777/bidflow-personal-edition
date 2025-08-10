// Composite Pricing Engine Usage Example - Step 7 Implementation

import { 
  CompositePricingEngine,
  CostAssembly,
  ScopeLine,
  DetailedBreakdownTable 
} from './composite-pricing-engine';
import { 
  PricingDatabase, 
  CONSTRUCTION_CATEGORIES 
} from './types';

/**
 * Example: How to implement composite pricing engine in your application
 */
export class CompositePricingEngineExample {

  /**
   * Example 1: Basic usage with scope lines and composite rates
   */
  static async example1_BasicUsage(): Promise<void> {
    console.log('=== Example 1: Basic Usage ===\n');

    // Create minimal pricing database
    const database: PricingDatabase = {
      rules: [],
      materials: [],
      labor: [],
      lastSync: new Date()
    };

    // Initialize composite pricing engine
    const engine = new CompositePricingEngine(database);

    // Define scope lines from parsed project description
    const scopeLines: ScopeLine[] = [
      {
        id: '1',
        description: 'Pour concrete foundation slab 4 inches thick',
        quantity: 800,
        unit: 'SF',
        compositeRate: 9.25, // $/SF provided by estimator or cost book
        priority: 'required'
      },
      {
        id: '2', 
        description: 'Frame interior partition walls with 2x4 studs',
        quantity: 160,
        unit: 'LF',
        compositeRate: 8.75, // $/LF
        priority: 'required'
      }
    ];

    // Process scope lines to generate detailed breakdowns
    const breakdowns = await engine.processScopeLines(scopeLines);

    // Display results
    for (const breakdown of breakdowns) {
      console.log(`📋 ${breakdown.description}`);
      console.log(`   Quantity: ${breakdown.quantity} ${breakdown.unit}`);
      console.log(`   Total Cost: $${breakdown.totalCost.toFixed(2)}`);
      console.log(`   Unit Cost: $${breakdown.unitCost.toFixed(2)}/${breakdown.unit}`);
      
      // Show composite rate analysis if available
      if (breakdown.compositeAnalysis) {
        const analysis = breakdown.compositeAnalysis;
        console.log(`   🔍 Composite Rate Breakdown:`);
        console.log(`      Labor: $${analysis.laborShare.amount.toFixed(2)} (${analysis.laborShare.percentage.toFixed(1)}%)`);
        console.log(`      Materials: $${analysis.materialShare.amount.toFixed(2)} (${analysis.materialShare.percentage.toFixed(1)}%)`);
        console.log(`      Equipment: $${analysis.equipmentShare.amount.toFixed(2)} (${analysis.equipmentShare.percentage.toFixed(1)}%)`);
        console.log(`      OH&P: $${analysis.overheadAndProfit.amount.toFixed(2)} (${analysis.overheadAndProfit.percentage.toFixed(1)}%)`);
      }
      
      console.log(`   Confidence: ${(breakdown.confidenceScore * 100).toFixed(1)}%\n`);
    }
  }

  /**
   * Example 2: Using custom cost assemblies for better accuracy
   */
  static async example2_CustomAssemblies(): Promise<void> {
    console.log('=== Example 2: Custom Cost Assemblies ===\n');

    // Define a detailed cost assembly
    const customAssembly: CostAssembly = {
      id: 'custom_concrete_001',
      code: '03.30.53.40',
      description: 'Concrete Slab on Grade, 4" thick with vapor barrier',
      category: CONSTRUCTION_CATEGORIES.CONCRETE,
      unit: 'SF',
      
      laborComponent: {
        totalHours: 0,
        crewMakeup: [],
        totalLaborCost: 0,
        laborRate: 48,
        skillMix: {
          foreman: 0.20,  // 20% foreman
          journeyman: 0.50, // 50% journeyman
          apprentice: 0.20, // 20% apprentice
          laborer: 0.10     // 10% laborer
        }
      },
      
      materialComponent: {
        materials: [
          {
            id: 'concrete',
            name: '4000 PSI Concrete',
            specification: '4000 PSI, 3/4" aggregate, air entrained',
            unit: 'CY',
            quantityPerAssemblyUnit: 0.0123, // 4" slab = ~0.0123 CY per SF
            unitCost: 125,
            totalCost: 0,
            wasteFactor: 0.05 // 5% waste
          },
          {
            id: 'vapor_barrier',
            name: '6 mil Vapor Barrier',
            specification: 'Polyethylene sheeting',
            unit: 'SF',
            quantityPerAssemblyUnit: 1.05, // 5% overlap
            unitCost: 0.28,
            totalCost: 0,
            wasteFactor: 0.10
          }
        ],
        totalMaterialCost: 0,
        wasteAllowance: 0.08,
        quantityBreaks: [],
        supplierInfo: {
          name: 'Local Ready Mix',
          contact: '555-CONCRETE',
          deliveryTime: '2-3 days notice',
          terms: 'COD'
        }
      },
      
      equipmentComponent: {
        equipment: [
          {
            id: 'concrete_pump',
            name: 'Concrete Pump Truck',
            type: 'rented',
            hoursPerUnit: 0.04, // 4 minutes per SF
            hourlyRate: 185,
            totalHours: 0,
            totalCost: 0,
            operator: {
              required: true,
              skillLevel: 'Certified Operator',
              hourlyRate: 48
            }
          }
        ],
        totalEquipmentCost: 0,
        mobilizationCost: 400,
        operatingCostPerHour: 185,
        setupTime: 2
      },
      
      productivityRate: 250, // SF per day with 4-person crew
      crewSize: 4,
      wasteFactor: 0.05,
      setupTime: 1,
      
      costBook: 'Company Database',
      regionCode: 'LOCAL',
      lastUpdated: new Date()
    };

    // Initialize engine with custom assembly
    const database: PricingDatabase = {
      rules: [],
      materials: [],
      labor: [],
      lastSync: new Date()
    };

    const engine = new CompositePricingEngine(database, [customAssembly]);

    // Test scope line that should match our custom assembly
    const scopeLines: ScopeLine[] = [
      {
        id: '1',
        description: 'Pour concrete slab on grade with vapor barrier',
        quantity: 1500,
        unit: 'SF',
        priority: 'required'
      }
    ];

    const breakdowns = await engine.processScopeLines(scopeLines);
    const breakdown = breakdowns[0];

    console.log(`📋 Detailed Breakdown: ${breakdown.description}`);
    console.log(`   Assembly: ${breakdown.assemblyCode} - ${breakdown.assemblyDescription}`);
    console.log(`   Quantity: ${breakdown.quantity} ${breakdown.unit}\n`);

    // Labor breakdown
    console.log('👷 Labor Breakdown:');
    for (const crew of breakdown.laborBreakdown.crew) {
      console.log(`   ${crew.quantity}x ${crew.skillLevel}: ${crew.totalHours.toFixed(1)} hrs @ $${crew.hourlyRate}/hr = $${crew.totalCost.toFixed(2)}`);
    }
    console.log(`   Total Labor: $${breakdown.laborBreakdown.totalCost.toFixed(2)} (${breakdown.laborBreakdown.totalHours.toFixed(1)} hours)\n`);

    // Material breakdown
    console.log('🧱 Material Breakdown:');
    for (const material of breakdown.materialBreakdown.items) {
      const qty = material.quantityPerAssemblyUnit * breakdown.quantity;
      console.log(`   ${material.name}: ${qty.toFixed(2)} ${material.unit} @ $${material.unitCost}/${material.unit} = $${material.totalCost.toFixed(2)}`);
    }
    console.log(`   Total Materials: $${breakdown.materialBreakdown.totalCost.toFixed(2)}\n`);

    // Equipment breakdown
    console.log('🚛 Equipment Breakdown:');
    for (const equipment of breakdown.equipmentBreakdown.items) {
      console.log(`   ${equipment.name}: ${equipment.totalHours.toFixed(2)} hrs @ $${equipment.hourlyRate}/hr = $${equipment.totalCost.toFixed(2)}`);
    }
    console.log(`   Total Equipment: $${breakdown.equipmentBreakdown.totalCost.toFixed(2)}\n`);

    console.log(`💰 Total Cost Summary:`);
    console.log(`   Direct Cost: $${breakdown.directCost.toFixed(2)}`);
    console.log(`   Overhead & Profit: $${breakdown.overheadAndProfit.toFixed(2)}`);
    console.log(`   Total: $${breakdown.totalCost.toFixed(2)}`);
    console.log(`   Unit Cost: $${breakdown.unitCost.toFixed(2)}/${breakdown.unit}\n`);
  }

  /**
   * Example 3: Estimator override capabilities
   */
  static async example3_EstimatorOverrides(): Promise<void> {
    console.log('=== Example 3: Estimator Override Format ===\n');

    const database: PricingDatabase = {
      rules: [],
      materials: [],
      labor: [],
      lastSync: new Date()
    };

    const engine = new CompositePricingEngine(database);

    const scopeLines: ScopeLine[] = [
      {
        id: '1',
        description: 'Install hardwood flooring in living areas',
        quantity: 500,
        unit: 'SF',
        compositeRate: 15.50,
        priority: 'required'
      }
    ];

    const breakdowns = await engine.processScopeLines(scopeLines);
    const breakdown = breakdowns[0];

    // Export in estimator-friendly format for overrides
    const estimatorFormat = engine.exportBreakdownTable(breakdown, 'estimator_format');

    console.log('📊 Estimator Override Format:');
    console.log('Summary:', JSON.stringify(estimatorFormat.summary, null, 2));
    console.log('\nLabor (editable):');
    estimatorFormat.labor.crew.forEach((crew: any, index: number) => {
      console.log(`  ${index + 1}. ${crew.type}: ${crew.count} people, ${crew.hours.toFixed(1)} hrs @ $${crew.rate}/hr = $${crew.cost.toFixed(2)} ${crew.overrideable ? '✏️' : '🔒'}`);
    });

    console.log('\nMaterials (editable):');
    estimatorFormat.materials.forEach((material: any, index: number) => {
      console.log(`  ${index + 1}. ${material.name}: ${material.quantity.toFixed(2)} ${material.unit} @ $${material.unitCost}/${material.unit} = $${material.totalCost.toFixed(2)} ${material.overrideable ? '✏️' : '🔒'}`);
    });

    console.log('\nOverride Options:', estimatorFormat.overrideOptions);
    console.log('');
  }

  /**
   * Example 4: Bulk processing with export
   */
  static async example4_BulkProcessing(): Promise<void> {
    console.log('=== Example 4: Bulk Processing with Export ===\n');

    const database: PricingDatabase = {
      rules: [],
      materials: [],
      labor: [],
      lastSync: new Date()
    };

    const engine = new CompositePricingEngine(database);

    // Large scope with multiple items
    const scopeLines: ScopeLine[] = [
      {
        id: '1',
        description: 'Excavate for foundation',
        quantity: 200,
        unit: 'CY',
        compositeRate: 12.50,
        priority: 'required'
      },
      {
        id: '2',
        description: 'Pour concrete foundation walls',
        quantity: 150,
        unit: 'LF',
        compositeRate: 28.75,
        priority: 'required'
      },
      {
        id: '3',
        description: 'Frame first floor walls',
        quantity: 320,
        unit: 'LF',
        compositeRate: 11.25,
        priority: 'required'
      },
      {
        id: '4',
        description: 'Install roof trusses',
        quantity: 1200,
        unit: 'SF',
        compositeRate: 4.85,
        priority: 'required'
      },
      {
        id: '5',
        description: 'Install luxury vinyl plank flooring',
        quantity: 800,
        unit: 'SF',
        compositeRate: 8.50,
        priority: 'optional'
      }
    ];

    console.log(`Processing ${scopeLines.length} scope line items...\n`);

    const breakdowns = await engine.processScopeLines(scopeLines);

    // Generate CSV export
    console.log('📄 CSV Export Sample:');
    const csvSample = engine.exportBreakdownTable(breakdowns[0], 'csv');
    console.log(csvSample.split('\n').slice(0, 5).join('\n') + '\n...\n');

    // Calculate project totals
    let totalCost = 0;
    let totalLaborHours = 0;

    console.log('📊 Project Summary:');
    for (let i = 0; i < breakdowns.length; i++) {
      const breakdown = breakdowns[i];
      const scope = scopeLines[i];
      
      totalCost += breakdown.totalCost;
      totalLaborHours += breakdown.laborBreakdown.totalHours;

      console.log(`${i + 1}. ${breakdown.description}`);
      console.log(`   ${breakdown.quantity} ${breakdown.unit} @ $${breakdown.unitCost.toFixed(2)}/${breakdown.unit} = $${breakdown.totalCost.toFixed(2)}`);
      console.log(`   Priority: ${scope.priority.toUpperCase()}, Confidence: ${(breakdown.confidenceScore * 100).toFixed(1)}%`);
    }

    console.log(`\n💰 Project Totals:`);
    console.log(`   Total Cost: $${totalCost.toFixed(2)}`);
    console.log(`   Total Labor Hours: ${totalLaborHours.toFixed(1)} hours`);
    console.log(`   Average Rate: $${(totalCost / totalLaborHours).toFixed(2)}/hour`);
    console.log(`   Line Items: ${breakdowns.length}`);
  }

  /**
   * Run all examples
   */
  static async runAllExamples(): Promise<void> {
    console.log('🚀 Composite Pricing Engine Examples\n');
    
    await this.example1_BasicUsage();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await this.example2_CustomAssemblies();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await this.example3_EstimatorOverrides();
    console.log('\n' + '='.repeat(60) + '\n');
    
    await this.example4_BulkProcessing();
    
    console.log('\n✅ All examples completed successfully!\n');
  }
}

// Export function to run examples
export async function runCompositePricingExamples(): Promise<void> {
  await CompositePricingEngineExample.runAllExamples();
}

// Run examples if this file is executed directly
if (require.main === module) {
  runCompositePricingExamples().catch(console.error);
}
