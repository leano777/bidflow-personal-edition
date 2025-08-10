// Alternates and Multi-Phase Scenario Handling - Step 8 Implementation
// Export Index for all related modules

// Core Types
export * from './alternates-types';

// Core Managers
export { AlternatesManager } from './alternates-manager';
export { PhasingCalendarManager } from './phasing-calendar-manager';

// Demo and Testing
export { AlternatesMultiPhaseDemo, alternatesMultiPhaseDemo } from './demo-alternates-multiphase';
export { AlternatesMultiPhaseTests, alternatesMultiPhaseTests } from './test-alternates-multiphase';

// Re-export related compilation types for convenience
export * from './types';

// Utility functions for working with alternates and multi-phase scenarios
export class AlternatesUtilities {
  /**
   * Calculate total cost difference between two alternates
   */
  static calculateCostDifference(alternate1: any, alternate2: any): {
    absoluteDifference: number;
    percentageDifference: number;
  } {
    const cost1 = alternate1.computedCostSummary?.contractTotal || 0;
    const cost2 = alternate2.computedCostSummary?.contractTotal || 0;
    const absoluteDifference = Math.abs(cost1 - cost2);
    const percentageDifference = cost2 !== 0 ? (absoluteDifference / cost2) * 100 : 0;
    
    return { absoluteDifference, percentageDifference };
  }

  /**
   * Find the most cost-effective alternate
   */
  static findMostCostEffective(alternates: any[]): any | null {
    if (alternates.length === 0) return null;
    
    return alternates.reduce((best, current) => {
      const bestCost = best.computedCostSummary?.contractTotal || Infinity;
      const currentCost = current.computedCostSummary?.contractTotal || Infinity;
      return currentCost < bestCost ? current : best;
    });
  }

  /**
   * Calculate learning curve efficiency for a given repetition
   */
  static calculateLearningEfficiency(
    initialEfficiency: number,
    finalEfficiency: number,
    learningRate: number,
    currentRepetition: number,
    maxRepetitions: number
  ): number {
    if (currentRepetition >= maxRepetitions) {
      return finalEfficiency;
    }

    // Wright's learning curve formula
    const progress = Math.log(currentRepetition) / Math.log(maxRepetitions);
    const learningExponent = Math.log(learningRate) / Math.log(2);
    const efficiency = initialEfficiency + 
      (finalEfficiency - initialEfficiency) * 
      Math.pow(progress, Math.abs(learningExponent));

    return Math.min(finalEfficiency, Math.max(initialEfficiency, efficiency));
  }

  /**
   * Calculate calendar rate multiplier for given date and time
   */
  static calculateRateMultiplier(
    date: Date,
    timeOfDay: string,
    laborRateAdjustment: any
  ): number {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const month = date.getMonth(); // 0 = January, 11 = December
    
    // Base multiplier from day of week
    let multiplier = 1.0;
    if (dayOfWeek === 0) { // Sunday
      multiplier = laborRateAdjustment.dayOfWeek?.sunday || 2.0;
    } else if (dayOfWeek === 6) { // Saturday
      multiplier = laborRateAdjustment.dayOfWeek?.saturday || 1.5;
    } else {
      multiplier = laborRateAdjustment.dayOfWeek?.weekday || 1.0;
    }

    // Apply time of day multiplier
    const hour = parseInt(timeOfDay.split(':')[0]);
    if (hour >= 20 || hour < 8) { // Night shift
      multiplier *= laborRateAdjustment.timeOfDay?.night?.multiplier || 1.2;
    } else if (hour >= 17) { // Overtime
      multiplier *= laborRateAdjustment.timeOfDay?.overtime?.multiplier || 1.5;
    } else { // Regular hours
      multiplier *= laborRateAdjustment.timeOfDay?.regular?.multiplier || 1.0;
    }

    // Apply seasonal multiplier
    let seasonalMultiplier = 1.0;
    if (month >= 2 && month <= 4) { // Spring
      seasonalMultiplier = laborRateAdjustment.seasonalFactors?.spring || 1.0;
    } else if (month >= 5 && month <= 7) { // Summer
      seasonalMultiplier = laborRateAdjustment.seasonalFactors?.summer || 1.0;
    } else if (month >= 8 && month <= 10) { // Fall
      seasonalMultiplier = laborRateAdjustment.seasonalFactors?.fall || 1.0;
    } else { // Winter
      seasonalMultiplier = laborRateAdjustment.seasonalFactors?.winter || 1.1;
    }

    return multiplier * seasonalMultiplier;
  }

  /**
   * Convert duration to days for calculations
   */
  static durationToDays(duration: any): number {
    switch (duration.unit) {
      case 'days': return duration.value;
      case 'weeks': return duration.value * 7;
      case 'months': return duration.value * 30;
      default: return duration.value;
    }
  }

  /**
   * Convert days to appropriate duration unit
   */
  static daysToDuration(days: number): any {
    if (days <= 7) return { value: days, unit: 'days' };
    if (days <= 60) return { value: Math.ceil(days / 7), unit: 'weeks' };
    return { value: Math.ceil(days / 30), unit: 'months' };
  }

  /**
   * Validate alternate scope integrity
   */
  static validateAlternateIntegrity(alternate: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!alternate.id) errors.push('Alternate ID is required');
    if (!alternate.name) errors.push('Alternate name is required');
    if (!alternate.parentScopeId) errors.push('Parent scope ID is required');
    if (!alternate.inheritsFrom) errors.push('Base scope inheritance is required');

    // Check cost deltas consistency
    const totalCalculatedDelta = alternate.costDeltas?.reduce((sum: number, delta: any) => sum + delta.deltaCost, 0) || 0;
    if (Math.abs(totalCalculatedDelta - alternate.totalDeltaCost) > 0.01) {
      errors.push('Cost delta totals do not match');
    }

    // Check computed values
    if (!alternate.computedCostSummary) {
      warnings.push('Computed cost summary is missing');
    }

    if (!alternate.computedPhases) {
      warnings.push('Computed phases are missing');
    }

    // Check modification consistency
    if (alternate.scopeModifications?.length === 0 && alternate.phaseModifications?.length === 0 && alternate.totalDeltaCost !== 0) {
      warnings.push('No modifications but non-zero delta cost');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate summary statistics for alternate comparison
   */
  static generateAlternateStatistics(alternates: any[]): {
    count: number;
    costRange: { min: number; max: number; average: number };
    qualityDistribution: Record<string, number>;
    riskDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
  } {
    if (alternates.length === 0) {
      return {
        count: 0,
        costRange: { min: 0, max: 0, average: 0 },
        qualityDistribution: {},
        riskDistribution: {},
        typeDistribution: {}
      };
    }

    const costs = alternates.map(alt => alt.computedCostSummary?.contractTotal || 0);
    const qualities = alternates.map(alt => alt.qualityLevelDelta || 'same');
    const risks = alternates.map(alt => alt.riskLevelDelta || 'same');
    const types = alternates.map(alt => alt.alternateType || 'custom');

    const costRange = {
      min: Math.min(...costs),
      max: Math.max(...costs),
      average: costs.reduce((sum, cost) => sum + cost, 0) / costs.length
    };

    const qualityDistribution = qualities.reduce((dist: Record<string, number>, quality) => {
      dist[quality] = (dist[quality] || 0) + 1;
      return dist;
    }, {});

    const riskDistribution = risks.reduce((dist: Record<string, number>, risk) => {
      dist[risk] = (dist[risk] || 0) + 1;
      return dist;
    }, {});

    const typeDistribution = types.reduce((dist: Record<string, number>, type) => {
      dist[type] = (dist[type] || 0) + 1;
      return dist;
    }, {});

    return {
      count: alternates.length,
      costRange,
      qualityDistribution,
      riskDistribution,
      typeDistribution
    };
  }
}

// Constants and defaults
export const ALTERNATES_CONSTANTS = {
  DEFAULT_LEARNING_RATES: {
    REPETITIVE_FRAMING: 0.85,
    REPETITIVE_FINISHING: 0.90,
    GENERAL_CONSTRUCTION: 0.88
  },
  
  DEFAULT_RATE_MULTIPLIERS: {
    OVERTIME: 1.5,
    WEEKEND: 2.0,
    HOLIDAY: 2.5,
    NIGHT: 1.2,
    WINTER: 1.1
  },

  CONFIDENCE_THRESHOLDS: {
    HIGH: 0.85,
    MEDIUM: 0.70,
    LOW: 0.50
  },

  RISK_IMPACT_MULTIPLIERS: {
    LOW: 0.95,
    MEDIUM: 1.0,
    HIGH: 1.15,
    CRITICAL: 1.30
  }
};

// Quick start template
export const ALTERNATES_QUICK_START = {
  /**
   * Create a basic value engineering alternate
   */
  createValueEngineeringTemplate: () => ({
    name: 'Value Engineering',
    description: 'Cost-optimized solution with standard materials',
    alternateType: 'value_engineering' as const,
    expectedCostReduction: 0.15, // 15% reduction
    qualityImpact: 'Standard materials, good value',
    riskConsiderations: ['Material quality', 'Installation complexity']
  }),

  /**
   * Create a basic premium upgrade alternate
   */
  createPremiumTemplate: () => ({
    name: 'Premium Upgrade',
    description: 'High-end finishes and premium materials',
    alternateType: 'premium' as const,
    expectedCostIncrease: 0.25, // 25% increase
    qualityImpact: 'Premium materials, enhanced durability',
    riskConsiderations: ['Lead times', 'Specialized installation']
  }),

  /**
   * Create a basic fast track alternate
   */
  createFastTrackTemplate: () => ({
    name: 'Fast Track',
    description: 'Accelerated timeline with parallel execution',
    alternateType: 'fast_track' as const,
    expectedCostIncrease: 0.18, // 18% increase
    timeReduction: 0.30, // 30% faster
    riskConsiderations: ['Coordination complexity', 'Quality control', 'Resource availability']
  })
};

console.log('📦 Alternates and Multi-Phase Scenario Handling System Loaded');
console.log('   ✅ Scope Tree Inheritance');
console.log('   ✅ Differential Pricing (Delta-only storage)');
console.log('   ✅ Labor Rate Adjustments');
console.log('   ✅ Learning Curves Across Phases');
console.log('   ✅ Phasing Calendar Integration');
console.log('   ✅ Multi-Phase Execution Planning');
console.log('   ✅ Comprehensive Cost Projections');
