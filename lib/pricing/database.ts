// Default Pricing Database - BF-002 Implementation
// California-focused pricing with common construction items

import { 
  PricingRule, 
  PricingDatabase, 
  MaterialPricing, 
  LaborPricing,
  RegionalAdjustment,
  CONSTRUCTION_CATEGORIES 
} from './types';

export const DEFAULT_PRICING_RULES: PricingRule[] = [
  // FENCING - Linear Feet
  {
    id: 'fencing_chain_link',
    category: CONSTRUCTION_CATEGORIES.FENCING,
    subcategory: 'Chain Link',
    description: 'Chain link fence installation',
    measurementType: 'linear',
    basePrice: 25.00, // $25/LF material + labor
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 1.2, // Labor is 120% of material cost
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'fencing_wood_privacy',
    category: CONSTRUCTION_CATEGORIES.FENCING,
    subcategory: 'Wood Privacy',
    description: 'Wood privacy fence installation',
    measurementType: 'linear',
    basePrice: 45.00, // $45/LF
    wasteFactor: 0.15, // 15% waste for wood
    laborMultiplier: 1.5,
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.0 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // FLOORING - Square Feet
  {
    id: 'flooring_hardwood',
    category: CONSTRUCTION_CATEGORIES.FLOORING,
    subcategory: 'Hardwood',
    description: 'Hardwood flooring installation',
    measurementType: 'square',
    basePrice: 12.00, // $12/SF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 2.0, // Labor intensive
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'flooring_tile',
    category: CONSTRUCTION_CATEGORIES.FLOORING,
    subcategory: 'Ceramic Tile',
    description: 'Ceramic tile flooring installation',
    measurementType: 'square',
    basePrice: 8.00, // $8/SF
    wasteFactor: 0.15, // 15% waste for tile
    laborMultiplier: 2.5, // Very labor intensive
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.2 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'flooring_carpet',
    category: CONSTRUCTION_CATEGORIES.FLOORING,
    subcategory: 'Carpet',
    description: 'Carpet installation',
    measurementType: 'square',
    basePrice: 4.50, // $4.50/SF
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 1.0, // Labor equals material cost
    complexityFactors: { easy: 1.0, medium: 1.2, hard: 1.5 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // PAINTING - Square Feet
  {
    id: 'painting_interior',
    category: CONSTRUCTION_CATEGORIES.PAINTING,
    subcategory: 'Interior',
    description: 'Interior wall painting',
    measurementType: 'square',
    basePrice: 3.50, // $3.50/SF
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 1.8, // Labor is primary cost
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'painting_exterior',
    category: CONSTRUCTION_CATEGORIES.PAINTING,
    subcategory: 'Exterior',
    description: 'Exterior wall painting',
    measurementType: 'square',
    basePrice: 4.50, // $4.50/SF
    wasteFactor: 0.08, // 8% waste
    laborMultiplier: 2.0, // Higher labor for exterior
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.0 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // ROOFING - Square Feet
  {
    id: 'roofing_asphalt_shingle',
    category: CONSTRUCTION_CATEGORIES.ROOFING,
    subcategory: 'Asphalt Shingle',
    description: 'Asphalt shingle roof installation',
    measurementType: 'square',
    basePrice: 8.00, // $8/SF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 1.5,
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'roofing_tile',
    category: CONSTRUCTION_CATEGORIES.ROOFING,
    subcategory: 'Tile',
    description: 'Tile roof installation',
    measurementType: 'square',
    basePrice: 15.00, // $15/SF
    wasteFactor: 0.15, // 15% waste
    laborMultiplier: 2.0,
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.2 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // CONCRETE - Cubic Feet/Yards
  {
    id: 'concrete_slab',
    category: CONSTRUCTION_CATEGORIES.CONCRETE,
    subcategory: 'Slab',
    description: 'Concrete slab installation',
    measurementType: 'cubic',
    basePrice: 150.00, // $150/CY
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 1.2,
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'concrete_driveway',
    category: CONSTRUCTION_CATEGORIES.CONCRETE,
    subcategory: 'Driveway',
    description: 'Concrete driveway installation',
    measurementType: 'cubic',
    basePrice: 180.00, // $180/CY (includes finishing)
    wasteFactor: 0.08, // 8% waste
    laborMultiplier: 1.5,
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.0 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // ELECTRICAL - Count
  {
    id: 'electrical_outlet',
    category: CONSTRUCTION_CATEGORIES.ELECTRICAL,
    subcategory: 'Outlets',
    description: 'Electrical outlet installation',
    measurementType: 'count',
    basePrice: 150.00, // $150/outlet
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 2.5, // Mostly labor
    complexityFactors: { easy: 1.0, medium: 1.5, hard: 2.5 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'electrical_switch',
    category: CONSTRUCTION_CATEGORIES.ELECTRICAL,
    subcategory: 'Switches',
    description: 'Light switch installation',
    measurementType: 'count',
    basePrice: 120.00, // $120/switch
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 2.0,
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.0 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // PLUMBING - Count
  {
    id: 'plumbing_fixture',
    category: CONSTRUCTION_CATEGORIES.PLUMBING,
    subcategory: 'Fixtures',
    description: 'Plumbing fixture installation',
    measurementType: 'count',
    basePrice: 300.00, // $300/fixture
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 1.5,
    complexityFactors: { easy: 1.0, medium: 1.5, hard: 2.5 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'plumbing_water_line',
    category: CONSTRUCTION_CATEGORIES.PLUMBING,
    subcategory: 'Water Lines',
    description: 'Water line installation',
    measurementType: 'linear',
    basePrice: 25.00, // $25/LF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 2.0,
    complexityFactors: { easy: 1.0, medium: 1.6, hard: 2.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // SIDING - Square Feet
  {
    id: 'siding_vinyl',
    category: CONSTRUCTION_CATEGORIES.SIDING,
    subcategory: 'Vinyl',
    description: 'Vinyl siding installation',
    measurementType: 'square',
    basePrice: 6.00, // $6/SF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 1.8,
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'siding_wood',
    category: CONSTRUCTION_CATEGORIES.SIDING,
    subcategory: 'Wood',
    description: 'Wood siding installation',
    measurementType: 'square',
    basePrice: 12.00, // $12/SF
    wasteFactor: 0.15, // 15% waste
    laborMultiplier: 2.0,
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.0 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // DRYWALL - Square Feet
  {
    id: 'drywall_standard',
    category: CONSTRUCTION_CATEGORIES.DRYWALL,
    subcategory: 'Standard',
    description: 'Drywall installation and finishing',
    measurementType: 'square',
    basePrice: 3.00, // $3/SF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 2.5, // Very labor intensive
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // TRIM - Linear Feet
  {
    id: 'trim_baseboard',
    category: CONSTRUCTION_CATEGORIES.TRIM,
    subcategory: 'Baseboard',
    description: 'Baseboard trim installation',
    measurementType: 'linear',
    basePrice: 8.00, // $8/LF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 2.0,
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'trim_crown_molding',
    category: CONSTRUCTION_CATEGORIES.TRIM,
    subcategory: 'Crown Molding',
    description: 'Crown molding installation',
    measurementType: 'linear',
    basePrice: 15.00, // $15/LF
    wasteFactor: 0.15, // 15% waste
    laborMultiplier: 3.0, // Very labor intensive
    complexityFactors: { easy: 1.0, medium: 1.5, hard: 2.5 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // DOORS & WINDOWS - Count
  {
    id: 'doors_interior',
    category: CONSTRUCTION_CATEGORIES.DOORS_WINDOWS,
    subcategory: 'Interior Doors',
    description: 'Interior door installation',
    measurementType: 'count',
    basePrice: 350.00, // $350/door
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 1.2,
    complexityFactors: { easy: 1.0, medium: 1.3, hard: 1.8 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },
  {
    id: 'windows_standard',
    category: CONSTRUCTION_CATEGORIES.DOORS_WINDOWS,
    subcategory: 'Windows',
    description: 'Window installation',
    measurementType: 'count',
    basePrice: 450.00, // $450/window
    wasteFactor: 0.05, // 5% waste
    laborMultiplier: 1.5,
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.0 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // INSULATION - Square Feet
  {
    id: 'insulation_fiberglass',
    category: CONSTRUCTION_CATEGORIES.INSULATION,
    subcategory: 'Fiberglass',
    description: 'Fiberglass insulation installation',
    measurementType: 'square',
    basePrice: 2.50, // $2.50/SF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 1.5,
    complexityFactors: { easy: 1.0, medium: 1.2, hard: 1.6 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // EXCAVATION - Cubic Yards
  {
    id: 'excavation_standard',
    category: CONSTRUCTION_CATEGORIES.EXCAVATION,
    subcategory: 'Standard',
    description: 'Standard excavation',
    measurementType: 'cubic',
    basePrice: 45.00, // $45/CY
    wasteFactor: 0.15, // 15% over-excavation
    laborMultiplier: 0.8, // Equipment intensive
    complexityFactors: { easy: 1.0, medium: 1.4, hard: 2.2 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  },

  // HVAC - Count
  {
    id: 'hvac_ductwork',
    category: CONSTRUCTION_CATEGORIES.HVAC,
    subcategory: 'Ductwork',
    description: 'HVAC ductwork installation',
    measurementType: 'linear',
    basePrice: 35.00, // $35/LF
    wasteFactor: 0.10, // 10% waste
    laborMultiplier: 2.0,
    complexityFactors: { easy: 1.0, medium: 1.5, hard: 2.5 },
    region: 'California',
    lastUpdated: new Date(),
    isActive: true
  }
];

export const DEFAULT_MATERIAL_PRICING: MaterialPricing[] = [
  {
    id: 'lumber_2x4',
    name: '2x4 Lumber',
    category: 'Lumber',
    unit: 'LF',
    basePrice: 3.50,
    wasteFactor: 0.15,
    supplier: 'Home Depot',
    region: 'California',
    lastUpdated: new Date()
  },
  {
    id: 'concrete_mix',
    name: 'Concrete Mix',
    category: 'Concrete',
    unit: 'CY',
    basePrice: 120.00,
    wasteFactor: 0.05,
    supplier: 'Ready Mix',
    region: 'California',
    lastUpdated: new Date()
  },
  {
    id: 'paint_interior',
    name: 'Interior Paint',
    category: 'Paint',
    unit: 'GAL',
    basePrice: 45.00,
    wasteFactor: 0.05,
    supplier: 'Sherwin Williams',
    region: 'California',
    lastUpdated: new Date()
  }
];

export const DEFAULT_LABOR_PRICING: LaborPricing[] = [
  {
    id: 'carpenter_journeyman',
    trade: 'Carpentry',
    skillLevel: 'journeyman',
    hourlyRate: 65.00,
    region: 'California',
    union: false,
    lastUpdated: new Date()
  },
  {
    id: 'electrician_journeyman',
    trade: 'Electrical',
    skillLevel: 'journeyman',
    hourlyRate: 85.00,
    region: 'California',
    union: true,
    lastUpdated: new Date()
  },
  {
    id: 'plumber_journeyman',
    trade: 'Plumbing',
    skillLevel: 'journeyman',
    hourlyRate: 80.00,
    region: 'California',
    union: false,
    lastUpdated: new Date()
  },
  {
    id: 'painter_journeyman',
    trade: 'Painting',
    skillLevel: 'journeyman',
    hourlyRate: 55.00,
    region: 'California',
    union: false,
    lastUpdated: new Date()
  }
];

export const DEFAULT_REGIONAL_ADJUSTMENTS: RegionalAdjustment[] = [
  {
    region: 'San Francisco Bay Area',
    materialMultiplier: 1.25,
    laborMultiplier: 1.45,
    permitMultiplier: 1.30,
    lastUpdated: new Date()
  },
  {
    region: 'Los Angeles',
    materialMultiplier: 1.15,
    laborMultiplier: 1.25,
    permitMultiplier: 1.20,
    lastUpdated: new Date()
  },
  {
    region: 'San Diego',
    materialMultiplier: 1.10,
    laborMultiplier: 1.20,
    permitMultiplier: 1.15,
    lastUpdated: new Date()
  },
  {
    region: 'Central Valley',
    materialMultiplier: 0.95,
    laborMultiplier: 0.90,
    permitMultiplier: 0.85,
    lastUpdated: new Date()
  }
];

export function createDefaultPricingDatabase(): PricingDatabase {
  return {
    rules: DEFAULT_PRICING_RULES,
    materials: DEFAULT_MATERIAL_PRICING,
    labor: DEFAULT_LABOR_PRICING,
    lastSync: new Date()
  };
}

// Utility function to find pricing rule by ID
export function findPricingRuleById(database: PricingDatabase, ruleId: string): PricingRule | null {
  return database.rules.find(rule => rule.id === ruleId) || null;
}

// Utility function to get rules by category
export function getRulesByCategory(database: PricingDatabase, category: string): PricingRule[] {
  return database.rules.filter(rule => rule.category === category && rule.isActive);
}

// Utility function to search rules by keywords
export function searchRules(database: PricingDatabase, keywords: string[]): PricingRule[] {
  const searchTerm = keywords.join(' ').toLowerCase();
  
  return database.rules.filter(rule => {
    if (!rule.isActive) return false;
    
    const searchableText = [
      rule.category,
      rule.subcategory || '',
      rule.description
    ].join(' ').toLowerCase();
    
    return keywords.some(keyword => 
      searchableText.includes(keyword.toLowerCase())
    );
  });
}