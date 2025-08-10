// Phasing Calendar Manager - Step 8 Implementation
// Handles labor rate adjustments and learning curves across phases

import {
  PhasingCalendar,
  CalendarPeriod,
  LaborRateAdjustment,
  LearningCurve,
  WorkScheduleTemplate,
  WorkDaySchedule,
  ScheduleConstraint,
  MultiPhaseExecutionPlan,
  ExecutionPhase,
  ResourceAllocation,
  PhaseCostProjection,
  MaterialDelivery
} from './alternates-types';
import {
  WorkPhase,
  EstimateLineItem,
  Duration,
  ProjectSummary
} from './types';
import { AlternateScope } from './alternates-types';

export class PhasingCalendarManager {
  private phasingCalendars: Map<string, PhasingCalendar> = new Map();
  private executionPlans: Map<string, MultiPhaseExecutionPlan> = new Map();

  /**
   * Create a new phasing calendar with labor rate adjustments
   */
  createPhasingCalendar(
    name: string,
    description: string,
    projectId: string,
    config: {
      periods: Partial<CalendarPeriod>[];
      laborRateAdjustments: Partial<LaborRateAdjustment>[];
      learningCurves: Partial<LearningCurve>[];
      workSchedules: Partial<WorkScheduleTemplate>[];
      constraints: Partial<ScheduleConstraint>[];
    }
  ): PhasingCalendar {
    const id = `calendar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const calendar: PhasingCalendar = {
      id,
      name,
      description,
      projectId,
      periods: this.buildCalendarPeriods(config.periods),
      laborRateAdjustments: this.buildLaborRateAdjustments(config.laborRateAdjustments),
      learningCurves: this.buildLearningCurves(config.learningCurves),
      workSchedules: this.buildWorkScheduleTemplates(config.workSchedules),
      scheduleConstraints: this.buildScheduleConstraints(config.constraints),
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.phasingCalendars.set(id, calendar);

    console.log(`📅 Created phasing calendar "${name}" with ${calendar.periods.length} periods, ${calendar.learningCurves.length} learning curves`);

    return calendar;
  }

  /**
   * Create a default construction calendar
   */
  createDefaultConstructionCalendar(projectId: string, startDate: Date, endDate: Date): PhasingCalendar {
    const yearlyCalendar = this.generateYearlyCalendar(startDate, endDate);
    const standardLaborRates = this.getStandardLaborRateAdjustments();
    const commonLearningCurves = this.getCommonLearningCurves();
    const standardWorkSchedule = this.getStandardWorkSchedule();
    const holidayConstraints = this.getHolidayConstraints(startDate, endDate);

    return this.createPhasingCalendar(
      'Standard Construction Calendar',
      'Default calendar with standard labor rates, learning curves, and constraints',
      projectId,
      {
        periods: yearlyCalendar,
        laborRateAdjustments: standardLaborRates,
        learningCurves: commonLearningCurves,
        workSchedules: [standardWorkSchedule],
        constraints: holidayConstraints
      }
    );
  }

  /**
   * Create multi-phase execution plan with calendar integration
   */
  createExecutionPlan(
    name: string,
    projectId: string,
    selectedAlternate: AlternateScope,
    calendarId: string,
    scheduledStartDate: Date
  ): MultiPhaseExecutionPlan {
    const calendar = this.phasingCalendars.get(calendarId);
    if (!calendar) {
      throw new Error(`Phasing calendar with ID ${calendarId} not found`);
    }

    const id = `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create execution phases from alternate's computed phases
    const executionPhases = this.createExecutionPhases(
      selectedAlternate.computedPhases || [],
      calendar,
      scheduledStartDate
    );

    // Generate resource planning
    const resourcePlanning = this.generateResourcePlanning(executionPhases, calendar);

    // Create cost projections with calendar adjustments
    const costProjection = this.generateCostProjections(executionPhases, calendar);

    // Initialize performance metrics
    const performanceMetrics = this.initializePerformanceMetrics(executionPhases);

    const executionPlan: MultiPhaseExecutionPlan = {
      id,
      name,
      projectId,
      selectedAlternate,
      executionPhases,
      resourcePlanning,
      calendar,
      costProjection,
      riskManagement: [], // Will be populated separately
      performanceMetrics,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.executionPlans.set(id, executionPlan);

    console.log(`📋 Created execution plan "${name}" with ${executionPhases.length} phases`);

    return executionPlan;
  }

  /**
   * Apply learning curve adjustments to cost and duration
   */
  applyLearningCurveAdjustments(
    phases: WorkPhase[],
    learningCurves: LearningCurve[]
  ): {
    adjustedPhases: WorkPhase[];
    learningCurveImpact: {
      phaseId: string;
      phaseName: string;
      curveApplied: string;
      originalCost: number;
      adjustedCost: number;
      costReduction: number;
      originalHours: number;
      adjustedHours: number;
      hoursReduction: number;
      repetitions: number;
      efficiency: number;
    }[];
  } {
    const adjustedPhases = JSON.parse(JSON.stringify(phases)); // Deep copy
    const learningCurveImpact: any[] = [];

    // Track repetitions for learning curve application
    const categoryRepetitions = new Map<string, number>();
    const tradeRepetitions = new Map<string, number>();

    for (let i = 0; i < adjustedPhases.length; i++) {
      const phase = adjustedPhases[i];
      
      // Find applicable learning curves
      const applicableCurves = learningCurves.filter(curve =>
        curve.applicableTrades.includes(phase.category) ||
        curve.applicableCategories.includes(phase.category)
      );

      for (const curve of applicableCurves) {
        // Track repetitions
        const key = `${curve.id}_${phase.category}`;
        const currentRepetitions = (categoryRepetitions.get(key) || 0) + 1;
        categoryRepetitions.set(key, currentRepetitions);

        // Apply learning curve if minimum repetitions met
        if (currentRepetitions >= curve.minimumRepetitions) {
          const efficiency = this.calculateLearningCurveEfficiency(
            curve,
            currentRepetitions
          );

          // Apply efficiency to phase costs and durations
          const originalCost = phase.phaseTotal;
          const originalLaborHours = phase.items.reduce((sum: number, item: any) => sum + item.laborHours, 0);

          let costReduction = 0;
          let hoursReduction = 0;

          if (curve.applyTo === 'labor_cost' || curve.applyTo === 'total_cost') {
            // Apply to labor costs
            for (const item of phase.items) {
              const originalLaborCost = item.laborCost;
              const adjustedLaborCost = originalLaborCost * efficiency;
              const reduction = originalLaborCost - adjustedLaborCost;
              
              item.laborCost = adjustedLaborCost;
              item.lineItemTotal = item.materialCost + item.laborCost + item.equipmentCost;
              
              costReduction += reduction;
            }
          }

          if (curve.applyTo === 'labor_hours') {
            // Apply to labor hours
            for (const item of phase.items) {
              const originalHours = item.laborHours;
              const adjustedHours = originalHours * efficiency;
              const reduction = originalHours - adjustedHours;
              
              item.laborHours = adjustedHours;
              hoursReduction += reduction;
            }
          }

          // Recalculate phase total
          phase.phaseTotal = phase.items.reduce((sum: number, item: any) => sum + item.lineItemTotal, 0);

          // Record learning curve impact
          learningCurveImpact.push({
            phaseId: phase.id,
            phaseName: phase.phase,
            curveApplied: curve.name,
            originalCost,
            adjustedCost: phase.phaseTotal,
            costReduction,
            originalHours: originalLaborHours,
            adjustedHours: phase.items.reduce((sum: number, item: any) => sum + item.laborHours, 0),
            hoursReduction,
            repetitions: currentRepetitions,
            efficiency
          });

          console.log(`🎯 Applied learning curve "${curve.name}" to ${phase.phase}: ${(efficiency * 100).toFixed(1)}% efficiency (${costReduction.toFixed(2)} cost reduction)`);
        }
      }
    }

    return {
      adjustedPhases,
      learningCurveImpact
    };
  }

  /**
   * Apply calendar-based labor rate adjustments
   */
  applyCalendarAdjustments(
    phases: WorkPhase[],
    calendar: PhasingCalendar,
    startDate: Date
  ): {
    adjustedPhases: WorkPhase[];
    calendarAdjustments: {
      phaseId: string;
      phaseName: string;
      originalCost: number;
      adjustments: {
        standard: number;
        overtime: number;
        weekend: number;
        holiday: number;
        night: number;
        seasonal: number;
        total: number;
      };
      adjustedCost: number;
    }[];
  } {
    const adjustedPhases = JSON.parse(JSON.stringify(phases)); // Deep copy
    const calendarAdjustments: any[] = [];

    let currentDate = new Date(startDate);

    for (let i = 0; i < adjustedPhases.length; i++) {
      const phase = adjustedPhases[i];
      const phaseDurationDays = this.durationToDays(phase.duration);
      const phaseEndDate = new Date(currentDate.getTime() + phaseDurationDays * 24 * 60 * 60 * 1000);
      
      // Get applicable calendar period
      const applicablePeriod = this.getApplicablePeriod(calendar, currentDate, phaseEndDate);
      
      if (applicablePeriod) {
        // Get labor rate adjustments for the phase category/trade
        const laborRateAdjustment = this.getLaborRateAdjustment(calendar, phase.category, currentDate);
        
        const originalCost = phase.phaseTotal;
        const adjustments = {
          standard: 0,
          overtime: 0,
          weekend: 0,
          holiday: 0,
          night: 0,
          seasonal: 0,
          total: 0
        };

        // Apply rate multipliers to labor costs
        for (const item of phase.items) {
          const originalLaborCost = item.laborCost;
          
          // Determine work distribution (simplified model)
          const workDistribution = this.calculateWorkDistribution(
            phaseDurationDays,
            currentDate,
            phaseEndDate,
            calendar
          );

          // Apply rate multipliers
          const standardCost = originalLaborCost * workDistribution.standard * applicablePeriod.rateMultipliers.standard;
          const overtimeCost = originalLaborCost * workDistribution.overtime * applicablePeriod.rateMultipliers.overtime;
          const weekendCost = originalLaborCost * workDistribution.weekend * applicablePeriod.rateMultipliers.weekend;
          const holidayCost = originalLaborCost * workDistribution.holiday * applicablePeriod.rateMultipliers.holiday;
          const nightCost = originalLaborCost * workDistribution.night * applicablePeriod.rateMultipliers.night;

          // Apply seasonal adjustments
          const seasonalMultiplier = laborRateAdjustment?.seasonalFactors.summer || 1.0; // Simplified
          
          const adjustedLaborCost = (standardCost + overtimeCost + weekendCost + holidayCost + nightCost) * seasonalMultiplier;
          
          // Record adjustments
          adjustments.standard += standardCost - (originalLaborCost * workDistribution.standard);
          adjustments.overtime += overtimeCost - (originalLaborCost * workDistribution.overtime);
          adjustments.weekend += weekendCost - (originalLaborCost * workDistribution.weekend);
          adjustments.holiday += holidayCost - (originalLaborCost * workDistribution.holiday);
          adjustments.night += nightCost - (originalLaborCost * workDistribution.night);
          adjustments.seasonal += (adjustedLaborCost * seasonalMultiplier) - adjustedLaborCost;

          // Update item costs
          item.laborCost = adjustedLaborCost;
          item.lineItemTotal = item.materialCost + item.laborCost + item.equipmentCost;
        }

        // Recalculate phase total
        phase.phaseTotal = phase.items.reduce((sum: number, item: any) => sum + item.lineItemTotal, 0);

        adjustments.total = Object.values(adjustments).reduce((sum, adj) => sum + adj, 0) - adjustments.total;

        calendarAdjustments.push({
          phaseId: phase.id,
          phaseName: phase.phase,
          originalCost,
          adjustments,
          adjustedCost: phase.phaseTotal
        });

        console.log(`📅 Applied calendar adjustments to ${phase.phase}: $${adjustments.total.toFixed(2)} total adjustment`);
      }

      // Advance current date for next phase
      currentDate = phaseEndDate;
    }

    return {
      adjustedPhases,
      calendarAdjustments
    };
  }

  /**
   * Generate comprehensive cost projection with all adjustments
   */
  generateComprehensiveCostProjection(
    phases: WorkPhase[],
    calendar: PhasingCalendar,
    startDate: Date
  ): {
    projectedPhases: WorkPhase[];
    totalProjection: {
      baseCost: number;
      calendarAdjustments: number;
      learningCurveSavings: number;
      riskContingency: number;
      finalProjectedCost: number;
    };
    phaseProjections: PhaseCostProjection[];
  } {
    // Step 1: Apply learning curves
    const { adjustedPhases: learningAdjustedPhases, learningCurveImpact } = 
      this.applyLearningCurveAdjustments(phases, calendar.learningCurves);

    // Step 2: Apply calendar adjustments
    const { adjustedPhases: finalAdjustedPhases, calendarAdjustments } = 
      this.applyCalendarAdjustments(learningAdjustedPhases, calendar, startDate);

    // Step 3: Generate phase-by-phase projections
    const phaseProjections = this.generateCostProjections(
      finalAdjustedPhases.map(phase => this.workPhaseToExecutionPhase(phase, calendar, startDate)),
      calendar
    );

    // Step 4: Calculate totals
    const baseCost = phases.reduce((sum, phase) => sum + phase.phaseTotal, 0);
    const finalCost = finalAdjustedPhases.reduce((sum, phase) => sum + phase.phaseTotal, 0);
    const learningCurveSavings = learningCurveImpact.reduce((sum, impact) => sum + impact.costReduction, 0);
    const calendarAdjustmentsCost = calendarAdjustments.reduce((sum, adj) => sum + adj.adjustments.total, 0);
    const riskContingency = finalCost * 0.05; // 5% risk contingency

    const totalProjection = {
      baseCost,
      calendarAdjustments: calendarAdjustmentsCost,
      learningCurveSavings,
      riskContingency,
      finalProjectedCost: finalCost + riskContingency
    };

    console.log(`📊 Generated comprehensive cost projection: Base $${baseCost.toFixed(2)} → Final $${totalProjection.finalProjectedCost.toFixed(2)}`);

    return {
      projectedPhases: finalAdjustedPhases,
      totalProjection,
      phaseProjections
    };
  }

  // Private helper methods

  private buildCalendarPeriods(periods: Partial<CalendarPeriod>[]): CalendarPeriod[] {
    return periods.map((period, index) => ({
      id: `period_${index}`,
      name: period.name || `Period ${index + 1}`,
      startDate: period.startDate || new Date(),
      endDate: period.endDate || new Date(),
      rateMultipliers: {
        standard: 1.0,
        overtime: 1.5,
        weekend: 2.0,
        holiday: 2.5,
        night: 1.2,
        ...period.rateMultipliers
      },
      productivityFactors: {
        temperature: 1.0,
        daylight: 1.0,
        seasonality: 1.0,
        ...period.productivityFactors
      },
      constraints: period.constraints || [],
      notes: period.notes
    }));
  }

  private buildLaborRateAdjustments(adjustments: Partial<LaborRateAdjustment>[]): LaborRateAdjustment[] {
    return adjustments.map((adj, index) => ({
      id: `labor_adj_${index}`,
      tradeCategory: adj.tradeCategory || 'general',
      skillLevel: adj.skillLevel || 'skilled',
      timeOfDay: {
        regular: { start: '08:00', end: '17:00', multiplier: 1.0 },
        overtime: { start: '17:00', end: '20:00', multiplier: 1.5 },
        night: { start: '20:00', end: '08:00', multiplier: 1.2 },
        ...adj.timeOfDay
      },
      dayOfWeek: {
        weekday: 1.0,
        saturday: 1.5,
        sunday: 2.0,
        ...adj.dayOfWeek
      },
      seasonalFactors: {
        spring: 1.0,
        summer: 1.0,
        fall: 1.0,
        winter: 1.1,
        ...adj.seasonalFactors
      },
      locationFactors: adj.locationFactors,
      effectiveDate: adj.effectiveDate || new Date(),
      expirationDate: adj.expirationDate
    }));
  }

  private buildLearningCurves(curves: Partial<LearningCurve>[]): LearningCurve[] {
    return curves.map((curve, index) => ({
      id: `curve_${index}`,
      name: curve.name || `Learning Curve ${index + 1}`,
      description: curve.description || 'Standard learning curve',
      applicableTrades: curve.applicableTrades || [],
      applicableCategories: curve.applicableCategories || [],
      initialEfficiency: curve.initialEfficiency || 0.8,
      finalEfficiency: curve.finalEfficiency || 1.2,
      learningRate: curve.learningRate || 0.85,
      repetitionsToFinalEfficiency: curve.repetitionsToFinalEfficiency || 10,
      minimumRepetitions: curve.minimumRepetitions || 2,
      applicableUnits: curve.applicableUnits || ['SF', 'LF', 'EA'],
      resetPeriod: curve.resetPeriod,
      applyTo: curve.applyTo || 'labor_cost',
      confidence: curve.confidence || 0.8,
      source: curve.source || 'Industry standard'
    }));
  }

  private buildWorkScheduleTemplates(templates: Partial<WorkScheduleTemplate>[]): WorkScheduleTemplate[] {
    const defaultWorkDay: WorkDaySchedule = {
      workingHours: {
        start: '08:00',
        end: '17:00',
        breakDuration: 15,
        lunchDuration: 60
      },
      maxOvertimeHours: 4,
      isWorkingDay: true
    };

    return templates.map((template, index) => ({
      id: `schedule_${index}`,
      name: template.name || `Work Schedule ${index + 1}`,
      description: template.description || 'Standard work schedule',
      standardWeek: {
        monday: { ...defaultWorkDay, ...template.standardWeek?.monday },
        tuesday: { ...defaultWorkDay, ...template.standardWeek?.tuesday },
        wednesday: { ...defaultWorkDay, ...template.standardWeek?.wednesday },
        thursday: { ...defaultWorkDay, ...template.standardWeek?.thursday },
        friday: { ...defaultWorkDay, ...template.standardWeek?.friday },
        saturday: { ...defaultWorkDay, isWorkingDay: false, ...template.standardWeek?.saturday },
        sunday: { ...defaultWorkDay, isWorkingDay: false, ...template.standardWeek?.sunday }
      },
      tradeSpecificSchedules: template.tradeSpecificSchedules,
      seasonalAdjustments: template.seasonalAdjustments
    }));
  }

  private buildScheduleConstraints(constraints: Partial<ScheduleConstraint>[]): ScheduleConstraint[] {
    return constraints.map((constraint, index) => ({
      id: `constraint_${index}`,
      type: constraint.type || 'custom',
      name: constraint.name || `Constraint ${index + 1}`,
      description: constraint.description || 'Schedule constraint',
      startDate: constraint.startDate || new Date(),
      endDate: constraint.endDate || new Date(),
      affectedDays: constraint.affectedDays,
      impact: {
        workProhibited: false,
        reducedProductivity: 1.0,
        increasedCosts: 1.0,
        requiredAdjustments: [],
        ...constraint.impact
      },
      affectedTrades: constraint.affectedTrades,
      affectedPhases: constraint.affectedPhases,
      mitigationOptions: constraint.mitigationOptions,
      isRecurring: constraint.isRecurring || false,
      recurrencePattern: constraint.recurrencePattern
    }));
  }

  private generateYearlyCalendar(startDate: Date, endDate: Date): Partial<CalendarPeriod>[] {
    const periods: Partial<CalendarPeriod>[] = [];
    const current = new Date(startDate);
    
    while (current < endDate) {
      const periodEnd = new Date(current);
      periodEnd.setMonth(periodEnd.getMonth() + 3); // Quarterly periods
      
      if (periodEnd > endDate) {
        periodEnd.setTime(endDate.getTime());
      }

      const season = this.getSeason(current);
      periods.push({
        name: `${season} ${current.getFullYear()}`,
        startDate: new Date(current),
        endDate: new Date(periodEnd),
        rateMultipliers: {
          standard: 1.0,
          overtime: 1.5,
          weekend: 2.0,
          holiday: 2.5,
          night: 1.2
        },
        productivityFactors: {
          temperature: season === 'Winter' ? 0.9 : 1.0,
          daylight: season === 'Winter' ? 0.85 : 1.0,
          seasonality: season === 'Summer' ? 1.05 : 1.0
        }
      });

      current.setTime(periodEnd.getTime());
    }

    return periods;
  }

  private getStandardLaborRateAdjustments(): Partial<LaborRateAdjustment>[] {
    const trades = ['Electrical', 'Plumbing', 'Framing', 'Drywall', 'Painting', 'Flooring'];
    
    return trades.map(trade => ({
      tradeCategory: trade,
      skillLevel: 'skilled' as const,
      timeOfDay: {
        regular: { start: '08:00', end: '17:00', multiplier: 1.0 },
        overtime: { start: '17:00', end: '20:00', multiplier: 1.5 },
        night: { start: '20:00', end: '08:00', multiplier: 1.2 }
      },
      dayOfWeek: {
        weekday: 1.0,
        saturday: 1.5,
        sunday: 2.0
      },
      seasonalFactors: {
        spring: 1.0,
        summer: 1.0,
        fall: 1.0,
        winter: 1.1
      }
    }));
  }

  private getCommonLearningCurves(): Partial<LearningCurve>[] {
    return [
      {
        name: 'Repetitive Framing',
        description: 'Learning curve for repetitive framing work',
        applicableTrades: ['Framing'],
        applicableCategories: ['Structure'],
        initialEfficiency: 0.8,
        finalEfficiency: 1.2,
        learningRate: 0.85,
        repetitionsToFinalEfficiency: 8,
        minimumRepetitions: 3,
        applyTo: 'labor_hours'
      },
      {
        name: 'Repetitive Finishing',
        description: 'Learning curve for repetitive finishing work',
        applicableTrades: ['Drywall', 'Painting', 'Flooring'],
        applicableCategories: ['Interior'],
        initialEfficiency: 0.85,
        finalEfficiency: 1.15,
        learningRate: 0.90,
        repetitionsToFinalEfficiency: 6,
        minimumRepetitions: 2,
        applyTo: 'labor_cost'
      }
    ];
  }

  private getStandardWorkSchedule(): Partial<WorkScheduleTemplate> {
    return {
      name: 'Standard Construction Schedule',
      description: 'Standard 40-hour work week with overtime capability',
      standardWeek: {
        monday: {
          workingHours: { start: '08:00', end: '17:00', breakDuration: 15, lunchDuration: 60 },
          maxOvertimeHours: 4,
          isWorkingDay: true
        },
        tuesday: {
          workingHours: { start: '08:00', end: '17:00', breakDuration: 15, lunchDuration: 60 },
          maxOvertimeHours: 4,
          isWorkingDay: true
        },
        wednesday: {
          workingHours: { start: '08:00', end: '17:00', breakDuration: 15, lunchDuration: 60 },
          maxOvertimeHours: 4,
          isWorkingDay: true
        },
        thursday: {
          workingHours: { start: '08:00', end: '17:00', breakDuration: 15, lunchDuration: 60 },
          maxOvertimeHours: 4,
          isWorkingDay: true
        },
        friday: {
          workingHours: { start: '08:00', end: '17:00', breakDuration: 15, lunchDuration: 60 },
          maxOvertimeHours: 4,
          isWorkingDay: true
        },
        saturday: {
          workingHours: { start: '08:00', end: '12:00', breakDuration: 15, lunchDuration: 0 },
          maxOvertimeHours: 0,
          isWorkingDay: false
        },
        sunday: {
          workingHours: { start: '08:00', end: '17:00', breakDuration: 15, lunchDuration: 60 },
          maxOvertimeHours: 0,
          isWorkingDay: false
        }
      }
    };
  }

  private getHolidayConstraints(startDate: Date, endDate: Date): Partial<ScheduleConstraint>[] {
    const holidays = [
      { name: 'New Year\'s Day', month: 0, day: 1 },
      { name: 'Independence Day', month: 6, day: 4 },
      { name: 'Labor Day', month: 8, day: 1 }, // First Monday
      { name: 'Thanksgiving', month: 10, day: 22 }, // Approximate
      { name: 'Christmas Day', month: 11, day: 25 }
    ];

    const constraints: Partial<ScheduleConstraint>[] = [];
    const startYear = startDate.getFullYear();
    const endYear = endDate.getFullYear();

    for (let year = startYear; year <= endYear; year++) {
      for (const holiday of holidays) {
        const holidayDate = new Date(year, holiday.month, holiday.day);
        if (holidayDate >= startDate && holidayDate <= endDate) {
          constraints.push({
            type: 'holiday',
            name: holiday.name,
            description: `${holiday.name} holiday - no work`,
            startDate: holidayDate,
            endDate: holidayDate,
            impact: {
              workProhibited: true,
              requiredAdjustments: ['Reschedule work', 'Holiday pay if worked']
            },
            isRecurring: true
          });
        }
      }
    }

    return constraints;
  }

  private createExecutionPhases(
    workPhases: WorkPhase[],
    calendar: PhasingCalendar,
    startDate: Date
  ): ExecutionPhase[] {
    const executionPhases: ExecutionPhase[] = [];
    let currentDate = new Date(startDate);

    for (let i = 0; i < workPhases.length; i++) {
      const workPhase = workPhases[i];
      const phaseDurationDays = this.durationToDays(workPhase.duration);
      const phaseEndDate = new Date(currentDate.getTime() + phaseDurationDays * 24 * 60 * 60 * 1000);

      const executionPhase: ExecutionPhase = {
        id: `exec_${workPhase.id}`,
        name: workPhase.phase,
        description: workPhase.description || `Execution phase for ${workPhase.phase}`,
        sequenceOrder: workPhase.sequenceOrder,
        workPhase,
        scheduledStart: new Date(currentDate),
        scheduledEnd: phaseEndDate,
        requiredResources: {
          laborHours: workPhase.items.reduce((sum, item) => sum + item.laborHours, 0),
          crewSize: this.estimateCrewSize(workPhase),
          equipmentNeeded: this.extractEquipmentNeeds(workPhase),
          materialDeliveries: this.generateMaterialDeliveries(workPhase, currentDate)
        },
        adjustedCosts: {
          baseCost: workPhase.phaseTotal,
          calendarAdjustments: 0,
          learningCurveAdjustments: 0,
          totalAdjustedCost: workPhase.phaseTotal
        },
        prerequisites: workPhase.prerequisites,
        constraints: calendar.scheduleConstraints.filter(constraint =>
          this.constraintAffectsPhase(constraint, workPhase, currentDate, phaseEndDate)
        ),
        progress: {
          percentComplete: 0,
          costToDate: 0,
          varianceFromPlan: 0,
          qualityMetrics: []
        },
        status: 'planned'
      };

      executionPhases.push(executionPhase);
      currentDate = phaseEndDate;
    }

    return executionPhases;
  }

  private generateResourcePlanning(
    phases: ExecutionPhase[],
    calendar: PhasingCalendar
  ): ResourceAllocation[] {
    const allocations: ResourceAllocation[] = [];
    let allocationId = 1;

    for (const phase of phases) {
      // Labor allocation
      allocations.push({
        id: `allocation_${allocationId++}`,
        phaseId: phase.id,
        resourceType: 'labor',
        allocation: {
          startDate: phase.scheduledStart,
          endDate: phase.scheduledEnd,
          quantity: phase.requiredResources.laborHours,
          costPerUnit: this.estimateAverageLaborRate(phase.workPhase.category, calendar),
          totalCost: phase.requiredResources.laborHours * this.estimateAverageLaborRate(phase.workPhase.category, calendar)
        },
        calendarAdjustments: {
          baseRate: this.estimateAverageLaborRate(phase.workPhase.category, calendar),
          adjustedRate: this.estimateAverageLaborRate(phase.workPhase.category, calendar) * 1.1, // Simplified
          adjustmentFactors: ['seasonal adjustment'],
          totalAdjustment: this.estimateAverageLaborRate(phase.workPhase.category, calendar) * 0.1
        },
        constraints: [],
        availability: 1.0
      });

      // Equipment allocation (if needed)
      if (phase.requiredResources.equipmentNeeded.length > 0) {
        allocations.push({
          id: `allocation_${allocationId++}`,
          phaseId: phase.id,
          resourceType: 'equipment',
          allocation: {
            startDate: phase.scheduledStart,
            endDate: phase.scheduledEnd,
            quantity: phase.requiredResources.equipmentNeeded.length,
            costPerUnit: 500, // Simplified
            totalCost: phase.requiredResources.equipmentNeeded.length * 500
          },
          calendarAdjustments: {
            baseRate: 500,
            adjustedRate: 500,
            adjustmentFactors: [],
            totalAdjustment: 0
          },
          constraints: [],
          availability: 0.9
        });
      }
    }

    return allocations;
  }

  private generateCostProjections(
    phases: ExecutionPhase[],
    calendar: PhasingCalendar
  ): PhaseCostProjection[] {
    return phases.map(phase => {
      const baseCosts = {
        material: phase.workPhase.items.reduce((sum, item) => sum + item.materialCost, 0),
        labor: phase.workPhase.items.reduce((sum, item) => sum + item.laborCost, 0),
        equipment: phase.workPhase.items.reduce((sum, item) => sum + item.equipmentCost, 0),
        overhead: phase.adjustedCosts.baseCost * 0.15
      };

      return {
        phaseId: phase.id,
        phaseName: phase.name,
        baseCosts,
        calendarAdjustments: {
          weekendWork: baseCosts.labor * 0.05,
          overtimeWork: baseCosts.labor * 0.10,
          nightWork: baseCosts.labor * 0.02,
          holidayWork: baseCosts.labor * 0.01,
          seasonalAdjustments: baseCosts.labor * 0.03,
          totalAdjustments: baseCosts.labor * 0.21
        },
        learningCurveBenefits: {
          expectedSavings: baseCosts.labor * 0.08,
          confidenceLevel: 0.75,
          applicableCategories: [phase.workPhase.category]
        },
        riskContingencies: {
          weatherRisk: baseCosts.material * 0.02,
          scheduleRisk: (baseCosts.material + baseCosts.labor) * 0.03,
          qualityRisk: baseCosts.labor * 0.02,
          marketRisk: baseCosts.material * 0.01,
          totalContingency: (baseCosts.material + baseCosts.labor) * 0.08
        },
        projectedCost: {
          optimistic: phase.adjustedCosts.baseCost * 0.92,
          mostLikely: phase.adjustedCosts.baseCost * 1.05,
          pessimistic: phase.adjustedCosts.baseCost * 1.18,
          expectedValue: phase.adjustedCosts.baseCost * 1.05,
          standardDeviation: phase.adjustedCosts.baseCost * 0.08
        }
      };
    });
  }

  private initializePerformanceMetrics(phases: ExecutionPhase[]): any[] {
    return [
      {
        metricName: 'Cost Performance Index',
        category: 'cost',
        target: 1.0,
        measurementFrequency: 'weekly',
        thresholds: { green: 0.95, yellow: 0.90, red: 0.85 }
      },
      {
        metricName: 'Schedule Performance Index',
        category: 'schedule',
        target: 1.0,
        measurementFrequency: 'weekly',
        thresholds: { green: 0.95, yellow: 0.90, red: 0.85 }
      },
      {
        metricName: 'Quality Score',
        category: 'quality',
        target: 95,
        measurementFrequency: 'phase-end',
        thresholds: { green: 90, yellow: 80, red: 70 }
      }
    ];
  }

  // Additional helper methods

  private calculateLearningCurveEfficiency(curve: LearningCurve, repetitions: number): number {
    if (repetitions < curve.minimumRepetitions) {
      return curve.initialEfficiency;
    }

    if (repetitions >= curve.repetitionsToFinalEfficiency) {
      return curve.finalEfficiency;
    }

    // Use Wright's learning curve formula
    const progress = Math.log(repetitions) / Math.log(curve.repetitionsToFinalEfficiency);
    const learningExponent = Math.log(curve.learningRate) / Math.log(2);
    const efficiency = curve.initialEfficiency + 
      (curve.finalEfficiency - curve.initialEfficiency) * 
      Math.pow(progress, Math.abs(learningExponent));

    return Math.min(curve.finalEfficiency, Math.max(curve.initialEfficiency, efficiency));
  }

  private durationToDays(duration: Duration): number {
    switch (duration.unit) {
      case 'days': return duration.value;
      case 'weeks': return duration.value * 7;
      case 'months': return duration.value * 30;
      default: return duration.value;
    }
  }

  private getSeason(date: Date): string {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  }

  private getApplicablePeriod(
    calendar: PhasingCalendar,
    startDate: Date,
    endDate: Date
  ): CalendarPeriod | null {
    for (const period of calendar.periods) {
      if (startDate >= period.startDate && startDate <= period.endDate) {
        return period;
      }
    }
    return null;
  }

  private getLaborRateAdjustment(
    calendar: PhasingCalendar,
    category: string,
    date: Date
  ): LaborRateAdjustment | null {
    for (const adjustment of calendar.laborRateAdjustments) {
      if (adjustment.tradeCategory === category || adjustment.tradeCategory === 'general') {
        if (date >= adjustment.effectiveDate && 
            (!adjustment.expirationDate || date <= adjustment.expirationDate)) {
          return adjustment;
        }
      }
    }
    return null;
  }

  private calculateWorkDistribution(
    durationDays: number,
    startDate: Date,
    endDate: Date,
    calendar: PhasingCalendar
  ): {
    standard: number;
    overtime: number;
    weekend: number;
    holiday: number;
    night: number;
  } {
    // Simplified model - in reality this would be much more complex
    return {
      standard: 0.75,
      overtime: 0.15,
      weekend: 0.05,
      holiday: 0.02,
      night: 0.03
    };
  }

  private workPhaseToExecutionPhase(
    workPhase: WorkPhase,
    calendar: PhasingCalendar,
    startDate: Date
  ): ExecutionPhase {
    return {
      id: `exec_${workPhase.id}`,
      name: workPhase.phase,
      description: workPhase.description || '',
      sequenceOrder: workPhase.sequenceOrder,
      workPhase,
      scheduledStart: startDate,
      scheduledEnd: new Date(startDate.getTime() + this.durationToDays(workPhase.duration) * 24 * 60 * 60 * 1000),
      requiredResources: {
        laborHours: workPhase.items.reduce((sum, item) => sum + item.laborHours, 0),
        crewSize: this.estimateCrewSize(workPhase),
        equipmentNeeded: [],
        materialDeliveries: []
      },
      adjustedCosts: {
        baseCost: workPhase.phaseTotal,
        calendarAdjustments: 0,
        learningCurveAdjustments: 0,
        totalAdjustedCost: workPhase.phaseTotal
      },
      prerequisites: workPhase.prerequisites,
      constraints: [],
      progress: {
        percentComplete: 0,
        costToDate: 0,
        varianceFromPlan: 0,
        qualityMetrics: []
      },
      status: 'planned'
    };
  }

  private estimateCrewSize(phase: WorkPhase): number {
    // Simplified crew size estimation
    const totalLaborHours = phase.items.reduce((sum, item) => sum + item.laborHours, 0);
    const phaseDays = this.durationToDays(phase.duration);
    const hoursPerDay = 8;
    
    return Math.max(1, Math.ceil(totalLaborHours / (phaseDays * hoursPerDay)));
  }

  private extractEquipmentNeeds(phase: WorkPhase): string[] {
    // Simplified equipment extraction based on phase category
    const equipmentMap: Record<string, string[]> = {
      'Site Preparation': ['Excavator', 'Dump Truck'],
      'Framing': ['Circular Saw', 'Nail Gun'],
      'Electrical': ['Drill', 'Wire Strippers'],
      'Plumbing': ['Pipe Cutter', 'Torch'],
      'Drywall': ['Screw Gun', 'Drywall Lift']
    };

    return equipmentMap[phase.phase] || [];
  }

  private generateMaterialDeliveries(phase: WorkPhase, startDate: Date): MaterialDelivery[] {
    return phase.items.map((item, index) => ({
      id: `delivery_${phase.id}_${index}`,
      materialName: item.description,
      quantity: item.quantity,
      unit: item.unit,
      scheduledDelivery: new Date(startDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
      supplier: 'TBD',
      cost: item.materialCost,
      leadTime: { value: 3, unit: 'days' },
      storageRequirements: []
    }));
  }

  private constraintAffectsPhase(
    constraint: ScheduleConstraint,
    phase: WorkPhase,
    phaseStart: Date,
    phaseEnd: Date
  ): boolean {
    // Check if constraint overlaps with phase dates
    const constraintOverlaps = (constraint.startDate <= phaseEnd && constraint.endDate >= phaseStart);
    
    if (!constraintOverlaps) return false;

    // Check if constraint affects this phase's trade or category
    if (constraint.affectedTrades && !constraint.affectedTrades.includes(phase.category)) {
      return false;
    }

    if (constraint.affectedPhases && !constraint.affectedPhases.includes(phase.phase)) {
      return false;
    }

    return true;
  }

  private estimateAverageLaborRate(category: string, calendar: PhasingCalendar): number {
    // Simplified labor rate estimation
    const baseRates: Record<string, number> = {
      'Electrical': 65,
      'Plumbing': 60,
      'Framing': 45,
      'Drywall': 35,
      'Painting': 30,
      'Flooring': 40
    };

    return baseRates[category] || 40; // Default $40/hour
  }

  // Getters
  getPhasingCalendar(id: string): PhasingCalendar | undefined {
    return this.phasingCalendars.get(id);
  }

  getExecutionPlan(id: string): MultiPhaseExecutionPlan | undefined {
    return this.executionPlans.get(id);
  }

  getAllCalendars(): PhasingCalendar[] {
    return Array.from(this.phasingCalendars.values());
  }

  getAllExecutionPlans(): MultiPhaseExecutionPlan[] {
    return Array.from(this.executionPlans.values());
  }
}
