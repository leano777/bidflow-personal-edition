// Cost Summary Calculation with Overhead and Markup - BF-005 Implementation

import { WorkPhase, CostSummary, CompilationConfig, ProjectSummary } from './types';

export interface CostCalculationOptions {
  overheadRate?: number;        // 0.15 = 15%
  generalConditionsRate?: number; // 0.05 = 5%
  markupRate?: number;          // 0.20 = 20%
  contingencyRate?: number;     // 0.05 = 5%
  bondingRate?: number;         // 0.02 = 2%
  permitCosts?: number;         // Fixed permit costs
  includeBonding?: boolean;     // Whether bonding is required
}

export class CostCalculator {
  private config: CompilationConfig;

  constructor(config?: Partial<CompilationConfig>) {
    this.config = {
      overheadRate: 0.15,
      generalConditionsRate: 0.05,
      markupRate: 0.20,
      contingencyRate: 0.05,
      bondingRate: 0.02,
      minimumConfidence: 0.70,
      maxPriceDeviation: 0.25,
      marketRates: {
        laborPercentage: 0.45,
        materialPercentage: 0.35,
        equipmentPercentage: 0.10,
        overheadPercentage: 0.10
      },
      standardPhases: [],
      phaseSequencing: {},
      defaultExportFormat: {
        format: 'pdf',
        template: 'professional',
        includeDetails: true,
        includePricing: true,
        includeRecommendations: true
      },
      clientTemplates: {},
      ...config
    };
  }

  /**
   * Calculate comprehensive cost summary from work phases
   */
  calculateCostSummary(
    workPhases: WorkPhase[], 
    project?: ProjectSummary,
    options?: CostCalculationOptions
  ): CostSummary {
    const opts = { ...this.getDefaultOptions(), ...options };
    
    // Calculate direct costs
    const directCosts = this.calculateDirectCosts(workPhases);
    
    // Calculate indirect costs
    const indirectCosts = this.calculateIndirectCosts(directCosts.directCostTotal, opts);
    
    // Calculate per-unit costs
    const perUnitCosts = this.calculatePerUnitCosts(
      indirectCosts.contractTotal, 
      project
    );
    
    // Calculate business metrics
    const businessMetrics = this.calculateBusinessMetrics(directCosts, indirectCosts);
    
    return {
      ...directCosts,
      ...indirectCosts,
      ...perUnitCosts,
      ...businessMetrics
    };
  }

  /**
   * Calculate direct costs from work phases
   */
  private calculateDirectCosts(workPhases: WorkPhase[]) {
    let materialTotal = 0;
    let laborTotal = 0;
    let equipmentTotal = 0;

    for (const phase of workPhases) {
      for (const item of phase.items) {
        materialTotal += item.materialCost;
        laborTotal += item.laborCost;
        equipmentTotal += item.equipmentCost;
      }
    }

    const directCostTotal = materialTotal + laborTotal + equipmentTotal;

    return {
      materialTotal,
      laborTotal,
      equipmentTotal,
      directCostTotal
    };
  }

  /**
   * Calculate indirect costs and final totals
   */
  private calculateIndirectCosts(directCostTotal: number, options: CostCalculationOptions) {
    const overhead = directCostTotal * (options.overheadRate || 0.15);
    const generalConditions = directCostTotal * (options.generalConditionsRate || 0.05);
    const contingency = directCostTotal * (options.contingencyRate || 0.05);
    const permits = options.permitCosts || 0;
    
    // Calculate subtotal before markup
    const subtotal = directCostTotal + overhead + generalConditions + contingency + permits;
    
    // Apply markup to subtotal
    const markup = subtotal * (options.markupRate || 0.20);
    
    // Calculate bonding if required
    const bonding = options.includeBonding 
      ? (subtotal + markup) * (options.bondingRate || 0.02)
      : 0;
    
    const indirectCostTotal = overhead + generalConditions + contingency + permits + markup + bonding;
    const contractTotal = directCostTotal + indirectCostTotal;

    return {
      overhead,
      generalConditions,
      markup,
      contingency,
      bonding,
      permits,
      indirectCostTotal,
      contractTotal
    };
  }

  /**
   * Calculate per-unit costs if project dimensions are available
   */
  private calculatePerUnitCosts(contractTotal: number, project?: ProjectSummary) {
    const perUnitCosts: { costPerSF?: number; costPerLF?: number } = {};
    
    if (project?.totalSquareFootage && project.totalSquareFootage > 0) {
      perUnitCosts.costPerSF = contractTotal / project.totalSquareFootage;
    }
    
    if (project?.totalLinearFootage && project.totalLinearFootage > 0) {
      perUnitCosts.costPerLF = contractTotal / project.totalLinearFootage;
    }
    
    return perUnitCosts;
  }

  /**
   * Calculate business metrics
   */
  private calculateBusinessMetrics(
    directCosts: { materialTotal: number; laborTotal: number; equipmentTotal: number; directCostTotal: number },
    indirectCosts: { contractTotal: number; markup: number }
  ) {
    const { contractTotal, markup } = indirectCosts;
    const { materialTotal, laborTotal, equipmentTotal, directCostTotal } = directCosts;
    
    const grossMargin = markup;
    const markupPercentage = directCostTotal > 0 ? (markup / directCostTotal) * 100 : 0;
    const laborPercentage = contractTotal > 0 ? (laborTotal / contractTotal) * 100 : 0;
    const materialPercentage = contractTotal > 0 ? (materialTotal / contractTotal) * 100 : 0;
    const equipmentPercentage = contractTotal > 0 ? (equipmentTotal / contractTotal) * 100 : 0;

    return {
      grossMargin,
      markupPercentage,
      laborPercentage,
      materialPercentage,
      equipmentPercentage
    };
  }

  /**
   * Get default calculation options
   */
  private getDefaultOptions(): CostCalculationOptions {
    return {
      overheadRate: this.config.overheadRate,
      generalConditionsRate: this.config.generalConditionsRate,
      markupRate: this.config.markupRate,
      contingencyRate: this.config.contingencyRate,
      bondingRate: this.config.bondingRate,
      permitCosts: 0,
      includeBonding: false
    };
  }

  /**
   * Calculate cost summary with different scenarios
   */
  calculateMultipleScenarios(
    workPhases: WorkPhase[],
    project?: ProjectSummary
  ): {
    conservative: CostSummary;
    standard: CostSummary;
    aggressive: CostSummary;
  } {
    const conservative = this.calculateCostSummary(workPhases, project, {
      overheadRate: 0.18,
      generalConditionsRate: 0.07,
      markupRate: 0.25,
      contingencyRate: 0.08,
      includeBonding: true
    });

    const standard = this.calculateCostSummary(workPhases, project);

    const aggressive = this.calculateCostSummary(workPhases, project, {
      overheadRate: 0.12,
      generalConditionsRate: 0.03,
      markupRate: 0.15,
      contingencyRate: 0.03,
      includeBonding: false
    });

    return { conservative, standard, aggressive };
  }

  /**
   * Validate cost summary against industry benchmarks
   */
  validateCostSummary(costSummary: CostSummary): {
    valid: boolean;
    warnings: string[];
    recommendations: string[];
  } {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check labor percentage
    if (costSummary.laborPercentage < 35) {
      warnings.push('Labor percentage is unusually low (< 35%)');
      recommendations.push('Verify labor calculations and rates');
    } else if (costSummary.laborPercentage > 55) {
      warnings.push('Labor percentage is unusually high (> 55%)');
      recommendations.push('Consider labor efficiency improvements');
    }

    // Check material percentage
    if (costSummary.materialPercentage < 25) {
      warnings.push('Material percentage is unusually low (< 25%)');
      recommendations.push('Verify material quantities and pricing');
    } else if (costSummary.materialPercentage > 45) {
      warnings.push('Material percentage is unusually high (> 45%)');
      recommendations.push('Consider value engineering opportunities');
    }

    // Check markup percentage
    if (costSummary.markupPercentage < 15) {
      warnings.push('Markup percentage is low (< 15%) - may impact profitability');
      recommendations.push('Consider increasing markup for adequate profit margin');
    } else if (costSummary.markupPercentage > 30) {
      warnings.push('Markup percentage is high (> 30%) - may impact competitiveness');
      recommendations.push('Consider competitive positioning');
    }

    // Check cost per SF if available
    if (costSummary.costPerSF) {
      if (costSummary.costPerSF < 50) {
        warnings.push('Cost per SF is unusually low (< $50/SF)');
      } else if (costSummary.costPerSF > 500) {
        warnings.push('Cost per SF is unusually high (> $500/SF)');
      }
    }

    return {
      valid: warnings.length === 0,
      warnings,
      recommendations
    };
  }

  /**
   * Apply cost adjustments to summary
   */
  applyCostAdjustments(
    costSummary: CostSummary,
    adjustments: {
      materialAdjustment?: number;  // Percentage adjustment
      laborAdjustment?: number;
      overheadAdjustment?: number;
      markupAdjustment?: number;
    }
  ): CostSummary {
    const adjusted = { ...costSummary };

    if (adjustments.materialAdjustment) {
      const materialChange = adjusted.materialTotal * (adjustments.materialAdjustment / 100);
      adjusted.materialTotal += materialChange;
    }

    if (adjustments.laborAdjustment) {
      const laborChange = adjusted.laborTotal * (adjustments.laborAdjustment / 100);
      adjusted.laborTotal += laborChange;
    }

    if (adjustments.overheadAdjustment) {
      const overheadChange = adjusted.overhead * (adjustments.overheadAdjustment / 100);
      adjusted.overhead += overheadChange;
    }

    if (adjustments.markupAdjustment) {
      const markupChange = adjusted.markup * (adjustments.markupAdjustment / 100);
      adjusted.markup += markupChange;
    }

    // Recalculate derived values
    adjusted.directCostTotal = adjusted.materialTotal + adjusted.laborTotal + adjusted.equipmentTotal;
    adjusted.indirectCostTotal = adjusted.overhead + adjusted.generalConditions + 
                                adjusted.markup + adjusted.contingency + (adjusted.bonding || 0) + adjusted.permits;
    adjusted.contractTotal = adjusted.directCostTotal + adjusted.indirectCostTotal;

    // Recalculate business metrics
    const businessMetrics = this.calculateBusinessMetrics(
      {
        materialTotal: adjusted.materialTotal,
        laborTotal: adjusted.laborTotal,
        equipmentTotal: adjusted.equipmentTotal,
        directCostTotal: adjusted.directCostTotal
      },
      {
        contractTotal: adjusted.contractTotal,
        markup: adjusted.markup
      }
    );

    Object.assign(adjusted, businessMetrics);

    return adjusted;
  }

  /**
   * Generate cost breakdown by category
   */
  generateCostBreakdown(workPhases: WorkPhase[]): {
    byPhase: { phase: string; total: number; percentage: number }[];
    byCategory: { category: string; total: number; percentage: number }[];
    totalCost: number;
  } {
    const totalCost = workPhases.reduce((sum, phase) => sum + phase.phaseTotal, 0);
    
    // Breakdown by phase
    const byPhase = workPhases.map(phase => ({
      phase: phase.phase,
      total: phase.phaseTotal,
      percentage: totalCost > 0 ? (phase.phaseTotal / totalCost) * 100 : 0
    }));

    // Breakdown by category
    const categoryTotals = new Map<string, number>();
    
    for (const phase of workPhases) {
      const current = categoryTotals.get(phase.category) || 0;
      categoryTotals.set(phase.category, current + phase.phaseTotal);
    }

    const byCategory = Array.from(categoryTotals.entries()).map(([category, total]) => ({
      category,
      total,
      percentage: totalCost > 0 ? (total / totalCost) * 100 : 0
    }));

    return { byPhase, byCategory, totalCost };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CompilationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   */
  getConfig(): CompilationConfig {
    return { ...this.config };
  }
}