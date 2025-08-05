// Pricing Engine Types for BF-002 Implementation

export interface PricingRule {
  id: string;
  category: string;
  subcategory?: string;
  description: string;
  measurementType: 'linear' | 'square' | 'cubic' | 'count';
  basePrice: number;
  wasteFactor: number; // 0.10 = 10% waste
  laborMultiplier: number; // Labor cost as multiplier of material cost
  complexityFactors: {
    easy: number;
    medium: number;
    hard: number;
  };
  region?: string; // Default to California
  lastUpdated: Date;
  isActive: boolean;
}

export interface MaterialPricing {
  id: string;
  name: string;
  category: string;
  unit: string;
  basePrice: number;
  wasteFactor: number;
  supplier?: string;
  region: string;
  lastUpdated: Date;
}

export interface LaborPricing {
  id: string;
  trade: string;
  skillLevel: 'apprentice' | 'journeyman' | 'master';
  hourlyRate: number;
  region: string;
  union: boolean;
  lastUpdated: Date;
}

export interface PricingCalculation {
  lineItemId: string;
  description: string;
  quantity: number;
  unit: string;
  
  // Material costs
  materialUnitCost: number;
  materialSubtotal: number;
  wasteAmount: number;
  materialTotal: number;
  
  // Labor costs
  laborHours: number;
  laborRate: number;
  laborTotal: number;
  
  // Equipment/tools
  equipmentCost?: number;
  
  // Totals
  lineItemTotal: number;
  
  // Metadata
  complexityLevel: 'easy' | 'medium' | 'hard';
  confidenceScore: number; // 0-1 scale
  pricingRuleId: string;
  calculatedAt: Date;
}

export interface EstimateRequest {
  description: string;
  quantity: number;
  measurementType: 'linear' | 'square' | 'cubic' | 'count';
  unit?: string;
  location?: string;
  urgency?: 'standard' | 'rush';
  qualityLevel?: 'basic' | 'standard' | 'premium';
}

export interface PricingDatabase {
  rules: PricingRule[];
  materials: MaterialPricing[];
  labor: LaborPricing[];
  lastSync: Date;
}

export interface AIAnalysisResult {
  suggestedCategory: string;
  suggestedSubcategory?: string;
  complexityLevel: 'easy' | 'medium' | 'hard';
  recommendedPricingRule: string; // PricingRule ID
  riskFactors: string[];
  confidenceScore: number;
  reasoning: string;
}

export interface RegionalAdjustment {
  region: string;
  materialMultiplier: number;
  laborMultiplier: number;
  permitMultiplier: number;
  lastUpdated: Date;
}

// Common Construction Categories
export const CONSTRUCTION_CATEGORIES = {
  STRUCTURAL: 'structural',
  ELECTRICAL: 'electrical',
  PLUMBING: 'plumbing',
  HVAC: 'hvac',
  FLOORING: 'flooring',
  ROOFING: 'roofing',
  SIDING: 'siding',
  PAINTING: 'painting',
  FENCING: 'fencing',
  CONCRETE: 'concrete',
  EXCAVATION: 'excavation',
  INSULATION: 'insulation',
  DRYWALL: 'drywall',
  TRIM: 'trim',
  DOORS_WINDOWS: 'doors_windows',
  PERMITS: 'permits'
} as const;

export type ConstructionCategory = typeof CONSTRUCTION_CATEGORIES[keyof typeof CONSTRUCTION_CATEGORIES];

// Measurement Unit Mappings
export const UNIT_MAPPINGS = {
  linear: ['LF', 'ft', 'feet', 'linear feet'],
  square: ['SF', 'sq ft', 'square feet', 'ft²'],
  cubic: ['CF', 'CY', 'cu ft', 'cubic feet', 'cubic yards', 'ft³', 'yd³'],
  count: ['EA', 'each', 'pc', 'piece', 'unit']
} as const;