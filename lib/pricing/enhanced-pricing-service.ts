// Enhanced Pricing Service with Regional Cost Database Integration
// Combines existing pricing engine with CSI-based regional pricing

import { 
  EstimateRequest, 
  PricingCalculation, 
  PricingQuery,
  PricingQueryResult,
  BaseUnitPrice,
  LocationFactors
} from './types';
import { PricingEngine } from './engine';
import { PricingAI } from './ai-integration';
import { RegionalCostDBService, regionalCostDB } from './regional-database';
import { createDefaultPricingDatabase, DEFAULT_REGIONAL_ADJUSTMENTS } from './database';

export interface EnhancedEstimateRequest extends EstimateRequest {
  csiCode?: string;
  zipCode?: string;
  includeRegionalPricing?: boolean;
  includeEscalation?: boolean;
}

export interface EnhancedPricingResult {
  // Original pricing calculation
  standardPricing: PricingCalculation;
  
  // Regional database pricing (if available)
  regionalPricing?: PricingQueryResult;
  
  // Recommended pricing (best of both)
  recommendedPricing: PricingCalculation & {
    pricingSource: 'standard' | 'regional' | 'hybrid';
    confidenceScore: number;
    locationAdjustment?: number;
    escalationAdjustment?: number;
  };
  
  // Analysis and validation
  analysis: {
    priceComparison: {
      standardPrice: number;
      regionalPrice?: number;
      variance?: number;
      percentageDifference?: number;
    };
    riskFactors: string[];
    recommendations: string[];
  };
  
  // Performance metrics
  performance: {
    queryTime: number;
    cacheHits: number;
    dataFreshness: string;
  };
}

export class EnhancedPricingService {
  private standardEngine: PricingEngine;
  private regionalDB: RegionalCostDBService;
  private ai: PricingAI;
  private isInitialized: boolean = false;

  constructor() {
    const database = createDefaultPricingDatabase();
    this.standardEngine = new PricingEngine(database, DEFAULT_REGIONAL_ADJUSTMENTS);
    this.regionalDB = regionalCostDB;
    this.ai = new PricingAI();
  }

  /**
   * Initialize all pricing services
   */
  async initialize(): Promise<void> {
    try {
      console.log('🚀 Initializing Enhanced Pricing Service...');
      
      // Initialize regional database (includes cache initialization)
      await this.regionalDB.initialize();
      
      this.isInitialized = true;
      console.log('✅ Enhanced Pricing Service initialized');
    } catch (error) {
      console.error('Failed to initialize Enhanced Pricing Service:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive pricing estimate using multiple data sources
   */
  async generateEnhancedEstimate(request: EnhancedEstimateRequest): Promise<EnhancedPricingResult> {
    if (!this.isInitialized) {
      throw new Error('Enhanced Pricing Service not initialized. Call initialize() first.');
    }

    const startTime = Date.now();
    let cacheHits = 0;

    try {
      console.log(`💰 Generating enhanced estimate for: ${request.description}`);

      // 1. Generate standard pricing
      const standardPricing = await this.standardEngine.calculateEstimate(request);
      
      // 2. Attempt regional pricing if CSI code and zip provided
      let regionalPricing: PricingQueryResult | undefined;
      
      if (request.csiCode && request.zipCode && request.includeRegionalPricing !== false) {
        try {
          const regionalQuery: PricingQuery = {
            csiCode: request.csiCode,
            zipCode: request.zipCode,
            quantity: request.quantity,
            unit: request.unit || 'EA',
            includeLocationFactors: true,
            includeEscalation: request.includeEscalation !== false
          };

          regionalPricing = await this.regionalDB.lookupPricing(regionalQuery);
          if (regionalPricing.cacheHit) {
            cacheHits++;
          }
        } catch (error) {
          console.warn('Regional pricing lookup failed, falling back to standard pricing:', error);
        }
      }

      // 3. Determine recommended pricing strategy
      const recommendedPricing = this.selectRecommendedPricing(standardPricing, regionalPricing);

      // 4. Generate analysis and recommendations
      const analysis = await this.generateAnalysis(standardPricing, regionalPricing, request);

      // 5. Calculate performance metrics
      const queryTime = Date.now() - startTime;
      const performance = {
        queryTime,
        cacheHits,
        dataFreshness: this.assessDataFreshness(standardPricing, regionalPricing)
      };

      const result: EnhancedPricingResult = {
        standardPricing,
        regionalPricing,
        recommendedPricing,
        analysis,
        performance
      };

      console.log(`✅ Enhanced estimate complete (${queryTime}ms, ${cacheHits} cache hits)`);
      return result;

    } catch (error) {
      console.error('Error generating enhanced estimate:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple enhanced estimates
   */
  async generateBatchEnhancedEstimates(requests: EnhancedEstimateRequest[]): Promise<{
    results: EnhancedPricingResult[];
    summary: {
      totalItems: number;
      successfulEstimates: number;
      failedEstimates: number;
      totalValue: number;
      averageConfidence: number;
      totalQueryTime: number;
      cacheHitRate: number;
    };
  }> {
    if (!this.isInitialized) {
      throw new Error('Enhanced Pricing Service not initialized');
    }

    console.log(`📊 Processing batch of ${requests.length} enhanced estimates...`);
    const batchStartTime = Date.now();

    // Process requests in parallel for better performance
    const results = await Promise.allSettled(
      requests.map(request => this.generateEnhancedEstimate(request))
    );

    const successful: EnhancedPricingResult[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        successful.push(result.value);
      } else {
        failed.push(`Request ${index}: ${result.reason}`);
        console.error(`Failed estimate ${index}:`, result.reason);
      }
    });

    // Calculate summary statistics
    const totalValue = successful.reduce((sum, result) => sum + result.recommendedPricing.lineItemTotal, 0);
    const averageConfidence = successful.reduce((sum, result) => sum + result.recommendedPricing.confidenceScore, 0) / successful.length;
    const totalQueryTime = Date.now() - batchStartTime;
    const totalCacheHits = successful.reduce((sum, result) => sum + result.performance.cacheHits, 0);
    const cacheHitRate = totalCacheHits / (successful.length * 2); // 2 potential cache hits per request

    const summary = {
      totalItems: requests.length,
      successfulEstimates: successful.length,
      failedEstimates: failed.length,
      totalValue,
      averageConfidence: averageConfidence || 0,
      totalQueryTime,
      cacheHitRate
    };

    console.log(`📊 Batch complete: ${successful.length}/${requests.length} successful, $${totalValue.toFixed(2)} total value (${totalQueryTime}ms)`);

    return { results: successful, summary };
  }

  /**
   * Select the best pricing strategy based on available data
   */
  private selectRecommendedPricing(
    standardPricing: PricingCalculation, 
    regionalPricing?: PricingQueryResult
  ): PricingCalculation & { 
    pricingSource: 'standard' | 'regional' | 'hybrid';
    locationAdjustment?: number;
    escalationAdjustment?: number;
  } {
    // If no regional pricing, use standard
    if (!regionalPricing) {
      return {
        ...standardPricing,
        pricingSource: 'standard'
      };
    }

    // If regional pricing has high confidence, prefer it
    if (regionalPricing.confidence >= 0.8) {
      const enhancedPricing = {
        ...standardPricing,
        lineItemTotal: regionalPricing.finalPrice.extendedPrice,
        materialTotal: regionalPricing.finalPrice.materialCost * standardPricing.quantity,
        laborTotal: regionalPricing.finalPrice.laborCost * standardPricing.quantity,
        confidenceScore: regionalPricing.confidence,
        pricingSource: 'regional' as const,
        locationAdjustment: regionalPricing.appliedFactors.locationFactor?.totalFactor,
        escalationAdjustment: regionalPricing.appliedFactors.escalationFactor?.overallInflation
      };

      return enhancedPricing;
    }

    // For moderate confidence, create hybrid pricing
    if (regionalPricing.confidence >= 0.5) {
      const weight = regionalPricing.confidence;
      const standardWeight = 1 - weight;

      const hybridTotal = (standardPricing.lineItemTotal * standardWeight) + 
                         (regionalPricing.finalPrice.extendedPrice * weight);

      return {
        ...standardPricing,
        lineItemTotal: hybridTotal,
        confidenceScore: Math.max(standardPricing.confidenceScore, regionalPricing.confidence * 0.9),
        pricingSource: 'hybrid',
        locationAdjustment: regionalPricing.appliedFactors.locationFactor?.totalFactor,
        escalationAdjustment: regionalPricing.appliedFactors.escalationFactor?.overallInflation
      };
    }

    // Low confidence regional data, stick with standard
    return {
      ...standardPricing,
      pricingSource: 'standard'
    };
  }

  /**
   * Generate comprehensive analysis comparing pricing sources
   */
  private async generateAnalysis(
    standardPricing: PricingCalculation,
    regionalPricing?: PricingQueryResult,
    request?: EnhancedEstimateRequest
  ): Promise<{
    priceComparison: {
      standardPrice: number;
      regionalPrice?: number;
      variance?: number;
      percentageDifference?: number;
    };
    riskFactors: string[];
    recommendations: string[];
  }> {
    const analysis = {
      priceComparison: {
        standardPrice: standardPricing.lineItemTotal,
        regionalPrice: regionalPricing?.finalPrice.extendedPrice,
        variance: undefined as number | undefined,
        percentageDifference: undefined as number | undefined
      },
      riskFactors: [] as string[],
      recommendations: [] as string[]
    };

    // Calculate price variance if both prices available
    if (regionalPricing) {
      const variance = regionalPricing.finalPrice.extendedPrice - standardPricing.lineItemTotal;
      const percentageDifference = (variance / standardPricing.lineItemTotal) * 100;
      
      analysis.priceComparison.variance = variance;
      analysis.priceComparison.percentageDifference = percentageDifference;

      // Add risk factors based on price variance
      if (Math.abs(percentageDifference) > 25) {
        analysis.riskFactors.push('Significant price variance between pricing sources');
      }
      
      if (regionalPricing.confidence < 0.7) {
        analysis.riskFactors.push('Low confidence in regional pricing data');
      }
    }

    // Assess data freshness risks
    const daysSinceUpdate = (Date.now() - standardPricing.calculatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 30) {
      analysis.riskFactors.push('Pricing data is over 30 days old');
    }

    // Generate recommendations
    if (regionalPricing && regionalPricing.confidence > 0.8) {
      analysis.recommendations.push('High-confidence regional pricing available - recommended');
    }

    if (request?.csiCode && !regionalPricing) {
      analysis.recommendations.push('Consider updating regional database for better CSI-based pricing');
    }

    if (analysis.priceComparison.percentageDifference && Math.abs(analysis.priceComparison.percentageDifference) > 15) {
      analysis.recommendations.push('Significant price variance detected - consider market research');
    }

    return analysis;
  }

  /**
   * Assess the freshness of pricing data
   */
  private assessDataFreshness(standardPricing: PricingCalculation, regionalPricing?: PricingQueryResult): string {
    const standardDays = (Date.now() - standardPricing.calculatedAt.getTime()) / (1000 * 60 * 60 * 24);
    
    if (regionalPricing) {
      const regionalDays = (Date.now() - regionalPricing.basePrice.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      const avgDays = (standardDays + regionalDays) / 2;
      
      if (avgDays < 7) return 'Fresh (within 1 week)';
      if (avgDays < 30) return 'Recent (within 1 month)';
      if (avgDays < 90) return 'Moderate (within 3 months)';
      return 'Stale (over 3 months)';
    }
    
    if (standardDays < 1) return 'Fresh (same day)';
    if (standardDays < 7) return 'Recent (within 1 week)';
    if (standardDays < 30) return 'Moderate (within 1 month)';
    return 'Stale (over 1 month)';
  }

  /**
   * Search for CSI codes
   */
  async searchCSICodes(searchTerm: string): Promise<{ code: string; title: string; description: string; }[]> {
    const stats = this.regionalDB.getStats();
    if (!stats.initialized) {
      return [];
    }

    // This would search the loaded CSI codes - simplified for demo
    const mockResults = [
      { code: '03 30 00', title: 'Cast-In-Place Concrete', description: 'Ready-mixed concrete' },
      { code: '06 10 00', title: 'Rough Carpentry', description: 'Framing lumber and hardware' },
      { code: '09 91 00', title: 'Painting', description: 'Interior and exterior painting' }
    ];

    return mockResults.filter(csi => 
      csi.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      csi.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      csi.code.includes(searchTerm)
    );
  }

  /**
   * Get service health and statistics
   */
  async getServiceHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: {
      standardEngine: 'healthy' | 'unhealthy';
      regionalDatabase: 'healthy' | 'unhealthy';
      cache: { status: 'healthy' | 'unhealthy'; latency?: number };
    };
    statistics: {
      regionalDB: any;
      standardDB: any;
    };
  }> {
    const regionalDBStats = this.regionalDB.getStats();
    const cacheHealth = await this.regionalDB['cache'].healthCheck();
    
    const services = {
      standardEngine: 'healthy' as const,
      regionalDatabase: regionalDBStats.initialized ? 'healthy' as const : 'unhealthy' as const,
      cache: cacheHealth
    };

    const overallStatus = Object.values(services).some(s => 
      typeof s === 'string' ? s === 'unhealthy' : s.status === 'unhealthy'
    ) ? 'unhealthy' : 'healthy';

    return {
      status: overallStatus,
      services,
      statistics: {
        regionalDB: regionalDBStats,
        standardDB: { message: 'Stats not available from standard engine' }
      }
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    await this.regionalDB.shutdown();
    console.log('✅ Enhanced Pricing Service shutdown complete');
  }
}

// Default export for easy consumption
export const enhancedPricingService = new EnhancedPricingService();
