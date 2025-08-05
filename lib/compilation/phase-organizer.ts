// Work Phase Organization and Sequencing - BF-005 Implementation

import { 
  WorkPhase, 
  EstimateLineItem, 
  Duration,
  DEFAULT_WORK_PHASES,
  PHASE_PREREQUISITES,
  WorkPhaseType 
} from './types';
import { PricingCalculation, CONSTRUCTION_CATEGORIES } from '../pricing/types';

export class PhaseOrganizer {
  
  /**
   * Organize pricing calculations into work phases
   */
  organizeIntoPhases(calculations: PricingCalculation[]): WorkPhase[] {
    // Group calculations by category/phase
    const phaseGroups = this.groupCalculationsByPhase(calculations);
    
    // Create work phases
    const workPhases: WorkPhase[] = [];
    
    const entries = Array.from(phaseGroups.entries());
    for (const [phaseName, items] of entries) {
      const phase = this.createWorkPhase(phaseName, items);
      workPhases.push(phase);
    }
    
    // Sort phases by sequence order
    workPhases.sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    
    return workPhases;
  }

  /**
   * Group pricing calculations by their appropriate work phase
   */
  private groupCalculationsByPhase(calculations: PricingCalculation[]): Map<string, EstimateLineItem[]> {
    const phaseGroups = new Map<string, EstimateLineItem[]>();
    
    for (const calc of calculations) {
      const phaseName = this.determinePhaseFromCalculation(calc);
      const lineItem = this.convertToLineItem(calc, phaseName);
      
      if (!phaseGroups.has(phaseName)) {
        phaseGroups.set(phaseName, []);
      }
      
      phaseGroups.get(phaseName)!.push(lineItem);
    }
    
    return phaseGroups;
  }

  /**
   * Determine which work phase a calculation belongs to
   */
  private determinePhaseFromCalculation(calc: PricingCalculation): string {
    const category = this.getCategoryFromCalculation(calc);
    
    // Map categories to work phases
    const categoryToPhase: Record<string, string> = {
      [CONSTRUCTION_CATEGORIES.EXCAVATION]: 'Site Preparation',
      [CONSTRUCTION_CATEGORIES.CONCRETE]: 'Foundation',
      [CONSTRUCTION_CATEGORIES.STRUCTURAL]: 'Framing',
      [CONSTRUCTION_CATEGORIES.ROOFING]: 'Roofing',
      [CONSTRUCTION_CATEGORIES.HVAC]: 'Mechanical Systems',
      [CONSTRUCTION_CATEGORIES.ELECTRICAL]: 'Electrical',
      [CONSTRUCTION_CATEGORIES.PLUMBING]: 'Plumbing',
      [CONSTRUCTION_CATEGORIES.INSULATION]: 'Insulation',
      [CONSTRUCTION_CATEGORIES.DRYWALL]: 'Drywall',
      [CONSTRUCTION_CATEGORIES.FLOORING]: 'Flooring',
      [CONSTRUCTION_CATEGORIES.PAINTING]: 'Interior Finishes',
      [CONSTRUCTION_CATEGORIES.TRIM]: 'Interior Finishes',
      [CONSTRUCTION_CATEGORIES.DOORS_WINDOWS]: 'Interior Finishes',
      [CONSTRUCTION_CATEGORIES.SIDING]: 'Exterior Finishes',
      [CONSTRUCTION_CATEGORIES.FENCING]: 'Exterior Finishes',
      [CONSTRUCTION_CATEGORIES.PERMITS]: 'Pre-Construction'
    };

    return categoryToPhase[category] || 'Interior Finishes';
  }

  /**
   * Extract category from pricing calculation
   */
  private getCategoryFromCalculation(calc: PricingCalculation): string {
    // Try to determine from description keywords
    const desc = calc.description.toLowerCase();
    
    if (desc.includes('excavat') || desc.includes('dig') || desc.includes('site prep')) {
      return CONSTRUCTION_CATEGORIES.EXCAVATION;
    } else if (desc.includes('concrete') || desc.includes('foundation') || desc.includes('slab')) {
      return CONSTRUCTION_CATEGORIES.CONCRETE;
    } else if (desc.includes('roof')) {
      return CONSTRUCTION_CATEGORIES.ROOFING;
    } else if (desc.includes('electrical') || desc.includes('outlet') || desc.includes('switch')) {
      return CONSTRUCTION_CATEGORIES.ELECTRICAL;
    } else if (desc.includes('plumbing') || desc.includes('fixture') || desc.includes('pipe')) {
      return CONSTRUCTION_CATEGORIES.PLUMBING;
    } else if (desc.includes('flooring') || desc.includes('floor') || desc.includes('tile') || desc.includes('carpet') || desc.includes('hardwood')) {
      return CONSTRUCTION_CATEGORIES.FLOORING;
    } else if (desc.includes('paint') || desc.includes('painting')) {
      return CONSTRUCTION_CATEGORIES.PAINTING;
    } else if (desc.includes('fence') || desc.includes('fencing')) {
      return CONSTRUCTION_CATEGORIES.FENCING;
    } else if (desc.includes('siding')) {
      return CONSTRUCTION_CATEGORIES.SIDING;
    } else if (desc.includes('drywall') || desc.includes('sheetrock')) {
      return CONSTRUCTION_CATEGORIES.DRYWALL;
    } else if (desc.includes('trim') || desc.includes('molding')) {
      return CONSTRUCTION_CATEGORIES.TRIM;
    } else if (desc.includes('door') || desc.includes('window')) {
      return CONSTRUCTION_CATEGORIES.DOORS_WINDOWS;
    } else if (desc.includes('insulation')) {
      return CONSTRUCTION_CATEGORIES.INSULATION;
    } else if (desc.includes('hvac') || desc.includes('ductwork')) {
      return CONSTRUCTION_CATEGORIES.HVAC;
    }
    
    return CONSTRUCTION_CATEGORIES.STRUCTURAL; // Default
  }

  /**
   * Convert pricing calculation to estimate line item
   */
  private convertToLineItem(calc: PricingCalculation, phase: string): EstimateLineItem {
    return {
      id: calc.lineItemId,
      description: calc.description,
      quantity: calc.quantity,
      unit: calc.unit,
      materialCost: calc.materialTotal,
      laborCost: calc.laborTotal,
      equipmentCost: calc.equipmentCost || 0,
      lineItemTotal: calc.lineItemTotal,
      confidenceScore: calc.confidenceScore,
      phase,
      category: this.getCategoryFromCalculation(calc),
      sourceCalculation: calc,
      notes: this.generateLineItemNotes(calc),
      riskFactors: this.extractRiskFactors(calc),
      wasteFactor: calc.wasteAmount / calc.materialSubtotal,
      laborHours: calc.laborHours
    };
  }

  /**
   * Generate notes for line item based on calculation
   */
  private generateLineItemNotes(calc: PricingCalculation): string {
    const notes: string[] = [];
    
    if (calc.complexityLevel === 'hard') {
      notes.push('Complex installation - requires specialized skills');
    }
    
    if (calc.confidenceScore < 0.7) {
      notes.push('Low confidence - verify pricing with suppliers');
    }
    
    if (calc.wasteAmount > calc.materialSubtotal * 0.15) {
      notes.push('High waste factor - consider bulk ordering');
    }
    
    if (calc.laborHours > calc.quantity * 2) {
      notes.push('Labor intensive - schedule accordingly');
    }
    
    return notes.join('; ');
  }

  /**
   * Extract risk factors from calculation
   */
  private extractRiskFactors(calc: PricingCalculation): string[] {
    const risks: string[] = [];
    
    if (calc.confidenceScore < 0.6) {
      risks.push('Low pricing confidence');
    }
    
    if (calc.complexityLevel === 'hard') {
      risks.push('Complex installation');
    }
    
    const desc = calc.description.toLowerCase();
    if (desc.includes('electrical panel') || desc.includes('gas line')) {
      risks.push('Permit required');
    }
    
    if (desc.includes('structural') || desc.includes('load bearing')) {
      risks.push('Engineering required');
    }
    
    if (desc.includes('weather') || desc.includes('exterior') || desc.includes('roof')) {
      risks.push('Weather dependent');
    }
    
    return risks;
  }

  /**
   * Create a work phase from line items
   */
  private createWorkPhase(phaseName: string, items: EstimateLineItem[]): WorkPhase {
    const phaseTotal = items.reduce((sum, item) => sum + item.lineItemTotal, 0);
    const sequenceOrder = this.getPhaseSequenceOrder(phaseName);
    const prerequisites = PHASE_PREREQUISITES[phaseName] || [];
    const duration = this.estimatePhaseDuration(phaseName, items);
    const riskLevel = this.assessPhaseRiskLevel(items);
    
    return {
      id: `phase_${phaseName.toLowerCase().replace(/\s+/g, '_')}`,
      phase: phaseName,
      category: this.getPhaseCategory(phaseName),
      sequenceOrder,
      items,
      phaseTotal,
      prerequisites,
      duration,
      description: this.getPhaseDescription(phaseName),
      riskLevel,
      permitRequired: this.doesPhaseRequirePermit(phaseName),
      inspectionRequired: this.doesPhaseRequireInspection(phaseName)
    };
  }

  /**
   * Get sequence order for phase
   */
  private getPhaseSequenceOrder(phaseName: string): number {
    const index = DEFAULT_WORK_PHASES.indexOf(phaseName as WorkPhaseType);
    return index >= 0 ? index + 1 : 99;
  }

  /**
   * Estimate duration for phase based on items
   */
  private estimatePhaseDuration(phaseName: string, items: EstimateLineItem[]): Duration {
    const totalLaborHours = items.reduce((sum, item) => sum + item.laborHours, 0);
    const workersPerDay = this.getTypicalWorkerCount(phaseName);
    const hoursPerDay = 8;
    
    const days = Math.ceil(totalLaborHours / (workersPerDay * hoursPerDay));
    
    // Add buffer for complex phases
    const buffer = phaseName.includes('Mechanical') || phaseName.includes('Electrical') ? 1.2 : 1.1;
    const adjustedDays = Math.ceil(days * buffer);
    
    if (adjustedDays <= 7) {
      return { value: adjustedDays, unit: 'days' };
    } else if (adjustedDays <= 30) {
      return { value: Math.ceil(adjustedDays / 7), unit: 'weeks' };
    } else {
      return { value: Math.ceil(adjustedDays / 30), unit: 'months' };
    }
  }

  /**
   * Get typical worker count for phase
   */
  private getTypicalWorkerCount(phaseName: string): number {
    const workerCounts: Record<string, number> = {
      'Site Preparation': 3,
      'Foundation': 4,
      'Framing': 6,
      'Roofing': 4,
      'Mechanical Systems': 2,
      'Electrical': 2,
      'Plumbing': 2,
      'Insulation': 2,
      'Drywall': 3,
      'Flooring': 2,
      'Interior Finishes': 3,
      'Exterior Finishes': 4,
      'Final Cleanup': 2
    };
    
    return workerCounts[phaseName] || 2;
  }

  /**
   * Assess risk level for phase
   */
  private assessPhaseRiskLevel(items: EstimateLineItem[]): 'low' | 'medium' | 'high' {
    const averageConfidence = items.reduce((sum, item) => sum + item.confidenceScore, 0) / items.length;
    const hasHighRiskItems = items.some(item => item.riskFactors.length > 2);
    const hasLowConfidenceItems = items.some(item => item.confidenceScore < 0.6);
    
    if (hasHighRiskItems || hasLowConfidenceItems || averageConfidence < 0.7) {
      return 'high';
    } else if (averageConfidence < 0.8) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Get phase category
   */
  private getPhaseCategory(phaseName: string): string {
    const categories: Record<string, string> = {
      'Pre-Construction': 'Planning',
      'Site Preparation': 'Site Work',
      'Foundation': 'Structure',
      'Framing': 'Structure',
      'Roofing': 'Envelope',
      'Mechanical Systems': 'Systems',
      'Electrical': 'Systems',
      'Plumbing': 'Systems',
      'Insulation': 'Envelope',
      'Drywall': 'Interior',
      'Flooring': 'Interior',
      'Interior Finishes': 'Interior',
      'Exterior Finishes': 'Exterior',
      'Final Cleanup': 'Completion',
      'Inspection & Completion': 'Completion'
    };
    
    return categories[phaseName] || 'General';
  }

  /**
   * Get phase description
   */
  private getPhaseDescription(phaseName: string): string {
    const descriptions: Record<string, string> = {
      'Pre-Construction': 'Planning, permits, and project setup',
      'Site Preparation': 'Excavation, grading, and site utilities',
      'Foundation': 'Concrete foundation and basement work',
      'Framing': 'Structural framing and rough carpentry',
      'Roofing': 'Roof installation and weatherproofing',
      'Mechanical Systems': 'HVAC installation and ductwork',
      'Electrical': 'Electrical rough-in and panel installation',
      'Plumbing': 'Plumbing rough-in and fixture installation',
      'Insulation': 'Thermal and acoustic insulation',
      'Drywall': 'Drywall installation and finishing',
      'Flooring': 'Floor installation and finishing',
      'Interior Finishes': 'Trim, paint, and interior fixtures',
      'Exterior Finishes': 'Siding, exterior paint, and landscaping',
      'Final Cleanup': 'Construction cleanup and punch list',
      'Inspection & Completion': 'Final inspections and project closeout'
    };
    
    return descriptions[phaseName] || 'Construction work';
  }

  /**
   * Check if phase requires permits
   */
  private doesPhaseRequirePermit(phaseName: string): boolean {
    const permitPhases = [
      'Foundation',
      'Framing', 
      'Roofing',
      'Electrical',
      'Plumbing',
      'Mechanical Systems'
    ];
    
    return permitPhases.includes(phaseName);
  }

  /**
   * Check if phase requires inspection
   */
  private doesPhaseRequireInspection(phaseName: string): boolean {
    const inspectionPhases = [
      'Foundation',
      'Framing',
      'Electrical',
      'Plumbing',
      'Mechanical Systems',
      'Final Cleanup'
    ];
    
    return inspectionPhases.includes(phaseName);
  }

  /**
   * Validate phase sequencing
   */
  validatePhaseSequencing(phases: WorkPhase[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    const phaseNames = phases.map(p => p.phase);
    
    // Check if all prerequisites are present
    for (const phase of phases) {
      for (const prerequisite of phase.prerequisites) {
        if (!phaseNames.includes(prerequisite)) {
          issues.push(`Phase "${phase.phase}" requires "${prerequisite}" which is not present`);
        }
      }
    }
    
    // Check for sequence order conflicts
    const sortedPhases = [...phases].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    for (let i = 0; i < sortedPhases.length; i++) {
      const phase = sortedPhases[i];
      for (const prerequisite of phase.prerequisites) {
        const prereqPhase = phases.find(p => p.phase === prerequisite);
        if (prereqPhase && prereqPhase.sequenceOrder >= phase.sequenceOrder) {
          issues.push(`Phase "${phase.phase}" sequence order (${phase.sequenceOrder}) should be after prerequisite "${prerequisite}" (${prereqPhase.sequenceOrder})`);
        }
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Calculate total project duration
   */
  calculateProjectDuration(phases: WorkPhase[]): Duration {
    // This is a simplified calculation - in reality, phases can overlap
    const totalDays = phases.reduce((sum, phase) => {
      const days = phase.duration.unit === 'days' ? phase.duration.value :
                   phase.duration.unit === 'weeks' ? phase.duration.value * 7 :
                   phase.duration.value * 30;
      return sum + days;
    }, 0);
    
    if (totalDays <= 30) {
      return { value: totalDays, unit: 'days' };
    } else if (totalDays <= 365) {
      return { value: Math.ceil(totalDays / 30), unit: 'months' };
    } else {
      return { value: Math.ceil(totalDays / 365), unit: 'months' };
    }
  }
}