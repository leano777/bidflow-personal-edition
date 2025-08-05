// Pricing Calculation Engine for BF-002 Implementation

import { 
  PricingRule, 
  PricingCalculation, 
  EstimateRequest, 
  PricingDatabase,
  AIAnalysisResult,
  RegionalAdjustment,
  ConstructionCategory,
  CONSTRUCTION_CATEGORIES
} from './types';

export class PricingEngine {
  private database: PricingDatabase;
  private regionalAdjustments: RegionalAdjustment[];

  constructor(database: PricingDatabase, regionalAdjustments: RegionalAdjustment[] = []) {
    this.database = database;
    this.regionalAdjustments = regionalAdjustments;
  }

  /**
   * Main calculation method - converts measurement + description into pricing
   */
  async calculateEstimate(request: EstimateRequest): Promise<PricingCalculation> {
    try {
      // 1. Find matching pricing rule
      const pricingRule = this.findBestPricingRule(request);
      
      if (!pricingRule) {
        throw new Error(`No pricing rule found for: ${request.description}`);
      }

      // 2. Determine complexity level (could be enhanced with AI later)
      const complexityLevel = this.determineComplexity(request.description);
      
      // 3. Calculate base costs
      const calculation = this.performCalculation(request, pricingRule, complexityLevel);
      
      // 4. Apply regional adjustments
      const finalCalculation = this.applyRegionalAdjustments(calculation, request.location);
      
      return finalCalculation;
    } catch (error) {
      console.error('Error calculating estimate:', error);
      throw error;
    }
  }

  /**
   * Find the best matching pricing rule for the request
   */
  private findBestPricingRule(request: EstimateRequest): PricingRule | null {
    const activeRules = this.database.rules.filter(rule => rule.isActive);
    
    // First, try to match by measurement type
    const typeMatches = activeRules.filter(rule => 
      rule.measurementType === request.measurementType
    );

    if (typeMatches.length === 0) {
      return null;
    }

    // Then try to match by description keywords
    const description = request.description.toLowerCase();
    
    for (const rule of typeMatches) {
      const keywords = this.getRuleKeywords(rule);
      if (keywords.some(keyword => description.includes(keyword.toLowerCase()))) {
        return rule;
      }
    }

    // Fallback to first rule of matching type
    return typeMatches[0];
  }

  /**
   * Get keywords associated with a pricing rule for matching
   */
  private getRuleKeywords(rule: PricingRule): string[] {
    const keywords = [rule.category, rule.description];
    if (rule.subcategory) {
      keywords.push(rule.subcategory);
    }

    // Add category-specific keywords
    switch (rule.category) {
      case CONSTRUCTION_CATEGORIES.FENCING:
        keywords.push('fence', 'fencing', 'chain link', 'privacy', 'wood fence');
        break;
      case CONSTRUCTION_CATEGORIES.FLOORING:
        keywords.push('floor', 'flooring', 'hardwood', 'tile', 'carpet', 'laminate');
        break;
      case CONSTRUCTION_CATEGORIES.PAINTING:
        keywords.push('paint', 'painting', 'primer', 'wall', 'interior', 'exterior');
        break;
      case CONSTRUCTION_CATEGORIES.ROOFING:
        keywords.push('roof', 'roofing', 'shingle', 'tile', 'metal roof');
        break;
      case CONSTRUCTION_CATEGORIES.CONCRETE:
        keywords.push('concrete', 'cement', 'foundation', 'slab', 'driveway');
        break;
      case CONSTRUCTION_CATEGORIES.ELECTRICAL:
        keywords.push('electrical', 'wire', 'outlet', 'switch', 'panel');
        break;
      case CONSTRUCTION_CATEGORIES.PLUMBING:
        keywords.push('plumbing', 'pipe', 'fixture', 'drain', 'water');
        break;
      default:
        break;
    }

    return keywords;
  }

  /**
   * Determine complexity level based on description
   */
  private determineComplexity(description: string): 'easy' | 'medium' | 'hard' {
    const desc = description.toLowerCase();
    
    // Hard complexity indicators
    const hardKeywords = ['custom', 'complex', 'structural', 'electrical panel', 'gas line', 'permit required'];
    if (hardKeywords.some(keyword => desc.includes(keyword))) {
      return 'hard';
    }

    // Medium complexity indicators  
    const mediumKeywords = ['install', 'replace', 'upgrade', 'multiple', 'corner', 'angle'];
    if (mediumKeywords.some(keyword => desc.includes(keyword))) {
      return 'medium';
    }

    // Default to easy
    return 'easy';
  }

  /**
   * Perform the actual cost calculation
   */
  private performCalculation(
    request: EstimateRequest, 
    rule: PricingRule, 
    complexityLevel: 'easy' | 'medium' | 'hard'
  ): PricingCalculation {
    const complexityMultiplier = rule.complexityFactors[complexityLevel];
    
    // Calculate material costs
    const materialUnitCost = rule.basePrice * complexityMultiplier;
    const materialSubtotal = request.quantity * materialUnitCost;
    const wasteAmount = materialSubtotal * rule.wasteFactor;
    const materialTotal = materialSubtotal + wasteAmount;
    
    // Calculate labor costs
    const laborTotal = materialTotal * rule.laborMultiplier;
    const laborHours = this.estimateLaborHours(request, rule, complexityLevel);
    const laborRate = laborTotal / Math.max(laborHours, 1); // Avoid division by zero
    
    // Calculate confidence score based on rule specificity and age
    const confidenceScore = this.calculateConfidenceScore(rule, request);
    
    return {
      lineItemId: `est_${Date.now()}`,
      description: request.description,
      quantity: request.quantity,
      unit: request.unit || this.getDefaultUnit(rule.measurementType),
      
      materialUnitCost,
      materialSubtotal,
      wasteAmount,
      materialTotal,
      
      laborHours,
      laborRate,
      laborTotal,
      
      equipmentCost: 0, // TODO: Add equipment cost calculation
      
      lineItemTotal: materialTotal + laborTotal,
      
      complexityLevel,
      confidenceScore,
      pricingRuleId: rule.id,
      calculatedAt: new Date()
    };
  }

  /**
   * Estimate labor hours based on quantity and complexity
   */
  private estimateLaborHours(
    request: EstimateRequest, 
    rule: PricingRule, 
    complexityLevel: 'easy' | 'medium' | 'hard'
  ): number {
    // Base hours per unit based on measurement type and category
    let baseHoursPerUnit = 0.5; // Default
    
    switch (rule.category) {
      case CONSTRUCTION_CATEGORIES.FENCING:
        baseHoursPerUnit = rule.measurementType === 'linear' ? 0.3 : 1.0;
        break;
      case CONSTRUCTION_CATEGORIES.FLOORING:
        baseHoursPerUnit = rule.measurementType === 'square' ? 0.2 : 1.0;
        break;
      case CONSTRUCTION_CATEGORIES.PAINTING:
        baseHoursPerUnit = rule.measurementType === 'square' ? 0.1 : 0.5;
        break;
      case CONSTRUCTION_CATEGORIES.ELECTRICAL:
        baseHoursPerUnit = rule.measurementType === 'count' ? 1.0 : 0.5;
        break;
      case CONSTRUCTION_CATEGORIES.PLUMBING:
        baseHoursPerUnit = rule.measurementType === 'count' ? 2.0 : 1.0;
        break;
      default:
        baseHoursPerUnit = 0.5;
    }

    // Apply complexity multiplier
    const complexityMultipliers = { easy: 1.0, medium: 1.5, hard: 2.5 };
    const adjustedHoursPerUnit = baseHoursPerUnit * complexityMultipliers[complexityLevel];
    
    return request.quantity * adjustedHoursPerUnit;
  }

  /**
   * Calculate confidence score for the estimate
   */
  private calculateConfidenceScore(rule: PricingRule, request: EstimateRequest): number {
    let score = 0.8; // Base confidence
    
    // Reduce confidence for old data
    const daysSinceUpdate = (Date.now() - rule.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 90) {
      score -= 0.2;
    } else if (daysSinceUpdate > 30) {
      score -= 0.1;
    }
    
    // Increase confidence for exact measurement type match
    if (rule.measurementType === request.measurementType) {
      score += 0.1;
    }
    
    // Ensure score is between 0 and 1
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Apply regional cost adjustments
   */
  private applyRegionalAdjustments(
    calculation: PricingCalculation, 
    region?: string
  ): PricingCalculation {
    if (!region) {
      return calculation;
    }

    const adjustment = this.regionalAdjustments.find(adj => 
      adj.region.toLowerCase() === region.toLowerCase()
    );

    if (!adjustment) {
      return calculation;
    }

    // Apply regional multipliers
    const adjustedCalculation = { ...calculation };
    adjustedCalculation.materialTotal *= adjustment.materialMultiplier;
    adjustedCalculation.laborTotal *= adjustment.laborMultiplier;
    adjustedCalculation.lineItemTotal = adjustedCalculation.materialTotal + adjustedCalculation.laborTotal;

    return adjustedCalculation;
  }

  /**
   * Get default unit for measurement type
   */
  private getDefaultUnit(measurementType: 'linear' | 'square' | 'cubic' | 'count'): string {
    switch (measurementType) {
      case 'linear': return 'LF';
      case 'square': return 'SF';
      case 'cubic': return 'CF';
      case 'count': return 'EA';
      default: return 'EA';
    }
  }

  /**
   * Batch calculate multiple estimates
   */
  async calculateMultipleEstimates(requests: EstimateRequest[]): Promise<PricingCalculation[]> {
    const calculations: PricingCalculation[] = [];
    
    for (const request of requests) {
      try {
        const calculation = await this.calculateEstimate(request);
        calculations.push(calculation);
      } catch (error) {
        console.error(`Failed to calculate estimate for: ${request.description}`, error);
        // Continue with other calculations
      }
    }
    
    return calculations;
  }

  /**
   * Update pricing database
   */
  updateDatabase(newDatabase: PricingDatabase): void {
    this.database = newDatabase;
  }

  /**
   * Get available categories
   */
  getAvailableCategories(): string[] {
    const categories = this.database.rules.map(rule => rule.category);
    return Array.from(new Set(categories));
  }

  /**
   * Search pricing rules by category
   */
  searchRulesByCategory(category: ConstructionCategory): PricingRule[] {
    return this.database.rules.filter(rule => 
      rule.category === category && rule.isActive
    );
  }
}