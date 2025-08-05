// Complete Estimate Compilation System - BF-005 Implementation

export * from './types';
export * from './phase-organizer';
export * from './cost-calculator';
export * from './quality-controller';
export * from './recommendations-engine';
export * from './scenario-generator';

import { PhaseOrganizer } from './phase-organizer';
import { CostCalculator, CostCalculationOptions } from './cost-calculator';
import { QualityController } from './quality-controller';
import { RecommendationsEngine } from './recommendations-engine';
import { ScenarioGenerator } from './scenario-generator';

import { 
  CompleteEstimate, 
  ProjectSummary, 
  CompilationConfig,
  WorkPhase,
  CostSummary,
  QualityMetrics,
  EstimateRecommendation,
  AlternativeEstimate
} from './types';

import { PricingCalculation } from '../pricing/types';

export interface CompilationOptions extends CostCalculationOptions {
  generateRecommendations?: boolean;
  generateAlternatives?: boolean;
  performQualityControl?: boolean;
  includeAuditTrail?: boolean;
}

/**
 * Main Estimate Compilation Engine
 * Integrates all compilation subsystems to create comprehensive estimates
 */
export class EstimateCompiler {
  private phaseOrganizer: PhaseOrganizer;
  private costCalculator: CostCalculator;
  private qualityController: QualityController;
  private recommendationsEngine: RecommendationsEngine;
  private scenarioGenerator: ScenarioGenerator;

  constructor(config?: Partial<CompilationConfig>) {
    this.phaseOrganizer = new PhaseOrganizer();
    this.costCalculator = new CostCalculator(config);
    this.qualityController = new QualityController();
    this.recommendationsEngine = new RecommendationsEngine();
    this.scenarioGenerator = new ScenarioGenerator(this.costCalculator);
  }

  /**
   * Main compilation method - converts pricing calculations into complete estimate
   */
  async compileCompleteEstimate(
    pricingCalculations: PricingCalculation[],
    project: ProjectSummary,
    options: CompilationOptions = {}
  ): Promise<CompleteEstimate> {
    const startTime = Date.now();

    try {
      // Step 1: Organize pricing calculations into work phases
      console.log('📋 Organizing work phases...');
      const workPhases = this.phaseOrganizer.organizeIntoPhases(pricingCalculations);
      
      // Validate phase sequencing
      const sequenceValidation = this.phaseOrganizer.validatePhaseSequencing(workPhases);
      if (!sequenceValidation.valid) {
        console.warn('⚠️ Phase sequencing issues:', sequenceValidation.issues);
      }

      // Step 2: Calculate comprehensive cost summary
      console.log('💰 Calculating cost summary...');
      const costSummary = this.costCalculator.calculateCostSummary(workPhases, project, options);

      // Step 3: Perform quality control analysis
      let qualityMetrics: QualityMetrics | undefined;
      if (options.performQualityControl !== false) {
        console.log('🔍 Performing quality control...');
        qualityMetrics = this.qualityController.performQualityControl(workPhases, costSummary, project);
      } else {
        qualityMetrics = this.createBasicQualityMetrics(workPhases);
      }

      // Step 4: Generate AI-powered recommendations
      let recommendations: EstimateRecommendation[] = [];
      if (options.generateRecommendations !== false) {
        console.log('🤖 Generating recommendations...');
        recommendations = this.recommendationsEngine.generateRecommendations(
          workPhases, 
          costSummary, 
          qualityMetrics, 
          project
        );
      }

      // Step 5: Generate alternative scenarios
      let alternativeScenarios: AlternativeEstimate[] = [];
      if (options.generateAlternatives !== false) {
        console.log('🎯 Generating alternative scenarios...');
        alternativeScenarios = this.scenarioGenerator.generateAlternativeScenarios(
          workPhases,
          costSummary,
          project
        );
      }

      // Step 6: Create complete estimate
      const completeEstimate: CompleteEstimate = {
        id: `estimate_${Date.now()}`,
        project,
        workBreakdown: workPhases,
        costSummary,
        qualityMetrics,
        recommendations,
        alternativeScenarios,
        
        // Metadata
        version: '1.0',
        status: 'draft',
        createdBy: 'EstimateCompiler',
        createdAt: new Date(),
        lastModified: new Date(),
        expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        
        // Export configurations
        exportFormats: [
          {
            format: 'pdf',
            template: 'professional',
            includeDetails: true,
            includePricing: true,
            includeRecommendations: true
          }
        ],
        clientPresentationReady: true
      };

      const processingTime = Date.now() - startTime;
      console.log(`✅ Estimate compilation completed in ${processingTime}ms`);

      return completeEstimate;

    } catch (error) {
      console.error('❌ Estimate compilation failed:', error);
      throw new Error(`Estimate compilation failed: ${error}`);
    }
  }

  /**
   * Quick compilation for performance-critical scenarios
   */
  async compileQuickEstimate(
    pricingCalculations: PricingCalculation[],
    project: ProjectSummary
  ): Promise<CompleteEstimate> {
    return this.compileCompleteEstimate(pricingCalculations, project, {
      generateRecommendations: false,
      generateAlternatives: false,
      performQualityControl: false,
      includeAuditTrail: false
    });
  }

  /**
   * Update existing estimate with new pricing data
   */
  async updateEstimate(
    existingEstimate: CompleteEstimate,
    newPricingCalculations: PricingCalculation[],
    options: CompilationOptions = {}
  ): Promise<CompleteEstimate> {
    console.log('🔄 Updating existing estimate...');
    
    // Recompile with new data
    const updated = await this.compileCompleteEstimate(
      newPricingCalculations,
      existingEstimate.project,
      options
    );

    // Preserve metadata
    updated.id = existingEstimate.id;
    updated.version = this.incrementVersion(existingEstimate.version);
    updated.createdBy = existingEstimate.createdBy;
    updated.createdAt = existingEstimate.createdAt;
    updated.lastModified = new Date();
    updated.status = 'draft'; // Reset to draft when updated

    return updated;
  }

  /**
   * Validate estimate against acceptance criteria
   */
  validateEstimate(estimate: CompleteEstimate): {
    valid: boolean;
    issues: string[];
    performance: {
      processingTime?: number;
      confidenceScore: number;
      completenessScore: number;
    };
  } {
    const issues: string[] = [];

    // Check data consistency
    if (estimate.workBreakdown.length === 0) {
      issues.push('No work phases defined');
    }

    // Check cost summary
    if (estimate.costSummary.contractTotal <= 0) {
      issues.push('Invalid contract total');
    }

    // Check quality metrics
    if (estimate.qualityMetrics.overallConfidence < 0.7) {
      issues.push(`Low overall confidence: ${(estimate.qualityMetrics.overallConfidence * 100).toFixed(1)}%`);
    }

    // Check data completeness
    if (estimate.qualityMetrics.dataCompleteness < 0.8) {
      issues.push(`Incomplete data: ${(estimate.qualityMetrics.dataCompleteness * 100).toFixed(1)}%`);
    }

    // Check recommendations
    const criticalRecommendations = estimate.recommendations.filter(r => r.priority === 'critical');
    if (criticalRecommendations.length > 0) {
      issues.push(`${criticalRecommendations.length} critical recommendations require attention`);
    }

    return {
      valid: issues.length === 0,
      issues,
      performance: {
        confidenceScore: estimate.qualityMetrics.overallConfidence,
        completenessScore: estimate.qualityMetrics.dataCompleteness
      }
    };
  }

  /**
   * Export estimate in various formats
   */
  async exportEstimate(
    estimate: CompleteEstimate,
    format: 'json' | 'pdf' | 'excel' | 'csv' = 'json'
  ): Promise<string | Buffer> {
    console.log(`📤 Exporting estimate in ${format} format...`);

    switch (format) {
      case 'json':
        return JSON.stringify(estimate, null, 2);
      
      case 'csv':
        return this.exportToCSV(estimate);
      
      case 'pdf':
        // PDF generation would require additional libraries
        throw new Error('PDF export not implemented - requires PDF generation library');
      
      case 'excel':
        // Excel generation would require additional libraries
        throw new Error('Excel export not implemented - requires Excel generation library');
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate estimate summary for quick review
   */
  generateSummary(estimate: CompleteEstimate): {
    projectInfo: {
      name: string;
      totalCost: number;
      duration: string;
      confidence: string;
    };
    costBreakdown: {
      direct: number;
      indirect: number;
      total: number;
    };
    riskAssessment: {
      level: string;
      factors: number;
      warnings: number;
    };
    recommendations: {
      total: number;
      critical: number;
      highPriority: number;
    };
    scenarios: {
      available: number;
      costRange: { min: number; max: number };
    };
  } {
    const projectDuration = this.phaseOrganizer.calculateProjectDuration(estimate.workBreakdown);
    const criticalRecs = estimate.recommendations.filter(r => r.priority === 'critical').length;
    const highPriorityRecs = estimate.recommendations.filter(r => r.priority === 'high').length;
    
    const scenarioCosts = estimate.alternativeScenarios.map(s => s.costSummary.contractTotal);
    const costRange = scenarioCosts.length > 0 
      ? { min: Math.min(...scenarioCosts), max: Math.max(...scenarioCosts) }
      : { min: estimate.costSummary.contractTotal, max: estimate.costSummary.contractTotal };

    return {
      projectInfo: {
        name: estimate.project.name,
        totalCost: estimate.costSummary.contractTotal,
        duration: `${projectDuration.value} ${projectDuration.unit}`,
        confidence: `${(estimate.qualityMetrics.overallConfidence * 100).toFixed(1)}%`
      },
      costBreakdown: {
        direct: estimate.costSummary.directCostTotal,
        indirect: estimate.costSummary.indirectCostTotal,
        total: estimate.costSummary.contractTotal
      },
      riskAssessment: {
        level: estimate.qualityMetrics.riskFactors.length > 3 ? 'High' : 
               estimate.qualityMetrics.riskFactors.length > 1 ? 'Medium' : 'Low',
        factors: estimate.qualityMetrics.riskFactors.length,
        warnings: estimate.qualityMetrics.warnings.length
      },
      recommendations: {
        total: estimate.recommendations.length,
        critical: criticalRecs,
        highPriority: highPriorityRecs
      },
      scenarios: {
        available: estimate.alternativeScenarios.length,
        costRange
      }
    };
  }

  /**
   * Create basic quality metrics when full QC is disabled
   */
  private createBasicQualityMetrics(workPhases: WorkPhase[]): QualityMetrics {
    const overallConfidence = workPhases.length > 0 
      ? workPhases.flatMap(p => p.items).reduce((sum, item) => sum + item.confidenceScore, 0) / workPhases.flatMap(p => p.items).length
      : 0.5;

    return {
      overallConfidence,
      dataCompleteness: 0.8,
      priceAccuracy: overallConfidence,
      scopeCompleteness: 0.9,
      riskFactors: [],
      warnings: [],
      benchmarkComparison: {
        totalCostPerSF: { estimate: 0, marketLow: 0, marketHigh: 0, marketAverage: 0, deviation: 0 },
        laborRatio: { estimate: 0, industryStandard: 0, deviation: 0 },
        materialRatio: { estimate: 0, industryStandard: 0, deviation: 0 },
        overheadRatio: { estimate: 0, industryStandard: 0, deviation: 0 },
        recommendedAdjustments: []
      },
      auditTrail: []
    };
  }

  /**
   * Export estimate to CSV format
   */
  private exportToCSV(estimate: CompleteEstimate): string {
    const lines: string[] = [];
    
    // Header
    lines.push('Phase,Item,Quantity,Unit,Material Cost,Labor Cost,Equipment Cost,Total Cost');
    
    // Data rows
    for (const phase of estimate.workBreakdown) {
      for (const item of phase.items) {
        lines.push([
          phase.phase,
          item.description,
          item.quantity.toString(),
          item.unit,
          item.materialCost.toFixed(2),
          item.laborCost.toFixed(2),
          item.equipmentCost.toFixed(2),
          item.lineItemTotal.toFixed(2)
        ].join(','));
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Increment version string
   */
  private incrementVersion(currentVersion: string): string {
    const parts = currentVersion.split('.');
    const patch = parseInt(parts[2] || '0') + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  /**
   * Get configuration
   */
  getConfig(): CompilationConfig {
    return this.costCalculator.getConfig();
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CompilationConfig>): void {
    this.costCalculator.updateConfig(newConfig);
  }
}

// Default export - ready-to-use estimate compiler
export const defaultEstimateCompiler = new EstimateCompiler();