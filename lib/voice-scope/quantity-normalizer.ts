// Quantity Normalization & Validation Module - BF-005 Implementation

import { VoiceMeasurement } from './types';

export interface NormalizedQuantity {
  id: string;
  originalMeasurement: VoiceMeasurement;
  normalizedValue: number;
  standardUnit: string;
  conversionFactor: number;
  conversionSource: string;
  validationStatus: 'valid' | 'warning' | 'error';
  validationNotes: string[];
  confidence: number;
}

export interface DimensionValidation {
  id: string;
  description: string;
  impliedDimensions: {
    length?: number;
    width?: number;
    height?: number;
    depth?: number;
  };
  calculatedArea?: number;
  calculatedVolume?: number;
  providedTotal: number;
  providedUnit: string;
  dimensionMatch: boolean;
  tolerance: number;
  deviation: number;
  validationLevel: 'pass' | 'warning' | 'fail';
  recommendations: string[];
}

export interface QuantityAmbiguity {
  id: string;
  type: 'unit_unclear' | 'dimension_mismatch' | 'multiple_interpretations' | 'missing_context' | 'conflicting_values';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedMeasurements: string[];
  possibleInterpretations: {
    interpretation: string;
    value: number;
    unit: string;
    confidence: number;
    reasoning: string;
  }[];
  recommendedAction: string;
  requiresUserConfirmation: boolean;
}

export interface AggregatedItem {
  id: string;
  description: string;
  category: string;
  totalQuantity: number;
  standardUnit: string;
  phase?: string;
  alternate?: string;
  sourceItems: {
    itemId: string;
    quantity: number;
    unit: string;
    confidence: number;
  }[];
  confidence: number;
  notes: string[];
}

export interface QuantityNormalizationResult {
  normalizedQuantities: NormalizedQuantity[];
  dimensionValidations: DimensionValidation[];
  flaggedAmbiguities: QuantityAmbiguity[];
  aggregatedItems: AggregatedItem[];
  qualityMetrics: {
    overallConfidence: number;
    normalizationSuccess: number;
    validationErrors: number;
    ambiguityCount: number;
    completenessScore: number;
  };
  processingNotes: string[];
}

/**
 * Standard unit conversion factors to base units
 */
const UNIT_CONVERSIONS = {
  // Linear measurements (to feet)
  'IN': 1/12,
  'INCHES': 1/12,
  'FT': 1,
  'FEET': 1,
  'LF': 1,
  'YD': 3,
  'YARDS': 3,
  'M': 3.281,
  'METERS': 3.281,
  
  // Area measurements (to square feet)
  'SF': 1,
  'SQ_FT': 1,
  'SQUARE_FEET': 1,
  'SQ_YD': 9,
  'SQUARE_YARDS': 9,
  'SQ_IN': 1/144,
  'SQUARE_INCHES': 1/144,
  'SQ_M': 10.764,
  'SQUARE_METERS': 10.764,
  
  // Volume measurements (to cubic feet)
  'CF': 1,
  'CU_FT': 1,
  'CUBIC_FEET': 1,
  'CY': 27,
  'CU_YD': 27,
  'CUBIC_YARDS': 27,
  'CU_IN': 1/1728,
  'CUBIC_INCHES': 1/1728,
  'CU_M': 35.314,
  'CUBIC_METERS': 35.314,
  
  // Count measurements
  'EA': 1,
  'EACH': 1,
  'PC': 1,
  'PIECES': 1,
  'UNITS': 1,
  'ITEMS': 1,
  
  // Weight measurements (to pounds)
  'LB': 1,
  'LBS': 1,
  'POUNDS': 1,
  'KG': 2.205,
  'KILOGRAMS': 2.205,
  'TON': 2000,
  'TONS': 2000,
};

/**
 * Standard units by measurement type
 */
const STANDARD_UNITS = {
  linear: 'LF',
  square: 'SF', 
  cubic: 'CF',
  count: 'EA',
  weight: 'LB',
};

/**
 * Tolerance levels for dimension validation
 */
const DIMENSION_TOLERANCES = {
  area: 0.05,      // 5% tolerance for area calculations
  volume: 0.10,    // 10% tolerance for volume calculations
  linear: 0.02,    // 2% tolerance for linear measurements
};

export class QuantityNormalizer {
  
  /**
   * Main normalization method
   */
  normalizeQuantities(measurements: VoiceMeasurement[], context?: string): QuantityNormalizationResult {
    console.log(`🔧 Starting quantity normalization for ${measurements.length} measurements`);
    
    const startTime = Date.now();
    const result: QuantityNormalizationResult = {
      normalizedQuantities: [],
      dimensionValidations: [],
      flaggedAmbiguities: [],
      aggregatedItems: [],
      qualityMetrics: {
        overallConfidence: 0,
        normalizationSuccess: 0,
        validationErrors: 0,
        ambiguityCount: 0,
        completenessScore: 0
      },
      processingNotes: []
    };

    try {
      // Step 1: Normalize units to standard measurements
      result.normalizedQuantities = this.convertToStandardUnits(measurements);
      result.processingNotes.push(`✓ Normalized ${result.normalizedQuantities.length} quantities`);

      // Step 2: Validate dimensions and calculate implicit totals
      result.dimensionValidations = this.validateDimensions(result.normalizedQuantities, context);
      result.processingNotes.push(`✓ Validated ${result.dimensionValidations.length} dimensional calculations`);

      // Step 3: Identify and flag ambiguities
      result.flaggedAmbiguities = this.identifyAmbiguities(result.normalizedQuantities, result.dimensionValidations);
      result.processingNotes.push(`⚠️ Identified ${result.flaggedAmbiguities.length} ambiguities requiring attention`);

      // Step 4: Aggregate like items and split by phase/alternates
      result.aggregatedItems = this.aggregateItems(result.normalizedQuantities, context);
      result.processingNotes.push(`📊 Aggregated into ${result.aggregatedItems.length} unique items`);

      // Step 5: Calculate quality metrics
      result.qualityMetrics = this.calculateQualityMetrics(result);
      result.processingNotes.push(`📈 Overall confidence: ${(result.qualityMetrics.overallConfidence * 100).toFixed(1)}%`);

      const processingTime = Date.now() - startTime;
      result.processingNotes.push(`⏱️ Processing completed in ${processingTime}ms`);

      return result;

    } catch (error) {
      console.error('❌ Quantity normalization failed:', error);
      result.processingNotes.push(`❌ Processing failed: ${error}`);
      return result;
    }
  }

  /**
   * Convert extracted quantities to standard units
   */
  private convertToStandardUnits(measurements: VoiceMeasurement[]): NormalizedQuantity[] {
    const normalized: NormalizedQuantity[] = [];

    measurements.forEach((measurement, index) => {
      const unitKey = measurement.unit.toUpperCase().replace(/[\s\-\.]/g, '_');
      const conversionFactor = UNIT_CONVERSIONS[unitKey] || 1;
      
      // Determine standard unit based on measurement type
      let standardUnit = STANDARD_UNITS[measurement.type] || measurement.unit;
      
      // Special handling for specific units
      if (measurement.unit.includes('CY') || measurement.unit.includes('cubic yard')) {
        standardUnit = 'CY'; // Keep cubic yards as standard for some materials
      }
      
      const normalizedValue = measurement.parsedValue * conversionFactor;
      
      // Validate conversion
      const validationStatus = this.validateConversion(measurement, normalizedValue, conversionFactor);
      const validationNotes: string[] = [];
      
      if (conversionFactor === 1 && unitKey !== measurement.unit.toUpperCase()) {
        validationNotes.push(`Unknown unit '${measurement.unit}' - no conversion applied`);
      }
      
      if (normalizedValue <= 0) {
        validationNotes.push('Invalid normalized value: must be positive');
      }
      
      if (normalizedValue > 100000) {
        validationNotes.push('Unusually large value - please verify');
      }

      normalized.push({
        id: `norm_${index + 1}`,
        originalMeasurement: measurement,
        normalizedValue,
        standardUnit,
        conversionFactor,
        conversionSource: `${measurement.unit} → ${standardUnit} (×${conversionFactor})`,
        validationStatus,
        validationNotes,
        confidence: this.adjustConfidenceForConversion(measurement.confidence, conversionFactor, unitKey)
      });
    });

    return normalized;
  }

  /**
   * Validate totals against implicit dimensions (height × length = area)
   */
  private validateDimensions(normalizedQuantities: NormalizedQuantity[], context?: string): DimensionValidation[] {
    const validations: DimensionValidation[] = [];
    
    // Group measurements by potential dimensional relationships
    const dimensionGroups = this.groupByDimensionalContext(normalizedQuantities);
    
    dimensionGroups.forEach((group, index) => {
      const validation = this.validateDimensionGroup(group, index, context);
      if (validation) {
        validations.push(validation);
      }
    });

    // Look for explicit dimensional measurements (e.g., "20 by 30 feet")
    const explicitDimensions = normalizedQuantities.filter(nq => 
      nq.originalMeasurement.rawText.includes('by') || 
      nq.originalMeasurement.rawText.includes('x') ||
      nq.originalMeasurement.rawText.includes('times')
    );

    explicitDimensions.forEach((dimMeasurement, index) => {
      const validation = this.validateExplicitDimension(dimMeasurement, index);
      if (validation) {
        validations.push(validation);
      }
    });

    return validations;
  }

  /**
   * Identify and flag ambiguities for user confirmation
   */
  private identifyAmbiguities(
    normalizedQuantities: NormalizedQuantity[], 
    dimensionValidations: DimensionValidation[]
  ): QuantityAmbiguity[] {
    const ambiguities: QuantityAmbiguity[] = [];
    let ambiguityId = 1;

    // Check for unit ambiguities
    normalizedQuantities.forEach(nq => {
      if (nq.validationNotes.some(note => note.includes('Unknown unit'))) {
        ambiguities.push({
          id: `ambig_${ambiguityId++}`,
          type: 'unit_unclear',
          severity: 'medium',
          description: `Unclear unit '${nq.originalMeasurement.unit}' in measurement`,
          affectedMeasurements: [nq.id],
          possibleInterpretations: this.generateUnitInterpretations(nq),
          recommendedAction: 'Please clarify the intended unit of measurement',
          requiresUserConfirmation: true
        });
      }
    });

    // Check for dimension mismatches
    dimensionValidations.forEach(dv => {
      if (dv.validationLevel === 'fail') {
        ambiguities.push({
          id: `ambig_${ambiguityId++}`,
          type: 'dimension_mismatch',
          severity: 'high',
          description: `Dimension calculation doesn't match provided total: ${dv.deviation.toFixed(2)}% difference`,
          affectedMeasurements: [dv.id],
          possibleInterpretations: [
            {
              interpretation: 'Use calculated value from dimensions',
              value: dv.calculatedArea || dv.calculatedVolume || 0,
              unit: dv.providedUnit,
              confidence: 0.8,
              reasoning: 'Based on dimensional calculation'
            },
            {
              interpretation: 'Use provided total value',
              value: dv.providedTotal,
              unit: dv.providedUnit,
              confidence: 0.6,
              reasoning: 'As stated in original measurement'
            }
          ],
          recommendedAction: 'Verify which value is correct',
          requiresUserConfirmation: true
        });
      }
    });

    // Check for conflicting measurements
    const conflictGroups = this.findConflictingMeasurements(normalizedQuantities);
    conflictGroups.forEach(group => {
      ambiguities.push({
        id: `ambig_${ambiguityId++}`,
        type: 'conflicting_values',
        severity: 'medium',
        description: `Multiple conflicting measurements for similar items`,
        affectedMeasurements: group.map(nq => nq.id),
        possibleInterpretations: group.map(nq => ({
          interpretation: `Use ${nq.originalMeasurement.rawText}`,
          value: nq.normalizedValue,
          unit: nq.standardUnit,
          confidence: nq.confidence,
          reasoning: `From: "${nq.originalMeasurement.rawText}"`
        })),
        recommendedAction: 'Select the most accurate measurement',
        requiresUserConfirmation: true
      });
    });

    return ambiguities;
  }

  /**
   * Aggregate like items and split by phase/alternate tags
   */
  private aggregateItems(normalizedQuantities: NormalizedQuantity[], context?: string): AggregatedItem[] {
    const itemGroups = new Map<string, NormalizedQuantity[]>();
    
    // Group similar items
    normalizedQuantities.forEach(nq => {
      const category = this.categorizeItem(nq, context);
      const phase = this.extractPhase(nq.originalMeasurement.context || '', context);
      const alternate = this.extractAlternate(nq.originalMeasurement.context || '');
      
      const groupKey = `${category}_${phase || 'default'}_${alternate || 'base'}`;
      
      if (!itemGroups.has(groupKey)) {
        itemGroups.set(groupKey, []);
      }
      itemGroups.get(groupKey)!.push(nq);
    });

    // Create aggregated items
    const aggregated: AggregatedItem[] = [];
    let itemId = 1;

    itemGroups.forEach((items, groupKey) => {
      const [category, phase, alternate] = groupKey.split('_');
      
      // Ensure all items have the same unit type
      const unitTypes = [...new Set(items.map(item => item.originalMeasurement.type))];
      
      if (unitTypes.length > 1) {
        // Split into separate aggregations by unit type
        unitTypes.forEach(unitType => {
          const typeItems = items.filter(item => item.originalMeasurement.type === unitType);
          if (typeItems.length > 0) {
            aggregated.push(this.createAggregatedItem(typeItems, category, phase, alternate, itemId++));
          }
        });
      } else {
        aggregated.push(this.createAggregatedItem(items, category, phase, alternate, itemId++));
      }
    });

    return aggregated.sort((a, b) => a.category.localeCompare(b.category));
  }

  /**
   * Calculate overall quality metrics
   */
  private calculateQualityMetrics(result: QuantityNormalizationResult): QuantityNormalizationResult['qualityMetrics'] {
    const totalQuantities = result.normalizedQuantities.length;
    const successfulNormalizations = result.normalizedQuantities.filter(nq => nq.validationStatus === 'valid').length;
    const validationErrors = result.dimensionValidations.filter(dv => dv.validationLevel === 'fail').length;
    
    const overallConfidence = totalQuantities > 0 
      ? result.normalizedQuantities.reduce((sum, nq) => sum + nq.confidence, 0) / totalQuantities
      : 0;

    const normalizationSuccess = totalQuantities > 0 
      ? successfulNormalizations / totalQuantities
      : 0;

    const completenessScore = result.aggregatedItems.length > 0
      ? result.aggregatedItems.reduce((sum, item) => sum + item.confidence, 0) / result.aggregatedItems.length
      : 0;

    return {
      overallConfidence,
      normalizationSuccess,
      validationErrors,
      ambiguityCount: result.flaggedAmbiguities.length,
      completenessScore
    };
  }

  /**
   * Helper methods
   */

  private validateConversion(measurement: VoiceMeasurement, normalizedValue: number, conversionFactor: number): 'valid' | 'warning' | 'error' {
    if (normalizedValue <= 0) return 'error';
    if (conversionFactor === 1 && measurement.unit.toUpperCase() !== measurement.unit) return 'warning';
    if (normalizedValue > 100000) return 'warning';
    return 'valid';
  }

  private adjustConfidenceForConversion(originalConfidence: number, conversionFactor: number, unitKey: string): number {
    let adjustedConfidence = originalConfidence;
    
    // Reduce confidence for unknown units
    if (!(unitKey in UNIT_CONVERSIONS)) {
      adjustedConfidence *= 0.7;
    }
    
    // Slightly reduce confidence for complex conversions
    if (conversionFactor !== 1 && conversionFactor !== 12 && conversionFactor !== 27) {
      adjustedConfidence *= 0.95;
    }
    
    return Math.max(0.1, Math.min(1, adjustedConfidence));
  }

  private groupByDimensionalContext(normalizedQuantities: NormalizedQuantity[]): NormalizedQuantity[][] {
    // Group measurements that might be related dimensionally
    const groups: NormalizedQuantity[][] = [];
    const processed = new Set<string>();

    normalizedQuantities.forEach(nq => {
      if (processed.has(nq.id)) return;
      
      const relatedItems = normalizedQuantities.filter(other => 
        !processed.has(other.id) &&
        this.areDimensionallyRelated(nq, other)
      );

      if (relatedItems.length > 1) {
        groups.push(relatedItems);
        relatedItems.forEach(item => processed.add(item.id));
      }
    });

    return groups;
  }

  private areDimensionallyRelated(nq1: NormalizedQuantity, nq2: NormalizedQuantity): boolean {
    // Check if measurements might be related (e.g., length/width for area calculation)
    const context1 = nq1.originalMeasurement.context?.toLowerCase() || '';
    const context2 = nq2.originalMeasurement.context?.toLowerCase() || '';
    
    // Same context and different types that could be related
    if (context1 === context2) {
      const type1 = nq1.originalMeasurement.type;
      const type2 = nq2.originalMeasurement.type;
      
      return (type1 === 'linear' && type2 === 'square') ||
             (type1 === 'square' && type2 === 'linear') ||
             (type1 === 'linear' && type2 === 'cubic') ||
             (type1 === 'square' && type2 === 'cubic');
    }
    
    return false;
  }

  private validateDimensionGroup(group: NormalizedQuantity[], index: number, context?: string): DimensionValidation | null {
    if (group.length < 2) return null;

    const linearItems = group.filter(nq => nq.originalMeasurement.type === 'linear');
    const areaItems = group.filter(nq => nq.originalMeasurement.type === 'square');
    const volumeItems = group.filter(nq => nq.originalMeasurement.type === 'cubic');

    // Validate area calculation
    if (linearItems.length >= 2 && areaItems.length >= 1) {
      return this.validateAreaCalculation(linearItems, areaItems[0], index);
    }

    // Validate volume calculation
    if (linearItems.length >= 3 && volumeItems.length >= 1) {
      return this.validateVolumeCalculation(linearItems, volumeItems[0], index);
    }

    if (areaItems.length >= 1 && linearItems.length >= 1 && volumeItems.length >= 1) {
      return this.validateAreaVolumeCalculation(areaItems[0], linearItems[0], volumeItems[0], index);
    }

    return null;
  }

  private validateAreaCalculation(linearItems: NormalizedQuantity[], areaItem: NormalizedQuantity, index: number): DimensionValidation {
    const length = linearItems[0].normalizedValue;
    const width = linearItems[1].normalizedValue;
    const calculatedArea = length * width;
    const providedArea = areaItem.normalizedValue;
    
    const deviation = Math.abs(calculatedArea - providedArea) / providedArea;
    const tolerance = DIMENSION_TOLERANCES.area;
    
    return {
      id: `dim_val_${index}`,
      description: `Area validation: ${length} × ${width} = ${calculatedArea.toFixed(2)} vs provided ${providedArea.toFixed(2)}`,
      impliedDimensions: { length, width },
      calculatedArea,
      providedTotal: providedArea,
      providedUnit: areaItem.standardUnit,
      dimensionMatch: deviation <= tolerance,
      tolerance,
      deviation,
      validationLevel: deviation <= tolerance ? 'pass' : deviation <= tolerance * 2 ? 'warning' : 'fail',
      recommendations: deviation > tolerance 
        ? [`Verify dimensions: calculated area (${calculatedArea.toFixed(2)}) differs from provided (${providedArea.toFixed(2)}) by ${(deviation * 100).toFixed(1)}%`]
        : []
    };
  }

  private validateVolumeCalculation(linearItems: NormalizedQuantity[], volumeItem: NormalizedQuantity, index: number): DimensionValidation {
    const length = linearItems[0].normalizedValue;
    const width = linearItems[1].normalizedValue;
    const height = linearItems[2].normalizedValue;
    const calculatedVolume = length * width * height;
    const providedVolume = volumeItem.normalizedValue;
    
    const deviation = Math.abs(calculatedVolume - providedVolume) / providedVolume;
    const tolerance = DIMENSION_TOLERANCES.volume;
    
    return {
      id: `dim_val_${index}`,
      description: `Volume validation: ${length} × ${width} × ${height} = ${calculatedVolume.toFixed(2)} vs provided ${providedVolume.toFixed(2)}`,
      impliedDimensions: { length, width, height },
      calculatedVolume,
      providedTotal: providedVolume,
      providedUnit: volumeItem.standardUnit,
      dimensionMatch: deviation <= tolerance,
      tolerance,
      deviation,
      validationLevel: deviation <= tolerance ? 'pass' : deviation <= tolerance * 2 ? 'warning' : 'fail',
      recommendations: deviation > tolerance 
        ? [`Verify dimensions: calculated volume (${calculatedVolume.toFixed(2)}) differs from provided (${providedVolume.toFixed(2)}) by ${(deviation * 100).toFixed(1)}%`]
        : []
    };
  }

  private validateAreaVolumeCalculation(areaItem: NormalizedQuantity, heightItem: NormalizedQuantity, volumeItem: NormalizedQuantity, index: number): DimensionValidation {
    const area = areaItem.normalizedValue;
    const height = heightItem.normalizedValue;
    const calculatedVolume = area * height;
    const providedVolume = volumeItem.normalizedValue;
    
    const deviation = Math.abs(calculatedVolume - providedVolume) / providedVolume;
    const tolerance = DIMENSION_TOLERANCES.volume;
    
    return {
      id: `dim_val_${index}`,
      description: `Volume validation: ${area} SF × ${height} = ${calculatedVolume.toFixed(2)} vs provided ${providedVolume.toFixed(2)}`,
      impliedDimensions: { height },
      calculatedVolume,
      providedTotal: providedVolume,
      providedUnit: volumeItem.standardUnit,
      dimensionMatch: deviation <= tolerance,
      tolerance,
      deviation,
      validationLevel: deviation <= tolerance ? 'pass' : deviation <= tolerance * 2 ? 'warning' : 'fail',
      recommendations: deviation > tolerance 
        ? [`Verify calculation: area × height (${calculatedVolume.toFixed(2)}) differs from provided volume (${providedVolume.toFixed(2)}) by ${(deviation * 100).toFixed(1)}%`]
        : []
    };
  }

  private validateExplicitDimension(dimMeasurement: NormalizedQuantity, index: number): DimensionValidation | null {
    const rawText = dimMeasurement.originalMeasurement.rawText.toLowerCase();
    
    // Extract dimensions from text like "20 by 30 feet"
    const dimensionMatch = rawText.match(/([\d.]+)\s*(?:by|x|times)\s*([\d.]+)/);
    if (!dimensionMatch) return null;
    
    const length = parseFloat(dimensionMatch[1]);
    const width = parseFloat(dimensionMatch[2]);
    
    if (dimMeasurement.originalMeasurement.type === 'square') {
      const calculatedArea = length * width;
      const providedArea = dimMeasurement.normalizedValue;
      const deviation = Math.abs(calculatedArea - providedArea) / providedArea;
      
      return {
        id: `explicit_dim_${index}`,
        description: `Explicit dimension check: "${rawText}"`,
        impliedDimensions: { length, width },
        calculatedArea,
        providedTotal: providedArea,
        providedUnit: dimMeasurement.standardUnit,
        dimensionMatch: deviation <= 0.01, // Very tight tolerance for explicit dimensions
        tolerance: 0.01,
        deviation,
        validationLevel: deviation <= 0.01 ? 'pass' : 'warning',
        recommendations: deviation > 0.01 
          ? [`Explicit dimension mismatch in "${rawText}"`]
          : []
      };
    }
    
    return null;
  }

  private generateUnitInterpretations(nq: NormalizedQuantity): QuantityAmbiguity['possibleInterpretations'] {
    const interpretations: QuantityAmbiguity['possibleInterpretations'] = [];
    const originalUnit = nq.originalMeasurement.unit.toLowerCase();
    
    // Generate possible interpretations based on context
    const context = nq.originalMeasurement.context?.toLowerCase() || '';
    
    if (context.includes('wall') || context.includes('length')) {
      interpretations.push({
        interpretation: 'Linear feet (LF)',
        value: nq.originalMeasurement.parsedValue,
        unit: 'LF',
        confidence: 0.8,
        reasoning: 'Context suggests linear measurement'
      });
    }
    
    if (context.includes('floor') || context.includes('area')) {
      interpretations.push({
        interpretation: 'Square feet (SF)',
        value: nq.originalMeasurement.parsedValue,
        unit: 'SF',
        confidence: 0.8,
        reasoning: 'Context suggests area measurement'
      });
    }
    
    if (originalUnit.includes('f')) {
      interpretations.push({
        interpretation: 'Feet (LF)',
        value: nq.originalMeasurement.parsedValue,
        unit: 'LF',
        confidence: 0.7,
        reasoning: 'Unit abbreviation suggests feet'
      });
    }
    
    return interpretations;
  }

  private findConflictingMeasurements(normalizedQuantities: NormalizedQuantity[]): NormalizedQuantity[][] {
    const conflicts: NormalizedQuantity[][] = [];
    const processed = new Set<string>();
    
    normalizedQuantities.forEach(nq => {
      if (processed.has(nq.id)) return;
      
      const similar = normalizedQuantities.filter(other => 
        other.id !== nq.id &&
        !processed.has(other.id) &&
        this.areSimilarMeasurements(nq, other)
      );
      
      if (similar.length > 0) {
        const conflictGroup = [nq, ...similar];
        conflicts.push(conflictGroup);
        conflictGroup.forEach(item => processed.add(item.id));
      }
    });
    
    return conflicts;
  }

  private areSimilarMeasurements(nq1: NormalizedQuantity, nq2: NormalizedQuantity): boolean {
    // Check if measurements are for similar items but have different values
    const context1 = nq1.originalMeasurement.context?.toLowerCase() || '';
    const context2 = nq2.originalMeasurement.context?.toLowerCase() || '';
    
    const sameType = nq1.originalMeasurement.type === nq2.originalMeasurement.type;
    const similarContext = context1 === context2 || 
                          context1.includes(context2) || 
                          context2.includes(context1);
    
    const differentValues = Math.abs(nq1.normalizedValue - nq2.normalizedValue) / Math.max(nq1.normalizedValue, nq2.normalizedValue) > 0.1;
    
    return sameType && similarContext && differentValues;
  }

  private categorizeItem(nq: NormalizedQuantity, context?: string): string {
    const rawText = nq.originalMeasurement.rawText.toLowerCase();
    const contextText = (nq.originalMeasurement.context || '').toLowerCase();
    const globalContext = (context || '').toLowerCase();
    
    const allText = `${rawText} ${contextText} ${globalContext}`;
    
    // Categorize based on keywords
    if (allText.includes('wall') || allText.includes('stud') || allText.includes('drywall')) {
      return 'Walls';
    }
    if (allText.includes('floor') || allText.includes('flooring') || allText.includes('carpet')) {
      return 'Flooring';
    }
    if (allText.includes('ceiling') || allText.includes('roof')) {
      return 'Ceiling/Roof';
    }
    if (allText.includes('door') || allText.includes('window')) {
      return 'Openings';
    }
    if (allText.includes('electrical') || allText.includes('outlet') || allText.includes('switch')) {
      return 'Electrical';
    }
    if (allText.includes('plumbing') || allText.includes('fixture') || allText.includes('pipe')) {
      return 'Plumbing';
    }
    if (allText.includes('concrete') || allText.includes('foundation')) {
      return 'Concrete';
    }
    if (allText.includes('paint') || allText.includes('painting')) {
      return 'Painting';
    }
    
    // Default categorization by measurement type
    switch (nq.originalMeasurement.type) {
      case 'linear': return 'Linear Items';
      case 'square': return 'Area Items';
      case 'cubic': return 'Volume Items';
      case 'count': return 'Count Items';
      default: return 'General Items';
    }
  }

  private extractPhase(context: string, globalContext?: string): string | undefined {
    const allText = `${context} ${globalContext || ''}`.toLowerCase();
    
    // Look for phase indicators
    const phases = [
      'demolition', 'demo', 'tear down',
      'foundation', 'concrete', 'footing',
      'framing', 'frame', 'stud',
      'rough', 'rough-in',
      'finish', 'finishing', 'trim',
      'electrical', 'plumbing', 'hvac',
      'drywall', 'paint', 'flooring'
    ];
    
    for (const phase of phases) {
      if (allText.includes(phase)) {
        return phase.charAt(0).toUpperCase() + phase.slice(1);
      }
    }
    
    return undefined;
  }

  private extractAlternate(context: string): string | undefined {
    const contextLower = context.toLowerCase();
    
    // Look for alternate indicators
    if (contextLower.includes('alternate') || contextLower.includes('alt')) {
      const altMatch = contextLower.match(/alt(?:ernate)?\s*(\d+|[a-z])/);
      if (altMatch) {
        return `Alt ${altMatch[1].toUpperCase()}`;
      }
      return 'Alternate';
    }
    
    if (contextLower.includes('option')) {
      const optMatch = contextLower.match(/option\s*(\d+|[a-z])/);
      if (optMatch) {
        return `Option ${optMatch[1].toUpperCase()}`;
      }
      return 'Option';
    }
    
    return undefined;
  }

  private createAggregatedItem(
    items: NormalizedQuantity[], 
    category: string, 
    phase: string | undefined, 
    alternate: string | undefined, 
    itemId: number
  ): AggregatedItem {
    const totalQuantity = items.reduce((sum, item) => sum + item.normalizedValue, 0);
    const standardUnit = items[0].standardUnit;
    const avgConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    
    // Generate description
    const descriptions = [...new Set(items.map(item => item.originalMeasurement.rawText))];
    const description = descriptions.length === 1 
      ? descriptions[0]
      : `${category} (${descriptions.length} measurements)`;
    
    return {
      id: `agg_${itemId}`,
      description,
      category,
      totalQuantity,
      standardUnit,
      phase: phase !== 'default' ? phase : undefined,
      alternate: alternate !== 'base' ? alternate : undefined,
      sourceItems: items.map(item => ({
        itemId: item.id,
        quantity: item.normalizedValue,
        unit: item.standardUnit,
        confidence: item.confidence
      })),
      confidence: avgConfidence,
      notes: [
        `Aggregated from ${items.length} source measurement${items.length > 1 ? 's' : ''}`,
        ...items.flatMap(item => item.validationNotes.filter(note => note.includes('verify')))
      ]
    };
  }
}

// Export default instance
export const quantityNormalizer = new QuantityNormalizer();
