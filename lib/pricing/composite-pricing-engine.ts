// Composite-Rate Decomposition Pricing Engine - Step 7 Implementation

import { PricingEngine } from './engine';
import { 
  PricingRule, 
  PricingCalculation, 
  EstimateRequest, 
  PricingDatabase,
  CONSTRUCTION_CATEGORIES,
  ConstructionCategory 
} from './types';

export interface CostAssembly {
  id: string;
  code: string; // Assembly code (e.g., "03.30.53.40")
  description: string;
  category: ConstructionCategory;
  unit: string;
  
  // Cost components
  laborComponent: LaborComponent;
  materialComponent: MaterialComponent;
  equipmentComponent: EquipmentComponent;
  
  // Assembly metadata
  productivityRate: number; // Units per day
  crewSize: number;
  wasteFactor: number;
  setupTime: number; // Hours
  
  // Composite rate information
  compositeRate?: number; // $/unit
  costBook: string; // Source cost book
  regionCode: string;
  lastUpdated: Date;
}

export interface LaborComponent {
  totalHours: number;
  crewMakeup: CrewMember[];
  totalLaborCost: number;
  laborRate: number; // Blended hourly rate
  
  // Detailed breakdown
  skillMix: {
    foreman: number;
    journeyman: number;
    apprentice: number;
    laborer: number;
  };
}

export interface CrewMember {
  trade: string;
  skillLevel: 'foreman' | 'journeyman' | 'apprentice' | 'laborer';
  quantity: number; // Number of people
  hoursPerUnit: number; // Hours required per unit
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
}

export interface MaterialComponent {
  materials: MaterialItem[];
  totalMaterialCost: number;
  wasteAllowance: number;
  
  // Bulk pricing considerations
  quantityBreaks: QuantityBreak[];
  supplierInfo: SupplierInfo;
}

export interface MaterialItem {
  id: string;
  name: string;
  specification: string;
  unit: string;
  quantityPerAssemblyUnit: number;
  unitCost: number;
  totalCost: number;
  wasteFactor: number;
  csiCode?: string;
}

export interface EquipmentComponent {
  equipment: EquipmentItem[];
  totalEquipmentCost: number;
  
  // Equipment considerations
  mobilizationCost: number;
  operatingCostPerHour: number;
  setupTime: number;
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: 'owned' | 'rented' | 'subcontractor';
  hoursPerUnit: number;
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
  operator?: {
    required: boolean;
    skillLevel: string;
    hourlyRate: number;
  };
}

export interface QuantityBreak {
  minQuantity: number;
  maxQuantity?: number;
  unitPrice: number;
  description: string;
}

export interface SupplierInfo {
  name: string;
  contact: string;
  deliveryTime: string;
  minimumOrder?: number;
  terms: string;
}

export interface CompositeRateAnalysis {
  originalCompositeRate: number;
  unit: string;
  
  // Decomposed components
  laborShare: {
    amount: number;
    percentage: number;
    hours: number;
    rate: number;
  };
  
  materialShare: {
    amount: number;
    percentage: number;
  };
  
  equipmentShare: {
    amount: number;
    percentage: number;
    hours: number;
  };
  
  overheadAndProfit: {
    amount: number;
    percentage: number;
  };
  
  // Analysis metadata
  confidenceScore: number;
  costBookSource: string;
  analysisMethod: 'cost_book_ratios' | 'historical_data' | 'industry_standard';
  assumptionsMade: string[];
}

export interface DetailedBreakdownTable {
  lineItemId: string;
  description: string;
  quantity: number;
  unit: string;
  
  // Assembly information
  assemblyCode: string;
  assemblyDescription: string;
  
  // Detailed costs
  laborBreakdown: {
    crew: CrewMember[];
    totalHours: number;
    totalCost: number;
    productivityRate: number;
  };
  
  materialBreakdown: {
    items: MaterialItem[];
    totalCost: number;
    wasteAllowance: number;
  };
  
  equipmentBreakdown: {
    items: EquipmentItem[];
    totalCost: number;
    operatingHours: number;
  };
  
  // Totals and analysis
  directCost: number;
  overheadAndProfit: number;
  totalCost: number;
  unitCost: number;
  
  // Estimator override capabilities
  allowOverrides: boolean;
  overrideHistory: OverrideEntry[];
  
  // Quality metrics
  confidenceScore: number;
  dataSource: string;
  lastUpdated: Date;
  
  // Composite rate analysis (if applicable)
  compositeAnalysis?: CompositeRateAnalysis;
}

export interface OverrideEntry {
  id: string;
  timestamp: Date;
  estimator: string;
  field: string;
  originalValue: any;
  newValue: any;
  reason: string;
  approved: boolean;
  approvedBy?: string;
}

export interface ScopeLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  category?: ConstructionCategory;
  compositeRate?: number; // If provided as $/unit
  notes?: string;
  priority: 'required' | 'optional' | 'alternate';
}

export class CompositePricingEngine extends PricingEngine {
  private costAssemblies: Map<string, CostAssembly>;
  private costBookRatios: Map<string, any>; // Cost book standard ratios

  constructor(
    database: PricingDatabase, 
    costAssemblies: CostAssembly[] = [],
    costBookRatios: any = {}
  ) {
    super(database);
    this.costAssemblies = new Map(costAssemblies.map(assembly => [assembly.code, assembly]));
    this.costBookRatios = new Map(Object.entries(costBookRatios));
  }

  /**
   * Main method: Process parsed scope lines and generate detailed breakdowns
   */
  async processScopeLines(scopeLines: ScopeLine[]): Promise<DetailedBreakdownTable[]> {
    const breakdownTables: DetailedBreakdownTable[] = [];

    for (const scopeLine of scopeLines) {
      try {
        const breakdown = await this.processSingleScopeLine(scopeLine);
        breakdownTables.push(breakdown);
      } catch (error) {
        console.error(`Failed to process scope line: ${scopeLine.description}`, error);
        // Create a basic breakdown with error information
        breakdownTables.push(this.createErrorBreakdown(scopeLine, error as Error));
      }
    }

    return breakdownTables;
  }

  /**
   * Process a single scope line into detailed breakdown
   */
  private async processSingleScopeLine(scopeLine: ScopeLine): Promise<DetailedBreakdownTable> {
    // Step 1: Map scope line to cost assembly
    const assembly = await this.mapScopeToAssembly(scopeLine);
    
    // Step 2: Compute detailed breakdown
    const breakdown = await this.computeDetailedBreakdown(scopeLine, assembly);
    
    // Step 3: If composite rate provided, reverse-engineer it
    if (scopeLine.compositeRate) {
      breakdown.compositeAnalysis = await this.reverseEngineerCompositeRate(
        scopeLine.compositeRate,
        scopeLine.unit,
        assembly
      );
    }

    return breakdown;
  }

  /**
   * Map scope line description to appropriate cost assembly
   */
  private async mapScopeToAssembly(scopeLine: ScopeLine): Promise<CostAssembly> {
    // First, try to find exact match by description keywords
    const description = scopeLine.description.toLowerCase();
    
    // Search through cost assemblies for best match
    let bestMatch: CostAssembly | null = null;
    let bestScore = 0;

    for (const assembly of Array.from(this.costAssemblies.values())) {
      const score = this.calculateMatchScore(description, assembly);
      if (score > bestScore) {
        bestScore = score;
        bestMatch = assembly;
      }
    }

    // If no good match found, create a generic assembly
    if (!bestMatch || bestScore < 0.3) {
      return this.createGenericAssembly(scopeLine);
    }

    return bestMatch;
  }

  /**
   * Calculate matching score between scope description and assembly
   */
  private calculateMatchScore(description: string, assembly: CostAssembly): number {
    const assemblyText = (assembly.description + ' ' + assembly.category).toLowerCase();
    const descWords = description.split(/\s+/);
    const assemblyWords = assemblyText.split(/\s+/);

    let matches = 0;
    for (const word of descWords) {
      if (assemblyWords.some(aWord => aWord.includes(word) || word.includes(aWord))) {
        matches++;
      }
    }

    return descWords.length > 0 ? matches / descWords.length : 0;
  }

  /**
   * Create generic assembly when no match found
   */
  private createGenericAssembly(scopeLine: ScopeLine): CostAssembly {
    const category = this.inferCategory(scopeLine.description);
    
    return {
      id: `generic_${Date.now()}`,
      code: 'GENERIC',
      description: scopeLine.description,
      category,
      unit: scopeLine.unit,
      
      laborComponent: {
        totalHours: 0,
        crewMakeup: [],
        totalLaborCost: 0,
        laborRate: 45, // Default rate
        skillMix: {
          foreman: 0.1,
          journeyman: 0.6,
          apprentice: 0.2,
          laborer: 0.1
        }
      },
      
      materialComponent: {
        materials: [],
        totalMaterialCost: 0,
        wasteAllowance: 0.1,
        quantityBreaks: [],
        supplierInfo: {
          name: 'TBD',
          contact: 'TBD',
          deliveryTime: 'TBD',
          terms: 'Net 30'
        }
      },
      
      equipmentComponent: {
        equipment: [],
        totalEquipmentCost: 0,
        mobilizationCost: 0,
        operatingCostPerHour: 0,
        setupTime: 0
      },
      
      productivityRate: 1,
      crewSize: 2,
      wasteFactor: 0.1,
      setupTime: 0,
      
      costBook: 'GENERIC',
      regionCode: 'DEFAULT',
      lastUpdated: new Date()
    };
  }

  /**
   * Infer construction category from description
   */
  private inferCategory(description: string): ConstructionCategory {
    const desc = description.toLowerCase();
    
    // Category keyword mapping
    const categoryKeywords = {
      [CONSTRUCTION_CATEGORIES.CONCRETE]: ['concrete', 'slab', 'foundation', 'footings'],
      [CONSTRUCTION_CATEGORIES.STRUCTURAL]: ['frame', 'framing', 'studs', 'joists', 'lumber', 'structural'],
      [CONSTRUCTION_CATEGORIES.ELECTRICAL]: ['electrical', 'outlet', 'switch', 'wire', 'panel'],
      [CONSTRUCTION_CATEGORIES.PLUMBING]: ['plumbing', 'pipe', 'drain', 'water', 'sewer'],
      [CONSTRUCTION_CATEGORIES.ROOFING]: ['roof', 'roofing', 'shingle', 'gutter'],
      [CONSTRUCTION_CATEGORIES.FLOORING]: ['floor', 'flooring', 'carpet', 'tile', 'hardwood'],
      [CONSTRUCTION_CATEGORIES.PAINTING]: ['paint', 'painting', 'primer', 'finish'],
      [CONSTRUCTION_CATEGORIES.DRYWALL]: ['drywall', 'sheetrock', 'gypsum'],
      [CONSTRUCTION_CATEGORIES.EXCAVATION]: ['excavate', 'dig', 'grade', 'earth'],
    };

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => desc.includes(keyword))) {
        return category as ConstructionCategory;
      }
    }

    return CONSTRUCTION_CATEGORIES.STRUCTURAL; // Default
  }

  /**
   * Compute detailed breakdown for scope line and assembly
   */
  private async computeDetailedBreakdown(
    scopeLine: ScopeLine, 
    assembly: CostAssembly
  ): Promise<DetailedBreakdownTable> {
    
    // Calculate labor hours and crew makeup
    const laborBreakdown = this.calculateLaborBreakdown(scopeLine.quantity, assembly);
    
    // Calculate material quantities
    const materialBreakdown = this.calculateMaterialBreakdown(scopeLine.quantity, assembly);
    
    // Calculate equipment hours
    const equipmentBreakdown = this.calculateEquipmentBreakdown(scopeLine.quantity, assembly);
    
    // Calculate totals
    const directCost = laborBreakdown.totalCost + materialBreakdown.totalCost + equipmentBreakdown.totalCost;
    const overheadAndProfit = directCost * 0.15; // 15% default
    const totalCost = directCost + overheadAndProfit;
    const unitCost = scopeLine.quantity > 0 ? totalCost / scopeLine.quantity : totalCost;

    return {
      lineItemId: `line_${Date.now()}`,
      description: scopeLine.description,
      quantity: scopeLine.quantity,
      unit: scopeLine.unit,
      
      assemblyCode: assembly.code,
      assemblyDescription: assembly.description,
      
      laborBreakdown,
      materialBreakdown,
      equipmentBreakdown,
      
      directCost,
      overheadAndProfit,
      totalCost,
      unitCost,
      
      allowOverrides: true,
      overrideHistory: [],
      
      confidenceScore: this.calculateAssemblyConfidenceScore(assembly),
      dataSource: assembly.costBook,
      lastUpdated: new Date()
    };
  }

  /**
   * Calculate labor hours and crew makeup
   */
  private calculateLaborBreakdown(quantity: number, assembly: CostAssembly): DetailedBreakdownTable['laborBreakdown'] {
    const totalUnitsPerDay = assembly.productivityRate;
    const daysRequired = quantity / totalUnitsPerDay;
    const crewHoursPerDay = 8;
    const totalCrewHours = daysRequired * crewHoursPerDay * assembly.crewSize;
    
    // Generate crew based on skill mix
    const crew: CrewMember[] = [];
    const skillMix = assembly.laborComponent.skillMix;
    
    // Create crew members based on skill mix
    const skillLevels = [
      { level: 'foreman' as const, percentage: skillMix.foreman, rate: 75 },
      { level: 'journeyman' as const, percentage: skillMix.journeyman, rate: 55 },
      { level: 'apprentice' as const, percentage: skillMix.apprentice, rate: 35 },
      { level: 'laborer' as const, percentage: skillMix.laborer, rate: 25 }
    ];

    for (const skill of skillLevels) {
      if (skill.percentage > 0) {
        const memberCount = Math.max(1, Math.round(assembly.crewSize * skill.percentage));
        const hoursPerMember = totalCrewHours / assembly.crewSize;
        
        crew.push({
          trade: assembly.category,
          skillLevel: skill.level,
          quantity: memberCount,
          hoursPerUnit: hoursPerMember / quantity,
          hourlyRate: skill.rate,
          totalHours: hoursPerMember * memberCount,
          totalCost: hoursPerMember * memberCount * skill.rate
        });
      }
    }

    const totalCost = crew.reduce((sum, member) => sum + member.totalCost, 0);
    const totalHours = crew.reduce((sum, member) => sum + member.totalHours, 0);

    return {
      crew,
      totalHours,
      totalCost,
      productivityRate: assembly.productivityRate
    };
  }

  /**
   * Calculate material quantities and costs
   */
  private calculateMaterialBreakdown(quantity: number, assembly: CostAssembly): DetailedBreakdownTable['materialBreakdown'] {
    const materials: MaterialItem[] = assembly.materialComponent.materials.map(material => ({
      ...material,
      totalCost: material.quantityPerAssemblyUnit * quantity * material.unitCost * (1 + material.wasteFactor)
    }));

    const totalCost = materials.reduce((sum, material) => sum + material.totalCost, 0);
    const wasteAllowance = totalCost * assembly.materialComponent.wasteAllowance;

    return {
      items: materials,
      totalCost: totalCost + wasteAllowance,
      wasteAllowance
    };
  }

  /**
   * Calculate equipment hours and costs
   */
  private calculateEquipmentBreakdown(quantity: number, assembly: CostAssembly): DetailedBreakdownTable['equipmentBreakdown'] {
    const equipment: EquipmentItem[] = assembly.equipmentComponent.equipment.map(item => {
      const totalHours = item.hoursPerUnit * quantity;
      const equipmentCost = totalHours * item.hourlyRate;
      const operatorCost = item.operator?.required 
        ? totalHours * (item.operator.hourlyRate || 0)
        : 0;

      return {
        ...item,
        totalHours,
        totalCost: equipmentCost + operatorCost
      };
    });

    const operatingHours = equipment.reduce((sum, item) => sum + item.totalHours, 0);
    const totalCost = equipment.reduce((sum, item) => sum + item.totalCost, 0) + 
                     assembly.equipmentComponent.mobilizationCost;

    return {
      items: equipment,
      totalCost,
      operatingHours
    };
  }

  /**
   * Reverse-engineer composite rate to expose labor vs material share
   */
  private async reverseEngineerCompositeRate(
    compositeRate: number,
    unit: string,
    assembly: CostAssembly
  ): Promise<CompositeRateAnalysis> {
    
    // Get cost book ratios for this type of assembly
    const ratios = this.getCostBookRatios(assembly.category, assembly.code);
    
    // Calculate component shares
    const laborShare = {
      amount: compositeRate * ratios.laborPercentage,
      percentage: ratios.laborPercentage * 100,
      hours: (compositeRate * ratios.laborPercentage) / ratios.averageLaborRate,
      rate: ratios.averageLaborRate
    };

    const materialShare = {
      amount: compositeRate * ratios.materialPercentage,
      percentage: ratios.materialPercentage * 100
    };

    const equipmentShare = {
      amount: compositeRate * ratios.equipmentPercentage,
      percentage: ratios.equipmentPercentage * 100,
      hours: ratios.equipmentHoursPerUnit || 0
    };

    const overheadAndProfit = {
      amount: compositeRate * ratios.overheadAndProfitPercentage,
      percentage: ratios.overheadAndProfitPercentage * 100
    };

    // Calculate confidence based on how well ratios sum to 100%
    const totalPercentage = ratios.laborPercentage + ratios.materialPercentage + 
                           ratios.equipmentPercentage + ratios.overheadAndProfitPercentage;
    const confidenceScore = Math.max(0.5, Math.min(1.0, 1 - Math.abs(1 - totalPercentage)));

    return {
      originalCompositeRate: compositeRate,
      unit,
      laborShare,
      materialShare,
      equipmentShare,
      overheadAndProfit,
      confidenceScore,
      costBookSource: assembly.costBook,
      analysisMethod: 'cost_book_ratios',
      assumptionsMade: [
        `Used ${assembly.costBook} cost book ratios`,
        `Labor rate assumed at $${ratios.averageLaborRate}/hour`,
        'Standard overhead and profit margins applied',
        'Regional adjustments may be required'
      ]
    };
  }

  /**
   * Get cost book ratios for assembly type
   */
  private getCostBookRatios(category: ConstructionCategory, assemblyCode: string): any {
    // Try to find specific ratios for this assembly code
    const specificRatios = this.costBookRatios.get(assemblyCode);
    if (specificRatios) {
      return specificRatios;
    }

    // Fall back to category-based ratios
    const categoryRatios = this.getCategoryDefaultRatios(category);
    return categoryRatios;
  }

  /**
   * Get default ratios by construction category
   */
  private getCategoryDefaultRatios(category: ConstructionCategory): any {
    const defaultRatios = {
      [CONSTRUCTION_CATEGORIES.CONCRETE]: {
        laborPercentage: 0.35,
        materialPercentage: 0.45,
        equipmentPercentage: 0.10,
        overheadAndProfitPercentage: 0.10,
        averageLaborRate: 45,
        equipmentHoursPerUnit: 0.5
      },
      [CONSTRUCTION_CATEGORIES.STRUCTURAL]: {
        laborPercentage: 0.55,
        materialPercentage: 0.35,
        equipmentPercentage: 0.02,
        overheadAndProfitPercentage: 0.08,
        averageLaborRate: 52,
        equipmentHoursPerUnit: 0.1
      },
      [CONSTRUCTION_CATEGORIES.ELECTRICAL]: {
        laborPercentage: 0.65,
        materialPercentage: 0.25,
        equipmentPercentage: 0.03,
        overheadAndProfitPercentage: 0.07,
        averageLaborRate: 68,
        equipmentHoursPerUnit: 0.05
      },
      [CONSTRUCTION_CATEGORIES.PLUMBING]: {
        laborPercentage: 0.60,
        materialPercentage: 0.28,
        equipmentPercentage: 0.05,
        overheadAndProfitPercentage: 0.07,
        averageLaborRate: 58,
        equipmentHoursPerUnit: 0.2
      },
      [CONSTRUCTION_CATEGORIES.ROOFING]: {
        laborPercentage: 0.45,
        materialPercentage: 0.42,
        equipmentPercentage: 0.08,
        overheadAndProfitPercentage: 0.05,
        averageLaborRate: 48,
        equipmentHoursPerUnit: 0.3
      }
    };

    return (defaultRatios as any)[category] || {
      laborPercentage: 0.50,
      materialPercentage: 0.35,
      equipmentPercentage: 0.05,
      overheadAndProfitPercentage: 0.10,
      averageLaborRate: 45,
      equipmentHoursPerUnit: 0.2
    };
  }

  /**
   * Calculate confidence score for assembly match
   */
  private calculateAssemblyConfidenceScore(assembly: CostAssembly): number {
    let score = 0.8; // Base confidence

    // Reduce confidence for generic assemblies
    if (assembly.code === 'GENERIC') {
      score -= 0.3;
    }

    // Reduce confidence for old data
    const daysSinceUpdate = (Date.now() - assembly.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 180) {
      score -= 0.2;
    } else if (daysSinceUpdate > 90) {
      score -= 0.1;
    }

    // Increase confidence if we have detailed material/labor info
    if (assembly.laborComponent.crewMakeup.length > 0) {
      score += 0.1;
    }
    if (assembly.materialComponent.materials.length > 0) {
      score += 0.1;
    }

    return Math.max(0.3, Math.min(1.0, score));
  }

  /**
   * Create error breakdown for failed processing
   */
  private createErrorBreakdown(scopeLine: ScopeLine, error: Error): DetailedBreakdownTable {
    return {
      lineItemId: `error_${Date.now()}`,
      description: `ERROR: ${scopeLine.description}`,
      quantity: scopeLine.quantity,
      unit: scopeLine.unit,
      
      assemblyCode: 'ERROR',
      assemblyDescription: `Processing failed: ${error.message}`,
      
      laborBreakdown: {
        crew: [],
        totalHours: 0,
        totalCost: 0,
        productivityRate: 0
      },
      
      materialBreakdown: {
        items: [],
        totalCost: 0,
        wasteAllowance: 0
      },
      
      equipmentBreakdown: {
        items: [],
        totalCost: 0,
        operatingHours: 0
      },
      
      directCost: 0,
      overheadAndProfit: 0,
      totalCost: 0,
      unitCost: 0,
      
      allowOverrides: true,
      overrideHistory: [],
      
      confidenceScore: 0.0,
      dataSource: 'ERROR',
      lastUpdated: new Date()
    };
  }

  /**
   * Add or update cost assembly
   */
  addCostAssembly(assembly: CostAssembly): void {
    this.costAssemblies.set(assembly.code, assembly);
  }

  /**
   * Get all available cost assemblies
   */
  getAvailableAssemblies(): CostAssembly[] {
    return Array.from(this.costAssemblies.values());
  }

  /**
   * Search assemblies by category
   */
  searchAssembliesByCategory(category: ConstructionCategory): CostAssembly[] {
    return Array.from(this.costAssemblies.values())
      .filter(assembly => assembly.category === category);
  }

  /**
   * Update cost book ratios
   */
  updateCostBookRatios(ratios: Record<string, any>): void {
    this.costBookRatios = new Map(Object.entries(ratios));
  }

  /**
   * Export breakdown table to different formats
   */
  exportBreakdownTable(
    breakdown: DetailedBreakdownTable, 
    format: 'json' | 'csv' | 'estimator_format'
  ): any {
    switch (format) {
      case 'json':
        return JSON.stringify(breakdown, null, 2);
        
      case 'csv':
        return this.convertToCSV(breakdown);
        
      case 'estimator_format':
        return this.convertToEstimatorFormat(breakdown);
        
      default:
        return breakdown;
    }
  }

  /**
   * Convert breakdown to CSV format
   */
  private convertToCSV(breakdown: DetailedBreakdownTable): string {
    const rows = [
      ['Description', 'Quantity', 'Unit', 'Labor Cost', 'Material Cost', 'Equipment Cost', 'Total Cost', 'Unit Cost'],
      [
        breakdown.description,
        breakdown.quantity.toString(),
        breakdown.unit,
        breakdown.laborBreakdown.totalCost.toFixed(2),
        breakdown.materialBreakdown.totalCost.toFixed(2),
        breakdown.equipmentBreakdown.totalCost.toFixed(2),
        breakdown.totalCost.toFixed(2),
        breakdown.unitCost.toFixed(2)
      ]
    ];

    // Add crew details
    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['LABOR BREAKDOWN', '', '', '', '', '', '', '']);
    for (const member of breakdown.laborBreakdown.crew) {
      rows.push([
        `${member.skillLevel} (${member.trade})`,
        member.quantity.toString(),
        'person',
        member.totalCost.toFixed(2),
        '',
        '',
        '',
        (member.totalCost / breakdown.quantity).toFixed(2)
      ]);
    }

    // Add material details
    rows.push(['', '', '', '', '', '', '', '']);
    rows.push(['MATERIAL BREAKDOWN', '', '', '', '', '', '', '']);
    for (const material of breakdown.materialBreakdown.items) {
      rows.push([
        material.name,
        (material.quantityPerAssemblyUnit * breakdown.quantity).toFixed(2),
        material.unit,
        '',
        material.totalCost.toFixed(2),
        '',
        '',
        (material.totalCost / breakdown.quantity).toFixed(2)
      ]);
    }

    return rows.map(row => row.join(',')).join('\n');
  }

  /**
   * Convert to estimator-friendly format for overrides
   */
  private convertToEstimatorFormat(breakdown: DetailedBreakdownTable): any {
    return {
      summary: {
        description: breakdown.description,
        quantity: breakdown.quantity,
        unit: breakdown.unit,
        unitCost: breakdown.unitCost,
        totalCost: breakdown.totalCost,
        confidenceScore: breakdown.confidenceScore
      },
      
      labor: {
        totalHours: breakdown.laborBreakdown.totalHours,
        totalCost: breakdown.laborBreakdown.totalCost,
        avgRate: breakdown.laborBreakdown.totalCost / Math.max(breakdown.laborBreakdown.totalHours, 1),
        crew: breakdown.laborBreakdown.crew.map(member => ({
          type: member.skillLevel,
          count: member.quantity,
          hours: member.totalHours,
          rate: member.hourlyRate,
          cost: member.totalCost,
          overrideable: true
        }))
      },
      
      materials: breakdown.materialBreakdown.items.map(material => ({
        name: material.name,
        spec: material.specification,
        quantity: material.quantityPerAssemblyUnit * breakdown.quantity,
        unit: material.unit,
        unitCost: material.unitCost,
        totalCost: material.totalCost,
        overrideable: true
      })),
      
      equipment: breakdown.equipmentBreakdown.items.map(equipment => ({
        name: equipment.name,
        type: equipment.type,
        hours: equipment.totalHours,
        rate: equipment.hourlyRate,
        cost: equipment.totalCost,
        overrideable: true
      })),
      
      overrideOptions: {
        allowLaborRateOverride: true,
        allowMaterialPriceOverride: true,
        allowEquipmentRateOverride: true,
        allowQuantityOverride: true,
        requireApproval: true
      }
    };
  }
}
