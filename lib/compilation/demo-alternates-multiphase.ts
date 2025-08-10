// Demo: Alternates and Multi-Phase Scenario Handling - Step 8 Implementation
// Demonstrates scope tree inheritance, differential pricing, and phasing calendars

import { AlternatesManager } from './alternates-manager';
import { PhasingCalendarManager } from './phasing-calendar-manager';
import { CostCalculator } from './cost-calculator';
import { 
  BaseScopeTree, 
  AlternateScope, 
  ScopeModification, 
  PhaseModification,
  AlternateComparison,
  PhasingCalendar
} from './alternates-types';
import { 
  WorkPhase, 
  EstimateLineItem, 
  Duration, 
  ProjectSummary 
} from './types';
import { OrganizedScope } from '../voice-scope/types';

export class AlternatesMultiPhaseDemo {
  private alternatesManager: AlternatesManager;
  private phasingManager: PhasingCalendarManager;
  private costCalculator: CostCalculator;

  constructor() {
    this.costCalculator = new CostCalculator();
    this.alternatesManager = new AlternatesManager(this.costCalculator);
    this.phasingManager = new PhasingCalendarManager();
  }

  /**
   * Complete demonstration of the alternates and multi-phase system
   */
  async runCompleteDemo(): Promise<void> {
    console.log('🚀 Starting Alternates and Multi-Phase Scenario Handling Demo');
    console.log('='.repeat(70));

    try {
      // Step 1: Create a sample base scope and project
      const { baseScope, project } = this.createSampleBaseScope();
      
      // Step 2: Create sample work phases
      const basePhases = this.createSampleWorkPhases();
      
      // Step 3: Create base scope tree
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Kitchen Renovation Base Scope',
        'Complete kitchen renovation with standard finishes',
        baseScope,
        basePhases,
        project
      );
      
      console.log(`\n📋 Base Scope Tree Created:`);
      console.log(`  ID: ${baseScopeTree.id}`);
      console.log(`  Name: ${baseScopeTree.name}`);
      console.log(`  Phases: ${baseScopeTree.basePhases.length}`);
      console.log(`  Total Cost: $${baseScopeTree.baseCostSummary.contractTotal.toFixed(2)}`);
      
      // Step 4: Create alternates with different scenarios
      const alternates = await this.createSampleAlternates(baseScopeTree.id);
      
      // Step 5: Create alternate comparison analysis
      const comparison = this.createAlternateComparison(baseScopeTree.id, alternates);
      
      // Step 6: Create phasing calendar with labor adjustments and learning curves
      const calendar = this.createSamplePhasingCalendar(project.id);
      
      // Step 7: Demonstrate learning curve applications
      await this.demonstrateLearningCurves(basePhases, calendar);
      
      // Step 8: Demonstrate calendar-based rate adjustments
      await this.demonstrateCalendarAdjustments(basePhases, calendar);
      
      // Step 9: Create execution plan with selected alternate
      const selectedAlternateId = alternates[0]; // Select best alternate
      const selectedAlternate = this.alternatesManager.getAlternateScope(selectedAlternateId);
      
      if (!selectedAlternate) {
        throw new Error(`Could not retrieve alternate scope with ID: ${selectedAlternateId}`);
      }
      
      const executionPlan = await this.createExecutionPlan(
        selectedAlternate,
        calendar,
        project
      );
      
      // Step 10: Generate comprehensive cost projection
      const costProjection = await this.generateComprehensiveCostProjection(
        basePhases,
        calendar
      );
      
      // Step 11: Display final results summary
      this.displayFinalSummary(baseScopeTree, alternates, comparison, executionPlan, costProjection);
      
      console.log('\n✅ Demo completed successfully!');
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    }
  }

  /**
   * Create sample base scope and project
   */
  private createSampleBaseScope(): { baseScope: OrganizedScope; project: ProjectSummary } {
    const baseScope: OrganizedScope = {
      id: 'scope_kitchen_base',
      projectSummary: 'Complete kitchen renovation with island and premium appliances',
      workCategories: [
        {
          id: 'demo_cat',
          category: 'Demolition',
          trade: 'Demolition',
          items: [
            {
              id: 'demo_cabinets',
              description: 'Remove existing cabinets and countertops',
              quantity: 20,
              unit: 'LF',
              priority: 'required'
            }
          ],
          sequenceOrder: 1,
          prerequisites: [],
          estimatedDuration: '2 days',
          riskLevel: 'low'
        },
        {
          id: 'electrical_cat',
          category: 'Electrical',
          trade: 'Electrical',
          items: [
            {
              id: 'elec_outlets',
              description: 'Install GFCI outlets and under-cabinet lighting',
              quantity: 8,
              unit: 'EA',
              priority: 'required'
            }
          ],
          sequenceOrder: 2,
          prerequisites: ['Demolition'],
          estimatedDuration: '3 days',
          riskLevel: 'medium'
        }
      ],
      materialSpecs: [],
      laborRequirements: [],
      specialConsiderations: [],
      estimatedTimeline: '3 weeks',
      confidence: 0.85,
      sourceCapture: 'demo_capture',
      createdAt: new Date()
    };

    const project: ProjectSummary = {
      id: 'proj_kitchen_reno',
      name: 'Kitchen Renovation Project',
      address: '123 Demo Street, Anytown, CA 90210',
      clientName: 'Demo Client',
      clientContact: 'demo@example.com',
      totalSquareFootage: 250,
      projectType: 'Kitchen Renovation',
      estimatedDuration: { value: 3, unit: 'weeks' },
      createdAt: new Date(),
      lastModified: new Date()
    };

    return { baseScope, project };
  }

  /**
   * Create sample work phases
   */
  private createSampleWorkPhases(): WorkPhase[] {
    return [
      {
        id: 'phase_demo',
        phase: 'Demolition',
        category: 'Site Work',
        sequenceOrder: 1,
        items: [
          {
            id: 'demo_item_1',
            description: 'Remove existing cabinets',
            quantity: 20,
            unit: 'LF',
            materialCost: 0,
            laborCost: 1200,
            equipmentCost: 200,
            lineItemTotal: 1400,
            confidenceScore: 0.9,
            phase: 'Demolition',
            category: 'Demolition',
            riskFactors: [],
            wasteFactor: 0,
            laborHours: 24
          },
          {
            id: 'demo_item_2',
            description: 'Remove countertops and appliances',
            quantity: 12,
            unit: 'SF',
            materialCost: 0,
            laborCost: 800,
            equipmentCost: 100,
            lineItemTotal: 900,
            confidenceScore: 0.85,
            phase: 'Demolition',
            category: 'Demolition',
            riskFactors: [],
            wasteFactor: 0,
            laborHours: 16
          }
        ],
        phaseTotal: 2300,
        duration: { value: 2, unit: 'days' },
        prerequisites: [],
        description: 'Complete demolition of existing kitchen',
        riskLevel: 'low',
        permitRequired: false,
        inspectionRequired: false
      },
      {
        id: 'phase_electrical',
        phase: 'Electrical',
        category: 'Systems',
        sequenceOrder: 2,
        items: [
          {
            id: 'elec_item_1',
            description: 'Install GFCI outlets',
            quantity: 8,
            unit: 'EA',
            materialCost: 480,
            laborCost: 1600,
            equipmentCost: 100,
            lineItemTotal: 2180,
            confidenceScore: 0.8,
            phase: 'Electrical',
            category: 'Electrical',
            riskFactors: ['Permit required'],
            wasteFactor: 0.05,
            laborHours: 24
          },
          {
            id: 'elec_item_2',
            description: 'Under-cabinet LED lighting system',
            quantity: 20,
            unit: 'LF',
            materialCost: 800,
            laborCost: 1200,
            equipmentCost: 50,
            lineItemTotal: 2050,
            confidenceScore: 0.75,
            phase: 'Electrical',
            category: 'Electrical',
            riskFactors: [],
            wasteFactor: 0.10,
            laborHours: 18
          }
        ],
        phaseTotal: 4230,
        duration: { value: 3, unit: 'days' },
        prerequisites: ['Demolition'],
        description: 'Electrical rough-in and installation',
        riskLevel: 'medium',
        permitRequired: true,
        inspectionRequired: true
      },
      {
        id: 'phase_cabinets',
        phase: 'Cabinet Installation',
        category: 'Interior',
        sequenceOrder: 3,
        items: [
          {
            id: 'cab_item_1',
            description: 'Install base cabinets',
            quantity: 12,
            unit: 'LF',
            materialCost: 7200,
            laborCost: 2400,
            equipmentCost: 200,
            lineItemTotal: 9800,
            confidenceScore: 0.85,
            phase: 'Cabinet Installation',
            category: 'Cabinets',
            riskFactors: [],
            wasteFactor: 0.05,
            laborHours: 32
          },
          {
            id: 'cab_item_2',
            description: 'Install wall cabinets and crown molding',
            quantity: 8,
            unit: 'LF',
            materialCost: 4800,
            laborCost: 2000,
            equipmentCost: 100,
            lineItemTotal: 6900,
            confidenceScore: 0.8,
            phase: 'Cabinet Installation',
            category: 'Cabinets',
            riskFactors: ['Precision installation'],
            wasteFactor: 0.10,
            laborHours: 28
          }
        ],
        phaseTotal: 16700,
        duration: { value: 4, unit: 'days' },
        prerequisites: ['Electrical'],
        description: 'Cabinet installation and trim work',
        riskLevel: 'medium',
        permitRequired: false,
        inspectionRequired: false
      },
      {
        id: 'phase_countertops',
        phase: 'Countertops',
        category: 'Interior',
        sequenceOrder: 4,
        items: [
          {
            id: 'counter_item_1',
            description: 'Quartz countertops with undermount sink cutout',
            quantity: 35,
            unit: 'SF',
            materialCost: 2800,
            laborCost: 1400,
            equipmentCost: 100,
            lineItemTotal: 4300,
            confidenceScore: 0.85,
            phase: 'Countertops',
            category: 'Countertops',
            riskFactors: ['Template required'],
            wasteFactor: 0.15,
            laborHours: 16
          }
        ],
        phaseTotal: 4300,
        duration: { value: 1, unit: 'days' },
        prerequisites: ['Cabinet Installation'],
        description: 'Countertop installation',
        riskLevel: 'medium',
        permitRequired: false,
        inspectionRequired: false
      }
    ];
  }

  /**
   * Create sample alternates
   */
  private async createSampleAlternates(baseScopeId: string): Promise<string[]> {
    console.log('\n🔄 Creating Alternate Scenarios:');
    const alternateIds: string[] = [];

    // Alternate 1: Value Engineering (Budget-friendly)
    const valueEngineering = this.alternatesManager.createAlternateScope(
      baseScopeId,
      'Value Engineering',
      'Cost-optimized solution with laminate countertops and standard fixtures',
      'value_engineering',
      {
        scopeModifications: [
          {
            id: 'mod_ve_countertops',
            type: 'replace',
            targetPath: 'phase_countertops',
            replacements: [
              {
                originalId: 'counter_item_1',
                newItem: {
                  id: 'counter_laminate',
                  description: 'Laminate countertops with drop-in sink',
                  quantity: 35,
                  unit: 'SF',
                  materialCost: 1200,
                  laborCost: 800,
                  equipmentCost: 50,
                  lineItemTotal: 2050,
                  confidenceScore: 0.9,
                  phase: 'Countertops',
                  category: 'Countertops',
                  riskFactors: [],
                  wasteFactor: 0.10,
                  laborHours: 12
                }
              }
            ],
            reason: 'Cost reduction through material substitution',
            impact: {
              costDelta: -2250,
              timeDelta: { value: 0, unit: 'days' },
              qualityImpact: 'basic materials, lower durability'
            }
          }
        ],
        phaseModifications: []
      }
    );
    alternateIds.push(valueEngineering.id);
    console.log(`  ✅ ${valueEngineering.name}: $${valueEngineering.totalDeltaCost.toFixed(2)} delta`);

    // Alternate 2: Premium Upgrade
    const premiumUpgrade = this.alternatesManager.createAlternateScope(
      baseScopeId,
      'Premium Upgrade',
      'High-end finishes with custom cabinetry and granite countertops',
      'premium',
      {
        scopeModifications: [
          {
            id: 'mod_premium_countertops',
            type: 'replace',
            targetPath: 'phase_countertops',
            replacements: [
              {
                originalId: 'counter_item_1',
                newItem: {
                  id: 'counter_granite',
                  description: 'Premium granite countertops with waterfall edge',
                  quantity: 35,
                  unit: 'SF',
                  materialCost: 4200,
                  laborCost: 2100,
                  equipmentCost: 200,
                  lineItemTotal: 6500,
                  confidenceScore: 0.8,
                  phase: 'Countertops',
                  category: 'Countertops',
                  riskFactors: ['Custom fabrication required'],
                  wasteFactor: 0.20,
                  laborHours: 24
                }
              }
            ],
            reason: 'Premium material upgrade',
            impact: {
              costDelta: 2200,
              timeDelta: { value: 1, unit: 'days' },
              qualityImpact: 'premium materials, enhanced durability'
            }
          }
        ],
        phaseModifications: [
          {
            id: 'mod_premium_cabinets',
            phaseId: 'phase_cabinets',
            modificationType: 'modify',
            phaseChanges: {
              phaseTotal: 20500 // Increase for custom cabinetry
            },
            reason: 'Upgrade to custom cabinetry',
            impact: {
              costDelta: 3800,
              scheduleDelta: { value: 2, unit: 'days' },
              riskChange: 'same',
              prerequisiteChanges: [],
              resourceRequirementChanges: ['Specialized craftsman required']
            }
          }
        ]
      }
    );
    alternateIds.push(premiumUpgrade.id);
    console.log(`  ✅ ${premiumUpgrade.name}: $${premiumUpgrade.totalDeltaCost.toFixed(2)} delta`);

    // Alternate 3: Fast Track
    const fastTrack = this.alternatesManager.createAlternateScope(
      baseScopeId,
      'Fast Track',
      'Accelerated timeline with parallel work execution',
      'fast_track',
      {
        scopeModifications: [
          {
            id: 'mod_fast_prefab',
            type: 'add',
            targetPath: 'phase_cabinets',
            addedItems: [
              {
                id: 'fast_coordination',
                description: 'Project coordination and scheduling premium',
                quantity: 1,
                unit: 'LS',
                materialCost: 0,
                laborCost: 1500,
                equipmentCost: 0,
                lineItemTotal: 1500,
                confidenceScore: 0.9,
                phase: 'Cabinet Installation',
                category: 'Project Management',
                riskFactors: ['Complex coordination'],
                wasteFactor: 0,
                laborHours: 20
              }
            ],
            reason: 'Additional coordination for parallel execution',
            impact: {
              costDelta: 1500,
              timeDelta: { value: -3, unit: 'days' },
              qualityImpact: 'same quality, faster delivery'
            }
          }
        ],
        phaseModifications: [
          {
            id: 'mod_fast_overlap',
            phaseId: 'phase_electrical',
            modificationType: 'modify',
            phaseChanges: {
              duration: { value: 2, unit: 'days' } // Compressed timeline
            },
            reason: 'Parallel execution with overtime work',
            impact: {
              costDelta: 800, // Overtime premium
              scheduleDelta: { value: -1, unit: 'days' },
              riskChange: 'higher',
              prerequisiteChanges: [],
              resourceRequirementChanges: ['Extended work hours', 'Additional crew']
            }
          }
        ]
      }
    );
    alternateIds.push(fastTrack.id);
    console.log(`  ✅ ${fastTrack.name}: $${fastTrack.totalDeltaCost.toFixed(2)} delta`);

    return alternateIds;
  }

  /**
   * Create alternate comparison
   */
  private createAlternateComparison(baseScopeId: string, alternateIds: string[]): AlternateComparison {
    console.log('\n📊 Creating Alternate Comparison Analysis:');
    
    const comparison = this.alternatesManager.createAlternateComparison(
      baseScopeId,
      alternateIds,
      'Kitchen Renovation Alternatives Analysis'
    );

    console.log(`  Comparison Matrix:`);
    for (const matrix of comparison.comparisonMatrix) {
      console.log(`    ${matrix.name}:`);
      console.log(`      Total Cost: $${matrix.totalCost.toFixed(2)}`);
      console.log(`      Cost Delta: $${matrix.costDelta.toFixed(2)} (${matrix.costDeltaPercentage.toFixed(1)}%)`);
      console.log(`      Quality Level: ${matrix.qualityLevel}`);
      console.log(`      Risk Level: ${matrix.riskLevel}`);
      console.log(`      Recommendation Score: ${matrix.recommendationScore.toFixed(1)}/100`);
    }

    console.log(`\n  Analysis Results:`);
    console.log(`    Best Value: ${this.getAlternateName(comparison.analysis.bestValue)}`);
    console.log(`    Lowest Cost: ${this.getAlternateName(comparison.analysis.lowestCost)}`);
    console.log(`    Highest Quality: ${this.getAlternateName(comparison.analysis.highestQuality)}`);
    console.log(`    Lowest Risk: ${this.getAlternateName(comparison.analysis.lowestRisk)}`);

    return comparison;
  }

  /**
   * Create sample phasing calendar
   */
  private createSamplePhasingCalendar(projectId: string): PhasingCalendar {
    console.log('\n📅 Creating Phasing Calendar with Labor Rate Adjustments:');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days

    const calendar = this.phasingManager.createDefaultConstructionCalendar(
      projectId,
      startDate,
      endDate
    );

    console.log(`  Calendar created with:`);
    console.log(`    Periods: ${calendar.periods.length}`);
    console.log(`    Labor Rate Adjustments: ${calendar.laborRateAdjustments.length}`);
    console.log(`    Learning Curves: ${calendar.learningCurves.length}`);
    console.log(`    Schedule Constraints: ${calendar.scheduleConstraints.length}`);

    return calendar;
  }

  /**
   * Demonstrate learning curve applications
   */
  private async demonstrateLearningCurves(phases: WorkPhase[], calendar: PhasingCalendar): Promise<void> {
    console.log('\n🎯 Demonstrating Learning Curve Applications:');

    // Create a repetitive scenario (multiple similar phases)
    const repetitivePhases: WorkPhase[] = [];
    for (let i = 0; i < 5; i++) {
      const phase = JSON.parse(JSON.stringify(phases[2])); // Duplicate cabinet phase
      phase.id = `phase_cabinets_${i}`;
      phase.sequenceOrder = 10 + i;
      repetitivePhases.push(phase);
    }

    const { adjustedPhases, learningCurveImpact } = this.phasingManager.applyLearningCurveAdjustments(
      repetitivePhases,
      calendar.learningCurves
    );

    console.log(`  Applied learning curves to ${adjustedPhases.length} repetitive phases:`);
    for (const impact of learningCurveImpact) {
      console.log(`    ${impact.phaseName} (Rep ${impact.repetitions}):`);
      console.log(`      Curve: ${impact.curveApplied}`);
      console.log(`      Efficiency: ${(impact.efficiency * 100).toFixed(1)}%`);
      console.log(`      Cost Reduction: $${impact.costReduction.toFixed(2)}`);
      console.log(`      Hours Saved: ${impact.hoursReduction.toFixed(1)}`);
    }

    const totalSavings = learningCurveImpact.reduce((sum, impact) => sum + impact.costReduction, 0);
    console.log(`  Total Learning Curve Savings: $${totalSavings.toFixed(2)}`);
  }

  /**
   * Demonstrate calendar-based rate adjustments
   */
  private async demonstrateCalendarAdjustments(phases: WorkPhase[], calendar: PhasingCalendar): Promise<void> {
    console.log('\n📅 Demonstrating Calendar-Based Rate Adjustments:');

    const startDate = new Date();
    const { adjustedPhases, calendarAdjustments } = this.phasingManager.applyCalendarAdjustments(
      phases,
      calendar,
      startDate
    );

    console.log(`  Applied calendar adjustments to ${adjustedPhases.length} phases:`);
    for (const adjustment of calendarAdjustments) {
      console.log(`    ${adjustment.phaseName}:`);
      console.log(`      Original Cost: $${adjustment.originalCost.toFixed(2)}`);
      console.log(`      Overtime Premium: $${adjustment.adjustments.overtime.toFixed(2)}`);
      console.log(`      Weekend Premium: $${adjustment.adjustments.weekend.toFixed(2)}`);
      console.log(`      Seasonal Adjustment: $${adjustment.adjustments.seasonal.toFixed(2)}`);
      console.log(`      Total Adjustment: $${adjustment.adjustments.total.toFixed(2)}`);
      console.log(`      Adjusted Cost: $${adjustment.adjustedCost.toFixed(2)}`);
    }

    const totalAdjustments = calendarAdjustments.reduce((sum, adj) => sum + adj.adjustments.total, 0);
    console.log(`  Total Calendar Adjustments: $${totalAdjustments.toFixed(2)}`);
  }

  /**
   * Create execution plan
   */
  private async createExecutionPlan(
    selectedAlternate: AlternateScope,
    calendar: PhasingCalendar,
    project: ProjectSummary
  ): Promise<any> {
    console.log('\n📋 Creating Multi-Phase Execution Plan:');

    const executionPlan = this.phasingManager.createExecutionPlan(
      'Kitchen Renovation Execution Plan',
      project.id,
      selectedAlternate,
      calendar.id,
      new Date()
    );

    console.log(`  Execution plan created with:`);
    console.log(`    Selected Alternate: ${selectedAlternate.name}`);
    console.log(`    Execution Phases: ${executionPlan.executionPhases.length}`);
    console.log(`    Resource Allocations: ${executionPlan.resourcePlanning.length}`);
    console.log(`    Cost Projections: ${executionPlan.costProjection.length}`);
    console.log(`    Performance Metrics: ${executionPlan.performanceMetrics.length}`);

    // Display phase schedule
    console.log(`\n  Phase Schedule:`);
    for (const phase of executionPlan.executionPhases) {
      console.log(`    ${phase.name}:`);
      console.log(`      Start: ${phase.scheduledStart.toDateString()}`);
      console.log(`      End: ${phase.scheduledEnd.toDateString()}`);
      console.log(`      Labor Hours: ${phase.requiredResources.laborHours}`);
      console.log(`      Crew Size: ${phase.requiredResources.crewSize}`);
      console.log(`      Cost: $${phase.adjustedCosts.totalAdjustedCost.toFixed(2)}`);
    }

    return executionPlan;
  }

  /**
   * Generate comprehensive cost projection
   */
  private async generateComprehensiveCostProjection(
    phases: WorkPhase[],
    calendar: PhasingCalendar
  ): Promise<any> {
    console.log('\n📊 Generating Comprehensive Cost Projection:');

    const startDate = new Date();
    const projection = this.phasingManager.generateComprehensiveCostProjection(
      phases,
      calendar,
      startDate
    );

    console.log(`  Comprehensive Cost Analysis:`);
    console.log(`    Base Cost: $${projection.totalProjection.baseCost.toFixed(2)}`);
    console.log(`    Calendar Adjustments: $${projection.totalProjection.calendarAdjustments.toFixed(2)}`);
    console.log(`    Learning Curve Savings: -$${Math.abs(projection.totalProjection.learningCurveSavings).toFixed(2)}`);
    console.log(`    Risk Contingency: $${projection.totalProjection.riskContingency.toFixed(2)}`);
    console.log(`    Final Projected Cost: $${projection.totalProjection.finalProjectedCost.toFixed(2)}`);

    const netAdjustment = projection.totalProjection.finalProjectedCost - projection.totalProjection.baseCost;
    const percentageChange = (netAdjustment / projection.totalProjection.baseCost) * 100;
    
    console.log(`\n  Net Impact: $${netAdjustment.toFixed(2)} (${percentageChange.toFixed(1)}%)`);

    return projection;
  }

  /**
   * Display final summary
   */
  private displayFinalSummary(
    baseScopeTree: BaseScopeTree,
    alternates: string[],
    comparison: AlternateComparison,
    executionPlan: any,
    costProjection: any
  ): void {
    console.log('\n' + '='.repeat(70));
    console.log('📋 FINAL SUMMARY: Alternates and Multi-Phase Scenario Handling');
    console.log('='.repeat(70));

    console.log(`\n🏗️  PROJECT OVERVIEW:`);
    console.log(`    Base Scope: ${baseScopeTree.name}`);
    console.log(`    Base Cost: $${baseScopeTree.baseCostSummary.contractTotal.toFixed(2)}`);
    console.log(`    Alternates Created: ${alternates.length}`);
    
    console.log(`\n🔄 ALTERNATES ANALYSIS:`);
    console.log(`    Best Value Option: ${this.getAlternateName(comparison.analysis.bestValue)}`);
    console.log(`    Cost Range: $${Math.min(...comparison.comparisonMatrix.map(m => m.totalCost)).toFixed(2)} - $${Math.max(...comparison.comparisonMatrix.map(m => m.totalCost)).toFixed(2)}`);
    console.log(`    Quality Levels: ${Array.from(new Set(comparison.comparisonMatrix.map(m => m.qualityLevel))).join(', ')}`);

    console.log(`\n📅 MULTI-PHASE EXECUTION:`);
    console.log(`    Execution Phases: ${executionPlan.executionPhases.length}`);
    console.log(`    Total Duration: ${this.calculateTotalDuration(executionPlan.executionPhases)}`);
    console.log(`    Resource Allocations: ${executionPlan.resourcePlanning.length}`);

    console.log(`\n💰 COST PROJECTION (with adjustments):`);
    console.log(`    Base Cost: $${costProjection.totalProjection.baseCost.toFixed(2)}`);
    console.log(`    Calendar Adjustments: $${costProjection.totalProjection.calendarAdjustments.toFixed(2)}`);
    console.log(`    Learning Curve Savings: -$${Math.abs(costProjection.totalProjection.learningCurveSavings).toFixed(2)}`);
    console.log(`    Final Projected Cost: $${costProjection.totalProjection.finalProjectedCost.toFixed(2)}`);

    console.log(`\n🎯 KEY BENEFITS DEMONSTRATED:`);
    console.log(`    ✅ Scope Tree Inheritance: Alternates inherit from base scope with delta-only storage`);
    console.log(`    ✅ Differential Pricing: Only cost deltas are calculated and stored`);
    console.log(`    ✅ Labor Rate Adjustments: Time-based, seasonal, and work-type rate multipliers`);
    console.log(`    ✅ Learning Curves: Efficiency improvements across repeated work phases`);
    console.log(`    ✅ Calendar Integration: Schedule constraints and productivity factors`);
    console.log(`    ✅ Multi-Phase Planning: Execution phases with resource allocation and tracking`);

    const totalBaseCost = baseScopeTree.baseCostSummary.contractTotal;
    const totalProjectedCost = costProjection.totalProjection.finalProjectedCost;
    const netImpact = totalProjectedCost - totalBaseCost;
    const percentageImpact = (netImpact / totalBaseCost) * 100;

    console.log(`\n📈 OVERALL IMPACT:`);
    console.log(`    Net Cost Impact: $${netImpact.toFixed(2)} (${percentageImpact.toFixed(1)}%)`);
    console.log(`    Pricing Accuracy: Improved through learning curves and calendar adjustments`);
    console.log(`    Risk Management: Enhanced through multi-phase planning and contingencies`);
  }

  // Helper methods
  private getAlternateName(alternateId: string): string {
    const alternate = this.alternatesManager.getAlternateScope(alternateId);
    return alternate ? alternate.name : 'Unknown';
  }

  private calculateTotalDuration(executionPhases: any[]): string {
    if (executionPhases.length === 0) return '0 days';
    
    const startDate = Math.min(...executionPhases.map(p => p.scheduledStart.getTime()));
    const endDate = Math.max(...executionPhases.map(p => p.scheduledEnd.getTime()));
    const totalDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));
    
    if (totalDays <= 7) return `${totalDays} days`;
    if (totalDays <= 30) return `${Math.ceil(totalDays / 7)} weeks`;
    return `${Math.ceil(totalDays / 30)} months`;
  }
}

// Export for use in other modules
export const alternatesMultiPhaseDemo = new AlternatesMultiPhaseDemo();

// Run demo if called directly
if (require.main === module) {
  alternatesMultiPhaseDemo.runCompleteDemo().catch(console.error);
}
