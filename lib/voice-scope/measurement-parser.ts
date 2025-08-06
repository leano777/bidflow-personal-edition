// Measurement Extraction and Parsing - BF-003 Implementation
import {
  VoiceMeasurement,
  MEASUREMENT_UNITS
} from './types';

export class MeasurementParser {
  private numberWords: Record<string, number> = {
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
    'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
    'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
    'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000,
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'half': 0.5, 'quarter': 0.25, 'third': 0.33
  };

  /**
   * Extract all measurements from transcribed text
   */
  extractMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    // Clean text for better parsing
    const cleanText = this.preprocessText(text);
    
    // Extract different types of measurements
    measurements.push(...this.extractDimensionalMeasurements(cleanText));
    measurements.push(...this.extractLinearMeasurements(cleanText));
    measurements.push(...this.extractAreaMeasurements(cleanText));
    measurements.push(...this.extractVolumeMeasurements(cleanText));
    measurements.push(...this.extractCountMeasurements(cleanText));
    measurements.push(...this.extractFractionalMeasurements(cleanText));
    
    // Remove duplicates and sort by confidence
    return this.deduplicateAndRank(measurements);
  }

  /**
   * Preprocess text to improve measurement extraction
   */
  private preprocessText(text: string): string {
    let processed = text.toLowerCase();
    
    // Normalize common measurement expressions
    const replacements = [
      [/\bf(?:ee|i)t\b/gi, 'feet'],
      [/\binch(?:es)?\b/gi, 'inches'], 
      [/\byd\.?\b/gi, 'yard'],
      [/\bsq\.?\s*f(?:ee)?t\.?\b/gi, 'square feet'],
      [/\bcu\.?\s*f(?:ee)?t\.?\b/gi, 'cubic feet'],
      [/\bsf\b/gi, 'square feet'],
      [/\bcf\b/gi, 'cubic feet'],
      [/\blf\b/gi, 'linear feet'],
      [/\bea\.?\b/gi, 'each'],
      [/\s+x\s+/gi, ' by '],
      [/\s*×\s*/gi, ' by '],
      [/\b(\d+)\s*'\s*(\d+)\s*"\s*/gi, '$1 feet $2 inches'],
      [/\b(\d+)\s*'\s*/gi, '$1 feet'],
      [/\b(\d+)\s*"\s*/gi, '$1 inches']
    ];
    
    replacements.forEach(([pattern, replacement]) => {
      processed = processed.replace(pattern as RegExp, replacement as string);
    });
    
    return processed;
  }

  /**
   * Extract dimensional measurements (e.g., "20 by 30 feet", "8x10 room")
   */
  private extractDimensionalMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    const patterns = [
      // "twenty by thirty feet", "20 by 30 feet"
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:by|x|times)\s*((?:\d+(?:\.\d+)?)|(?:\w+))\s*(feet|foot|inches?|yards?)/gi,
      // "8 foot by 10 foot", "8 feet by 10 feet"  
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(feet?|foot|inches?|yards?)\s*(?:by|x|times)\s*((?:\d+(?:\.\d+)?)|(?:\w+))\s*(feet?|foot|inches?|yards?)/gi,
      // "20x30", "8 x 10"
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*[x×]\s*((?:\d+(?:\.\d+)?)|(?:\w+))/gi
    ];

    let id = 1;
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, dim1, dim2OrUnit, dim3OrUnit2, unit2] = match;
        
        let width: number, length: number, unit: string, measurementType: VoiceMeasurement['type'];
        
        if (unit2) {
          // Pattern: "8 feet by 10 feet"
          width = this.parseNumber(dim1);
          length = this.parseNumber(dim3OrUnit2);
          unit = this.normalizeUnit(dim2OrUnit);
        } else if (dim3OrUnit2) {
          // Pattern: "20 by 30 feet"
          width = this.parseNumber(dim1);
          length = this.parseNumber(dim2OrUnit);
          unit = this.normalizeUnit(dim3OrUnit2);
        } else {
          // Pattern: "20x30" (assume feet and square)
          width = this.parseNumber(dim1);
          length = this.parseNumber(dim2OrUnit);
          unit = 'SF';
        }
        
        if (width > 0 && length > 0) {
          const area = width * length;
          measurementType = unit.includes('SF') || unit.includes('square') ? 'square' : 'square';
          
          measurements.push({
            id: `dimension_${id++}`,
            rawText: fullMatch,
            parsedValue: area,
            unit: unit.includes('SF') ? 'SF' : this.normalizeUnit(unit),
            type: measurementType,
            confidence: this.calculateConfidence(fullMatch, area),
            context: this.extractContext(text, match.index || 0, 30)
          });
        }
      });
    });

    return measurements;
  }

  /**
   * Extract linear measurements (e.g., "150 linear feet", "20 feet long")
   */
  private extractLinearMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    const patterns = [
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:linear\s*feet?|running\s*feet?|feet?|foot|inches?|yards?)\s*(?:long|wide|tall|high|of)/gi,
      /(?:long|wide|tall|high|of)\s*((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:linear\s*feet?|running\s*feet?|feet?|foot|inches?|yards?)/gi,
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(linear\s*feet?|running\s*feet?|lf)/gi
    ];

    let id = 1;
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, numberPart, unitPart] = match;
        
        const value = this.parseNumber(numberPart);
        const unit = this.normalizeUnit(unitPart || 'feet');
        
        if (value > 0) {
          measurements.push({
            id: `linear_${id++}`,
            rawText: fullMatch,
            parsedValue: value,
            unit: unit === 'feet' ? 'LF' : unit,
            type: 'linear',
            confidence: this.calculateConfidence(fullMatch, value),
            context: this.extractContext(text, match.index || 0, 30)
          });
        }
      });
    });

    return measurements;
  }

  /**
   * Extract area measurements (e.g., "250 square feet", "150 sq ft")
   */
  private extractAreaMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    const patterns = [
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:square\s*feet?|sq\s*ft?|sf|ft²)/gi,
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:square\s*yards?|sq\s*yd|yd²)/gi,
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:square\s*inches?|sq\s*in|in²)/gi
    ];

    let id = 1;
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, numberPart, unitPart] = match;
        
        const value = this.parseNumber(numberPart);
        const unit = this.normalizeUnit(unitPart);
        
        if (value > 0) {
          measurements.push({
            id: `area_${id++}`,
            rawText: fullMatch,
            parsedValue: value,
            unit: unit.includes('square') ? 'SF' : unit,
            type: 'square',
            confidence: this.calculateConfidence(fullMatch, value),
            context: this.extractContext(text, match.index || 0, 30)
          });
        }
      });
    });

    return measurements;
  }

  /**
   * Extract volume measurements (e.g., "10 cubic yards", "50 cu ft")
   */
  private extractVolumeMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    const patterns = [
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:cubic\s*feet?|cu\s*ft?|cf|ft³)/gi,
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:cubic\s*yards?|cu\s*yd|cy|yd³)/gi,
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:cubic\s*inches?|cu\s*in|in³)/gi
    ];

    let id = 1;
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, numberPart, unitPart] = match;
        
        const value = this.parseNumber(numberPart);
        const unit = this.normalizeUnit(unitPart);
        
        if (value > 0) {
          measurements.push({
            id: `volume_${id++}`,
            rawText: fullMatch,
            parsedValue: value,
            unit: unit.includes('cubic') && unit.includes('yard') ? 'CY' : 'CF',
            type: 'cubic',
            confidence: this.calculateConfidence(fullMatch, value),
            context: this.extractContext(text, match.index || 0, 30)
          });
        }
      });
    });

    return measurements;
  }

  /**
   * Extract count measurements (e.g., "3 outlets", "five pieces", "dozen items")
   */
  private extractCountMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    const patterns = [
      /((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:pieces?|items?|units?|each|outlets?|switches?|fixtures?|doors?|windows?)/gi,
      /(?:install|replace|add)\s*((?:\d+(?:\.\d+)?)|(?:\w+))\s*(?:pieces?|items?|units?|each|outlets?|switches?|fixtures?|doors?|windows?)/gi,
      /(dozen|half\s*dozen)\s*(?:pieces?|items?|units?)/gi
    ];

    let id = 1;
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, numberPart, unitPart] = match;
        
        let value: number;
        
        if (numberPart === 'dozen') {
          value = 12;
        } else if (numberPart === 'half dozen') {
          value = 6;
        } else {
          value = this.parseNumber(numberPart);
        }
        
        if (value > 0) {
          measurements.push({
            id: `count_${id++}`,
            rawText: fullMatch,
            parsedValue: value,
            unit: 'EA',
            type: 'count',
            confidence: this.calculateConfidence(fullMatch, value),
            context: this.extractContext(text, match.index || 0, 30)
          });
        }
      });
    });

    return measurements;
  }

  /**
   * Extract fractional measurements (e.g., "3/4 inch", "1/2 inch plywood")
   */
  private extractFractionalMeasurements(text: string): VoiceMeasurement[] {
    const measurements: VoiceMeasurement[] = [];
    
    const patterns = [
      /(\d+\/\d+)\s*(inch(?:es)?|feet?|foot)/gi,
      /(half|quarter|three\s*quarter|one\s*third|two\s*third)\s*(inch(?:es)?|feet?|foot)/gi
    ];

    let id = 1;
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        const [fullMatch, fractionPart, unitPart] = match;
        
        let value: number;
        
        if (fractionPart.includes('/')) {
          const [numerator, denominator] = fractionPart.split('/');
          value = parseInt(numerator) / parseInt(denominator);
        } else {
          const fractionWords: Record<string, number> = {
            'half': 0.5,
            'quarter': 0.25,
            'three quarter': 0.75,
            'one third': 0.33,
            'two third': 0.67
          };
          value = fractionWords[fractionPart.replace(/\s+/g, ' ')] || 0;
        }
        
        if (value > 0) {
          measurements.push({
            id: `fraction_${id++}`,
            rawText: fullMatch,
            parsedValue: value,
            unit: unitPart.includes('inch') ? 'IN' : 'LF',
            type: 'linear',
            confidence: this.calculateConfidence(fullMatch, value),
            context: this.extractContext(text, match.index || 0, 30)
          });
        }
      });
    });

    return measurements;
  }

  /**
   * Parse number from text (handles both digits and words)
   */
  private parseNumber(text: string): number {
    if (!text) return 0;
    
    const cleanText = text.toLowerCase().trim();
    
    // Check if it's already a number
    const directNumber = parseFloat(cleanText);
    if (!isNaN(directNumber)) {
      return directNumber;
    }

    // Handle word numbers
    if (this.numberWords[cleanText]) {
      return this.numberWords[cleanText];
    }

    // Handle compound numbers like "twenty-five", "thirty two"
    const parts = cleanText.split(/[-\s]+/);
    let total = 0;
    let currentHundred = 0;
    
    for (const part of parts) {
      if (this.numberWords[part]) {
        const value = this.numberWords[part];
        
        if (value === 100) {
          currentHundred *= 100;
        } else if (value === 1000) {
          total += currentHundred * 1000;
          currentHundred = 0;
        } else if (value >= 20) {
          currentHundred += value;
        } else {
          currentHundred += value;
        }
      }
    }
    
    total += currentHundred;
    return total > 0 ? total : 0;
  }

  /**
   * Normalize measurement units to standard abbreviations
   */
  private normalizeUnit(unit: string): string {
    if (!unit) return 'EA';
    
    const unitLower = unit.toLowerCase().replace(/s$/, '').trim();
    
    const unitMappings: Record<string, string> = {
      'foot': 'LF',
      'feet': 'LF', 
      'ft': 'LF',
      'linear feet': 'LF',
      'linear foot': 'LF',
      'running feet': 'LF',
      'running foot': 'LF',
      'lf': 'LF',
      'square feet': 'SF',
      'square foot': 'SF',
      'sq ft': 'SF',
      'sqft': 'SF',
      'sf': 'SF',
      'ft²': 'SF',
      'cubic feet': 'CF',
      'cubic foot': 'CF',
      'cu ft': 'CF',
      'cuft': 'CF',
      'cf': 'CF',
      'ft³': 'CF',
      'cubic yard': 'CY',
      'cubic yards': 'CY',
      'cu yd': 'CY',
      'cy': 'CY',
      'yd³': 'CY',
      'inch': 'IN',
      'inches': 'IN',
      'in': 'IN',
      '"': 'IN',
      'yard': 'YD',
      'yards': 'YD',
      'yd': 'YD',
      'each': 'EA',
      'piece': 'EA',
      'pieces': 'EA',
      'unit': 'EA',
      'units': 'EA',
      'item': 'EA',
      'items': 'EA',
      'outlet': 'EA',
      'outlets': 'EA',
      'switch': 'EA',
      'switches': 'EA',
      'fixture': 'EA',
      'fixtures': 'EA'
    };

    return unitMappings[unitLower] || unit.toUpperCase();
  }

  /**
   * Calculate confidence score for a measurement
   */
  private calculateConfidence(rawText: string, value: number): number {
    let confidence = 0.7; // Base confidence
    
    // Higher confidence for numeric values vs word numbers
    if (/\d/.test(rawText)) {
      confidence += 0.15;
    }
    
    // Higher confidence for explicit units
    if (/\b(?:feet?|foot|inches?|yards?|sq|cubic)\b/i.test(rawText)) {
      confidence += 0.1;
    }
    
    // Lower confidence for very small or very large values
    if (value < 0.1 || value > 10000) {
      confidence -= 0.2;
    }
    
    // Higher confidence for reasonable construction values
    if ((value >= 1 && value <= 1000) || (value >= 0.25 && value <= 2)) {
      confidence += 0.05;
    }
    
    return Math.min(Math.max(confidence, 0), 1);
  }

  /**
   * Extract context around measurement for better understanding
   */
  private extractContext(text: string, position: number, radius: number): string {
    const start = Math.max(0, position - radius);
    const end = Math.min(text.length, position + radius);
    return text.substring(start, end).trim();
  }

  /**
   * Remove duplicate measurements and rank by confidence
   */
  private deduplicateAndRank(measurements: VoiceMeasurement[]): VoiceMeasurement[] {
    // Group similar measurements
    const groups = new Map<string, VoiceMeasurement[]>();
    
    measurements.forEach(measurement => {
      const key = `${measurement.type}-${measurement.unit}-${measurement.parsedValue}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(measurement);
    });

    // Keep the highest confidence measurement from each group
    const deduped: VoiceMeasurement[] = [];
    
    groups.forEach(group => {
      group.sort((a, b) => b.confidence - a.confidence);
      deduped.push(group[0]);
    });

    // Sort by confidence descending
    return deduped.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Validate and correct measurements
   */
  correctMeasurements(measurements: VoiceMeasurement[], context: string): VoiceMeasurement[] {
    return measurements.map(measurement => {
      // Convert units based on context
      if (context.includes('room') || context.includes('floor')) {
        if (measurement.unit === 'LF' && measurement.parsedValue > 50) {
          // Likely square feet for rooms
          return {
            ...measurement,
            unit: 'SF',
            type: 'square',
            confidence: measurement.confidence * 0.9
          };
        }
      }

      // Reasonable value checks
      if (measurement.type === 'square' && measurement.parsedValue > 5000) {
        // Very large area, might be linear feet
        return {
          ...measurement,
          unit: 'LF',
          type: 'linear',
          confidence: measurement.confidence * 0.8
        };
      }

      return measurement;
    });
  }
}
