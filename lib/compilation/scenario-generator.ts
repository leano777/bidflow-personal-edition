// Alternative Scenario Generation - BF-005 Implementation

import { 
  AlternativeEstimate, 
  WorkPhase, 
  CostSummary, 
  EstimateRecommendation,
  ProjectSummary,
  Duration 
} from './types';
import { CostCalculator, CostCalculationOptions } from './cost-calculator';

export class ScenarioGenerator {
  private costCalculator: CostCalculator;

  constructor(costCalculator: CostCalculator) {
    this.costCalculator = costCalculator;
  }

  /**
   * Generate multiple pricing scenarios from baseline estimate
   */
  generateAlternativeScenarios(
    baselinePhases: WorkPhase[],
    baselineCostSummary: CostSummary,
    project?: ProjectSummary
  ): AlternativeEstimate[] {
    const scenarios: AlternativeEstimate[] = [];

    // Value Engineering Scenario
    scenarios.push(this.generateValueEngineeredScenario(baselinePhases, project));

    // Premium Finish Scenario
    scenarios.push(this.generatePremiumScenario(baselinePhases, project));

    // Fast Track Scenario
    scenarios.push(this.generateFastTrackScenario(baselinePhases, project));

    // Budget Conscious Scenario
    scenarios.push(this.generateBudgetConsciousScenario(baselinePhases, project));

    // Conservative/Risk-Averse Scenario
    scenarios.push(this.generateConservativeScenario(baselinePhases, project));

    return scenarios;
  }

  /**
   * Generate value-engineered scenario (cost-optimized)
   */
  private generateValueEngineeredScenario(
    baselinePhases: WorkPhase[],
    project?: ProjectSummary
  ): AlternativeEstimate {
    // Reduce material costs by using standard-grade materials
    const modifiedPhases = this.applyPhaseModifications(baselinePhases, {
      materialCostMultiplier: 0.85,  // 15% reduction
      laborCostMultiplier: 1.05,     // 5% increase (more work to use cheaper materials)
      equipmentCostMultiplier: 0.95  // 5% reduction
    });

    const costOptions: CostCalculationOptions = {
      markupRate: 0.18,               // Reduced markup for competitiveness
      contingencyRate: 0.03,          // Lower contingency
      overheadRate: 0.13             // Reduced overhead
    };

    const costSummary = this.costCalculator.calculateCostSummary(modifiedPhases, project, costOptions);

    return {
      id: 'value_engineered',
      name: 'Value Engineered',
      description: 'Cost-optimized solution using standard materials and efficient methods',
      costVariation: -0.15,           // 15% cost reduction
      timeVariation: 0.05,            // 5% longer timeline
      riskLevel: 'higher',
      qualityLevel: 'same',
      tradeoffs: [
        'Standard-grade materials instead of premium',
        'Simplified installation methods',
        'Longer construction timeline',
        'Reduced aesthetic features'
      ],
      advantages: [
        'Significant cost savings',
        'Competitive pricing advantage',
        'Still meets building codes',
        'Good value for money'
      ],
      targetMarket: 'Budget-conscious clients seeking good value',
      costSummary,
      modifiedPhases,
      recommendations: this.generateScenarioRecommendations('value_engineered', costSummary)
    };
  }

  /**
   * Generate premium finish scenario
   */
  private generatePremiumScenario(
    baselinePhases: WorkPhase[],
    project?: ProjectSummary
  ): AlternativeEstimate {
    const modifiedPhases = this.applyPhaseModifications(baselinePhases, {
      materialCostMultiplier: 1.35,   // 35% increase for premium materials
      laborCostMultiplier: 1.15,     // 15% increase for skilled craftsmen
      equipmentCostMultiplier: 1.10  // 10% increase for specialized tools
    });

    const costOptions: CostCalculationOptions = {
      markupRate: 0.25,              // Higher markup for premium work
      contingencyRate: 0.04,         // Slightly lower contingency (less risk with quality materials)
      overheadRate: 0.17             // Higher overhead for premium service
    };

    const costSummary = this.costCalculator.calculateCostSummary(modifiedPhases, project, costOptions);

    return {
      id: 'premium_finish',
      name: 'Premium Finish',
      description: 'High-end materials and finishes with superior craftsmanship',
      costVariation: 0.25,           // 25% cost increase
      timeVariation: 0.10,           // 10% longer for careful work
      riskLevel: 'lower',
      qualityLevel: 'higher',
      tradeoffs: [
        'Higher upfront investment',
        'Longer construction timeline',
        'More stringent quality requirements'
      ],
      advantages: [
        'Premium materials and finishes',
        'Superior craftsmanship',
        'Enhanced durability and longevity',
        'Higher property value',
        'Extended warranty coverage'
      ],
      targetMarket: 'High-end clients seeking luxury and durability',
      costSummary,
      modifiedPhases,
      recommendations: this.generateScenarioRecommendations('premium_finish', costSummary)
    };
  }

  /**
   * Generate fast-track scenario
   */
  private generateFastTrackScenario(
    baselinePhases: WorkPhase[],
    project?: ProjectSummary
  ): AlternativeEstimate {
    const modifiedPhases = this.applyPhaseModifications(baselinePhases, {
      materialCostMultiplier: 1.10,   // Premium for quick delivery
      laborCostMultiplier: 1.30,     // Overtime and additional crews
      equipmentCostMultiplier: 1.20  // Equipment rental premiums
    });

    // Compress timeline by overlapping phases
    for (const phase of modifiedPhases) {
      phase.duration = {
        value: Math.max(1, Math.ceil(phase.duration.value * 0.7)),
        unit: phase.duration.unit
      };
    }

    const costOptions: CostCalculationOptions = {
      markupRate: 0.22,              // Higher markup for rush work
      contingencyRate: 0.07,         // Higher contingency for rush risks
      overheadRate: 0.18             // Higher overhead for coordination
    };

    const costSummary = this.costCalculator.calculateCostSummary(modifiedPhases, project, costOptions);

    return {
      id: 'fast_track',
      name: 'Fast Track',
      description: 'Accelerated timeline with parallel work execution',
      costVariation: 0.18,           // 18% cost increase
      timeVariation: -0.30,          // 30% faster completion
      riskLevel: 'higher',
      qualityLevel: 'same',
      tradeoffs: [
        'Higher labor costs due to overtime',
        'Increased coordination complexity',
        'Higher risk of errors',
        'Premium material costs for quick delivery'
      ],
      advantages: [
        'Significantly faster completion',
        'Earlier occupancy/use',
        'Reduced financing costs',
        'Competitive time advantage'
      ],
      targetMarket: 'Time-sensitive clients with urgent deadlines',
      costSummary,
      modifiedPhases,
      recommendations: this.generateScenarioRecommendations('fast_track', costSummary)
    };
  }

  /**
   * Generate budget-conscious scenario
   */
  private generateBudgetConsciousScenario(
    baselinePhases: WorkPhase[],
    project?: ProjectSummary
  ): AlternativeEstimate {
    const modifiedPhases = this.applyPhaseModifications(baselinePhases, {
      materialCostMultiplier: 0.80,   // 20% reduction using basic materials
      laborCostMultiplier: 0.95,     // 5% reduction with efficient methods
      equipmentCostMultiplier: 0.90  // 10% reduction with basic equipment
    });

    // Remove or simplify certain finish items
    for (const phase of modifiedPhases) {
      if (phase.phase.includes('Interior Finishes') || phase.phase.includes('Exterior Finishes')) {
        phase.items = phase.items.filter(item => !item.description.toLowerCase().includes('premium'));
        phase.phaseTotal = phase.items.reduce((sum, item) => sum + item.lineItemTotal, 0);
      }
    }

    const costOptions: CostCalculationOptions = {
      markupRate: 0.16,              // Lower markup for budget market
      contingencyRate: 0.06,         // Higher contingency for budget risks
      overheadRate: 0.12             // Reduced overhead
    };

    const costSummary = this.costCalculator.calculateCostSummary(modifiedPhases, project, costOptions);

    return {
      id: 'budget_conscious',
      name: 'Budget Conscious',
      description: 'Maximum value with essential features and cost-effective materials',
      costVariation: -0.22,          // 22% cost reduction
      timeVariation: 0.08,           // 8% longer timeline
      riskLevel: 'higher',
      qualityLevel: 'lower',
      tradeoffs: [
        'Basic materials and finishes',
        'Simplified construction methods',
        'Fewer decorative elements',
        'Standard-grade fixtures'
      ],
      advantages: [
        'Maximum cost savings',
        'Meets essential requirements',
        'Good for investment properties',
        'Lower maintenance costs'
      ],
      targetMarket: 'Cost-sensitive clients and investors',
      costSummary,
      modifiedPhases,
      recommendations: this.generateScenarioRecommendations('budget_conscious', costSummary)
    };
  }

  /**
   * Generate conservative/risk-averse scenario
   */
  private generateConservativeScenario(
    baselinePhases: WorkPhase[],
    project?: ProjectSummary
  ): AlternativeEstimate {
    const modifiedPhases = this.applyPhaseModifications(baselinePhases, {
      materialCostMultiplier: 1.05,   // 5% increase for quality materials
      laborCostMultiplier: 1.10,     // 10% increase for experienced crews
      equipmentCostMultiplier: 1.05  // 5% increase for reliable equipment
    });

    const costOptions: CostCalculationOptions = {
      markupRate: 0.22,              // Higher markup for stability
      contingencyRate: 0.08,         // Higher contingency for safety
      overheadRate: 0.18,            // Higher overhead for management
      includeBonding: true           // Include bonding for security
    };

    const costSummary = this.costCalculator.calculateCostSummary(modifiedPhases, project, costOptions);

    return {
      id: 'conservative',
      name: 'Conservative',
      description: 'Risk-minimized approach with higher contingencies and proven methods',
      costVariation: 0.12,           // 12% cost increase
      timeVariation: 0.05,           // 5% longer for careful work
      riskLevel: 'lower',
      qualityLevel: 'higher',
      tradeoffs: [
        'Higher upfront costs',
        'Conservative timeline',
        'Higher contingency allocations'
      ],
      advantages: [
        'Minimal risk of cost overruns',
        'High probability of on-time completion',
        'Quality assurance',
        'Bonded and insured work',
        'Proven construction methods'
      ],
      targetMarket: 'Risk-averse clients seeking certainty',
      costSummary,
      modifiedPhases,
      recommendations: this.generateScenarioRecommendations('conservative', costSummary)
    };
  }

  /**
   * Apply modifications to work phases
   */
  private applyPhaseModifications(
    baselinePhases: WorkPhase[],
    modifications: {
      materialCostMultiplier: number;
      laborCostMultiplier: number;
      equipmentCostMultiplier: number;
    }
  ): WorkPhase[] {
    return baselinePhases.map(phase => {
      const modifiedPhase = { ...phase };
      modifiedPhase.items = phase.items.map(item => {
        const modifiedItem = { ...item };
        
        modifiedItem.materialCost *= modifications.materialCostMultiplier;
        modifiedItem.laborCost *= modifications.laborCostMultiplier;
        modifiedItem.equipmentCost *= modifications.equipmentCostMultiplier;
        modifiedItem.lineItemTotal = modifiedItem.materialCost + modifiedItem.laborCost + modifiedItem.equipmentCost;
        
        return modifiedItem;
      });
      
      modifiedPhase.phaseTotal = modifiedPhase.items.reduce((sum, item) => sum + item.lineItemTotal, 0);
      
      return modifiedPhase;
    });
  }

  /**
   * Generate scenario-specific recommendations
   */
  private generateScenarioRecommendations(scenarioType: string, costSummary: CostSummary): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    switch (scenarioType) {
      case 'value_engineered':
        recommendations.push({
          id: 've_material_verification',
          category: 'cost_optimization',
          priority: 'high',
          title: 'Verify Alternative Materials',
          description: 'Confirm that alternative materials meet building codes and client expectations.',
          impact: { qualityImprovement: 'Ensures compliance and satisfaction' },
          implementation: {
            effort: 'medium',
            timeline: { value: 3, unit: 'days' },
            requirements: ['Material testing', 'Code verification', 'Client approval']
          },
          tradeoffs: ['Additional verification time'],
          confidence: 0.9
        });
        break;

      case 'premium_finish':
        recommendations.push({
          id: 'premium_supplier_coordination',
          category: 'project_execution',
          priority: 'high',
          title: 'Premium Supplier Coordination',
          description: 'Establish relationships with premium material suppliers for reliable delivery.',
          impact: { riskReduction: 0.3 },
          implementation: {
            effort: 'medium',
            timeline: { value: 1, unit: 'weeks' },
            requirements: ['Supplier vetting', 'Delivery schedules', 'Quality agreements']
          },
          tradeoffs: ['Higher material costs', 'Longer lead times'],
          confidence: 0.8
        });
        break;

      case 'fast_track':
        recommendations.push({
          id: 'fast_track_coordination',
          category: 'project_execution',
          priority: 'critical',
          title: 'Enhanced Project Coordination',
          description: 'Implement robust project management for parallel work execution.',
          impact: { timeReduction: { value: 2, unit: 'days' } },
          implementation: {
            effort: 'hard',
            timeline: { value: 1, unit: 'weeks' },
            requirements: ['Project management software', 'Daily coordination meetings', 'Clear communication protocols']
          },
          tradeoffs: ['Higher management overhead', 'Increased complexity'],
          confidence: 0.9
        });
        break;

      case 'budget_conscious':
        recommendations.push({
          id: 'budget_scope_management',
          category: 'cost_optimization',
          priority: 'high',
          title: 'Strict Scope Management',
          description: 'Implement change order controls to prevent scope creep.',
          impact: { costSavings: costSummary.contractTotal * 0.05 },
          implementation: {
            effort: 'medium',
            timeline: { value: 2, unit: 'days' },
            requirements: ['Change order procedures', 'Client education', 'Clear specifications']
          },
          tradeoffs: ['Less flexibility for changes'],
          confidence: 0.8
        });
        break;

      case 'conservative':
        recommendations.push({
          id: 'conservative_risk_monitoring',
          category: 'risk_mitigation',
          priority: 'medium',
          title: 'Continuous Risk Monitoring',
          description: 'Implement regular risk assessment and mitigation reviews.',
          impact: { riskReduction: 0.4 },
          implementation: {
            effort: 'medium',
            timeline: { value: 1, unit: 'weeks' },
            requirements: ['Risk assessment tools', 'Regular reviews', 'Mitigation protocols']
          },
          tradeoffs: ['Additional monitoring time'],
          confidence: 0.9
        });
        break;
    }

    return recommendations;
  }

  /**
   * Compare scenarios and generate comparison matrix
   */
  compareScenarios(scenarios: AlternativeEstimate[]): {
    comparison: {
      scenarioId: string;
      name: string;
      totalCost: number;
      costVariation: number;
      timeVariation: number;
      riskLevel: string;
      qualityLevel: string;
      advantages: number;
      tradeoffs: number;
    }[];
    recommendations: {
      bestValue: string;
      lowestCost: string;
      fastestCompletion: string;
      lowestRisk: string;
      highestQuality: string;
    };
  } {
    const comparison = scenarios.map(scenario => ({
      scenarioId: scenario.id,
      name: scenario.name,
      totalCost: scenario.costSummary.contractTotal,
      costVariation: scenario.costVariation,
      timeVariation: scenario.timeVariation,
      riskLevel: scenario.riskLevel,
      qualityLevel: scenario.qualityLevel,
      advantages: scenario.advantages.length,
      tradeoffs: scenario.tradeoffs.length
    }));

    // Find best scenarios for different criteria
    const sortedByCost = [...comparison].sort((a, b) => a.totalCost - b.totalCost);
    const sortedByTime = [...comparison].sort((a, b) => a.timeVariation - b.timeVariation);
    const sortedByValue = [...comparison].sort((a, b) => {
      const valueScore = (a.advantages - a.tradeoffs) / a.totalCost * 1000000;
      const valueBScore = (b.advantages - b.tradeoffs) / b.totalCost * 1000000;
      return valueBScore - valueScore;
    });

    const riskRanking = { lower: 3, same: 2, higher: 1 };
    const qualityRanking = { higher: 3, same: 2, lower: 1 };
    
    const sortedByRisk = [...comparison].sort((a, b) => 
      riskRanking[b.riskLevel as keyof typeof riskRanking] - riskRanking[a.riskLevel as keyof typeof riskRanking]
    );
    
    const sortedByQuality = [...comparison].sort((a, b) => 
      qualityRanking[b.qualityLevel as keyof typeof qualityRanking] - qualityRanking[a.qualityLevel as keyof typeof qualityRanking]
    );

    return {
      comparison,
      recommendations: {
        bestValue: sortedByValue[0]?.scenarioId || '',
        lowestCost: sortedByCost[0]?.scenarioId || '',
        fastestCompletion: sortedByTime[0]?.scenarioId || '',
        lowestRisk: sortedByRisk[0]?.scenarioId || '',
        highestQuality: sortedByQuality[0]?.scenarioId || ''
      }
    };
  }

  /**
   * Generate custom scenario based on specific requirements
   */
  generateCustomScenario(
    baselinePhases: WorkPhase[],
    requirements: {
      maxBudget?: number;
      maxTimeframe?: Duration;
      priorityFeatures?: string[];
      riskTolerance?: 'low' | 'medium' | 'high';
      qualityLevel?: 'basic' | 'standard' | 'premium';
    },
    project?: ProjectSummary
  ): AlternativeEstimate {
    // Determine modifications based on requirements
    let materialMultiplier = 1.0;
    let laborMultiplier = 1.0;
    let equipmentMultiplier = 1.0;
    let markupRate = 0.20;
    let contingencyRate = 0.05;

    // Adjust based on quality level
    if (requirements.qualityLevel === 'premium') {
      materialMultiplier = 1.25;
      laborMultiplier = 1.15;
      markupRate = 0.23;
    } else if (requirements.qualityLevel === 'basic') {
      materialMultiplier = 0.85;
      laborMultiplier = 0.95;
      markupRate = 0.17;
    }

    // Adjust based on risk tolerance
    if (requirements.riskTolerance === 'low') {
      contingencyRate = 0.08;
      markupRate += 0.02;
    } else if (requirements.riskTolerance === 'high') {
      contingencyRate = 0.03;
      markupRate -= 0.02;
    }

    const modifiedPhases = this.applyPhaseModifications(baselinePhases, {
      materialCostMultiplier: materialMultiplier,
      laborCostMultiplier: laborMultiplier,
      equipmentCostMultiplier: equipmentMultiplier
    });

    const costOptions: CostCalculationOptions = {
      markupRate,
      contingencyRate,
      overheadRate: 0.15,
      includeBonding: requirements.riskTolerance === 'low'
    };

    const costSummary = this.costCalculator.calculateCostSummary(modifiedPhases, project, costOptions);

    return {
      id: 'custom_scenario',
      name: 'Custom Scenario',
      description: 'Tailored solution based on specific client requirements',
      costVariation: (costSummary.contractTotal / baselinePhases.reduce((sum, p) => sum + p.phaseTotal, 0)) - 1,
      timeVariation: 0,
      riskLevel: requirements.riskTolerance === 'low' ? 'lower' : 
                requirements.riskTolerance === 'high' ? 'higher' : 'same',
      qualityLevel: requirements.qualityLevel === 'premium' ? 'higher' :
                   requirements.qualityLevel === 'basic' ? 'lower' : 'same',
      tradeoffs: [],
      advantages: [],
      targetMarket: 'Custom client requirements',
      costSummary,
      modifiedPhases,
      recommendations: []
    };
  }
}