// AI-Powered Scope Organization System - BF-003 Implementation
import {
  ScopeCapture,
  OrganizedScope,
  WorkCategory,
  ScopeItem,
  MaterialSpec,
  LaborRequirement,
  VoiceMeasurement,
  ScopeAnalysisPrompt,
  ScopeAnalysisResult,
  CONSTRUCTION_TRADES,
  SKILL_LEVELS
} from './types';

export class ScopeOrganizer {
  private tradeSequence: Record<string, number> = {
    'Demolition': 1,
    'Excavation': 2,
    'Concrete': 3,
    'Framing': 4,
    'Roofing': 5,
    'Electrical': 6,
    'Plumbing': 7,
    'HVAC': 8,
    'Insulation': 9,
    'Drywall': 10,
    'Flooring': 11,
    'Painting': 12,
    'Trim & Millwork': 13,
    'Cabinets': 14,
    'Countertops': 15,
    'Appliances': 16,
    'Fixtures': 17,
    'Landscaping': 18,
    'Cleanup': 19
  };

  /**
   * Organize transcribed scope into structured work categories
   */
  async organizeScope(
    transcription: string, 
    measurements: VoiceMeasurement[],
    contextPhotos?: string[]
  ): Promise<ScopeAnalysisResult> {
    const startTime = Date.now();
    
    try {
      const prompt: ScopeAnalysisPrompt = {
        transcription,
        measurements,
        photos: contextPhotos
      };

      // Analyze the transcription and extract structured data
      const organized = await this.analyzeTranscription(prompt);
      
      // Generate suggestions and warnings
      const suggestions = this.generateSuggestions(organized);
      const warnings = this.validateScope(organized);
      
      // Calculate confidence based on various factors
      const confidence = this.calculateConfidence(organized, measurements);
      
      const processingTime = Date.now() - startTime;
      
      return {
        organized,
        suggestions,
        warnings,
        confidence,
        processingTime
      };
      
    } catch (error) {
      throw new Error(`Scope organization failed: ${error}`);
    }
  }

  /**
   * Analyze transcription and create organized scope structure
   */
  private async analyzeTranscription(prompt: ScopeAnalysisPrompt): Promise<OrganizedScope> {
    const text = prompt.transcription.toLowerCase();
    
    // Extract project summary
    const projectSummary = this.extractProjectSummary(text);
    
    // Categorize work items
    const workCategories = this.categorizeWork(text, prompt.measurements);
    
    // Extract material specifications
    const materialSpecs = this.extractMaterials(text);
    
    // Determine labor requirements
    const laborRequirements = this.analyzeLaborRequirements(workCategories);
    
    // Identify special considerations
    const specialConsiderations = this.identifySpecialConsiderations(text);
    
    // Estimate timeline
    const estimatedTimeline = this.estimateTimeline(workCategories);
    
    return {
      id: `scope_${Date.now()}`,
      projectSummary,
      workCategories,
      materialSpecs,
      laborRequirements,
      specialConsiderations,
      estimatedTimeline,
      confidence: 0.85, // Will be recalculated
      sourceCapture: prompt.transcription,
      createdAt: new Date()
    };
  }

  /**
   * Extract high-level project summary from transcription
   */
  private extractProjectSummary(text: string): string {
    // Look for project type indicators
    const projectTypes = {
      'kitchen': 'Kitchen Renovation',
      'bathroom': 'Bathroom Remodel', 
      'flooring': 'Flooring Installation',
      'roofing': 'Roofing Project',
      'addition': 'Home Addition',
      'renovation': 'General Renovation',
      'remodel': 'Remodeling Project',
      'deck': 'Deck Construction',
      'fence': 'Fencing Installation',
      'painting': 'Painting Project'
    };

    for (const [keyword, description] of Object.entries(projectTypes)) {
      if (text.includes(keyword)) {
        return description;
      }
    }

    // Fallback to general construction
    return 'General Construction Project';
  }

  /**
   * Categorize work items into trade categories
   */
  private categorizeWork(text: string, measurements: VoiceMeasurement[]): WorkCategory[] {
    const categories: WorkCategory[] = [];
    const foundTrades = new Set<string>();

    // Analyze text for trade-related keywords
    const tradeKeywords = {
      'Demolition': ['demo', 'demolish', 'remove', 'tear out', 'strip'],
      'Excavation': ['dig', 'excavate', 'grade', 'foundation', 'footings'],
      'Concrete': ['concrete', 'slab', 'foundation', 'pour', 'cement'],
      'Framing': ['frame', 'stud', 'joist', 'rafter', '2x4', '2x6', '2x8'],
      'Roofing': ['roof', 'shingle', 'tile', 'metal roof', 'gutters'],
      'Electrical': ['electric', 'outlet', 'switch', 'panel', 'wire', 'circuit'],
      'Plumbing': ['plumb', 'pipe', 'fixture', 'toilet', 'sink', 'shower', 'faucet'],
      'HVAC': ['hvac', 'heating', 'cooling', 'air condition', 'duct', 'furnace'],
      'Insulation': ['insulation', 'insulate', 'foam', 'fiberglass'],
      'Drywall': ['drywall', 'sheetrock', 'mud', 'tape', 'texture'],
      'Flooring': ['flooring', 'floor', 'hardwood', 'tile', 'carpet', 'laminate'],
      'Painting': ['paint', 'primer', 'stain', 'finish'],
      'Trim & Millwork': ['trim', 'molding', 'baseboard', 'crown', 'casing'],
      'Cabinets': ['cabinet', 'cupboard', 'vanity'],
      'Countertops': ['countertop', 'counter', 'granite', 'quartz', 'marble'],
      'Fixtures': ['fixture', 'light', 'fan', 'hardware'],
      'Cleanup': ['cleanup', 'clean', 'debris', 'haul', 'dispose']
    };

    // Find matching trades
    for (const [trade, keywords] of Object.entries(tradeKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          foundTrades.add(trade);
          break;
        }
      }
    }

    // Create work categories for found trades
    Array.from(foundTrades).forEach(trade => {
      const items = this.extractScopeItems(text, trade, measurements);
      
      if (items.length > 0) {
        categories.push({
          id: `category_${trade.toLowerCase().replace(/\s+/g, '_')}`,
          category: trade,
          trade,
          items,
          sequenceOrder: this.tradeSequence[trade] || 99,
          prerequisites: this.getTradePrerequisites(trade),
          estimatedDuration: this.estimateTradeDuration(items),
          riskLevel: this.assessTradeRisk(trade, items)
        });
      }
    });

    // Sort by sequence order
    return categories.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  }

  /**
   * Extract scope items for a specific trade
   */
  private extractScopeItems(text: string, trade: string, measurements: VoiceMeasurement[]): ScopeItem[] {
    const items: ScopeItem[] = [];
    
    // Trade-specific item extraction
    const tradePatterns = {
      'Flooring': [
        /install.*(?:hardwood|laminate|tile|carpet|vinyl).*flooring/gi,
        /(?:hardwood|laminate|tile|carpet|vinyl).*flooring.*install/gi
      ],
      'Electrical': [
        /install.*(?:\d+\s*)?(?:outlet|switch|light|fixture)/gi,
        /(?:outlet|switch|light|fixture).*install/gi
      ],
      'Plumbing': [
        /(?:replace|install).*(?:toilet|sink|faucet|shower|fixture)/gi,
        /(?:toilet|sink|faucet|shower|fixture).*(?:replace|install)/gi
      ],
      'Drywall': [
        /drywall.*(?:install|hang|finish)/gi,
        /(?:install|hang|finish).*drywall/gi
      ],
      'Painting': [
        /paint.*(?:wall|ceiling|room|exterior|interior)/gi,
        /(?:wall|ceiling|room|exterior|interior).*paint/gi
      ]
    };

    const patterns = tradePatterns[trade] || [];
    
    patterns.forEach(pattern => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach((match, index) => {
        // Try to find associated measurements
        const associatedMeasurements = this.findNearbyMeasurements(text, match.index || 0, measurements);
        
        items.push({
          id: `item_${trade}_${index}`,
          description: match[0].trim(),
          quantity: associatedMeasurements.length > 0 ? associatedMeasurements[0].parsedValue : undefined,
          unit: associatedMeasurements.length > 0 ? associatedMeasurements[0].unit : undefined,
          priority: 'required',
          notes: associatedMeasurements.length > 0 ? `From voice: "${associatedMeasurements[0].rawText}"` : undefined
        });
      });
    });

    // If no specific items found, create a general item for the trade
    if (items.length === 0 && measurements.length > 0) {
      items.push({
        id: `item_${trade}_general`,
        description: `${trade} work as described`,
        priority: 'required',
        notes: 'General scope item - requires detailed specification'
      });
    }

    return items;
  }

  /**
   * Find measurements near a text position
   */
  private findNearbyMeasurements(text: string, position: number, measurements: VoiceMeasurement[]): VoiceMeasurement[] {
    const nearby: VoiceMeasurement[] = [];
    const searchRadius = 100; // characters

    measurements.forEach(measurement => {
      const measurementPosition = text.indexOf(measurement.rawText);
      if (measurementPosition !== -1 && Math.abs(measurementPosition - position) <= searchRadius) {
        nearby.push(measurement);
      }
    });

    return nearby;
  }

  /**
   * Extract material specifications from text
   */
  private extractMaterials(text: string): MaterialSpec[] {
    const materials: MaterialSpec[] = [];
    
    const materialPatterns = [
      { pattern: /(?:2x4|2x6|2x8|2x10|2x12)\s*(?:studs?|lumber)/gi, category: 'Lumber' },
      { pattern: /(?:hardwood|oak|maple|cherry)\s*flooring/gi, category: 'Flooring' },
      { pattern: /(?:ceramic|porcelain|marble|granite)\s*tile/gi, category: 'Tile' },
      { pattern: /(?:fiberglass|cellulose|foam)\s*insulation/gi, category: 'Insulation' },
      { pattern: /(?:latex|oil|primer)\s*paint/gi, category: 'Paint' },
      { pattern: /drywall|sheetrock/gi, category: 'Drywall' }
    ];

    let id = 1;
    materialPatterns.forEach(({ pattern, category }) => {
      const matches = Array.from(text.matchAll(pattern));
      matches.forEach(match => {
        materials.push({
          id: `material_${id++}`,
          name: match[0],
          category,
          specification: 'As specified in scope',
          notes: 'Specification requires confirmation'
        });
      });
    });

    return materials;
  }

  /**
   * Analyze labor requirements based on work categories
   */
  private analyzeLaborRequirements(workCategories: WorkCategory[]): LaborRequirement[] {
    const laborRequirements: LaborRequirement[] = [];

    workCategories.forEach(category => {
      const skillLevel = this.determineSkillLevel(category.trade);
      const crewSize = this.estimateCrewSize(category.trade, category.items.length);
      const hoursRequired = this.estimateLaborHours(category.trade, category.items);

      laborRequirements.push({
        id: `labor_${category.id}`,
        trade: category.trade,
        skillLevel: skillLevel.level,
        hoursRequired,
        crewSize,
        licensing: this.getRequiredLicensing(category.trade),
        notes: `${skillLevel.description}. Estimated ${hoursRequired} hours with ${crewSize} person crew.`
      });
    });

    return laborRequirements;
  }

  /**
   * Determine skill level for trade
   */
  private determineSkillLevel(trade: string): typeof SKILL_LEVELS[keyof typeof SKILL_LEVELS] {
    const tradeSkillMap: Record<string, keyof typeof SKILL_LEVELS> = {
      'Demolition': 'UNSKILLED',
      'Cleanup': 'UNSKILLED',
      'Excavation': 'SEMI_SKILLED',
      'Concrete': 'SKILLED',
      'Framing': 'SKILLED',
      'Electrical': 'SKILLED',
      'Plumbing': 'SKILLED',
      'HVAC': 'SKILLED',
      'Roofing': 'SKILLED',
      'Drywall': 'SEMI_SKILLED',
      'Painting': 'SEMI_SKILLED',
      'Flooring': 'SEMI_SKILLED',
      'Trim & Millwork': 'SPECIALIST',
      'Cabinets': 'SPECIALIST',
      'Countertops': 'SPECIALIST'
    };

    const skillKey = tradeSkillMap[trade] || 'SEMI_SKILLED';
    return SKILL_LEVELS[skillKey];
  }

  /**
   * Estimate crew size for trade
   */
  private estimateCrewSize(trade: string, itemCount: number): number {
    const baseCrewSizes: Record<string, number> = {
      'Demolition': 2,
      'Excavation': 2,
      'Concrete': 3,
      'Framing': 3,
      'Roofing': 2,
      'Electrical': 1,
      'Plumbing': 1,
      'HVAC': 2,
      'Insulation': 2,
      'Drywall': 2,
      'Flooring': 2,
      'Painting': 2,
      'Trim & Millwork': 1,
      'Cabinets': 2,
      'Countertops': 2,
      'Fixtures': 1,
      'Cleanup': 2
    };

    const baseCrew = baseCrewSizes[trade] || 2;
    return Math.max(baseCrew, Math.ceil(itemCount / 3)); // Scale up for larger projects
  }

  /**
   * Estimate labor hours for trade
   */
  private estimateLaborHours(trade: string, items: ScopeItem[]): number {
    const baseHours: Record<string, number> = {
      'Demolition': 8,
      'Excavation': 16,
      'Concrete': 24,
      'Framing': 32,
      'Roofing': 24,
      'Electrical': 16,
      'Plumbing': 16,
      'HVAC': 24,
      'Insulation': 8,
      'Drywall': 16,
      'Flooring': 24,
      'Painting': 16,
      'Trim & Millwork': 20,
      'Cabinets': 32,
      'Countertops': 8,
      'Fixtures': 4,
      'Cleanup': 8
    };

    const base = baseHours[trade] || 16;
    const complexity = items.length > 3 ? 1.5 : 1;
    
    return Math.round(base * complexity * items.length);
  }

  /**
   * Get required licensing for trade
   */
  private getRequiredLicensing(trade: string): string[] {
    const licensingMap: Record<string, string[]> = {
      'Electrical': ['Electrical License', 'Local Permit'],
      'Plumbing': ['Plumbing License', 'Local Permit'],
      'HVAC': ['HVAC License', 'Local Permit'],
      'Roofing': ['Roofing License'],
      'Concrete': ['General Contractor License'],
      'Framing': ['General Contractor License']
    };

    return licensingMap[trade] || [];
  }

  /**
   * Get trade prerequisites
   */
  private getTradePrerequisites(trade: string): string[] {
    const prerequisites: Record<string, string[]> = {
      'Framing': ['Demolition', 'Excavation'],
      'Roofing': ['Framing'],
      'Electrical': ['Framing'],
      'Plumbing': ['Framing'],
      'HVAC': ['Framing'],
      'Insulation': ['Electrical', 'Plumbing', 'HVAC'],
      'Drywall': ['Insulation'],
      'Flooring': ['Drywall'],
      'Painting': ['Drywall'],
      'Trim & Millwork': ['Painting'],
      'Fixtures': ['Electrical', 'Plumbing'],
      'Cleanup': ['All other trades']
    };

    return prerequisites[trade] || [];
  }

  /**
   * Estimate duration for trade
   */
  private estimateTradeDuration(items: ScopeItem[]): string {
    const itemCount = items.length;
    
    if (itemCount <= 2) return '1-2 days';
    if (itemCount <= 5) return '3-5 days';
    if (itemCount <= 10) return '1-2 weeks';
    return '2+ weeks';
  }

  /**
   * Assess risk level for trade
   */
  private assessTradeRisk(trade: string, items: ScopeItem[]): 'low' | 'medium' | 'high' {
    const highRiskTrades = ['Electrical', 'Plumbing', 'HVAC', 'Roofing', 'Excavation'];
    const mediumRiskTrades = ['Framing', 'Concrete', 'Demolition'];
    
    if (highRiskTrades.includes(trade)) return 'high';
    if (mediumRiskTrades.includes(trade)) return 'medium';
    
    // Risk also depends on complexity
    return items.length > 5 ? 'medium' : 'low';
  }

  /**
   * Identify special considerations from text
   */
  private identifySpecialConsiderations(text: string): string[] {
    const considerations: string[] = [];
    
    const patterns = [
      { pattern: /permit/gi, message: 'Permits may be required' },
      { pattern: /load.*bear/gi, message: 'Structural engineering evaluation needed' },
      { pattern: /asbestos/gi, message: 'Hazardous material assessment required' },
      { pattern: /historic/gi, message: 'Historic preservation guidelines may apply' },
      { pattern: /hoa/gi, message: 'HOA approval may be required' },
      { pattern: /utility/gi, message: 'Utility coordination required' },
      { pattern: /access/gi, message: 'Site access limitations to consider' }
    ];

    patterns.forEach(({ pattern, message }) => {
      if (text.match(pattern)) {
        considerations.push(message);
      }
    });

    return considerations;
  }

  /**
   * Estimate overall project timeline
   */
  private estimateTimeline(workCategories: WorkCategory[]): string {
    const totalDays = workCategories.reduce((total, category) => {
      const days = this.parseDurationToDays(category.estimatedDuration);
      return total + days;
    }, 0);

    if (totalDays <= 5) return '1 week';
    if (totalDays <= 14) return '2 weeks';
    if (totalDays <= 30) return '1 month';
    if (totalDays <= 60) return '2 months';
    return '2+ months';
  }

  /**
   * Parse duration string to days
   */
  private parseDurationToDays(duration: string): number {
    if (duration.includes('1-2 days')) return 2;
    if (duration.includes('3-5 days')) return 4;
    if (duration.includes('1-2 weeks')) return 10;
    if (duration.includes('2+ weeks')) return 20;
    return 5; // default
  }

  /**
   * Generate suggestions for improvement
   */
  private generateSuggestions(scope: OrganizedScope): string[] {
    const suggestions: string[] = [];

    // Check for missing common trades
    const commonTrades = ['Electrical', 'Plumbing', 'Painting'];
    const presentTrades = scope.workCategories.map(cat => cat.trade);
    
    commonTrades.forEach(trade => {
      if (!presentTrades.includes(trade)) {
        suggestions.push(`Consider if ${trade} work is needed for this project`);
      }
    });

    // Check for material specifications
    if (scope.materialSpecs.length < scope.workCategories.length) {
      suggestions.push('Material specifications should be detailed for accurate pricing');
    }

    // Check for timeline
    if (scope.estimatedTimeline === '2+ months') {
      suggestions.push('Consider breaking large projects into phases');
    }

    return suggestions;
  }

  /**
   * Validate scope for completeness and accuracy
   */
  private validateScope(scope: OrganizedScope): string[] {
    const warnings: string[] = [];

    // Check for empty categories
    if (scope.workCategories.length === 0) {
      warnings.push('No work categories identified - scope may be unclear');
    }

    // Check for missing measurements
    const measuredCategories = scope.workCategories.filter(cat => 
      cat.items.some(item => item.quantity)
    );
    
    if (measuredCategories.length < scope.workCategories.length * 0.5) {
      warnings.push('Many work items lack quantity measurements');
    }

    // Check for high-risk combinations
    const highRiskTrades = scope.workCategories.filter(cat => cat.riskLevel === 'high');
    if (highRiskTrades.length > 2) {
      warnings.push('Multiple high-risk trades require careful coordination');
    }

    return warnings;
  }

  /**
   * Calculate overall confidence score
   */
  private calculateConfidence(scope: OrganizedScope, measurements: VoiceMeasurement[]): number {
    let confidence = 0.5; // Base confidence

    // Boost for identified categories
    confidence += scope.workCategories.length * 0.1;

    // Boost for measurements
    confidence += measurements.length * 0.05;

    // Boost for material specs
    confidence += scope.materialSpecs.length * 0.03;

    // Penalty for warnings
    const warnings = this.validateScope(scope);
    confidence -= warnings.length * 0.05;

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }
}
