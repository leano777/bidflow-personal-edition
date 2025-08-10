// Alternates and Multi-Phase Scenario Handling Types - Step 8 Implementation

import { 
  WorkPhase, 
  EstimateLineItem, 
  Duration, 
  CostSummary,
  EstimateRecommendation,
  ProjectSummary 
} from './types';
import { OrganizedScope } from '../voice-scope/types';

// Base Scope Tree Structure
export interface BaseScopeTree {
  id: string;
  name: string;
  description: string;
  baseScope: OrganizedScope;
  basePhases: WorkPhase[];
  baseCostSummary: CostSummary;
  createdAt: Date;
  lastModified: Date;
}

// Alternate Scope that inherits from base
export interface AlternateScope {
  id: string;
  name: string;
  description: string;
  parentScopeId: string; // Reference to BaseScopeTree
  alternateType: 'value_engineering' | 'premium' | 'fast_track' | 'budget' | 'conservative' | 'custom';
  
  // Inheritance structure
  inheritsFrom: BaseScopeTree;
  
  // Only store modifications/deltas from base
  scopeModifications: ScopeModification[];
  phaseModifications: PhaseModification[];
  
  // Differential pricing (only deltas)
  costDeltas: CostDelta[];
  totalDeltaCost: number;
  deltaPercentage: number;
  
  // Timeline adjustments
  timeDeltas: TimeDelta[];
  totalTimeDelta: Duration;
  
  // Quality and risk adjustments
  qualityLevelDelta: 'lower' | 'same' | 'higher';
  riskLevelDelta: 'lower' | 'same' | 'higher';
  
  // Computed properties (base + deltas)
  computedCostSummary?: CostSummary;
  computedPhases?: WorkPhase[];
  
  createdAt: Date;
  lastModified: Date;
}

// Scope modifications from base
export interface ScopeModification {
  id: string;
  type: 'add' | 'remove' | 'modify' | 'replace';
  targetPath: string; // Path to the scope element being modified
  
  // For add operations
  addedItems?: EstimateLineItem[];
  
  // For remove operations
  removedItemIds?: string[];
  
  // For modify operations
  modifications?: {
    itemId: string;
    changes: Partial<EstimateLineItem>;
  }[];
  
  // For replace operations
  replacements?: {
    originalId: string;
    newItem: EstimateLineItem;
  }[];
  
  reason: string;
  impact: {
    costDelta: number;
    timeDelta: Duration;
    qualityImpact: string;
  };
}

// Phase modifications
export interface PhaseModification {
  id: string;
  phaseId: string;
  modificationType: 'add' | 'remove' | 'modify' | 'split' | 'merge';
  
  // For phase splitting/merging
  affectedPhaseIds?: string[];
  newPhases?: Partial<WorkPhase>[];
  
  // For phase modification
  phaseChanges?: Partial<WorkPhase>;
  
  // For item modifications within phase
  itemModifications?: ScopeModification[];
  
  reason: string;
  impact: PhaseModificationImpact;
}

export interface PhaseModificationImpact {
  costDelta: number;
  scheduleDelta: Duration;
  riskChange: 'lower' | 'same' | 'higher';
  prerequisiteChanges: string[];
  resourceRequirementChanges: string[];
}

// Cost deltas for differential pricing
export interface CostDelta {
  id: string;
  category: 'material' | 'labor' | 'equipment' | 'overhead' | 'markup' | 'contingency';
  subcategory?: string;
  description: string;
  
  // Delta amounts (can be positive or negative)
  baseCost: number;
  deltaCost: number;
  newCost: number;
  deltaPercentage: number;
  
  // Source of the delta
  sourceModification: string; // Reference to ScopeModification or PhaseModification
  
  // Breakdown
  breakdown: {
    quantity?: number;
    unitCost?: number;
    multiplier?: number;
    adjustment?: number;
  };
  
  // Justification
  reason: string;
  confidence: number;
}

// Time deltas for schedule adjustments
export interface TimeDelta {
  id: string;
  phaseId: string;
  category: 'duration' | 'sequence' | 'resource' | 'efficiency';
  description: string;
  
  baseDuration: Duration;
  deltaDuration: Duration;
  newDuration: Duration;
  deltaPercentage: number;
  
  reason: string;
  impact: string[];
}

// Multi-Phase Calendar System
export interface PhasingCalendar {
  id: string;
  name: string;
  description: string;
  projectId: string;
  
  // Calendar periods with different rates
  periods: CalendarPeriod[];
  
  // Labor rate adjustments by time
  laborRateAdjustments: LaborRateAdjustment[];
  
  // Learning curve configurations
  learningCurves: LearningCurve[];
  
  // Work schedule templates
  workSchedules: WorkScheduleTemplate[];
  
  // Holiday and weather considerations
  scheduleConstraints: ScheduleConstraint[];
  
  createdAt: Date;
  lastModified: Date;
}

// Calendar periods with different pricing
export interface CalendarPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  
  // Rate multipliers for this period
  rateMultipliers: {
    standard: number;      // Regular hours (1.0 = base rate)
    overtime: number;      // Overtime hours (1.5 = time and a half)
    weekend: number;       // Weekend work (2.0 = double time)
    holiday: number;       // Holiday work (2.5 = holiday pay)
    night: number;         // Night shift (1.2 = night differential)
  };
  
  // Productivity adjustments
  productivityFactors: {
    temperature?: number;  // Weather impact on productivity
    daylight?: number;     // Daylight hours impact
    seasonality?: number;  // Seasonal productivity changes
  };
  
  // Special considerations
  constraints: string[];
  notes?: string;
}

// Labor rate adjustments over time
export interface LaborRateAdjustment {
  id: string;
  tradeCategory: string;
  skillLevel: 'unskilled' | 'semi-skilled' | 'skilled' | 'specialist';
  
  // Time-based adjustments
  timeOfDay: {
    regular: { start: string; end: string; multiplier: number };    // "08:00" - "17:00", 1.0
    overtime: { start: string; end: string; multiplier: number };   // "17:00" - "20:00", 1.5
    night: { start: string; end: string; multiplier: number };      // "20:00" - "08:00", 1.2
  };
  
  // Day-based adjustments
  dayOfWeek: {
    weekday: number;       // Monday-Friday multiplier (1.0)
    saturday: number;      // Saturday multiplier (1.5)
    sunday: number;        // Sunday multiplier (2.0)
  };
  
  // Seasonal adjustments
  seasonalFactors: {
    spring: number;        // March-May
    summer: number;        // June-August  
    fall: number;          // September-November
    winter: number;        // December-February
  };
  
  // Geographic zone adjustments
  locationFactors?: {
    urban: number;         // Urban area multiplier
    suburban: number;      // Suburban area multiplier
    rural: number;         // Rural area multiplier
  };
  
  effectiveDate: Date;
  expirationDate?: Date;
}

// Learning curves for repeated work
export interface LearningCurve {
  id: string;
  name: string;
  description: string;
  
  // Applicable scope
  applicableTrades: string[];
  applicableCategories: string[];
  
  // Curve parameters
  initialEfficiency: number;      // Starting efficiency (0.8 = 80% efficient)
  finalEfficiency: number;        // Final efficiency after learning (1.2 = 120% efficient)
  learningRate: number;           // Rate of improvement (0.85 = 85% learning curve)
  repetitionsToFinalEfficiency: number;  // Number of repetitions to reach final efficiency
  
  // Application rules
  minimumRepetitions: number;     // Minimum repetitions for curve to apply
  applicableUnits: string[];      // Units where learning applies (SF, LF, EA)
  
  // Time frame
  resetPeriod?: Duration;         // Reset learning if gap exceeds this
  
  // Implementation
  applyTo: 'labor_hours' | 'labor_cost' | 'total_cost';
  
  confidence: number;
  source: string; // Source of learning curve data
}

// Work schedule templates
export interface WorkScheduleTemplate {
  id: string;
  name: string;
  description: string;
  
  // Standard work week
  standardWeek: {
    monday: WorkDaySchedule;
    tuesday: WorkDaySchedule;
    wednesday: WorkDaySchedule;
    thursday: WorkDaySchedule;
    friday: WorkDaySchedule;
    saturday: WorkDaySchedule;
    sunday: WorkDaySchedule;
  };
  
  // Special schedules for different trades
  tradeSpecificSchedules?: {
    [trade: string]: Partial<WorkScheduleTemplate['standardWeek']>;
  };
  
  // Seasonal variations
  seasonalAdjustments?: {
    [season: string]: {
      hoursAdjustment: number;
      productivityAdjustment: number;
      availabilityAdjustment: number;
    };
  };
}

export interface WorkDaySchedule {
  workingHours: {
    start: string;         // "08:00"
    end: string;           // "17:00"
    breakDuration: number; // Minutes
    lunchDuration: number; // Minutes
  };
  maxOvertimeHours: number;
  isWorkingDay: boolean;
  notes?: string;
}

// Schedule constraints
export interface ScheduleConstraint {
  id: string;
  type: 'holiday' | 'weather' | 'permit' | 'inspection' | 'delivery' | 'custom';
  name: string;
  description: string;
  
  // Time constraints
  startDate: Date;
  endDate: Date;
  affectedDays?: string[]; // ['monday', 'tuesday'] for recurring constraints
  
  // Impact on work
  impact: {
    workProhibited: boolean;     // No work allowed
    reducedProductivity?: number; // 0.7 = 70% productivity
    increasedCosts?: number;     // Additional cost multiplier
    requiredAdjustments: string[]; // Required adjustments
  };
  
  // Affected trades/phases
  affectedTrades?: string[];
  affectedPhases?: string[];
  
  // Mitigation strategies
  mitigationOptions?: string[];
  
  isRecurring: boolean;
  recurrencePattern?: string; // Cron-like pattern for recurring constraints
}

// Alternate comparison and analysis
export interface AlternateComparison {
  id: string;
  name: string;
  baseScope: BaseScopeTree;
  alternates: AlternateScope[];
  
  // Comparison matrix
  comparisonMatrix: {
    alternateId: string;
    name: string;
    totalCost: number;
    costDelta: number;
    costDeltaPercentage: number;
    totalTime: Duration;
    timeDelta: Duration;
    timeDeltaPercentage: number;
    qualityLevel: 'lower' | 'same' | 'higher';
    riskLevel: 'lower' | 'same' | 'higher';
    advantages: string[];
    disadvantages: string[];
    recommendationScore: number;
  }[];
  
  // Analysis results
  analysis: {
    bestValue: string;           // Alternate ID
    lowestCost: string;          // Alternate ID  
    fastestCompletion: string;   // Alternate ID
    highestQuality: string;      // Alternate ID
    lowestRisk: string;          // Alternate ID
    mostInnovative: string;      // Alternate ID
  };
  
  // Recommendations
  recommendations: EstimateRecommendation[];
  
  // Sensitivity analysis
  sensitivityAnalysis: {
    parameter: string;
    baseValue: number;
    sensitivities: {
      change: number;          // -10% to +10%
      impactOnCost: number;    // Dollar impact
      impactOnSchedule: number; // Day impact
      affectedAlternates: string[];
    }[];
  }[];
  
  createdAt: Date;
  lastModified: Date;
}

// Multi-phase project execution plan
export interface MultiPhaseExecutionPlan {
  id: string;
  name: string;
  projectId: string;
  selectedAlternate: AlternateScope;
  
  // Phase breakdown with calendar integration
  executionPhases: ExecutionPhase[];
  
  // Resource allocation across phases
  resourcePlanning: ResourceAllocation[];
  
  // Calendar integration
  calendar: PhasingCalendar;
  
  // Cost projection across phases
  costProjection: PhaseCostProjection[];
  
  // Risk management across phases
  riskManagement: PhaseRiskManagement[];
  
  // Performance tracking
  performanceMetrics: ExecutionPerformanceMetric[];
  
  createdAt: Date;
  lastModified: Date;
}

export interface ExecutionPhase {
  id: string;
  name: string;
  description: string;
  sequenceOrder: number;
  
  // Original work phase reference
  workPhase: WorkPhase;
  
  // Calendar-adjusted scheduling
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  
  // Resource requirements
  requiredResources: {
    laborHours: number;
    crewSize: number;
    equipmentNeeded: string[];
    materialDeliveries: MaterialDelivery[];
  };
  
  // Calendar-adjusted costs
  adjustedCosts: {
    baseCost: number;
    calendarAdjustments: number;
    learningCurveAdjustments: number;
    totalAdjustedCost: number;
  };
  
  // Dependencies and constraints
  prerequisites: string[];
  constraints: ScheduleConstraint[];
  
  // Progress tracking
  progress: {
    percentComplete: number;
    costToDate: number;
    varianceFromPlan: number;
    qualityMetrics: any[];
  };
  
  status: 'planned' | 'in_progress' | 'completed' | 'delayed' | 'cancelled';
}

export interface MaterialDelivery {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  scheduledDelivery: Date;
  supplier: string;
  cost: number;
  leadTime: Duration;
  storageRequirements: string[];
}

export interface ResourceAllocation {
  id: string;
  phaseId: string;
  resourceType: 'labor' | 'equipment' | 'material' | 'subcontractor';
  
  allocation: {
    startDate: Date;
    endDate: Date;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
  };
  
  // Calendar adjustments
  calendarAdjustments: {
    baseRate: number;
    adjustedRate: number;
    adjustmentFactors: string[];
    totalAdjustment: number;
  };
  
  // Learning curve impact
  learningCurveImpact?: {
    initialEfficiency: number;
    currentEfficiency: number;
    projectedEfficiency: number;
    costImpact: number;
  };
  
  // Constraints and availability
  constraints: string[];
  availability: number; // 0.0 to 1.0
}

export interface PhaseCostProjection {
  phaseId: string;
  phaseName: string;
  
  // Base costs
  baseCosts: {
    material: number;
    labor: number;
    equipment: number;
    overhead: number;
  };
  
  // Calendar adjustments
  calendarAdjustments: {
    weekendWork: number;
    overtimeWork: number;
    nightWork: number;
    holidayWork: number;
    seasonalAdjustments: number;
    totalAdjustments: number;
  };
  
  // Learning curve benefits
  learningCurveBenefits: {
    expectedSavings: number;
    confidenceLevel: number;
    applicableCategories: string[];
  };
  
  // Risk contingencies
  riskContingencies: {
    weatherRisk: number;
    scheduleRisk: number;
    qualityRisk: number;
    marketRisk: number;
    totalContingency: number;
  };
  
  // Final projection
  projectedCost: {
    optimistic: number;
    mostLikely: number;
    pessimistic: number;
    expectedValue: number;
    standardDeviation: number;
  };
}

export interface PhaseRiskManagement {
  phaseId: string;
  phaseName: string;
  
  identifiedRisks: {
    id: string;
    category: string;
    description: string;
    probability: number;
    impact: number;
    riskScore: number;
    mitigation: string;
    contingencyPlan: string;
    owner: string;
  }[];
  
  riskResponse: {
    accept: string[];
    mitigate: string[];
    transfer: string[];
    avoid: string[];
  };
  
  contingencyReserves: {
    cost: number;
    schedule: Duration;
    quality: string[];
  };
}

export interface ExecutionPerformanceMetric {
  metricName: string;
  category: 'cost' | 'schedule' | 'quality' | 'safety' | 'productivity';
  
  target: number;
  actual?: number;
  variance?: number;
  trend: 'improving' | 'stable' | 'declining';
  
  measurementFrequency: 'daily' | 'weekly' | 'phase-end' | 'milestone';
  lastMeasured?: Date;
  
  thresholds: {
    green: number;    // Acceptable performance
    yellow: number;   // Warning threshold
    red: number;      // Critical threshold
  };
  
  corrective_actions?: string[];
}

// Utility types for delta calculations
export type DeltaCalculationMethod = 'absolute' | 'percentage' | 'compound' | 'parametric';

export interface DeltaCalculationConfig {
  method: DeltaCalculationMethod;
  baselineValue: number;
  adjustmentValue: number;
  compoundingFactors?: number[];
  parametricModel?: {
    variables: Record<string, number>;
    coefficients: Record<string, number>;
    formula: string;
  };
}
