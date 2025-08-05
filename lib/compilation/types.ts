// Estimate Compilation Types - BF-005 Implementation

import { PricingCalculation } from '../pricing/types';

export interface ProjectSummary {
  id: string;
  name: string;
  address: string;
  clientName: string;
  clientContact: string;
  totalSquareFootage?: number;
  totalLinearFootage?: number;
  projectType: string;
  estimatedDuration: Duration;
  createdAt: Date;
  lastModified: Date;
}

export interface Duration {
  value: number;
  unit: 'days' | 'weeks' | 'months';
  startDate?: Date;
  endDate?: Date;
}

export interface WorkPhase {
  id: string;
  phase: string;
  category: string;
  sequenceOrder: number;
  items: EstimateLineItem[];
  phaseTotal: number;
  duration: Duration;
  prerequisites: string[];
  description?: string;
  riskLevel: 'low' | 'medium' | 'high';
  permitRequired: boolean;
  inspectionRequired: boolean;
}

export interface EstimateLineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  materialCost: number;
  laborCost: number;
  equipmentCost: number;
  lineItemTotal: number;
  confidenceScore: number;
  phase: string;
  category: string;
  sourceCalculation?: PricingCalculation;
  notes?: string;
  riskFactors: string[];
  wasteFactor: number;
  laborHours: number;
}

export interface CostSummary {
  // Direct costs
  materialTotal: number;
  laborTotal: number;
  equipmentTotal: number;
  directCostTotal: number;

  // Indirect costs
  overhead: number;           // 15% default
  generalConditions: number;  // 5% default
  markup: number;            // 20% default
  contingency: number;       // 5% default
  bonding?: number;          // 2% if required
  permits: number;

  // Final totals
  indirectCostTotal: number;
  contractTotal: number;
  
  // Per-unit costs
  costPerSF?: number;
  costPerLF?: number;

  // Business metrics
  grossMargin: number;
  markupPercentage: number;
  laborPercentage: number;
  materialPercentage: number;
  equipmentPercentage: number;
}

export interface QualityMetrics {
  overallConfidence: number;        // 0-1 scale
  dataCompleteness: number;         // 0-1 scale
  priceAccuracy: number;           // 0-1 scale
  scopeCompleteness: number;       // 0-1 scale
  riskFactors: RiskAssessment[];
  warnings: QualityWarning[];
  benchmarkComparison: BenchmarkAnalysis;
  auditTrail: AuditEntry[];
}

export interface RiskAssessment {
  id: string;
  category: 'cost' | 'schedule' | 'quality' | 'safety' | 'regulatory';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  mitigation: string;
  probability: number; // 0-1 scale
  costImpact?: number;
  scheduleImpact?: Duration;
}

export interface QualityWarning {
  id: string;
  type: 'missing_data' | 'price_anomaly' | 'scope_gap' | 'risk_factor' | 'benchmark_deviation';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  recommendation: string;
  affectedItems: string[];
  autoFixable: boolean;
}

export interface BenchmarkAnalysis {
  totalCostPerSF: {
    estimate: number;
    marketLow: number;
    marketHigh: number;
    marketAverage: number;
    deviation: number;
  };
  laborRatio: {
    estimate: number;
    industryStandard: number;
    deviation: number;
  };
  materialRatio: {
    estimate: number;
    industryStandard: number;
    deviation: number;
  };
  overheadRatio: {
    estimate: number;
    industryStandard: number;
    deviation: number;
  };
  recommendedAdjustments: string[];
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  details: any;
  previousValue?: any;
  newValue?: any;
}

export interface EstimateRecommendation {
  id: string;
  category: 'cost_optimization' | 'risk_mitigation' | 'competitive_positioning' | 'project_execution';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    costSavings?: number;
    timeReduction?: Duration;
    riskReduction?: number;
    qualityImprovement?: string;
  };
  implementation: {
    effort: 'easy' | 'medium' | 'hard';
    timeline: Duration;
    requirements: string[];
  };
  tradeoffs: string[];
  confidence: number; // 0-1 scale
}

export interface AlternativeEstimate {
  id: string;
  name: string;
  description: string;
  costVariation: number;     // -0.15 = 15% reduction
  timeVariation: number;     // 0.05 = 5% increase
  riskLevel: 'lower' | 'same' | 'higher';
  qualityLevel: 'lower' | 'same' | 'higher';
  tradeoffs: string[];
  advantages: string[];
  targetMarket: string;
  costSummary: CostSummary;
  modifiedPhases: WorkPhase[];
  recommendations: EstimateRecommendation[];
}

export interface CompleteEstimate {
  id: string;
  project: ProjectSummary;
  workBreakdown: WorkPhase[];
  costSummary: CostSummary;
  qualityMetrics: QualityMetrics;
  recommendations: EstimateRecommendation[];
  alternativeScenarios: AlternativeEstimate[];
  
  // Metadata
  version: string;
  status: 'draft' | 'review' | 'approved' | 'sent' | 'accepted' | 'rejected';
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  expirationDate: Date;
  
  // Export options
  exportFormats: EstimateExportFormat[];
  clientPresentationReady: boolean;
}

export interface EstimateExportFormat {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  template: 'professional' | 'detailed' | 'summary' | 'client_friendly';
  includeDetails: boolean;
  includePricing: boolean;
  includeRecommendations: boolean;
  watermark?: string;
}

// Compilation Configuration
export interface CompilationConfig {
  // Cost multipliers
  overheadRate: number;        // 0.15 = 15%
  generalConditionsRate: number; // 0.05 = 5%
  markupRate: number;          // 0.20 = 20%
  contingencyRate: number;     // 0.05 = 5%
  bondingRate?: number;        // 0.02 = 2%
  
  // Quality thresholds
  minimumConfidence: number;   // 0.70 = 70%
  maxPriceDeviation: number;   // 0.25 = 25%
  
  // Benchmark data
  marketRates: {
    laborPercentage: number;   // 0.45 = 45%
    materialPercentage: number; // 0.35 = 35%
    equipmentPercentage: number; // 0.10 = 10%
    overheadPercentage: number; // 0.10 = 10%
  };
  
  // Work phase templates
  standardPhases: string[];
  phaseSequencing: Record<string, string[]>; // phase -> prerequisites
  
  // Export settings
  defaultExportFormat: EstimateExportFormat;
  clientTemplates: Record<string, EstimateExportFormat>;
}

// Default work phases for construction projects
export const DEFAULT_WORK_PHASES = [
  'Pre-Construction',
  'Site Preparation',
  'Foundation',
  'Framing',
  'Roofing',
  'Mechanical Systems',
  'Electrical',
  'Plumbing',
  'Insulation',
  'Drywall',
  'Flooring',
  'Interior Finishes',
  'Exterior Finishes',
  'Final Cleanup',
  'Inspection & Completion'
] as const;

export type WorkPhaseType = typeof DEFAULT_WORK_PHASES[number];

// Phase sequencing rules
export const PHASE_PREREQUISITES: Record<string, string[]> = {
  'Site Preparation': ['Pre-Construction'],
  'Foundation': ['Site Preparation'],
  'Framing': ['Foundation'],
  'Roofing': ['Framing'],
  'Mechanical Systems': ['Framing', 'Roofing'],
  'Electrical': ['Framing'],
  'Plumbing': ['Framing'],
  'Insulation': ['Mechanical Systems', 'Electrical', 'Plumbing'],
  'Drywall': ['Insulation'],
  'Flooring': ['Drywall'],
  'Interior Finishes': ['Flooring'],
  'Exterior Finishes': ['Roofing'],
  'Final Cleanup': ['Interior Finishes', 'Exterior Finishes'],
  'Inspection & Completion': ['Final Cleanup']
};