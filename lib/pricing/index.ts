// Main Pricing Engine Export - BF-002 Implementation

export * from './types';
export * from './engine';
export * from './ai-integration';
export * from './database';

import { PricingEngine } from './engine';
import { PricingAI } from './ai-integration';
import { 
  createDefaultPricingDatabase, 
  DEFAULT_REGIONAL_ADJUSTMENTS,
  findPricingRuleById,
  getRulesByCategory,
  searchRules 
} from './database';
import { EstimateRequest, PricingCalculation, PricingDatabase } from './types';

// Main Pricing Service Class
export class PricingService {
  private engine: PricingEngine;
  private ai: PricingAI;
  private database: PricingDatabase;

  constructor(customDatabase?: PricingDatabase) {
    this.database = customDatabase || createDefaultPricingDatabase();
    this.engine = new PricingEngine(this.database, DEFAULT_REGIONAL_ADJUSTMENTS);
    this.ai = new PricingAI();
  }

  /**
   * Main method: Convert measurements to pricing with AI analysis
   */
  async generateEstimate(request: EstimateRequest): Promise<{
    calculation: PricingCalculation;
    aiAnalysis: any;
    validation: any;
  }> {
    try {
      // 1. AI Analysis of description
      const aiAnalysis = await this.ai.analyzeDescription(
        request.description, 
        request.quantity
      );

      // 2. Calculate pricing
      const calculation = await this.engine.calculateEstimate(request);

      // 3. Validate pricing
      const validation = await this.ai.validatePricingEstimate(
        request.description,
        calculation.lineItemTotal,
        request.quantity,
        calculation.unit
      );

      return {
        calculation,
        aiAnalysis,
        validation
      };
    } catch (error) {
      console.error('Error generating estimate:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple measurements
   */
  async generateMultipleEstimates(requests: EstimateRequest[]): Promise<{
    calculations: PricingCalculation[];
    totalEstimate: number;
    summary: {
      itemCount: number;
      averageConfidence: number;
      riskFactors: string[];
    };
  }> {
    const calculations: PricingCalculation[] = [];
    const allRiskFactors: string[] = [];
    let totalConfidence = 0;

    for (const request of requests) {
      try {
        const result = await this.generateEstimate(request);
        calculations.push(result.calculation);
        totalConfidence += result.calculation.confidenceScore;
        allRiskFactors.push(...result.aiAnalysis.riskFactors);
      } catch (error) {
        console.error(`Failed to estimate: ${request.description}`, error);
      }
    }

    const totalEstimate = calculations.reduce((sum, calc) => sum + calc.lineItemTotal, 0);
    const averageConfidence = calculations.length > 0 ? totalConfidence / calculations.length : 0;
    const uniqueRiskFactors = Array.from(new Set(allRiskFactors));

    return {
      calculations,
      totalEstimate,
      summary: {
        itemCount: calculations.length,
        averageConfidence,
        riskFactors: uniqueRiskFactors
      }
    };
  }

  /**
   * Search for pricing rules
   */
  searchPricingRules(keywords: string[]) {
    return searchRules(this.database, keywords);
  }

  /**
   * Get available categories
   */
  getCategories() {
    return this.engine.getAvailableCategories();
  }

  /**
   * Update pricing database
   */
  updateDatabase(newDatabase: PricingDatabase) {
    this.database = newDatabase;
    this.engine.updateDatabase(newDatabase);
  }

  /**
   * Get database statistics
   */
  getDatabaseStats() {
    return {
      totalRules: this.database.rules.length,
      activeRules: this.database.rules.filter(r => r.isActive).length,
      categories: this.getCategories().length,
      lastSync: this.database.lastSync,
      materials: this.database.materials.length,
      laborRates: this.database.labor.length
    };
  }
}

// Default export - ready-to-use pricing service
export const defaultPricingService = new PricingService();