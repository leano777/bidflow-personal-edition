// AI-Powered Recommendations Engine - BF-005 Implementation

import { 
  EstimateRecommendation, 
  WorkPhase, 
  CostSummary, 
  QualityMetrics,
  ProjectSummary,
  Duration 
} from './types';

export class RecommendationsEngine {

  /**
   * Generate comprehensive recommendations for the estimate
   */
  generateRecommendations(
    workPhases: WorkPhase[],
    costSummary: CostSummary,
    qualityMetrics: QualityMetrics,
    project?: ProjectSummary
  ): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    // Cost optimization recommendations
    recommendations.push(...this.generateCostOptimizationRecommendations(workPhases, costSummary));

    // Risk mitigation recommendations
    recommendations.push(...this.generateRiskMitigationRecommendations(workPhases, qualityMetrics));

    // Competitive positioning recommendations
    recommendations.push(...this.generateCompetitivePositioningRecommendations(costSummary, qualityMetrics));

    // Project execution recommendations
    recommendations.push(...this.generateProjectExecutionRecommendations(workPhases, project));

    // Sort by priority and confidence
    recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.confidence - a.confidence;
    });

    return recommendations;
  }

  /**
   * Generate cost optimization recommendations
   */
  private generateCostOptimizationRecommendations(
    workPhases: WorkPhase[],
    costSummary: CostSummary
  ): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    // High material cost optimization
    if (costSummary.materialPercentage > 40) {
      const potentialSavings = costSummary.materialTotal * 0.15;
      recommendations.push({
        id: 'material_cost_optimization',
        category: 'cost_optimization',
        priority: 'high',
        title: 'Material Cost Optimization Opportunity',
        description: 'Material costs represent a high percentage of the total. Consider value engineering to reduce material expenses.',
        impact: {
          costSavings: potentialSavings,
          qualityImprovement: 'Maintain quality while reducing costs'
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 1, unit: 'weeks' },
          requirements: ['Review material specifications', 'Research alternative materials', 'Verify with suppliers']
        },
        tradeoffs: ['May require design modifications', 'Some premium features may be reduced'],
        confidence: 0.8
      });
    }

    // Labor efficiency improvements
    if (costSummary.laborPercentage > 50) {
      const laborSavings = costSummary.laborTotal * 0.12;
      recommendations.push({
        id: 'labor_efficiency_improvement',
        category: 'cost_optimization',
        priority: 'medium',
        title: 'Labor Efficiency Improvement',
        description: 'Labor costs are above industry average. Implement efficiency measures to reduce labor hours.',
        impact: {
          costSavings: laborSavings,
          timeReduction: { value: 3, unit: 'days' }
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 2, unit: 'weeks' },
          requirements: ['Process optimization', 'Tool upgrades', 'Crew coordination improvements']
        },
        tradeoffs: ['Initial investment in better tools', 'Training time required'],
        confidence: 0.7
      });
    }

    // Bulk purchasing opportunities
    const materialIntensivePhases = workPhases.filter(phase => 
      phase.items.some(item => item.materialCost > item.laborCost * 1.5)
    );
    
    if (materialIntensivePhases.length > 2) {
      recommendations.push({
        id: 'bulk_purchasing_optimization',
        category: 'cost_optimization',
        priority: 'medium',
        title: 'Bulk Purchasing Optimization',
        description: 'Multiple phases have high material costs. Coordinate purchasing for better pricing.',
        impact: {
          costSavings: costSummary.materialTotal * 0.08,
          qualityImprovement: 'Consistent material quality'
        },
        implementation: {
          effort: 'easy',
          timeline: { value: 3, unit: 'days' },
          requirements: ['Supplier negotiations', 'Storage arrangements', 'Delivery coordination']
        },
        tradeoffs: ['Storage space requirements', 'Upfront cash flow impact'],
        confidence: 0.9
      });
    }

    // Contingency optimization
    if (costSummary.contingency > costSummary.directCostTotal * 0.08) {
      recommendations.push({
        id: 'contingency_optimization',
        category: 'cost_optimization',
        priority: 'low',
        title: 'Contingency Review',
        description: 'Contingency appears high relative to project risk. Consider reducing if risk factors are well-controlled.',
        impact: {
          costSavings: costSummary.contingency * 0.3
        },
        implementation: {
          effort: 'easy',
          timeline: { value: 1, unit: 'days' },
          requirements: ['Risk assessment review', 'Client discussion']
        },
        tradeoffs: ['Reduced buffer for unexpected costs'],
        confidence: 0.6
      });
    }

    return recommendations;
  }

  /**
   * Generate risk mitigation recommendations
   */
  private generateRiskMitigationRecommendations(
    workPhases: WorkPhase[],
    qualityMetrics: QualityMetrics
  ): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    // Low confidence items
    const lowConfidenceItems = workPhases.flatMap(p => p.items).filter(item => item.confidenceScore < 0.6);
    if (lowConfidenceItems.length > 0) {
      recommendations.push({
        id: 'pricing_verification',
        category: 'risk_mitigation',
        priority: 'high',
        title: 'Pricing Verification Required',
        description: `${lowConfidenceItems.length} line items have low confidence scores and need verification.`,
        impact: {
          riskReduction: 0.4,
          qualityImprovement: 'Improved pricing accuracy'
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 1, unit: 'weeks' },
          requirements: ['Supplier quotes', 'Market research', 'Historical data review']
        },
        tradeoffs: ['Additional time for verification', 'Possible price increases'],
        confidence: 0.9
      });
    }

    // High-risk phases
    const highRiskPhases = workPhases.filter(p => p.riskLevel === 'high');
    if (highRiskPhases.length > 0) {
      recommendations.push({
        id: 'risk_phase_planning',
        category: 'risk_mitigation',
        priority: 'high',
        title: 'High-Risk Phase Planning',
        description: `${highRiskPhases.length} phases are identified as high-risk and need detailed planning.`,
        impact: {
          riskReduction: 0.5,
          timeReduction: { value: 2, unit: 'days' }
        },
        implementation: {
          effort: 'hard',
          timeline: { value: 2, unit: 'weeks' },
          requirements: ['Risk analysis', 'Mitigation strategies', 'Contingency planning']
        },
        tradeoffs: ['Additional planning time', 'Possible cost increases for mitigation'],
        confidence: 0.8
      });
    }

    // Missing permits
    const permitPhases = workPhases.filter(p => p.permitRequired);
    if (permitPhases.length > 0) {
      recommendations.push({
        id: 'permit_coordination',
        category: 'risk_mitigation',
        priority: 'critical',
        title: 'Permit Coordination Strategy',
        description: 'Multiple phases require permits. Develop comprehensive permit strategy to avoid delays.',
        impact: {
          riskReduction: 0.6,
          timeReduction: { value: 1, unit: 'weeks' }
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 1, unit: 'weeks' },
          requirements: ['Permit applications', 'Timeline coordination', 'Inspector relationships']
        },
        tradeoffs: ['Upfront permit costs', 'Potential design restrictions'],
        confidence: 0.9
      });
    }

    // Weather-dependent work
    const weatherDependentPhases = workPhases.filter(p => 
      p.phase.includes('Roofing') || p.phase.includes('Exterior') || p.phase.includes('Site')
    );
    
    if (weatherDependentPhases.length > 0) {
      recommendations.push({
        id: 'weather_risk_mitigation',
        category: 'risk_mitigation',
        priority: 'medium',
        title: 'Weather Risk Mitigation',
        description: 'Schedule weather-dependent work during favorable seasons and plan for weather delays.',
        impact: {
          riskReduction: 0.3,
          timeReduction: { value: 1, unit: 'days' }
        },
        implementation: {
          effort: 'easy',
          timeline: { value: 2, unit: 'days' },
          requirements: ['Weather forecasting', 'Schedule adjustments', 'Protection measures']
        },
        tradeoffs: ['Seasonal scheduling constraints', 'Possible protection costs'],
        confidence: 0.7
      });
    }

    return recommendations;
  }

  /**
   * Generate competitive positioning recommendations
   */
  private generateCompetitivePositioningRecommendations(
    costSummary: CostSummary,
    qualityMetrics: QualityMetrics
  ): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    // High markup warning
    if (costSummary.markupPercentage > 25) {
      recommendations.push({
        id: 'competitive_markup_review',
        category: 'competitive_positioning',
        priority: 'medium',
        title: 'Markup Competitiveness Review',
        description: 'Current markup may be high compared to market standards. Consider competitive implications.',
        impact: {
          qualityImprovement: 'Better competitive position'
        },
        implementation: {
          effort: 'easy',
          timeline: { value: 1, unit: 'days' },
          requirements: ['Market research', 'Competitor analysis', 'Margin review']
        },
        tradeoffs: ['Reduced profit margin', 'Better win probability'],
        confidence: 0.7
      });
    }

    // Cost per SF comparison
    if (costSummary.costPerSF && costSummary.costPerSF > 350) {
      recommendations.push({
        id: 'cost_per_sf_optimization',
        category: 'competitive_positioning',
        priority: 'high',
        title: 'Cost Per Square Foot Analysis',
        description: 'Cost per square foot is above market average. Review for competitive positioning.',
        impact: {
          costSavings: (costSummary.costPerSF - 300) * (costSummary.contractTotal / costSummary.costPerSF),
          qualityImprovement: 'Improved market competitiveness'
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 3, unit: 'days' },
          requirements: ['Value engineering', 'Market comparison', 'Scope review']
        },
        tradeoffs: ['Possible scope reductions', 'Material substitutions'],
        confidence: 0.8
      });
    }

    // Quality confidence positioning
    if (qualityMetrics.overallConfidence > 0.85) {
      recommendations.push({
        id: 'quality_confidence_leverage',
        category: 'competitive_positioning',
        priority: 'medium',
        title: 'Leverage High Quality Confidence',
        description: 'High confidence scores can be used as competitive advantage in presentations.',
        impact: {
          qualityImprovement: 'Enhanced client confidence'
        },
        implementation: {
          effort: 'easy',
          timeline: { value: 1, unit: 'days' },
          requirements: ['Presentation materials', 'Quality metrics documentation']
        },
        tradeoffs: [],
        confidence: 0.9
      });
    }

    return recommendations;
  }

  /**
   * Generate project execution recommendations
   */
  private generateProjectExecutionRecommendations(
    workPhases: WorkPhase[],
    project?: ProjectSummary
  ): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    // Phase sequencing optimization
    const criticalPathPhases = workPhases.filter(p => p.prerequisites.length > 1);
    if (criticalPathPhases.length > 0) {
      recommendations.push({
        id: 'critical_path_optimization',
        category: 'project_execution',
        priority: 'medium',
        title: 'Critical Path Optimization',
        description: 'Optimize scheduling of phases with multiple dependencies to reduce overall timeline.',
        impact: {
          timeReduction: { value: 1, unit: 'weeks' }
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 3, unit: 'days' },
          requirements: ['Schedule analysis', 'Resource planning', 'Coordination protocols']
        },
        tradeoffs: ['More complex scheduling', 'Higher coordination requirements'],
        confidence: 0.7
      });
    }

    // Resource allocation optimization
    const laborIntensivePhases = workPhases.filter(phase =>
      phase.items.some(item => item.laborCost > item.materialCost * 1.5)
    );
    
    if (laborIntensivePhases.length > 2) {
      recommendations.push({
        id: 'resource_allocation_optimization',
        category: 'project_execution',
        priority: 'medium',
        title: 'Resource Allocation Strategy',
        description: 'Multiple labor-intensive phases require careful resource planning and crew allocation.',
        impact: {
          timeReduction: { value: 2, unit: 'days' },
          costSavings: workPhases.reduce((sum, phase) => 
            sum + phase.items.reduce((itemSum, item) => itemSum + item.laborCost, 0), 0
          ) * 0.05
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 1, unit: 'weeks' },
          requirements: ['Crew scheduling', 'Skill assessment', 'Equipment planning']
        },
        tradeoffs: ['Complex scheduling', 'Possible crew conflicts'],
        confidence: 0.8
      });
    }

    // Quality control checkpoints
    if (workPhases.some(p => p.inspectionRequired)) {
      recommendations.push({
        id: 'quality_control_checkpoints',
        category: 'project_execution',
        priority: 'high',
        title: 'Quality Control Checkpoint System',
        description: 'Implement systematic quality checkpoints to ensure work meets standards before inspections.',
        impact: {
          riskReduction: 0.3,
          qualityImprovement: 'Reduced rework and inspection failures'
        },
        implementation: {
          effort: 'medium',
          timeline: { value: 1, unit: 'weeks' },
          requirements: ['Checkpoint protocols', 'Quality checklists', 'Inspector coordination']
        },
        tradeoffs: ['Additional time for inspections', 'More documentation'],
        confidence: 0.9
      });
    }

    // Communication and coordination
    if (workPhases.length > 8) {
      recommendations.push({
        id: 'communication_coordination_system',
        category: 'project_execution',
        priority: 'medium',
        title: 'Enhanced Communication System',
        description: 'Complex project with many phases requires robust communication and coordination system.',
        impact: {
          riskReduction: 0.2,
          timeReduction: { value: 1, unit: 'days' }
        },
        implementation: {
          effort: 'easy',
          timeline: { value: 2, unit: 'days' },
          requirements: ['Communication protocols', 'Regular meetings', 'Progress tracking tools']
        },
        tradeoffs: ['Additional administrative time', 'Meeting overhead'],
        confidence: 0.8
      });
    }

    return recommendations;
  }

  /**
   * Generate AI prompt for external AI service
   */
  generateAIRecommendationPrompt(
    workPhases: WorkPhase[],
    costSummary: CostSummary,
    qualityMetrics: QualityMetrics,
    project?: ProjectSummary
  ): string {
    return `
Analyze this construction estimate and provide detailed recommendations:

PROJECT SUMMARY:
${project ? `
- Name: ${project.name}
- Type: ${project.projectType}
- Square Footage: ${project.totalSquareFootage || 'Not specified'}
- Client: ${project.clientName}
` : 'Project details not provided'}

COST BREAKDOWN:
- Contract Total: $${costSummary.contractTotal.toLocaleString()}
- Material Total: $${costSummary.materialTotal.toLocaleString()} (${costSummary.materialPercentage.toFixed(1)}%)
- Labor Total: $${costSummary.laborTotal.toLocaleString()} (${costSummary.laborPercentage.toFixed(1)}%)
- Markup: $${costSummary.markup.toLocaleString()} (${costSummary.markupPercentage.toFixed(1)}%)
- Cost per SF: $${costSummary.costPerSF?.toFixed(2) || 'N/A'}

WORK PHASES (${workPhases.length}):
${workPhases.map(phase => `
- ${phase.phase}: $${phase.phaseTotal.toLocaleString()} (${phase.items.length} items, ${phase.riskLevel} risk)
`).join('')}

QUALITY METRICS:
- Overall Confidence: ${(qualityMetrics.overallConfidence * 100).toFixed(1)}%
- Data Completeness: ${(qualityMetrics.dataCompleteness * 100).toFixed(1)}%
- Risk Factors: ${qualityMetrics.riskFactors.length}
- Warnings: ${qualityMetrics.warnings.length}

Please provide recommendations for:

1. COST OPTIMIZATION:
   - Material substitutions to reduce costs
   - Labor efficiency improvements
   - Value engineering opportunities
   - Bulk purchasing strategies

2. RISK MITIGATION:
   - Identify high-risk line items
   - Suggest contingency adjustments
   - Flag potential scope gaps
   - Weather and seasonal considerations

3. COMPETITIVE POSITIONING:
   - Compare to typical market rates
   - Identify competitive advantages
   - Win probability assessment
   - Pricing strategy recommendations

4. PROJECT EXECUTION:
   - Optimal work sequencing
   - Resource allocation suggestions
   - Quality control recommendations
   - Communication and coordination strategies

Format each recommendation with:
- Category and priority level
- Description and impact
- Implementation requirements
- Potential tradeoffs
- Confidence level (0-1)

Focus on actionable, specific recommendations that can improve the estimate's accuracy, competitiveness, and execution success.
    `.trim();
  }

  /**
   * Filter recommendations by category
   */
  filterRecommendationsByCategory(
    recommendations: EstimateRecommendation[],
    category: EstimateRecommendation['category']
  ): EstimateRecommendation[] {
    return recommendations.filter(rec => rec.category === category);
  }

  /**
   * Filter recommendations by priority
   */
  filterRecommendationsByPriority(
    recommendations: EstimateRecommendation[],
    priority: EstimateRecommendation['priority']
  ): EstimateRecommendation[] {
    return recommendations.filter(rec => rec.priority === priority);
  }

  /**
   * Calculate total potential impact
   */
  calculateTotalImpact(recommendations: EstimateRecommendation[]): {
    totalCostSavings: number;
    totalTimeReduction: number; // in days
    averageRiskReduction: number;
  } {
    let totalCostSavings = 0;
    let totalTimeReduction = 0;
    let totalRiskReduction = 0;
    let riskReductionCount = 0;

    for (const rec of recommendations) {
      if (rec.impact.costSavings) {
        totalCostSavings += rec.impact.costSavings;
      }
      
      if (rec.impact.timeReduction) {
        const days = rec.impact.timeReduction.unit === 'days' ? rec.impact.timeReduction.value :
                     rec.impact.timeReduction.unit === 'weeks' ? rec.impact.timeReduction.value * 7 :
                     rec.impact.timeReduction.value * 30;
        totalTimeReduction += days;
      }
      
      if (rec.impact.riskReduction) {
        totalRiskReduction += rec.impact.riskReduction;
        riskReductionCount++;
      }
    }

    return {
      totalCostSavings,
      totalTimeReduction,
      averageRiskReduction: riskReductionCount > 0 ? totalRiskReduction / riskReductionCount : 0
    };
  }
}