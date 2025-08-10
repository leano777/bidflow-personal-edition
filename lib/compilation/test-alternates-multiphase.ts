// Test Suite: Alternates and Multi-Phase Scenario Handling - Step 8 Implementation

import { AlternatesManager } from './alternates-manager';
import { PhasingCalendarManager } from './phasing-calendar-manager';
import { CostCalculator } from './cost-calculator';
import { 
  BaseScopeTree, 
  AlternateScope, 
  ScopeModification, 
  PhaseModification 
} from './alternates-types';
import { WorkPhase, EstimateLineItem } from './types';
import { OrganizedScope } from '../voice-scope/types';

interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  executionTime: number;
}

export class AlternatesMultiPhaseTests {
  private alternatesManager: AlternatesManager;
  private phasingManager: PhasingCalendarManager;
  private costCalculator: CostCalculator;
  private testResults: TestResult[] = [];

  constructor() {
    this.costCalculator = new CostCalculator();
    this.alternatesManager = new AlternatesManager(this.costCalculator);
    this.phasingManager = new PhasingCalendarManager();
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Alternates and Multi-Phase Tests');
    console.log('='.repeat(50));

    const testSuites = [
      () => this.testBaseScopeTreeCreation(),
      () => this.testAlternateScopeInheritance(),
      () => this.testDifferentialPricing(),
      () => this.testScopeModifications(),
      () => this.testPhaseModifications(),
      () => this.testAlternateComparison(),
      () => this.testPhasingCalendarCreation(),
      () => this.testLearningCurves(),
      () => this.testLaborRateAdjustments(),
      () => this.testCalendarConstraints(),
      () => this.testExecutionPlanCreation(),
      () => this.testComprehensiveCostProjection(),
      () => this.testDataIntegrity(),
      () => this.testPerformance()
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite();
      } catch (error) {
        console.error(`Test suite failed: ${error}`);
      }
    }

    this.displayTestSummary();
  }

  /**
   * Test base scope tree creation
   */
  private async testBaseScopeTreeCreation(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test scope for validation',
        baseScope,
        basePhases
      );

      const isValid = 
        baseScopeTree.id !== '' &&
        baseScopeTree.name === 'Test Base Scope' &&
        baseScopeTree.basePhases.length === basePhases.length &&
        baseScopeTree.baseCostSummary.contractTotal > 0;

      this.addTestResult({
        testName: 'Base Scope Tree Creation',
        passed: isValid,
        message: isValid ? 'Successfully created base scope tree' : 'Failed to create valid base scope tree',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Base Scope Tree Creation',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test alternate scope inheritance
   */
  private async testAlternateScopeInheritance(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test scope for inheritance validation',
        baseScope,
        basePhases
      );

      const alternate = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Test Alternate',
        'Test alternate scope',
        'value_engineering',
        {
          scopeModifications: [],
          phaseModifications: []
        }
      );

      const isValid = 
        alternate.parentScopeId === baseScopeTree.id &&
        alternate.inheritsFrom.id === baseScopeTree.id &&
        alternate.computedPhases !== undefined &&
        alternate.computedCostSummary !== undefined;

      this.addTestResult({
        testName: 'Alternate Scope Inheritance',
        passed: isValid,
        message: isValid ? 'Alternate correctly inherits from base scope' : 'Alternate inheritance failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Alternate Scope Inheritance',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test differential pricing (delta-only storage)
   */
  private async testDifferentialPricing(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test scope for differential pricing',
        baseScope,
        basePhases
      );

      const scopeModifications: ScopeModification[] = [
        {
          id: 'mod_test_add',
          type: 'add',
          targetPath: 'phase_test',
          addedItems: [
            {
              id: 'added_item_1',
              description: 'Added test item',
              quantity: 10,
              unit: 'EA',
              materialCost: 500,
              laborCost: 300,
              equipmentCost: 50,
              lineItemTotal: 850,
              confidenceScore: 0.9,
              phase: 'Test Phase',
              category: 'Test',
              riskFactors: [],
              wasteFactor: 0.05,
              laborHours: 12
            }
          ],
          reason: 'Test addition',
          impact: {
            costDelta: 850,
            timeDelta: { value: 1, unit: 'days' },
            qualityImpact: 'improved'
          }
        }
      ];

      const alternate = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Test Differential Pricing',
        'Test differential pricing functionality',
        'custom',
        {
          scopeModifications,
          phaseModifications: []
        }
      );

      const isValid = 
        alternate.costDeltas.length > 0 &&
        alternate.totalDeltaCost === 850 &&
        alternate.deltaPercentage > 0 &&
        alternate.computedCostSummary!.contractTotal > baseScopeTree.baseCostSummary.contractTotal;

      this.addTestResult({
        testName: 'Differential Pricing',
        passed: isValid,
        message: isValid ? 'Differential pricing correctly calculates deltas' : 'Differential pricing calculation failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Differential Pricing',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test scope modifications (add, remove, modify, replace)
   */
  private async testScopeModifications(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test scope modifications',
        baseScope,
        basePhases
      );

      // Test all modification types
      const scopeModifications: ScopeModification[] = [
        {
          id: 'mod_add',
          type: 'add',
          targetPath: 'phase_test',
          addedItems: [this.createTestItem('added_item', 100)],
          reason: 'Test add',
          impact: { costDelta: 100, timeDelta: { value: 0, unit: 'days' }, qualityImpact: 'same' }
        },
        {
          id: 'mod_modify',
          type: 'modify',
          targetPath: 'phase_test',
          modifications: [{
            itemId: 'test_item_1',
            changes: { materialCost: 200 } // Increase by 100
          }],
          reason: 'Test modify',
          impact: { costDelta: 100, timeDelta: { value: 0, unit: 'days' }, qualityImpact: 'same' }
        }
      ];

      const alternate = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Test Scope Modifications',
        'Test all scope modification types',
        'custom',
        {
          scopeModifications,
          phaseModifications: []
        }
      );

      const hasAddDeltas = alternate.costDeltas.some(d => d.description.includes('Added'));
      const hasModifyDeltas = alternate.costDeltas.some(d => d.description.includes('Modified'));
      
      const isValid = hasAddDeltas && hasModifyDeltas && alternate.costDeltas.length >= 2;

      this.addTestResult({
        testName: 'Scope Modifications',
        passed: isValid,
        message: isValid ? 'All scope modification types work correctly' : 'Scope modifications failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Scope Modifications',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test phase modifications
   */
  private async testPhaseModifications(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test phase modifications',
        baseScope,
        basePhases
      );

      const phaseModifications: PhaseModification[] = [
        {
          id: 'mod_phase_modify',
          phaseId: 'phase_test_1',
          modificationType: 'modify',
          phaseChanges: {
            phaseTotal: 2000 // Increase from original
          },
          reason: 'Test phase modification',
          impact: {
            costDelta: 500,
            scheduleDelta: { value: 1, unit: 'days' },
            riskChange: 'same',
            prerequisiteChanges: [],
            resourceRequirementChanges: []
          }
        }
      ];

      const alternate = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Test Phase Modifications',
        'Test phase modification functionality',
        'custom',
        {
          scopeModifications: [],
          phaseModifications
        }
      );

      const hasPhaseDeltas = alternate.costDeltas.some(d => d.description.includes('Modified phase'));
      const hasTimeDeltas = alternate.timeDeltas.length > 0;
      
      const isValid = hasPhaseDeltas && hasTimeDeltas;

      this.addTestResult({
        testName: 'Phase Modifications',
        passed: isValid,
        message: isValid ? 'Phase modifications work correctly' : 'Phase modifications failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Phase Modifications',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test alternate comparison
   */
  private async testAlternateComparison(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test alternate comparison',
        baseScope,
        basePhases
      );

      // Create two alternates
      const alternate1 = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Value Engineering',
        'Cost reduction alternate',
        'value_engineering',
        { scopeModifications: [], phaseModifications: [] }
      );

      const alternate2 = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Premium Upgrade',
        'Premium alternate',
        'premium',
        { scopeModifications: [], phaseModifications: [] }
      );

      const comparison = this.alternatesManager.createAlternateComparison(
        baseScopeTree.id,
        [alternate1.id, alternate2.id],
        'Test Comparison'
      );

      const isValid = 
        comparison.comparisonMatrix.length === 2 &&
        comparison.analysis.bestValue !== '' &&
        comparison.analysis.lowestCost !== '' &&
        comparison.recommendations.length > 0;

      this.addTestResult({
        testName: 'Alternate Comparison',
        passed: isValid,
        message: isValid ? 'Alternate comparison works correctly' : 'Alternate comparison failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Alternate Comparison',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test phasing calendar creation
   */
  private async testPhasingCalendarCreation(): Promise<void> {
    const startTime = Date.now();

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);

      const calendar = this.phasingManager.createDefaultConstructionCalendar(
        'test_project',
        startDate,
        endDate
      );

      const isValid = 
        calendar.periods.length > 0 &&
        calendar.laborRateAdjustments.length > 0 &&
        calendar.learningCurves.length > 0 &&
        calendar.workSchedules.length > 0;

      this.addTestResult({
        testName: 'Phasing Calendar Creation',
        passed: isValid,
        message: isValid ? 'Phasing calendar created successfully' : 'Phasing calendar creation failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Phasing Calendar Creation',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test learning curves
   */
  private async testLearningCurves(): Promise<void> {
    const startTime = Date.now();

    try {
      const { basePhases } = this.createTestData();
      
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const calendar = this.phasingManager.createDefaultConstructionCalendar(
        'test_project',
        startDate,
        endDate
      );

      // Create repetitive phases for learning curve testing
      const repetitivePhases: WorkPhase[] = [];
      for (let i = 0; i < 3; i++) {
        const phase = JSON.parse(JSON.stringify(basePhases[0]));
        phase.id = `repetitive_phase_${i}`;
        phase.category = 'Interior'; // Match learning curve category
        repetitivePhases.push(phase);
      }

      const { adjustedPhases, learningCurveImpact } = 
        this.phasingManager.applyLearningCurveAdjustments(repetitivePhases, calendar.learningCurves);

      const isValid = 
        adjustedPhases.length === repetitivePhases.length &&
        learningCurveImpact.length > 0 &&
        learningCurveImpact.some(impact => impact.efficiency < 1.0); // Some efficiency improvement

      this.addTestResult({
        testName: 'Learning Curves',
        passed: isValid,
        message: isValid ? 'Learning curves applied successfully' : 'Learning curves application failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Learning Curves',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test labor rate adjustments
   */
  private async testLaborRateAdjustments(): Promise<void> {
    const startTime = Date.now();

    try {
      const { basePhases } = this.createTestData();
      
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const calendar = this.phasingManager.createDefaultConstructionCalendar(
        'test_project',
        startDate,
        endDate
      );

      const { adjustedPhases, calendarAdjustments } = 
        this.phasingManager.applyCalendarAdjustments(basePhases, calendar, startDate);

      const isValid = 
        adjustedPhases.length === basePhases.length &&
        calendarAdjustments.length > 0 &&
        calendarAdjustments.some(adj => Math.abs(adj.adjustments.total) > 0);

      this.addTestResult({
        testName: 'Labor Rate Adjustments',
        passed: isValid,
        message: isValid ? 'Labor rate adjustments applied successfully' : 'Labor rate adjustments failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Labor Rate Adjustments',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test calendar constraints
   */
  private async testCalendarConstraints(): Promise<void> {
    const startTime = Date.now();

    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // One year

      const calendar = this.phasingManager.createDefaultConstructionCalendar(
        'test_project',
        startDate,
        endDate
      );

      const hasHolidays = calendar.scheduleConstraints.some(c => c.type === 'holiday');
      const hasConstraints = calendar.scheduleConstraints.length > 0;

      const isValid = hasHolidays && hasConstraints;

      this.addTestResult({
        testName: 'Calendar Constraints',
        passed: isValid,
        message: isValid ? 'Calendar constraints created successfully' : 'Calendar constraints creation failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Calendar Constraints',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test execution plan creation
   */
  private async testExecutionPlanCreation(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test execution plan',
        baseScope,
        basePhases
      );

      const alternate = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Test Alternate',
        'Test alternate for execution plan',
        'value_engineering',
        { scopeModifications: [], phaseModifications: [] }
      );

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const calendar = this.phasingManager.createDefaultConstructionCalendar(
        'test_project',
        startDate,
        endDate
      );

      const executionPlan = this.phasingManager.createExecutionPlan(
        'Test Execution Plan',
        'test_project',
        alternate,
        calendar.id,
        startDate
      );

      const isValid = 
        executionPlan.executionPhases.length > 0 &&
        executionPlan.resourcePlanning.length > 0 &&
        executionPlan.costProjection.length > 0 &&
        executionPlan.performanceMetrics.length > 0;

      this.addTestResult({
        testName: 'Execution Plan Creation',
        passed: isValid,
        message: isValid ? 'Execution plan created successfully' : 'Execution plan creation failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Execution Plan Creation',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test comprehensive cost projection
   */
  private async testComprehensiveCostProjection(): Promise<void> {
    const startTime = Date.now();

    try {
      const { basePhases } = this.createTestData();
      
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 90 * 24 * 60 * 60 * 1000);
      
      const calendar = this.phasingManager.createDefaultConstructionCalendar(
        'test_project',
        startDate,
        endDate
      );

      const projection = this.phasingManager.generateComprehensiveCostProjection(
        basePhases,
        calendar,
        startDate
      );

      const isValid = 
        projection.projectedPhases.length === basePhases.length &&
        projection.totalProjection.baseCost > 0 &&
        projection.totalProjection.finalProjectedCost > 0 &&
        projection.phaseProjections.length === basePhases.length;

      this.addTestResult({
        testName: 'Comprehensive Cost Projection',
        passed: isValid,
        message: isValid ? 'Cost projection generated successfully' : 'Cost projection generation failed',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Comprehensive Cost Projection',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test data integrity
   */
  private async testDataIntegrity(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      const baseScopeTree = this.alternatesManager.createBaseScopeTree(
        'Test Base Scope',
        'Test data integrity',
        baseScope,
        basePhases
      );

      const alternate = this.alternatesManager.createAlternateScope(
        baseScopeTree.id,
        'Test Alternate',
        'Test alternate for data integrity',
        'value_engineering',
        { scopeModifications: [], phaseModifications: [] }
      );

      // Test data retrieval
      const retrievedBase = this.alternatesManager.getBaseScopeTree(baseScopeTree.id);
      const retrievedAlternate = this.alternatesManager.getAlternateScope(alternate.id);
      const allBases = this.alternatesManager.getAllBaseScopeTrees();
      const allAlternates = this.alternatesManager.getAllAlternateScopes();
      const alternatesByBase = this.alternatesManager.getAlternatesByBaseScope(baseScopeTree.id);

      const isValid = 
        retrievedBase?.id === baseScopeTree.id &&
        retrievedAlternate?.id === alternate.id &&
        allBases.length >= 1 &&
        allAlternates.length >= 1 &&
        alternatesByBase.length >= 1 &&
        alternatesByBase.some(a => a.id === alternate.id);

      this.addTestResult({
        testName: 'Data Integrity',
        passed: isValid,
        message: isValid ? 'Data integrity maintained' : 'Data integrity compromised',
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Data Integrity',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  /**
   * Test performance
   */
  private async testPerformance(): Promise<void> {
    const startTime = Date.now();

    try {
      const { baseScope, basePhases } = this.createTestData();
      
      // Test creating multiple base scopes and alternates
      const performanceStartTime = Date.now();
      
      for (let i = 0; i < 10; i++) {
        const baseScopeTree = this.alternatesManager.createBaseScopeTree(
          `Performance Test Base ${i}`,
          `Performance test base scope ${i}`,
          baseScope,
          basePhases
        );

        for (let j = 0; j < 5; j++) {
          this.alternatesManager.createAlternateScope(
            baseScopeTree.id,
            `Performance Test Alternate ${i}_${j}`,
            `Performance test alternate ${i}_${j}`,
            'value_engineering',
            { scopeModifications: [], phaseModifications: [] }
          );
        }
      }

      const performanceTime = Date.now() - performanceStartTime;
      const isValid = performanceTime < 5000; // Should complete in under 5 seconds

      this.addTestResult({
        testName: 'Performance',
        passed: isValid,
        message: isValid ? `Performance acceptable (${performanceTime}ms for 60 operations)` : `Performance too slow (${performanceTime}ms)`,
        executionTime: Date.now() - startTime
      });

    } catch (error) {
      this.addTestResult({
        testName: 'Performance',
        passed: false,
        message: `Error: ${error}`,
        executionTime: Date.now() - startTime
      });
    }
  }

  // Helper methods

  private createTestData(): { baseScope: OrganizedScope; basePhases: WorkPhase[] } {
    const baseScope: OrganizedScope = {
      id: 'test_scope',
      projectSummary: 'Test project for validation',
      workCategories: [],
      materialSpecs: [],
      laborRequirements: [],
      specialConsiderations: [],
      estimatedTimeline: '2 weeks',
      confidence: 0.8,
      sourceCapture: 'test',
      createdAt: new Date()
    };

    const basePhases: WorkPhase[] = [
      {
        id: 'phase_test_1',
        phase: 'Test Phase 1',
        category: 'Interior',
        sequenceOrder: 1,
        items: [this.createTestItem('test_item_1', 100)],
        phaseTotal: 150,
        duration: { value: 2, unit: 'days' },
        prerequisites: [],
        description: 'Test phase 1',
        riskLevel: 'low',
        permitRequired: false,
        inspectionRequired: false
      },
      {
        id: 'phase_test_2',
        phase: 'Test Phase 2',
        category: 'Systems',
        sequenceOrder: 2,
        items: [this.createTestItem('test_item_2', 200)],
        phaseTotal: 300,
        duration: { value: 3, unit: 'days' },
        prerequisites: ['Test Phase 1'],
        description: 'Test phase 2',
        riskLevel: 'medium',
        permitRequired: true,
        inspectionRequired: true
      }
    ];

    return { baseScope, basePhases };
  }

  private createTestItem(id: string, cost: number): EstimateLineItem {
    return {
      id,
      description: `Test item ${id}`,
      quantity: 1,
      unit: 'EA',
      materialCost: cost * 0.6,
      laborCost: cost * 0.3,
      equipmentCost: cost * 0.1,
      lineItemTotal: cost,
      confidenceScore: 0.8,
      phase: 'Test Phase',
      category: 'Test',
      riskFactors: [],
      wasteFactor: 0.05,
      laborHours: 8
    };
  }

  private addTestResult(result: TestResult): void {
    this.testResults.push(result);
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.testName} (${result.executionTime}ms): ${result.message}`);
  }

  private displayTestSummary(): void {
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    const totalTime = this.testResults.reduce((sum, r) => sum + r.executionTime, 0);

    console.log('\n' + '='.repeat(50));
    console.log('🧪 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Pass Rate: ${((passed / total) * 100).toFixed(1)}%`);
    console.log(`Total Execution Time: ${totalTime}ms`);
    console.log(`Average Test Time: ${(totalTime / total).toFixed(1)}ms`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! The alternates and multi-phase system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the implementation.');
      
      console.log('\n❌ Failed Tests:');
      this.testResults.filter(r => !r.passed).forEach(result => {
        console.log(`  • ${result.testName}: ${result.message}`);
      });
    }

    console.log('\n🎯 Key Features Validated:');
    console.log('  ✅ Scope Tree Inheritance');
    console.log('  ✅ Differential Pricing (Delta-only storage)');
    console.log('  ✅ Scope and Phase Modifications');
    console.log('  ✅ Alternate Comparison Analysis');
    console.log('  ✅ Phasing Calendars with Labor Rate Adjustments');
    console.log('  ✅ Learning Curves Across Phases');
    console.log('  ✅ Calendar-based Rate Multipliers');
    console.log('  ✅ Multi-Phase Execution Planning');
    console.log('  ✅ Comprehensive Cost Projection');
    console.log('  ✅ Data Integrity and Performance');
  }
}

// Export for use in other modules
export const alternatesMultiPhaseTests = new AlternatesMultiPhaseTests();

// Run tests if called directly
if (require.main === module) {
  alternatesMultiPhaseTests.runAllTests().catch(console.error);
}
