# Composite Pricing Engine - Step 7 Implementation

## Overview

The Composite Pricing Engine is a sophisticated construction pricing system that implements **composite-rate decomposition** as specified in Step 7 of the project requirements. It provides:

✅ **Scope Line Mapping** - Maps parsed scope lines to detailed cost assemblies  
✅ **Labor Hours & Crew Calculation** - Computes detailed crew makeup and labor hours  
✅ **Material Quantity Calculation** - Calculates material requirements with waste factors  
✅ **Equipment Hours Calculation** - Determines equipment needs and operating costs  
✅ **Composite Rate Reverse-Engineering** - Decomposes $/LF rates using cost book ratios  
✅ **Detailed Breakdown Tables** - Generates tables suitable for estimator override

## Key Features

### 1. Cost Assembly Mapping
- Automatically matches scope descriptions to cost assemblies using keyword analysis
- Falls back to generic assemblies when no match is found
- Uses construction category inference for unknown items

### 2. Detailed Cost Breakdown
- **Labor**: Crew composition by skill level (foreman, journeyman, apprentice, laborer)
- **Materials**: Individual material items with quantities and unit costs
- **Equipment**: Equipment hours, rental rates, and operator costs
- **Overhead & Profit**: Configurable markup percentages

### 3. Composite Rate Decomposition
When a composite rate (e.g., $12.50/LF) is provided, the engine reverse-engineers it to expose:
- Labor share (amount & percentage)
- Material share (amount & percentage)  
- Equipment share (amount & percentage)
- Overhead & profit (amount & percentage)

### 4. Estimator Override Support
- All values are marked as overrideable
- Provides structured data for estimator adjustments
- Maintains audit trail of changes
- Supports approval workflows

## Architecture

```
CompositePricingEngine
├── CostAssembly Management
├── Scope Line Processing
├── Cost Calculations
│   ├── Labor Breakdown
│   ├── Material Breakdown
│   └── Equipment Breakdown
├── Composite Rate Analysis
└── Export Capabilities
```

## Usage Examples

### Basic Usage

```typescript
import { CompositePricingEngine } from './composite-pricing-engine';

const engine = new CompositePricingEngine(database);

const scopeLines = [
  {
    id: '1',
    description: 'Pour concrete foundation slab 4 inches thick',
    quantity: 800,
    unit: 'SF',
    compositeRate: 9.25, // Will be decomposed
    priority: 'required'
  }
];

const breakdowns = await engine.processScopeLines(scopeLines);
```

### Custom Cost Assemblies

```typescript
const customAssembly: CostAssembly = {
  id: 'concrete_001',
  code: '03.30.53.40',
  description: 'Concrete Slab on Grade, 4" thick',
  category: CONSTRUCTION_CATEGORIES.CONCRETE,
  unit: 'SF',
  
  laborComponent: {
    skillMix: {
      foreman: 0.20,
      journeyman: 0.50,
      apprentice: 0.20,
      laborer: 0.10
    }
  },
  
  materialComponent: {
    materials: [
      {
        name: '4000 PSI Concrete',
        quantityPerAssemblyUnit: 0.0123, // CY per SF
        unitCost: 125
      }
    ]
  }
};

const engine = new CompositePricingEngine(database, [customAssembly]);
```

### Composite Rate Analysis

```typescript
// Input: $8.75/SF composite rate
// Output: Detailed breakdown
{
  originalCompositeRate: 8.75,
  laborShare: {
    amount: 3.06,      // $3.06/SF
    percentage: 35.0,  // 35%
    hours: 0.068,      // 0.068 hours per SF
    rate: 45           // $45/hour average
  },
  materialShare: {
    amount: 3.94,      // $3.94/SF
    percentage: 45.0   // 45%
  },
  equipmentShare: {
    amount: 1.05,      // $1.05/SF
    percentage: 12.0   // 12%
  },
  overheadAndProfit: {
    amount: 0.70,      // $0.70/SF
    percentage: 8.0    // 8%
  }
}
```

## Data Structures

### ScopeLine
```typescript
interface ScopeLine {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  compositeRate?: number;  // Optional $/unit rate to decompose
  priority: 'required' | 'optional' | 'alternate';
}
```

### DetailedBreakdownTable
```typescript
interface DetailedBreakdownTable {
  description: string;
  quantity: number;
  unit: string;
  
  laborBreakdown: {
    crew: CrewMember[];
    totalHours: number;
    totalCost: number;
  };
  
  materialBreakdown: {
    items: MaterialItem[];
    totalCost: number;
  };
  
  equipmentBreakdown: {
    items: EquipmentItem[];
    totalCost: number;
  };
  
  totalCost: number;
  unitCost: number;
  confidenceScore: number;
  
  compositeAnalysis?: CompositeRateAnalysis;
}
```

### CrewMember
```typescript
interface CrewMember {
  trade: string;
  skillLevel: 'foreman' | 'journeyman' | 'apprentice' | 'laborer';
  quantity: number;
  hoursPerUnit: number;
  hourlyRate: number;
  totalHours: number;
  totalCost: number;
}
```

## Export Formats

### JSON Export
Full structured data suitable for system integration.

### CSV Export
Tabular format for spreadsheet applications.

### Estimator Format
Structured format optimized for estimator override:

```typescript
{
  summary: {
    description: "...",
    totalCost: 10500.00,
    confidenceScore: 0.85
  },
  
  labor: {
    crew: [
      {
        type: "foreman",
        count: 1,
        hours: 16.0,
        rate: 75,
        cost: 1200.00,
        overrideable: true
      }
    ]
  },
  
  materials: [
    {
      name: "4000 PSI Concrete",
      quantity: 18.45,
      unit: "CY",
      unitCost: 125.00,
      totalCost: 2306.25,
      overrideable: true
    }
  ]
}
```

## Cost Book Integration

The engine supports multiple cost book formats and ratios:

### Default Ratios by Category

| Category | Labor % | Material % | Equipment % | OH&P % |
|----------|---------|------------|-------------|--------|
| Concrete | 35% | 45% | 12% | 8% |
| Framing | 55% | 35% | 3% | 7% |
| Electrical | 65% | 25% | 3% | 7% |
| Plumbing | 60% | 28% | 5% | 7% |
| Roofing | 45% | 42% | 8% | 5% |

### Custom Ratios
```typescript
engine.updateCostBookRatios({
  '03.30.53.40': {
    laborPercentage: 0.35,
    materialPercentage: 0.45,
    equipmentPercentage: 0.12,
    overheadAndProfitPercentage: 0.08,
    averageLaborRate: 45
  }
});
```

## Testing

The engine includes comprehensive tests:

```bash
npm run test:composite-pricing
```

Test coverage includes:
- Basic scope line processing
- Composite rate decomposition
- Cost assembly matching
- Export functionality
- Crew makeup calculations

## Integration

### With Voice-to-Scope System
```typescript
import { ScopeOrganizer } from '../voice-scope/scope-organizer';
import { CompositePricingEngine } from './composite-pricing-engine';

// Convert organized scope to scope lines
const scopeLines = organizedScope.workCategories
  .flatMap(category => category.items)
  .map(item => ({
    id: item.id,
    description: item.description,
    quantity: item.quantity || 1,
    unit: item.unit || 'EA',
    priority: item.priority
  }));

// Process with composite pricing engine
const breakdowns = await engine.processScopeLines(scopeLines);
```

### With Compilation System
```typescript
import { WorkPhase, EstimateLineItem } from '../compilation/types';

// Convert breakdowns to estimate line items
const lineItems: EstimateLineItem[] = breakdowns.map(breakdown => ({
  id: breakdown.lineItemId,
  description: breakdown.description,
  quantity: breakdown.quantity,
  unit: breakdown.unit,
  materialCost: breakdown.materialBreakdown.totalCost,
  laborCost: breakdown.laborBreakdown.totalCost,
  equipmentCost: breakdown.equipmentBreakdown.totalCost,
  lineItemTotal: breakdown.totalCost,
  confidenceScore: breakdown.confidenceScore,
  laborHours: breakdown.laborBreakdown.totalHours
}));
```

## Configuration

### Engine Options
```typescript
const engine = new CompositePricingEngine(
  database,           // Pricing database
  costAssemblies,    // Custom cost assemblies
  costBookRatios     // Custom cost book ratios
);
```

### Override Settings
```typescript
const overrideOptions = {
  allowLaborRateOverride: true,
  allowMaterialPriceOverride: true,
  allowEquipmentRateOverride: true,
  allowQuantityOverride: true,
  requireApproval: true
};
```

## Performance Considerations

- **Caching**: Cost assemblies and ratios are cached in memory
- **Batch Processing**: Supports processing multiple scope lines efficiently
- **Lazy Loading**: Material and equipment data loaded on demand
- **Memory Management**: Large datasets handled with streaming

## Error Handling

The engine provides robust error handling:
- Invalid scope lines create error breakdowns
- Missing assemblies fall back to generic assemblies
- Malformed composite rates use default ratios
- All errors are logged with context

## Future Enhancements

Planned improvements:
- Machine learning for assembly matching
- Dynamic cost book updates
- Regional cost adjustments
- Historical pricing analysis
- Predictive cost modeling

## Support

For technical support or questions about the Composite Pricing Engine:
1. Check the test files for usage examples
2. Review the type definitions for data structures
3. Examine the example implementation
4. Consult the integration documentation

---

*This engine implements Step 7 of the construction pricing system, providing comprehensive composite-rate decomposition with detailed breakdown tables suitable for estimator override.*
