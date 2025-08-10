// Alternates Manager - Step 8 Implementation
// Handles scope tree inheritance and differential pricing

import {
  BaseScopeTree,
  AlternateScope,
  ScopeModification,
  PhaseModification,
  CostDelta,
  TimeDelta,
  AlternateComparison,
  DeltaCalculationConfig,
  DeltaCalculationMethod
} from './alternates-types';
import {
  WorkPhase,
  EstimateLineItem,
  Duration,
  CostSummary,
  EstimateRecommendation,
  ProjectSummary
} from './types';
import { OrganizedScope } from '../voice-scope/types';
import { CostCalculator } from './cost-calculator';

export class AlternatesManager {
  private costCalculator: CostCalculator;
  private baseScopeTrees: Map<string, BaseScopeTree> = new Map();
  private alternateScopes: Map<string, AlternateScope> = new Map();

  constructor(costCalculator: CostCalculator) {
    this.costCalculator = costCalculator;
  }

  /**
   * Create a new base scope tree from organized scope and phases
   */
  createBaseScopeTree(
    name: string,
    description: string,
    baseScope: OrganizedScope,
    basePhases: WorkPhase[],
    project?: ProjectSummary
  ): BaseScopeTree {
    const id = `base_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate base cost summary
    const baseCostSummary = this.costCalculator.calculateCostSummary(basePhases, project);

    const baseScopeTree: BaseScopeTree = {
      id,
      name,
      description,
      baseScope,
      basePhases,
      baseCostSummary,
      createdAt: new Date(),
      lastModified: new Date()
    };

    this.baseScopeTrees.set(id, baseScopeTree);
    
    console.log(`📋 Created base scope tree "${name}" with ${basePhases.length} phases, total cost: $${baseCostSummary.contractTotal.toFixed(2)}`);
    
    return baseScopeTree;
  }

  /**
   * Create alternate scope that inherits from base scope tree
   */
  createAlternateScope(
    baseScopeId: string,
    name: string,
    description: string,
    alternateType: AlternateScope['alternateType'],
    modifications: {
      scopeModifications: ScopeModification[];
      phaseModifications: PhaseModification[];
    }
  ): AlternateScope {
    const baseScope = this.baseScopeTrees.get(baseScopeId);
    if (!baseScope) {
      throw new Error(`Base scope tree with ID ${baseScopeId} not found`);
    }

    const id = `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate cost and time deltas from modifications
    const costDeltas = this.calculateCostDeltas(baseScope, modifications);
    const timeDeltas = this.calculateTimeDeltas(baseScope, modifications);

    const totalDeltaCost = costDeltas.reduce((sum, delta) => sum + delta.deltaCost, 0);
    const deltaPercentage = (totalDeltaCost / baseScope.baseCostSummary.contractTotal) * 100;

    const totalTimeDelta = this.aggregateTimeDeltas(timeDeltas);

    const alternateScope: AlternateScope = {
      id,
      name,
      description,
      parentScopeId: baseScopeId,
      alternateType,
      inheritsFrom: baseScope,
      scopeModifications: modifications.scopeModifications,
      phaseModifications: modifications.phaseModifications,
      costDeltas,
      totalDeltaCost,
      deltaPercentage,
      timeDeltas,
      totalTimeDelta,
      qualityLevelDelta: this.assessQualityDelta(modifications),
      riskLevelDelta: this.assessRiskDelta(modifications),
      createdAt: new Date(),
      lastModified: new Date()
    };

    // Compute the actual cost summary and phases (base + deltas)
    alternateScope.computedCostSummary = this.computeAlternateCostSummary(alternateScope);
    alternateScope.computedPhases = this.computeAlternatePhases(alternateScope);

    this.alternateScopes.set(id, alternateScope);

    console.log(`🔄 Created alternate "${name}" with ${costDeltas.length} cost deltas, total delta: $${totalDeltaCost.toFixed(2)} (${deltaPercentage.toFixed(1)}%)`);

    return alternateScope;
  }

  /**
   * Calculate cost deltas from scope and phase modifications
   */
  private calculateCostDeltas(
    baseScope: BaseScopeTree,
    modifications: {
      scopeModifications: ScopeModification[];
      phaseModifications: PhaseModification[];
    }
  ): CostDelta[] {
    const deltas: CostDelta[] = [];
    let deltaId = 1;

    // Process scope modifications
    for (const mod of modifications.scopeModifications) {
      const scopeDeltas = this.processScopeModificationDeltas(baseScope, mod, deltaId);
      deltas.push(...scopeDeltas);
      deltaId += scopeDeltas.length;
    }

    // Process phase modifications
    for (const mod of modifications.phaseModifications) {
      const phaseDeltas = this.processPhaseModificationDeltas(baseScope, mod, deltaId);
      deltas.push(...phaseDeltas);
      deltaId += phaseDeltas.length;
    }

    return deltas;
  }

  /**
   * Process cost deltas from scope modifications
   */
  private processScopeModificationDeltas(
    baseScope: BaseScopeTree,
    modification: ScopeModification,
    startId: number
  ): CostDelta[] {
    const deltas: CostDelta[] = [];
    let id = startId;

    switch (modification.type) {
      case 'add':
        if (modification.addedItems) {
          for (const item of modification.addedItems) {
            deltas.push({
              id: `delta_${id++}`,
              category: 'material',
              description: `Added: ${item.description}`,
              baseCost: 0,
              deltaCost: item.materialCost,
              newCost: item.materialCost,
              deltaPercentage: 100, // 100% increase from 0
              sourceModification: modification.id,
              breakdown: {
                quantity: item.quantity,
                unitCost: item.materialCost / item.quantity
              },
              reason: modification.reason,
              confidence: item.confidenceScore
            });

            if (item.laborCost > 0) {
              deltas.push({
                id: `delta_${id++}`,
                category: 'labor',
                description: `Added labor: ${item.description}`,
                baseCost: 0,
                deltaCost: item.laborCost,
                newCost: item.laborCost,
                deltaPercentage: 100,
                sourceModification: modification.id,
                breakdown: {
                  quantity: item.laborHours,
                  unitCost: item.laborCost / (item.laborHours || 1)
                },
                reason: modification.reason,
                confidence: item.confidenceScore
              });
            }

            if (item.equipmentCost > 0) {
              deltas.push({
                id: `delta_${id++}`,
                category: 'equipment',
                description: `Added equipment: ${item.description}`,
                baseCost: 0,
                deltaCost: item.equipmentCost,
                newCost: item.equipmentCost,
                deltaPercentage: 100,
                sourceModification: modification.id,
                breakdown: {
                  quantity: item.quantity,
                  unitCost: item.equipmentCost / item.quantity
                },
                reason: modification.reason,
                confidence: item.confidenceScore
              });
            }
          }
        }
        break;

      case 'remove':
        if (modification.removedItemIds) {
          for (const removedId of modification.removedItemIds) {
            const originalItem = this.findItemInPhases(baseScope.basePhases, removedId);
            if (originalItem) {
              deltas.push({
                id: `delta_${id++}`,
                category: 'material',
                description: `Removed: ${originalItem.description}`,
                baseCost: originalItem.materialCost,
                deltaCost: -originalItem.materialCost,
                newCost: 0,
                deltaPercentage: -100,
                sourceModification: modification.id,
                breakdown: {
                  quantity: originalItem.quantity,
                  unitCost: originalItem.materialCost / originalItem.quantity
                },
                reason: modification.reason,
                confidence: originalItem.confidenceScore
              });

              if (originalItem.laborCost > 0) {
                deltas.push({
                  id: `delta_${id++}`,
                  category: 'labor',
                  description: `Removed labor: ${originalItem.description}`,
                  baseCost: originalItem.laborCost,
                  deltaCost: -originalItem.laborCost,
                  newCost: 0,
                  deltaPercentage: -100,
                  sourceModification: modification.id,
                  breakdown: {
                    quantity: originalItem.laborHours,
                    unitCost: originalItem.laborCost / (originalItem.laborHours || 1)
                  },
                  reason: modification.reason,
                  confidence: originalItem.confidenceScore
                });
              }
            }
          }
        }
        break;

      case 'modify':
        if (modification.modifications) {
          for (const itemMod of modification.modifications) {
            const originalItem = this.findItemInPhases(baseScope.basePhases, itemMod.itemId);
            if (originalItem && itemMod.changes) {
              // Calculate deltas for each changed field
              if (itemMod.changes.materialCost !== undefined) {
                const deltaCost = itemMod.changes.materialCost - originalItem.materialCost;
                deltas.push({
                  id: `delta_${id++}`,
                  category: 'material',
                  description: `Modified material cost: ${originalItem.description}`,
                  baseCost: originalItem.materialCost,
                  deltaCost,
                  newCost: itemMod.changes.materialCost,
                  deltaPercentage: (deltaCost / originalItem.materialCost) * 100,
                  sourceModification: modification.id,
                  breakdown: {
                    quantity: itemMod.changes.quantity || originalItem.quantity,
                    unitCost: itemMod.changes.materialCost / (itemMod.changes.quantity || originalItem.quantity)
                  },
                  reason: modification.reason,
                  confidence: itemMod.changes.confidenceScore || originalItem.confidenceScore
                });
              }

              if (itemMod.changes.laborCost !== undefined) {
                const deltaCost = itemMod.changes.laborCost - originalItem.laborCost;
                deltas.push({
                  id: `delta_${id++}`,
                  category: 'labor',
                  description: `Modified labor cost: ${originalItem.description}`,
                  baseCost: originalItem.laborCost,
                  deltaCost,
                  newCost: itemMod.changes.laborCost,
                  deltaPercentage: originalItem.laborCost > 0 ? (deltaCost / originalItem.laborCost) * 100 : 100,
                  sourceModification: modification.id,
                  breakdown: {
                    quantity: itemMod.changes.laborHours || originalItem.laborHours,
                    unitCost: itemMod.changes.laborCost / (itemMod.changes.laborHours || originalItem.laborHours || 1)
                  },
                  reason: modification.reason,
                  confidence: itemMod.changes.confidenceScore || originalItem.confidenceScore
                });
              }
            }
          }
        }
        break;

      case 'replace':
        if (modification.replacements) {
          for (const replacement of modification.replacements) {
            const originalItem = this.findItemInPhases(baseScope.basePhases, replacement.originalId);
            if (originalItem) {
              // Calculate net delta (new - old)
              const materialDelta = replacement.newItem.materialCost - originalItem.materialCost;
              const laborDelta = replacement.newItem.laborCost - originalItem.laborCost;
              const equipmentDelta = replacement.newItem.equipmentCost - originalItem.equipmentCost;

              if (materialDelta !== 0) {
                deltas.push({
                  id: `delta_${id++}`,
                  category: 'material',
                  description: `Replaced material: ${originalItem.description} → ${replacement.newItem.description}`,
                  baseCost: originalItem.materialCost,
                  deltaCost: materialDelta,
                  newCost: replacement.newItem.materialCost,
                  deltaPercentage: (materialDelta / originalItem.materialCost) * 100,
                  sourceModification: modification.id,
                  breakdown: {
                    quantity: replacement.newItem.quantity,
                    unitCost: replacement.newItem.materialCost / replacement.newItem.quantity
                  },
                  reason: modification.reason,
                  confidence: replacement.newItem.confidenceScore
                });
              }

              if (laborDelta !== 0) {
                deltas.push({
                  id: `delta_${id++}`,
                  category: 'labor',
                  description: `Replaced labor: ${originalItem.description} → ${replacement.newItem.description}`,
                  baseCost: originalItem.laborCost,
                  deltaCost: laborDelta,
                  newCost: replacement.newItem.laborCost,
                  deltaPercentage: originalItem.laborCost > 0 ? (laborDelta / originalItem.laborCost) * 100 : 100,
                  sourceModification: modification.id,
                  breakdown: {
                    quantity: replacement.newItem.laborHours,
                    unitCost: replacement.newItem.laborCost / (replacement.newItem.laborHours || 1)
                  },
                  reason: modification.reason,
                  confidence: replacement.newItem.confidenceScore
                });
              }
            }
          }
        }
        break;
    }

    return deltas;
  }

  /**
   * Process cost deltas from phase modifications
   */
  private processPhaseModificationDeltas(
    baseScope: BaseScopeTree,
    modification: PhaseModification,
    startId: number
  ): CostDelta[] {
    const deltas: CostDelta[] = [];
    let id = startId;

    // Process based on modification type
    switch (modification.modificationType) {
      case 'add':
        if (modification.newPhases) {
          for (const newPhase of modification.newPhases) {
            if (newPhase.phaseTotal) {
              deltas.push({
                id: `delta_${id++}`,
                category: 'material', // Aggregate category
                description: `Added phase: ${newPhase.phase}`,
                baseCost: 0,
                deltaCost: newPhase.phaseTotal,
                newCost: newPhase.phaseTotal,
                deltaPercentage: 100,
                sourceModification: modification.id,
                breakdown: {
                  quantity: newPhase.items?.length || 0,
                  unitCost: newPhase.phaseTotal / (newPhase.items?.length || 1)
                },
                reason: modification.reason,
                confidence: 0.8 // Default confidence for phase additions
              });
            }
          }
        }
        break;

      case 'remove':
        const removedPhase = baseScope.basePhases.find(p => p.id === modification.phaseId);
        if (removedPhase) {
          deltas.push({
            id: `delta_${id++}`,
            category: 'material',
            description: `Removed phase: ${removedPhase.phase}`,
            baseCost: removedPhase.phaseTotal,
            deltaCost: -removedPhase.phaseTotal,
            newCost: 0,
            deltaPercentage: -100,
            sourceModification: modification.id,
            breakdown: {
              quantity: removedPhase.items.length,
              unitCost: removedPhase.phaseTotal / removedPhase.items.length
            },
            reason: modification.reason,
            confidence: 0.9
          });
        }
        break;

      case 'modify':
        const originalPhase = baseScope.basePhases.find(p => p.id === modification.phaseId);
        if (originalPhase && modification.phaseChanges && modification.phaseChanges.phaseTotal !== undefined) {
          const deltaCost = modification.phaseChanges.phaseTotal - originalPhase.phaseTotal;
          deltas.push({
            id: `delta_${id++}`,
            category: 'material',
            description: `Modified phase: ${originalPhase.phase}`,
            baseCost: originalPhase.phaseTotal,
            deltaCost,
            newCost: modification.phaseChanges.phaseTotal,
            deltaPercentage: (deltaCost / originalPhase.phaseTotal) * 100,
            sourceModification: modification.id,
            breakdown: {
              quantity: originalPhase.items.length,
              adjustment: deltaCost
            },
            reason: modification.reason,
            confidence: 0.8
          });
        }
        break;
    }

    // Process item modifications within phases
    if (modification.itemModifications) {
      for (const itemMod of modification.itemModifications) {
        const itemDeltas = this.processScopeModificationDeltas(baseScope, itemMod, id);
        deltas.push(...itemDeltas);
        id += itemDeltas.length;
      }
    }

    return deltas;
  }

  /**
   * Calculate time deltas from modifications
   */
  private calculateTimeDeltas(
    baseScope: BaseScopeTree,
    modifications: {
      scopeModifications: ScopeModification[];
      phaseModifications: PhaseModification[];
    }
  ): TimeDelta[] {
    const deltas: TimeDelta[] = [];
    let deltaId = 1;

    // Process phase modifications for time impacts
    for (const mod of modifications.phaseModifications) {
      if (mod.impact.scheduleDelta) {
        const originalPhase = baseScope.basePhases.find(p => p.id === mod.phaseId);
        if (originalPhase) {
          const deltaDuration = mod.impact.scheduleDelta;
          const newDuration = this.addDurations(originalPhase.duration, deltaDuration);
          const deltaPercentage = this.calculateDurationPercentage(originalPhase.duration, deltaDuration);

          deltas.push({
            id: `time_delta_${deltaId++}`,
            phaseId: mod.phaseId,
            category: 'duration',
            description: `Modified phase duration: ${originalPhase.phase}`,
            baseDuration: originalPhase.duration,
            deltaDuration,
            newDuration,
            deltaPercentage,
            reason: mod.reason,
            impact: [`Phase duration changed by ${deltaPercentage.toFixed(1)}%`]
          });
        }
      }
    }

    // Process scope modifications for indirect time impacts
    for (const mod of modifications.scopeModifications) {
      if (mod.impact.timeDelta) {
        deltas.push({
          id: `time_delta_${deltaId++}`,
          phaseId: 'scope_impact',
          category: 'resource',
          description: `Time impact from scope modification: ${mod.type}`,
          baseDuration: { value: 0, unit: 'days' },
          deltaDuration: mod.impact.timeDelta,
          newDuration: mod.impact.timeDelta,
          deltaPercentage: 100,
          reason: mod.reason,
          impact: [mod.impact.qualityImpact]
        });
      }
    }

    return deltas;
  }

  /**
   * Aggregate time deltas into total time delta
   */
  private aggregateTimeDeltas(timeDeltas: TimeDelta[]): Duration {
    let totalDays = 0;

    for (const delta of timeDeltas) {
      const days = this.durationToDays(delta.deltaDuration);
      totalDays += days;
    }

    return this.daysToDuration(totalDays);
  }

  /**
   * Assess quality level delta from modifications
   */
  private assessQualityDelta(modifications: {
    scopeModifications: ScopeModification[];
    phaseModifications: PhaseModification[];
  }): 'lower' | 'same' | 'higher' {
    let qualityScore = 0;

    // Analyze scope modifications
    for (const mod of modifications.scopeModifications) {
      if (mod.impact.qualityImpact.includes('premium') || mod.impact.qualityImpact.includes('higher')) {
        qualityScore += 1;
      } else if (mod.impact.qualityImpact.includes('basic') || mod.impact.qualityImpact.includes('lower')) {
        qualityScore -= 1;
      }
    }

    if (qualityScore > 0) return 'higher';
    if (qualityScore < 0) return 'lower';
    return 'same';
  }

  /**
   * Assess risk level delta from modifications
   */
  private assessRiskDelta(modifications: {
    scopeModifications: ScopeModification[];
    phaseModifications: PhaseModification[];
  }): 'lower' | 'same' | 'higher' {
    let riskScore = 0;

    // Analyze phase modifications
    for (const mod of modifications.phaseModifications) {
      if (mod.impact.riskChange === 'higher') {
        riskScore += 1;
      } else if (mod.impact.riskChange === 'lower') {
        riskScore -= 1;
      }
    }

    // Consider complexity increases as risk increases
    const additionsCount = modifications.scopeModifications.filter(m => m.type === 'add').length;
    const modificationsCount = modifications.scopeModifications.filter(m => m.type === 'modify' || m.type === 'replace').length;
    
    if (additionsCount > 3 || modificationsCount > 5) {
      riskScore += 1;
    }

    if (riskScore > 0) return 'higher';
    if (riskScore < 0) return 'lower';
    return 'same';
  }

  /**
   * Compute alternate cost summary (base + deltas)
   */
  private computeAlternateCostSummary(alternate: AlternateScope): CostSummary {
    const baseCostSummary = alternate.inheritsFrom.baseCostSummary;
    
    // Apply cost deltas to base costs
    let materialDelta = 0;
    let laborDelta = 0;
    let equipmentDelta = 0;
    let overheadDelta = 0;
    let markupDelta = 0;
    let contingencyDelta = 0;

    for (const delta of alternate.costDeltas) {
      switch (delta.category) {
        case 'material':
          materialDelta += delta.deltaCost;
          break;
        case 'labor':
          laborDelta += delta.deltaCost;
          break;
        case 'equipment':
          equipmentDelta += delta.deltaCost;
          break;
        case 'overhead':
          overheadDelta += delta.deltaCost;
          break;
        case 'markup':
          markupDelta += delta.deltaCost;
          break;
        case 'contingency':
          contingencyDelta += delta.deltaCost;
          break;
      }
    }

    const newMaterialTotal = baseCostSummary.materialTotal + materialDelta;
    const newLaborTotal = baseCostSummary.laborTotal + laborDelta;
    const newEquipmentTotal = baseCostSummary.equipmentTotal + equipmentDelta;
    const newDirectCostTotal = newMaterialTotal + newLaborTotal + newEquipmentTotal;

    // Recalculate percentages based on new direct costs
    const newOverhead = baseCostSummary.overhead + overheadDelta;
    const newGeneralConditions = baseCostSummary.generalConditions;
    const newMarkup = baseCostSummary.markup + markupDelta;
    const newContingency = baseCostSummary.contingency + contingencyDelta;
    const newIndirectCostTotal = newOverhead + newGeneralConditions + newMarkup + newContingency + (baseCostSummary.bonding || 0) + baseCostSummary.permits;
    
    const newContractTotal = newDirectCostTotal + newIndirectCostTotal;

    const computedCostSummary: CostSummary = {
      ...baseCostSummary,
      materialTotal: newMaterialTotal,
      laborTotal: newLaborTotal,
      equipmentTotal: newEquipmentTotal,
      directCostTotal: newDirectCostTotal,
      overhead: newOverhead,
      markup: newMarkup,
      contingency: newContingency,
      indirectCostTotal: newIndirectCostTotal,
      contractTotal: newContractTotal,
      grossMargin: (newContractTotal - newDirectCostTotal) / newContractTotal,
      markupPercentage: newMarkup / newDirectCostTotal,
      laborPercentage: newLaborTotal / newDirectCostTotal,
      materialPercentage: newMaterialTotal / newDirectCostTotal,
      equipmentPercentage: newEquipmentTotal / newDirectCostTotal
    };

    return computedCostSummary;
  }

  /**
   * Compute alternate phases (base + modifications)
   */
  private computeAlternatePhases(alternate: AlternateScope): WorkPhase[] {
    const basePhases = alternate.inheritsFrom.basePhases;
    let computedPhases = JSON.parse(JSON.stringify(basePhases)); // Deep copy

    // Apply phase modifications
    for (const mod of alternate.phaseModifications) {
      computedPhases = this.applyPhaseModification(computedPhases, mod);
    }

    // Apply scope modifications to items within phases
    for (const mod of alternate.scopeModifications) {
      computedPhases = this.applyScopeModificationToPhases(computedPhases, mod);
    }

    // Recalculate phase totals
    for (const phase of computedPhases) {
      phase.phaseTotal = phase.items.reduce((sum: number, item: any) => sum + item.lineItemTotal, 0);
    }

    return computedPhases;
  }

  /**
   * Apply phase modification to computed phases
   */
  private applyPhaseModification(phases: WorkPhase[], modification: PhaseModification): WorkPhase[] {
    switch (modification.modificationType) {
      case 'add':
        if (modification.newPhases) {
          for (const newPhase of modification.newPhases) {
            phases.push(newPhase as WorkPhase);
          }
        }
        break;

      case 'remove':
        return phases.filter(p => p.id !== modification.phaseId);

      case 'modify':
        const phaseToModify = phases.find(p => p.id === modification.phaseId);
        if (phaseToModify && modification.phaseChanges) {
          Object.assign(phaseToModify, modification.phaseChanges);
        }
        break;

      case 'split':
        const phaseToSplit = phases.find(p => p.id === modification.phaseId);
        if (phaseToSplit && modification.newPhases) {
          const splitIndex = phases.indexOf(phaseToSplit);
          phases.splice(splitIndex, 1, ...(modification.newPhases as WorkPhase[]));
        }
        break;

      case 'merge':
        if (modification.affectedPhaseIds && modification.newPhases) {
          // Remove affected phases
          const filteredPhases = phases.filter(p => !modification.affectedPhaseIds!.includes(p.id));
          // Add merged phase
          filteredPhases.push(...(modification.newPhases as WorkPhase[]));
          return filteredPhases;
        }
        break;
    }

    return phases;
  }

  /**
   * Apply scope modification to phases
   */
  private applyScopeModificationToPhases(phases: WorkPhase[], modification: ScopeModification): WorkPhase[] {
    // Find target phase based on target path
    const targetPhase = this.findPhaseByPath(phases, modification.targetPath);
    if (!targetPhase) return phases;

    switch (modification.type) {
      case 'add':
        if (modification.addedItems) {
          targetPhase.items.push(...modification.addedItems);
        }
        break;

      case 'remove':
        if (modification.removedItemIds) {
          targetPhase.items = targetPhase.items.filter(item => 
            !modification.removedItemIds!.includes(item.id)
          );
        }
        break;

      case 'modify':
        if (modification.modifications) {
          for (const itemMod of modification.modifications) {
            const item = targetPhase.items.find(i => i.id === itemMod.itemId);
            if (item) {
              Object.assign(item, itemMod.changes);
            }
          }
        }
        break;

      case 'replace':
        if (modification.replacements) {
          for (const replacement of modification.replacements) {
            const itemIndex = targetPhase.items.findIndex(i => i.id === replacement.originalId);
            if (itemIndex >= 0) {
              targetPhase.items[itemIndex] = replacement.newItem;
            }
          }
        }
        break;
    }

    return phases;
  }

  /**
   * Create comparison analysis between base scope and alternates
   */
  createAlternateComparison(
    baseScopeId: string,
    alternateIds: string[],
    name: string
  ): AlternateComparison {
    const baseScope = this.baseScopeTrees.get(baseScopeId);
    if (!baseScope) {
      throw new Error(`Base scope tree with ID ${baseScopeId} not found`);
    }

    const alternates: AlternateScope[] = [];
    for (const alternateId of alternateIds) {
      const alternate = this.alternateScopes.get(alternateId);
      if (alternate) {
        alternates.push(alternate);
      }
    }

    const comparisonMatrix = this.buildComparisonMatrix(baseScope, alternates);
    const analysis = this.performComparisonAnalysis(comparisonMatrix);
    const recommendations = this.generateComparisonRecommendations(baseScope, alternates, analysis);
    const sensitivityAnalysis = this.performSensitivityAnalysis(baseScope, alternates);

    const comparison: AlternateComparison = {
      id: `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      baseScope,
      alternates,
      comparisonMatrix,
      analysis,
      recommendations,
      sensitivityAnalysis,
      createdAt: new Date(),
      lastModified: new Date()
    };

    console.log(`📊 Created alternate comparison "${name}" with ${alternates.length} alternates`);

    return comparison;
  }

  /**
   * Build comparison matrix
   */
  private buildComparisonMatrix(
    baseScope: BaseScopeTree,
    alternates: AlternateScope[]
  ): AlternateComparison['comparisonMatrix'] {
    return alternates.map(alternate => {
      const totalCost = alternate.computedCostSummary?.contractTotal || 0;
      const costDelta = alternate.totalDeltaCost;
      const costDeltaPercentage = alternate.deltaPercentage;

      const totalTime = this.calculateTotalDuration(alternate.computedPhases || []);
      const timeDelta = alternate.totalTimeDelta;
      const baseTotalTime = this.calculateTotalDuration(baseScope.basePhases);
      const timeDeltaPercentage = this.calculateDurationPercentage(baseTotalTime, timeDelta);

      return {
        alternateId: alternate.id,
        name: alternate.name,
        totalCost,
        costDelta,
        costDeltaPercentage,
        totalTime,
        timeDelta,
        timeDeltaPercentage,
        qualityLevel: alternate.qualityLevelDelta,
        riskLevel: alternate.riskLevelDelta,
        advantages: this.extractAdvantages(alternate),
        disadvantages: this.extractDisadvantages(alternate),
        recommendationScore: this.calculateRecommendationScore(alternate)
      };
    });
  }

  /**
   * Perform comparison analysis
   */
  private performComparisonAnalysis(matrix: AlternateComparison['comparisonMatrix']): AlternateComparison['analysis'] {
    const sortedByCost = [...matrix].sort((a, b) => a.totalCost - b.totalCost);
    const sortedByTime = [...matrix].sort((a, b) => this.durationToDays(a.totalTime) - this.durationToDays(b.totalTime));
    const sortedByQuality = [...matrix].sort((a, b) => this.qualityToNumber(b.qualityLevel) - this.qualityToNumber(a.qualityLevel));
    const sortedByRisk = [...matrix].sort((a, b) => this.riskToNumber(a.riskLevel) - this.riskToNumber(b.riskLevel));
    const sortedByScore = [...matrix].sort((a, b) => b.recommendationScore - a.recommendationScore);

    return {
      bestValue: sortedByScore[0]?.alternateId || '',
      lowestCost: sortedByCost[0]?.alternateId || '',
      fastestCompletion: sortedByTime[0]?.alternateId || '',
      highestQuality: sortedByQuality[0]?.alternateId || '',
      lowestRisk: sortedByRisk[0]?.alternateId || '',
      mostInnovative: this.findMostInnovative(matrix)
    };
  }

  // Helper methods
  private findItemInPhases(phases: WorkPhase[], itemId: string): EstimateLineItem | null {
    for (const phase of phases) {
      const item = phase.items.find(i => i.id === itemId);
      if (item) return item;
    }
    return null;
  }

  private findPhaseByPath(phases: WorkPhase[], path: string): WorkPhase | null {
    // Simple path resolution - could be enhanced
    const phaseId = path.split('/')[0];
    return phases.find(p => p.id === phaseId) || null;
  }

  private addDurations(duration1: Duration, duration2: Duration): Duration {
    const days1 = this.durationToDays(duration1);
    const days2 = this.durationToDays(duration2);
    return this.daysToDuration(days1 + days2);
  }

  private durationToDays(duration: Duration): number {
    switch (duration.unit) {
      case 'days': return duration.value;
      case 'weeks': return duration.value * 7;
      case 'months': return duration.value * 30;
      default: return duration.value;
    }
  }

  private daysToDuration(days: number): Duration {
    if (days <= 7) return { value: days, unit: 'days' };
    if (days <= 60) return { value: Math.ceil(days / 7), unit: 'weeks' };
    return { value: Math.ceil(days / 30), unit: 'months' };
  }

  private calculateDurationPercentage(baseDuration: Duration, deltaDuration: Duration): number {
    const baseDays = this.durationToDays(baseDuration);
    const deltaDays = this.durationToDays(deltaDuration);
    return baseDays > 0 ? (deltaDays / baseDays) * 100 : 0;
  }

  private calculateTotalDuration(phases: WorkPhase[]): Duration {
    const totalDays = phases.reduce((sum, phase) => sum + this.durationToDays(phase.duration), 0);
    return this.daysToDuration(totalDays);
  }

  private extractAdvantages(alternate: AlternateScope): string[] {
    const advantages: string[] = [];
    
    if (alternate.totalDeltaCost < 0) {
      advantages.push(`Cost savings of $${Math.abs(alternate.totalDeltaCost).toFixed(2)}`);
    }
    
    if (alternate.qualityLevelDelta === 'higher') {
      advantages.push('Higher quality materials and finishes');
    }
    
    if (alternate.riskLevelDelta === 'lower') {
      advantages.push('Reduced project risk');
    }

    // Add specific advantages based on alternate type
    switch (alternate.alternateType) {
      case 'value_engineering':
        advantages.push('Optimized value proposition', 'Cost-effective materials');
        break;
      case 'premium':
        advantages.push('Premium materials and finishes', 'Enhanced durability');
        break;
      case 'fast_track':
        advantages.push('Accelerated timeline', 'Earlier project completion');
        break;
    }

    return advantages;
  }

  private extractDisadvantages(alternate: AlternateScope): string[] {
    const disadvantages: string[] = [];
    
    if (alternate.totalDeltaCost > 0) {
      disadvantages.push(`Additional cost of $${alternate.totalDeltaCost.toFixed(2)}`);
    }
    
    if (alternate.qualityLevelDelta === 'lower') {
      disadvantages.push('Reduced material quality');
    }
    
    if (alternate.riskLevelDelta === 'higher') {
      disadvantages.push('Increased project risk');
    }

    return disadvantages;
  }

  private calculateRecommendationScore(alternate: AlternateScope): number {
    let score = 50; // Base score

    // Cost impact (negative delta increases score)
    score += (-alternate.deltaPercentage / 100) * 20;

    // Quality impact
    if (alternate.qualityLevelDelta === 'higher') score += 15;
    if (alternate.qualityLevelDelta === 'lower') score -= 10;

    // Risk impact
    if (alternate.riskLevelDelta === 'lower') score += 10;
    if (alternate.riskLevelDelta === 'higher') score -= 15;

    // Confidence boost based on number of well-defined deltas
    const avgConfidence = alternate.costDeltas.reduce((sum, d) => sum + d.confidence, 0) / alternate.costDeltas.length;
    score += (avgConfidence - 0.5) * 20;

    return Math.max(0, Math.min(100, score));
  }

  private qualityToNumber(quality: 'lower' | 'same' | 'higher'): number {
    switch (quality) {
      case 'lower': return 0;
      case 'same': return 1;
      case 'higher': return 2;
    }
  }

  private riskToNumber(risk: 'lower' | 'same' | 'higher'): number {
    switch (risk) {
      case 'lower': return 0;
      case 'same': return 1;
      case 'higher': return 2;
    }
  }

  private findMostInnovative(matrix: AlternateComparison['comparisonMatrix']): string {
    // Simple heuristic: alternate with most modifications or custom type
    const customAlternates = matrix.filter(m => {
      const alternate = this.alternateScopes.get(m.alternateId);
      return alternate?.alternateType === 'custom';
    });

    return customAlternates.length > 0 ? customAlternates[0].alternateId : matrix[0]?.alternateId || '';
  }

  private generateComparisonRecommendations(
    baseScope: BaseScopeTree,
    alternates: AlternateScope[],
    analysis: AlternateComparison['analysis']
  ): EstimateRecommendation[] {
    const recommendations: EstimateRecommendation[] = [];

    // Add general recommendations based on analysis
    recommendations.push({
      id: 'best_value_recommendation',
      category: 'competitive_positioning',
      priority: 'high',
      title: 'Best Value Alternate',
      description: `Consider ${alternates.find(a => a.id === analysis.bestValue)?.name || 'the recommended alternate'} for optimal value proposition`,
      impact: {
        qualityImprovement: 'Balanced cost, quality, and risk profile'
      },
      implementation: {
        effort: 'medium',
        timeline: { value: 1, unit: 'weeks' },
        requirements: ['Detailed review', 'Client approval', 'Updated contracts']
      },
      tradeoffs: ['May require scope adjustments'],
      confidence: 0.85
    });

    return recommendations;
  }

  private performSensitivityAnalysis(
    baseScope: BaseScopeTree,
    alternates: AlternateScope[]
  ): AlternateComparison['sensitivityAnalysis'] {
    // Simplified sensitivity analysis
    return [
      {
        parameter: 'Material Cost Variance',
        baseValue: baseScope.baseCostSummary.materialTotal,
        sensitivities: [
          {
            change: -10,
            impactOnCost: -baseScope.baseCostSummary.materialTotal * 0.1,
            impactOnSchedule: 0,
            affectedAlternates: alternates.map(a => a.id)
          },
          {
            change: 10,
            impactOnCost: baseScope.baseCostSummary.materialTotal * 0.1,
            impactOnSchedule: 0,
            affectedAlternates: alternates.map(a => a.id)
          }
        ]
      }
    ];
  }

  // Getters for stored data
  getBaseScopeTree(id: string): BaseScopeTree | undefined {
    return this.baseScopeTrees.get(id);
  }

  getAlternateScope(id: string): AlternateScope | undefined {
    return this.alternateScopes.get(id);
  }

  getAllBaseScopeTrees(): BaseScopeTree[] {
    return Array.from(this.baseScopeTrees.values());
  }

  getAllAlternateScopes(): AlternateScope[] {
    return Array.from(this.alternateScopes.values());
  }

  getAlternatesByBaseScope(baseScopeId: string): AlternateScope[] {
    return Array.from(this.alternateScopes.values())
      .filter(alt => alt.parentScopeId === baseScopeId);
  }
}
