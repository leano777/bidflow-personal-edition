// Quality Control and Validation System - BF-005 Implementation

import { 
  WorkPhase, 
  CostSummary, 
  QualityMetrics, 
  RiskAssessment, 
  QualityWarning, 
  BenchmarkAnalysis, 
  AuditEntry,
  ProjectSummary
} from './types';

export class QualityController {
  private auditTrail: AuditEntry[] = [];

  /**
   * Perform comprehensive quality control analysis
   */
  performQualityControl(
    workPhases: WorkPhase[],
    costSummary: CostSummary,
    project?: ProjectSummary
  ): QualityMetrics {
    // Calculate confidence scores
    const overallConfidence = this.calculateOverallConfidence(workPhases);
    const dataCompleteness = this.calculateDataCompleteness(workPhases, project);
    const priceAccuracy = this.calculatePriceAccuracy(workPhases);
    const scopeCompleteness = this.calculateScopeCompleteness(workPhases);

    // Identify risks
    const riskFactors = this.identifyRiskFactors(workPhases, costSummary);

    // Generate warnings
    const warnings = this.generateWarnings(workPhases, costSummary);

    // Perform benchmark analysis
    const benchmarkComparison = this.performBenchmarkAnalysis(costSummary, project);

    // Create audit entry
    this.addAuditEntry('quality_control_performed', 'system', {
      overallConfidence,
      dataCompleteness,
      riskCount: riskFactors.length,
      warningCount: warnings.length
    });

    return {
      overallConfidence,
      dataCompleteness,
      priceAccuracy,
      scopeCompleteness,
      riskFactors,
      warnings,
      benchmarkComparison,
      auditTrail: [...this.auditTrail]
    };
  }

  /**
   * Calculate overall confidence score
   */
  private calculateOverallConfidence(workPhases: WorkPhase[]): number {
    if (workPhases.length === 0) return 0;

    let totalConfidence = 0;
    let totalItems = 0;

    for (const phase of workPhases) {
      for (const item of phase.items) {
        totalConfidence += item.confidenceScore;
        totalItems++;
      }
    }

    return totalItems > 0 ? totalConfidence / totalItems : 0;
  }

  /**
   * Calculate data completeness score
   */
  private calculateDataCompleteness(workPhases: WorkPhase[], project?: ProjectSummary): number {
    let completenessScore = 0;
    let maxScore = 0;

    // Check project information completeness
    if (project) {
      maxScore += 20;
      if (project.name) completenessScore += 5;
      if (project.address) completenessScore += 5;
      if (project.clientName) completenessScore += 5;
      if (project.totalSquareFootage || project.totalLinearFootage) completenessScore += 5;
    }

    // Check work phase completeness
    maxScore += 80;
    if (workPhases.length > 0) {
      completenessScore += 20;

      // Check essential phases are present
      const phaseNames = workPhases.map(p => p.phase);
      const essentialPhases = ['Foundation', 'Framing', 'Roofing', 'Interior Finishes'];
      const presentEssentialPhases = essentialPhases.filter(phase => 
        phaseNames.some(name => name.includes(phase))
      );
      completenessScore += (presentEssentialPhases.length / essentialPhases.length) * 30;

      // Check line item details
      let totalItems = 0;
      let completeItems = 0;
      
      for (const phase of workPhases) {
        for (const item of phase.items) {
          totalItems++;
          if (item.description && item.quantity > 0 && item.lineItemTotal > 0) {
            completeItems++;
          }
        }
      }
      
      if (totalItems > 0) {
        completenessScore += (completeItems / totalItems) * 30;
      }
    }

    return maxScore > 0 ? completenessScore / maxScore : 0;
  }

  /**
   * Calculate price accuracy score
   */
  private calculatePriceAccuracy(workPhases: WorkPhase[]): number {
    if (workPhases.length === 0) return 0;

    let accuracyScore = 0;
    let totalItems = 0;

    for (const phase of workPhases) {
      for (const item of phase.items) {
        totalItems++;
        
        // Base accuracy on confidence score and data quality
        let itemAccuracy = item.confidenceScore;
        
        // Reduce accuracy for items with risk factors
        if (item.riskFactors.length > 0) {
          itemAccuracy *= (1 - (item.riskFactors.length * 0.1));
        }
        
        // Increase accuracy for items with detailed source calculations
        if (item.sourceCalculation) {
          itemAccuracy = Math.min(1, itemAccuracy + 0.1);
        }
        
        accuracyScore += Math.max(0, itemAccuracy);
      }
    }

    return totalItems > 0 ? accuracyScore / totalItems : 0;
  }

  /**
   * Calculate scope completeness score
   */
  private calculateScopeCompleteness(workPhases: WorkPhase[]): number {
    const requiredPhases = [
      'Site Preparation',
      'Foundation', 
      'Framing',
      'Roofing',
      'Electrical',
      'Plumbing',
      'Interior Finishes',
      'Exterior Finishes'
    ];

    const presentPhases = workPhases.map(p => p.phase);
    const matchedPhases = requiredPhases.filter(required => 
      presentPhases.some(present => present.includes(required) || required.includes(present))
    );

    const basicCompleteness = matchedPhases.length / requiredPhases.length;

    // Bonus points for additional detail
    let detailBonus = 0;
    for (const phase of workPhases) {
      if (phase.items.length > 3) detailBonus += 0.02; // Detailed phase
      if (phase.description) detailBonus += 0.01; // Has description
      if (phase.duration.value > 0) detailBonus += 0.01; // Has duration
    }

    return Math.min(1, basicCompleteness + detailBonus);
  }

  /**
   * Identify risk factors in the estimate
   */
  private identifyRiskFactors(workPhases: WorkPhase[], costSummary: CostSummary): RiskAssessment[] {
    const risks: RiskAssessment[] = [];

    // Cost-related risks
    if (costSummary.markupPercentage < 15) {
      risks.push({
        id: 'low_markup_risk',
        category: 'cost',
        level: 'medium',
        description: 'Markup percentage is below industry standard',
        impact: 'Reduced profitability and potential cash flow issues',
        mitigation: 'Consider increasing markup to 18-22% for adequate profit margin',
        probability: 0.7,
        costImpact: costSummary.contractTotal * 0.05
      });
    }

    if (costSummary.contingency < costSummary.directCostTotal * 0.03) {
      risks.push({
        id: 'low_contingency_risk',
        category: 'cost',
        level: 'high',
        description: 'Contingency is below recommended minimum',
        impact: 'Insufficient buffer for cost overruns',
        mitigation: 'Increase contingency to at least 5% of direct costs',
        probability: 0.6,
        costImpact: costSummary.directCostTotal * 0.02
      });
    }

    // Schedule-related risks
    const highRiskPhases = workPhases.filter(p => p.riskLevel === 'high');
    if (highRiskPhases.length > 0) {
      risks.push({
        id: 'high_risk_phases',
        category: 'schedule',
        level: 'medium',
        description: `${highRiskPhases.length} phases identified as high risk`,
        impact: 'Potential schedule delays and cost overruns',
        mitigation: 'Develop detailed mitigation plans for high-risk phases',
        probability: 0.4,
        scheduleImpact: { value: highRiskPhases.length * 3, unit: 'days' }
      });
    }

    // Quality-related risks
    const lowConfidenceItems = workPhases.flatMap(p => p.items).filter(item => item.confidenceScore < 0.6);
    if (lowConfidenceItems.length > workPhases.flatMap(p => p.items).length * 0.2) {
      risks.push({
        id: 'low_confidence_pricing',
        category: 'quality',
        level: 'medium',
        description: 'High percentage of line items have low confidence scores',
        impact: 'Pricing accuracy may be compromised',
        mitigation: 'Verify pricing for low-confidence items with suppliers',
        probability: 0.5
      });
    }

    // Regulatory risks
    const permitPhases = workPhases.filter(p => p.permitRequired);
    if (permitPhases.length > 0 && costSummary.permits === 0) {
      risks.push({
        id: 'missing_permit_costs',
        category: 'regulatory',
        level: 'high',
        description: 'Permit costs not included despite permit-required phases',
        impact: 'Unexpected permit costs and potential delays',
        mitigation: 'Add estimated permit costs to the estimate',
        probability: 0.8,
        costImpact: permitPhases.length * 500 // Estimated $500 per permit
      });
    }

    return risks;
  }

  /**
   * Generate quality warnings
   */
  private generateWarnings(workPhases: WorkPhase[], costSummary: CostSummary): QualityWarning[] {
    const warnings: QualityWarning[] = [];

    // Missing data warnings
    const phasesWithoutItems = workPhases.filter(p => p.items.length === 0);
    if (phasesWithoutItems.length > 0) {
      warnings.push({
        id: 'empty_phases',
        type: 'missing_data',
        severity: 'warning',
        message: `${phasesWithoutItems.length} phases have no line items`,
        recommendation: 'Add line items or remove unnecessary phases',
        affectedItems: phasesWithoutItems.map(p => p.id),
        autoFixable: false
      });
    }

    // Price anomaly warnings
    const expensiveItems = workPhases.flatMap(p => p.items).filter(item => 
      item.lineItemTotal > costSummary.contractTotal * 0.15
    );
    if (expensiveItems.length > 0) {
      warnings.push({
        id: 'expensive_line_items',
        type: 'price_anomaly',
        severity: 'info',
        message: `${expensiveItems.length} line items exceed 15% of total cost`,
        recommendation: 'Review high-cost items for accuracy',
        affectedItems: expensiveItems.map(item => item.id),
        autoFixable: false
      });
    }

    // Scope gap warnings
    const requiredCategories = ['Structure', 'Systems', 'Interior', 'Exterior'];
    const presentCategories = Array.from(new Set(workPhases.map(p => p.category)));
    const missingCategories = requiredCategories.filter(cat => !presentCategories.includes(cat));
    
    if (missingCategories.length > 0) {
      warnings.push({
        id: 'missing_categories',
        type: 'scope_gap',
        severity: 'warning',
        message: `Missing work categories: ${missingCategories.join(', ')}`,
        recommendation: 'Consider adding phases for missing categories',
        affectedItems: [],
        autoFixable: false
      });
    }

    // Risk factor warnings
    const highRiskItems = workPhases.flatMap(p => p.items).filter(item => item.riskFactors.length > 2);
    if (highRiskItems.length > 0) {
      warnings.push({
        id: 'high_risk_items',
        type: 'risk_factor',
        severity: 'warning',
        message: `${highRiskItems.length} line items have multiple risk factors`,
        recommendation: 'Develop risk mitigation strategies',
        affectedItems: highRiskItems.map(item => item.id),
        autoFixable: false
      });
    }

    return warnings;
  }

  /**
   * Perform benchmark analysis
   */
  private performBenchmarkAnalysis(costSummary: CostSummary, project?: ProjectSummary): BenchmarkAnalysis {
    // Industry benchmarks (California construction)
    const industryBenchmarks = {
      costPerSF: { low: 150, high: 400, average: 275 },
      laborRatio: 0.45,        // 45% labor
      materialRatio: 0.35,     // 35% materials
      overheadRatio: 0.20      // 20% overhead + markup
    };

    const analysis: BenchmarkAnalysis = {
      totalCostPerSF: {
        estimate: 0,
        marketLow: industryBenchmarks.costPerSF.low,
        marketHigh: industryBenchmarks.costPerSF.high,
        marketAverage: industryBenchmarks.costPerSF.average,
        deviation: 0
      },
      laborRatio: {
        estimate: costSummary.laborPercentage / 100,
        industryStandard: industryBenchmarks.laborRatio,
        deviation: 0
      },
      materialRatio: {
        estimate: costSummary.materialPercentage / 100,
        industryStandard: industryBenchmarks.materialRatio,
        deviation: 0
      },
      overheadRatio: {
        estimate: (costSummary.overhead + costSummary.markup) / costSummary.contractTotal,
        industryStandard: industryBenchmarks.overheadRatio,
        deviation: 0
      },
      recommendedAdjustments: []
    };

    // Calculate cost per SF if available
    if (costSummary.costPerSF) {
      analysis.totalCostPerSF.estimate = costSummary.costPerSF;
      analysis.totalCostPerSF.deviation = 
        (costSummary.costPerSF - industryBenchmarks.costPerSF.average) / industryBenchmarks.costPerSF.average;
      
      if (Math.abs(analysis.totalCostPerSF.deviation) > 0.25) {
        analysis.recommendedAdjustments.push(
          analysis.totalCostPerSF.deviation > 0 
            ? 'Cost per SF is significantly above market average - consider value engineering'
            : 'Cost per SF is significantly below market average - verify completeness'
        );
      }
    }

    // Calculate deviations
    analysis.laborRatio.deviation = analysis.laborRatio.estimate - analysis.laborRatio.industryStandard;
    analysis.materialRatio.deviation = analysis.materialRatio.estimate - analysis.materialRatio.industryStandard;
    analysis.overheadRatio.deviation = analysis.overheadRatio.estimate - analysis.overheadRatio.industryStandard;

    // Generate recommendations based on deviations
    if (Math.abs(analysis.laborRatio.deviation) > 0.1) {
      analysis.recommendedAdjustments.push(
        analysis.laborRatio.deviation > 0
          ? 'Labor ratio is high - consider efficiency improvements'
          : 'Labor ratio is low - verify labor calculations'
      );
    }

    if (Math.abs(analysis.materialRatio.deviation) > 0.1) {
      analysis.recommendedAdjustments.push(
        analysis.materialRatio.deviation > 0
          ? 'Material ratio is high - consider alternative materials'
          : 'Material ratio is low - verify material quantities'
      );
    }

    if (Math.abs(analysis.overheadRatio.deviation) > 0.05) {
      analysis.recommendedAdjustments.push(
        analysis.overheadRatio.deviation > 0
          ? 'Overhead ratio is high - review markup strategy'
          : 'Overhead ratio is low - ensure adequate profit margin'
      );
    }

    return analysis;
  }

  /**
   * Add entry to audit trail
   */
  private addAuditEntry(action: string, user: string, details: any, previousValue?: any, newValue?: any): void {
    this.auditTrail.push({
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      action,
      user,
      details,
      previousValue,
      newValue
    });
  }

  /**
   * Validate estimate completeness
   */
  validateEstimateCompleteness(workPhases: WorkPhase[], project?: ProjectSummary): {
    isComplete: boolean;
    missingElements: string[];
    recommendations: string[];
  } {
    const missingElements: string[] = [];
    const recommendations: string[] = [];

    // Check project information
    if (!project) {
      missingElements.push('Project information');
      recommendations.push('Add project details including name, address, and dimensions');
    } else {
      if (!project.name) missingElements.push('Project name');
      if (!project.address) missingElements.push('Project address');
      if (!project.clientName) missingElements.push('Client name');
    }

    // Check essential phases
    const phaseNames = workPhases.map(p => p.phase);
    const essentialPhases = ['Foundation', 'Interior Finishes'];
    
    for (const essential of essentialPhases) {
      if (!phaseNames.some(name => name.includes(essential))) {
        missingElements.push(`${essential} phase`);
        recommendations.push(`Add ${essential} phase with appropriate line items`);
      }
    }

    // Check for empty phases
    const emptyPhases = workPhases.filter(p => p.items.length === 0);
    if (emptyPhases.length > 0) {
      missingElements.push(`Line items for ${emptyPhases.length} phases`);
      recommendations.push('Add line items to empty phases or remove unnecessary phases');
    }

    return {
      isComplete: missingElements.length === 0,
      missingElements,
      recommendations
    };
  }

  /**
   * Get audit trail
   */
  getAuditTrail(): AuditEntry[] {
    return [...this.auditTrail];
  }

  /**
   * Clear audit trail
   */
  clearAuditTrail(): void {
    this.auditTrail = [];
  }
}