// Voice-to-Scope Transcription Types - BF-003 Implementation

export interface ScopeCapture {
  id: string;
  audioBlob?: Blob;
  transcription: string;
  editedText: string;
  contextPhotos: string[];
  measurements: VoiceMeasurement[];
  timestamp: Date;
  duration?: number; // Recording duration in seconds
  confidence?: number; // Transcription confidence 0-1
}

export interface VoiceMeasurement {
  id: string;
  rawText: string; // "twenty by thirty feet"
  parsedValue: number;
  unit: string;
  type: 'linear' | 'square' | 'cubic' | 'count';
  confidence: number;
  context?: string; // Surrounding text for context
}

export interface OrganizedScope {
  id: string;
  projectSummary: string;
  workCategories: WorkCategory[];
  materialSpecs: MaterialSpec[];
  laborRequirements: LaborRequirement[];
  specialConsiderations: string[];
  estimatedTimeline: string;
  confidence: number;
  sourceCapture: string; // Reference to ScopeCapture id
  createdAt: Date;
}

export interface WorkCategory {
  id: string;
  category: string; // "Demolition", "Framing", "Electrical", etc.
  trade: string;
  items: ScopeItem[];
  sequenceOrder: number;
  prerequisites: string[];
  estimatedDuration: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ScopeItem {
  id: string;
  description: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  priority: 'required' | 'recommended' | 'optional';
  estimatedCost?: number;
  laborHours?: number;
}

export interface MaterialSpec {
  id: string;
  name: string;
  category: string;
  specification: string;
  quantity?: number;
  unit?: string;
  grade?: string;
  alternatives?: string[];
  notes?: string;
}

export interface LaborRequirement {
  id: string;
  trade: string;
  skillLevel: 'unskilled' | 'semi-skilled' | 'skilled' | 'specialist';
  hoursRequired: number;
  crewSize: number;
  licensing?: string[];
  notes?: string;
}

export interface TranscriptionOptions {
  language?: string; // Default 'en-US'
  includeTimestamps?: boolean;
  filterProfanity?: boolean;
  enhanceConstruction?: boolean; // Use construction terminology
  realTime?: boolean; // Real-time vs batch processing
}

export interface AudioProcessingOptions {
  noiseReduction?: boolean;
  autoGainControl?: boolean;
  echoCancellation?: boolean;
  sampleRate?: number; // Default 44100
  format?: 'wav' | 'mp3' | 'webm';
}

export interface VoiceRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioLevel: number; // 0-100 for visual feedback
  error?: string;
}

export interface ConstructionTerminology {
  terms: Record<string, string[]>; // category -> terms
  measurements: string[]; // Common measurement phrases
  materials: string[]; // Common material names
  trades: string[]; // Trade names and variations
  corrections: Record<string, string>; // Common misheard -> correct
}

export interface ScopeAnalysisPrompt {
  transcription: string;
  measurements: VoiceMeasurement[];
  photos?: string[]; // Base64 encoded or URLs
  context?: {
    projectType?: string;
    location?: string;
    clientRequirements?: string;
  };
}

export interface ScopeAnalysisResult {
  organized: OrganizedScope;
  suggestions: string[];
  warnings: string[];
  confidence: number;
  processingTime: number;
}

// Construction trade categories
export const CONSTRUCTION_TRADES = {
  GENERAL: 'General Construction',
  DEMOLITION: 'Demolition',
  EXCAVATION: 'Excavation',
  CONCRETE: 'Concrete',
  FRAMING: 'Framing',
  ROOFING: 'Roofing',
  SIDING: 'Siding',
  ELECTRICAL: 'Electrical',
  PLUMBING: 'Plumbing',
  HVAC: 'HVAC',
  INSULATION: 'Insulation',
  DRYWALL: 'Drywall',
  FLOORING: 'Flooring',
  PAINTING: 'Painting',
  TRIM: 'Trim & Millwork',
  CABINETS: 'Cabinets',
  COUNTERTOPS: 'Countertops',
  APPLIANCES: 'Appliances',
  FIXTURES: 'Fixtures',
  LANDSCAPING: 'Landscaping',
  CLEANUP: 'Cleanup'
} as const;

export type ConstructionTrade = typeof CONSTRUCTION_TRADES[keyof typeof CONSTRUCTION_TRADES];

// Priority levels for scope items
export const PRIORITY_LEVELS = {
  REQUIRED: 'required',
  RECOMMENDED: 'recommended', 
  OPTIONAL: 'optional'
} as const;

export type PriorityLevel = typeof PRIORITY_LEVELS[keyof typeof PRIORITY_LEVELS];

// Common measurement units and their variations
export const MEASUREMENT_UNITS = {
  LINEAR: {
    primary: 'LF',
    variations: ['feet', 'foot', 'ft', 'linear feet', 'running feet'],
    conversions: { 'inches': 12, 'yards': 0.333, 'meters': 3.281 }
  },
  SQUARE: {
    primary: 'SF',
    variations: ['square feet', 'sq ft', 'ft²', 'square foot'],
    conversions: { 'square yards': 9, 'square meters': 10.764 }
  },
  CUBIC: {
    primary: 'CF',
    variations: ['cubic feet', 'cu ft', 'ft³', 'cubic yards', 'CY', 'yd³'],
    conversions: { 'cubic yards': 27, 'cubic meters': 35.314 }
  },
  COUNT: {
    primary: 'EA',
    variations: ['each', 'piece', 'pc', 'unit', 'item'],
    conversions: {}
  }
} as const;

// Skill level definitions
export const SKILL_LEVELS = {
  UNSKILLED: {
    level: 'unskilled',
    description: 'General labor, no special training required',
    hourlyRange: [18, 25],
    examples: ['cleanup', 'material handling', 'basic demolition']
  },
  SEMI_SKILLED: {
    level: 'semi-skilled',
    description: 'Basic trade knowledge, some training required',
    hourlyRange: [25, 40],
    examples: ['drywall hanging', 'basic carpentry', 'painting prep']
  },
  SKILLED: {
    level: 'skilled',
    description: 'Licensed trade professional with experience',
    hourlyRange: [40, 75],
    examples: ['electrical work', 'plumbing', 'framing', 'finish carpentry']
  },
  SPECIALIST: {
    level: 'specialist',
    description: 'Expert-level work, specialized skills/equipment',
    hourlyRange: [75, 150],
    examples: ['structural engineering', 'custom millwork', 'high-end finishes']
  }
} as const;

export type SkillLevel = keyof typeof SKILL_LEVELS;

// Default construction terminology for enhanced transcription
export const DEFAULT_CONSTRUCTION_TERMS: ConstructionTerminology = {
  terms: {
    framing: ['studs', 'joists', 'rafters', 'headers', 'plates', 'blocking'],
    electrical: ['outlets', 'switches', 'panel', 'circuits', 'conduit', 'romex'],
    plumbing: ['pipes', 'fixtures', 'faucets', 'toilets', 'showers', 'drains'],
    roofing: ['shingles', 'underlayment', 'flashing', 'gutters', 'ridge', 'eaves'],
    concrete: ['slab', 'foundation', 'footings', 'rebar', 'forms', 'cure'],
    drywall: ['sheetrock', 'mud', 'tape', 'texture', 'prime', 'sand']
  },
  measurements: [
    'feet', 'foot', 'inches', 'yards', 'square feet', 'cubic feet',
    'linear feet', 'running feet', 'by', 'times', 'deep', 'wide', 'tall'
  ],
  materials: [
    'lumber', 'plywood', 'concrete', 'rebar', 'insulation', 'vinyl',
    'hardwood', 'tile', 'carpet', 'paint', 'primer', 'caulk'
  ],
  trades: [
    'electrician', 'plumber', 'carpenter', 'roofer', 'painter', 'drywaller',
    'flooring', 'hvac', 'concrete', 'framer', 'siding'
  ],
  corrections: {
    'sheat rock': 'sheetrock',
    'dry wall': 'drywall',
    'studs': 'studs',
    'joist': 'joists',
    'rafter': 'rafters',
    'electrical panel': 'electrical panel',
    'plumbing fixture': 'plumbing fixtures'
  }
};