// AI Integration for Pricing Analysis - BF-002 Implementation

import { 
  AIAnalysisResult, 
  EstimateRequest, 
  PricingRule,
  CONSTRUCTION_CATEGORIES 
} from './types';

export class PricingAI {
  
  /**
   * Analyze description and suggest pricing category and complexity
   */
  async analyzeDescription(description: string, quantity?: number): Promise<AIAnalysisResult> {
    try {
      // For now, implement rule-based analysis
      // This can be enhanced with actual AI API calls later
      const analysis = this.performRuleBasedAnalysis(description, quantity);
      return analysis;
    } catch (error) {
      console.error('Error analyzing description:', error);
      
      // Fallback analysis
      return {
        suggestedCategory: CONSTRUCTION_CATEGORIES.STRUCTURAL,
        complexityLevel: 'medium',
        recommendedPricingRule: 'default',
        riskFactors: ['Unable to analyze description automatically'],
        confidenceScore: 0.3,
        reasoning: 'Fallback analysis due to processing error'
      };
    }
  }

  /**
   * Rule-based analysis for immediate implementation
   * Can be replaced with AI API calls later
   */
  private performRuleBasedAnalysis(description: string, quantity?: number): AIAnalysisResult {
    const desc = description.toLowerCase();
    const analysis: AIAnalysisResult = {
      suggestedCategory: CONSTRUCTION_CATEGORIES.STRUCTURAL,
      complexityLevel: 'medium',
      recommendedPricingRule: 'default',
      riskFactors: [],
      confidenceScore: 0.7,
      reasoning: 'Rule-based keyword analysis'
    };

    // Category classification
    if (this.containsKeywords(desc, ['fence', 'fencing', 'chain link', 'privacy fence', 'wood fence'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.FENCING;
      analysis.recommendedPricingRule = 'fencing_linear';
    } else if (this.containsKeywords(desc, ['floor', 'flooring', 'hardwood', 'tile', 'carpet', 'laminate', 'vinyl'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.FLOORING;
      analysis.recommendedPricingRule = 'flooring_square';
    } else if (this.containsKeywords(desc, ['paint', 'painting', 'primer', 'wall paint', 'interior paint', 'exterior paint'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.PAINTING;
      analysis.recommendedPricingRule = 'painting_square';
    } else if (this.containsKeywords(desc, ['roof', 'roofing', 'shingle', 'roof tile', 'metal roof', 'roof repair'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.ROOFING;
      analysis.recommendedPricingRule = 'roofing_square';
    } else if (this.containsKeywords(desc, ['concrete', 'cement', 'foundation', 'slab', 'driveway', 'sidewalk'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.CONCRETE;
      analysis.recommendedPricingRule = 'concrete_cubic';
    } else if (this.containsKeywords(desc, ['electrical', 'wire', 'outlet', 'switch', 'panel', 'circuit'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.ELECTRICAL;
      analysis.recommendedPricingRule = 'electrical_count';
    } else if (this.containsKeywords(desc, ['plumbing', 'pipe', 'fixture', 'drain', 'water line', 'faucet'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.PLUMBING;
      analysis.recommendedPricingRule = 'plumbing_count';
    } else if (this.containsKeywords(desc, ['siding', 'exterior', 'vinyl siding', 'wood siding', 'fiber cement'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.SIDING;
      analysis.recommendedPricingRule = 'siding_square';
    } else if (this.containsKeywords(desc, ['drywall', 'sheetrock', 'wall', 'ceiling'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.DRYWALL;
      analysis.recommendedPricingRule = 'drywall_square';
    } else if (this.containsKeywords(desc, ['trim', 'molding', 'baseboard', 'crown molding', 'casing'])) {
      analysis.suggestedCategory = CONSTRUCTION_CATEGORIES.TRIM;
      analysis.recommendedPricingRule = 'trim_linear';
    }

    // Complexity analysis
    if (this.containsKeywords(desc, ['custom', 'complex', 'structural', 'engineering', 'permit required', 'inspection'])) {
      analysis.complexityLevel = 'hard';
      analysis.riskFactors.push('Complex installation requiring specialized skills');
    } else if (this.containsKeywords(desc, ['standard', 'basic', 'simple', 'straightforward', 'typical'])) {
      analysis.complexityLevel = 'easy';
    } else if (this.containsKeywords(desc, ['install', 'replace', 'upgrade', 'multiple', 'corner', 'angle', 'curved'])) {
      analysis.complexityLevel = 'medium';
    }

    // Risk factor analysis
    if (this.containsKeywords(desc, ['electrical panel', 'gas line', 'structural', 'load bearing'])) {
      analysis.riskFactors.push('May require permits and inspections');
    }
    
    if (this.containsKeywords(desc, ['asbestos', 'lead', 'mold', 'hazardous'])) {
      analysis.riskFactors.push('Potential hazardous materials - requires testing');
    }

    if (this.containsKeywords(desc, ['basement', 'crawl space', 'attic', 'tight space'])) {
      analysis.riskFactors.push('Difficult access may increase labor time');
    }

    // Quantity-based risk assessment
    if (quantity && quantity > 1000) {
      analysis.riskFactors.push('Large quantity may require bulk pricing and scheduling considerations');
    }

    // Adjust confidence based on keyword matches and risk factors
    if (analysis.riskFactors.length > 2) {
      analysis.confidenceScore -= 0.2;
    }

    return analysis;
  }

  /**
   * Check if description contains any of the specified keywords
   */
  private containsKeywords(description: string, keywords: string[]): boolean {
    return keywords.some(keyword => description.includes(keyword));
  }

  /**
   * Generate AI prompt for external AI service (GPT-4, etc.)
   */
  generateAnalysisPrompt(description: string, quantity?: number): string {
    return `
Analyze this construction work description and provide pricing recommendations:

DESCRIPTION: "${description}"
QUANTITY: ${quantity || 'Not specified'}

Please analyze and provide:

1. CATEGORY CLASSIFICATION:
   - Primary category (fencing, flooring, painting, roofing, electrical, plumbing, etc.)
   - Subcategory if applicable
   - Best measurement type (linear feet, square feet, cubic feet, or count)

2. COMPLEXITY ASSESSMENT:
   - Easy: Basic installation, standard materials
   - Medium: Some challenges, multiple components
   - Hard: Complex installation, specialized skills/permits required

3. RISK FACTORS:
   - Permit requirements
   - Hazardous materials
   - Access challenges  
   - Structural considerations
   - Weather dependencies

4. PRICING CONSIDERATIONS:
   - Typical waste factors for materials
   - Labor intensity (hours per unit)
   - Equipment needs
   - Regional variations

5. QUALITY RECOMMENDATIONS:
   - Material grade suggestions
   - Installation best practices
   - Warranty considerations

Provide your analysis in a structured format with confidence scores (0-1) for each assessment.
    `.trim();
  }

  /**
   * Process AI response and convert to structured result
   * This would parse response from external AI service
   */
  parseAIResponse(aiResponse: string): AIAnalysisResult {
    // This is a placeholder for parsing actual AI responses
    // Implementation would depend on the AI service format
    
    try {
      // For now, return a basic parse
      return {
        suggestedCategory: CONSTRUCTION_CATEGORIES.STRUCTURAL,
        complexityLevel: 'medium',
        recommendedPricingRule: 'default',
        riskFactors: ['AI analysis not fully implemented'],
        confidenceScore: 0.5,
        reasoning: 'Placeholder AI response parsing'
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }

  /**
   * Validate pricing estimate using AI
   */
  async validatePricingEstimate(
    description: string,
    calculatedTotal: number,
    quantity: number,
    unit: string
  ): Promise<{
    isReasonable: boolean;
    suggestedRange: { min: number; max: number };
    warnings: string[];
    confidence: number;
  }> {
    // Rule-based validation for immediate implementation
    const pricePerUnit = calculatedTotal / quantity;
    const warnings: string[] = [];
    
    // Basic price sanity checks
    let isReasonable = true;
    let confidence = 0.7;
    
    // Category-specific validation
    const desc = description.toLowerCase();
    
    if (this.containsKeywords(desc, ['fence', 'fencing']) && unit === 'LF') {
      if (pricePerUnit < 10 || pricePerUnit > 150) {
        isReasonable = false;
        warnings.push(`Fencing cost of $${pricePerUnit.toFixed(2)}/LF seems unusual (typical range: $15-80/LF)`);
      }
    } else if (this.containsKeywords(desc, ['flooring']) && unit === 'SF') {
      if (pricePerUnit < 2 || pricePerUnit > 50) {
        isReasonable = false;
        warnings.push(`Flooring cost of $${pricePerUnit.toFixed(2)}/SF seems unusual (typical range: $3-25/SF)`);
      }
    } else if (this.containsKeywords(desc, ['paint', 'painting']) && unit === 'SF') {
      if (pricePerUnit < 1 || pricePerUnit > 15) {
        isReasonable = false;
        warnings.push(`Painting cost of $${pricePerUnit.toFixed(2)}/SF seems unusual (typical range: $2-8/SF)`);
      }
    }

    // Generate suggested range (±25% of calculated)
    const suggestedRange = {
      min: calculatedTotal * 0.75,
      max: calculatedTotal * 1.25
    };

    return {
      isReasonable,
      suggestedRange,
      warnings,
      confidence
    };
  }
}