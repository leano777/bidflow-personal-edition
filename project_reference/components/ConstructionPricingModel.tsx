import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { AlertCircle, Calculator, Home, Building, Plus, Minus, Edit3 } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner@2.0.3';

// Market pricing data structure
const MARKET_PRICING = {
  home: {
    low: { min: 180, max: 250, typical: 215 },
    medium: { min: 250, max: 350, typical: 300 },
    high: { min: 350, max: 500, typical: 425 },
    luxury: { min: 500, max: 800, typical: 650 }
  },
  adu: {
    low: { min: 200, max: 280, typical: 240 },
    medium: { min: 280, max: 380, typical: 330 },
    high: { min: 380, max: 520, typical: 450 },
    luxury: { min: 520, max: 750, typical: 635 }
  }
};

// Trade/component breakdown percentages
const TRADE_BREAKDOWNS = {
  foundation: { percentage: 8, name: 'Foundation & Sitework' },
  framing: { percentage: 15, name: 'Framing & Structure' },
  roofing: { percentage: 8, name: 'Roofing' },
  electrical: { percentage: 10, name: 'Electrical' },
  plumbing: { percentage: 12, name: 'Plumbing' },
  hvac: { percentage: 8, name: 'HVAC' },
  insulation: { percentage: 4, name: 'Insulation' },
  drywall: { percentage: 6, name: 'Drywall & Paint' },
  flooring: { percentage: 8, name: 'Flooring' },
  kitchen: { percentage: 12, name: 'Kitchen' },
  bathrooms: { percentage: 8, name: 'Bathrooms' },
  permits: { percentage: 3, name: 'Permits & Fees' },
  overhead: { percentage: 15, name: 'Overhead & Profit' },
  contingency: { percentage: 5, name: 'Contingency' }
};

interface PricingModelState {
  projectType: 'home' | 'adu';
  marketTier: 'low' | 'medium' | 'high' | 'luxury';
  squareFootage: number;
  customPricingPerSF: number | null;
  useCustomPricing: boolean;
  tradeBreakdowns: Record<string, { 
    percentage: number; 
    customAmount?: number; 
    included: boolean;
    subcontractorNotes?: string;
  }>;
  additionalCosts: Array<{
    id: string;
    description: string;
    amount: number;
    category: 'upgrade' | 'change' | 'allowance';
  }>;
}

interface ConstructionPricingModelProps {
  onPricingUpdate?: (pricing: any) => void;
  initialData?: Partial<PricingModelState>;
  readOnly?: boolean;
}

export function ConstructionPricingModel({ 
  onPricingUpdate, 
  initialData,
  readOnly = false 
}: ConstructionPricingModelProps) {
  const { theme } = useTheme();
  
  const [state, setState] = useState<PricingModelState>({
    projectType: 'home',
    marketTier: 'medium',
    squareFootage: 2000,
    customPricingPerSF: null,
    useCustomPricing: false,
    tradeBreakdowns: Object.fromEntries(
      Object.entries(TRADE_BREAKDOWNS).map(([key, value]) => [
        key,
        { 
          percentage: value.percentage, 
          included: true, 
          subcontractorNotes: '' 
        }
      ])
    ),
    additionalCosts: [],
    ...initialData
  });

  const [showTradeDetails, setShowTradeDetails] = useState(false);

  // Safe access to market pricing data
  const getMarketData = useCallback(() => {
    try {
      const projectPricing = MARKET_PRICING[state.projectType];
      if (!projectPricing) {
        console.error('Invalid project type:', state.projectType);
        return MARKET_PRICING.home.medium;
      }
      
      const tierPricing = projectPricing[state.marketTier];
      if (!tierPricing) {
        console.error('Invalid market tier:', state.marketTier);
        return projectPricing.medium;
      }
      
      return tierPricing;
    } catch (error) {
      console.error('Error accessing market data:', error);
      return MARKET_PRICING.home.medium;
    }
  }, [state.projectType, state.marketTier]);

  // Calculate base pricing
  const basePricing = useMemo(() => {
    const marketData = getMarketData();
    const pricePerSF = state.useCustomPricing && state.customPricingPerSF 
      ? state.customPricingPerSF 
      : marketData.typical;
    
    return {
      pricePerSF,
      totalBase: pricePerSF * state.squareFootage,
      marketRange: {
        min: marketData.min * state.squareFootage,
        max: marketData.max * state.squareFootage
      }
    };
  }, [state.projectType, state.marketTier, state.squareFootage, state.useCustomPricing, state.customPricingPerSF, getMarketData]);

  // Calculate trade breakdowns
  const tradeCalculations = useMemo(() => {
    const calculations: Record<string, { amount: number; included: boolean; name: string }> = {};
    let totalIncluded = 0;
    
    Object.entries(state.tradeBreakdowns).forEach(([trade, config]) => {
      const tradeData = TRADE_BREAKDOWNS[trade];
      if (!tradeData) return;
      
      const amount = config.customAmount || (basePricing.totalBase * (config.percentage / 100));
      
      calculations[trade] = {
        amount,
        included: config.included,
        name: tradeData.name
      };
      
      if (config.included) {
        totalIncluded += amount;
      }
    });
    
    return { calculations, totalIncluded };
  }, [state.tradeBreakdowns, basePricing.totalBase]);

  // Calculate final pricing
  const finalPricing = useMemo(() => {
    const additionalTotal = state.additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);
    const subtotal = tradeCalculations.totalIncluded + additionalTotal;
    
    return {
      subtotal,
      additionalCosts: additionalTotal,
      grandTotal: subtotal,
      totalSF: state.squareFootage,
      effectivePricePSF: state.squareFootage > 0 ? subtotal / state.squareFootage : 0
    };
  }, [tradeCalculations.totalIncluded, state.additionalCosts, state.squareFootage]);

  // Update handlers with error handling
  const updateState = useCallback((updates: Partial<PricingModelState>) => {
    try {
      setState(prev => {
        const newState = { ...prev, ...updates };
        onPricingUpdate?.(newState);
        return newState;
      });
    } catch (error) {
      console.error('Error updating state:', error);
      toast.error('Failed to update pricing model');
    }
  }, [onPricingUpdate]);

  const updateTradeBreakdown = useCallback((trade: string, updates: Partial<typeof state.tradeBreakdowns[string]>) => {
    try {
      updateState({
        tradeBreakdowns: {
          ...state.tradeBreakdowns,
          [trade]: { ...state.tradeBreakdowns[trade], ...updates }
        }
      });
    } catch (error) {
      console.error('Error updating trade breakdown:', error);
      toast.error('Failed to update trade breakdown');
    }
  }, [state.tradeBreakdowns, updateState]);

  const addAdditionalCost = useCallback(() => {
    try {
      const newCost = {
        id: `cost_${Date.now()}`,
        description: '',
        amount: 0,
        category: 'upgrade' as const
      };
      
      updateState({
        additionalCosts: [...state.additionalCosts, newCost]
      });
    } catch (error) {
      console.error('Error adding additional cost:', error);
      toast.error('Failed to add additional cost');
    }
  }, [state.additionalCosts, updateState]);

  const updateAdditionalCost = useCallback((id: string, updates: Partial<typeof state.additionalCosts[0]>) => {
    try {
      updateState({
        additionalCosts: state.additionalCosts.map(cost => 
          cost.id === id ? { ...cost, ...updates } : cost
        )
      });
    } catch (error) {
      console.error('Error updating additional cost:', error);
      toast.error('Failed to update additional cost');
    }
  }, [state.additionalCosts, updateState]);

  const removeAdditionalCost = useCallback((id: string) => {
    try {
      updateState({
        additionalCosts: state.additionalCosts.filter(cost => cost.id !== id)
      });
    } catch (error) {
      console.error('Error removing additional cost:', error);
      toast.error('Failed to remove additional cost');
    }
  }, [state.additionalCosts, updateState]);

  const handleQuickEstimate = useCallback(() => {
    try {
      toast.success(`Quick estimate: $${finalPricing.grandTotal.toLocaleString()} for ${state.squareFootage} SF ${state.projectType}`);
    } catch (error) {
      console.error('Error generating quick estimate:', error);
      toast.error('Failed to generate quick estimate');
    }
  }, [finalPricing.grandTotal, state.squareFootage, state.projectType]);

  // Theme-aware classes
  const getCardClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'contractor-card bg-gray-900 border-gray-600 text-white';
      case 'dark-glass':
        return 'contractor-card glass-card';
      case 'light-glass':
        return 'contractor-card glass-card';
      default:
        return 'contractor-card';
    }
  };

  const getInputClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'bg-gray-800 border-gray-600 text-white placeholder:text-gray-400';
      case 'dark-glass':
        return 'bg-white/10 border-white/20 text-foreground backdrop-blur-sm';
      case 'light-glass':
        return 'bg-white/60 border-gray-300/40 backdrop-blur-sm';
      default:
        return '';
    }
  };

  const getButtonClasses = (variant: 'primary' | 'secondary' = 'primary') => {
    if (variant === 'primary') {
      switch (theme) {
        case 'tactical':
          return 'bg-white text-black hover:bg-gray-200 border-2 border-white';
        case 'dark-glass':
          return 'bg-primary/90 text-primary-foreground hover:bg-primary shadow-lg shadow-primary/25 backdrop-blur-sm';
        case 'light-glass':
          return 'bg-primary/90 text-primary-foreground hover:bg-primary shadow-lg backdrop-blur-sm';
        default:
          return 'contractor-button-primary';
      }
    } else {
      switch (theme) {
        case 'tactical':
          return 'bg-gray-800 text-white border-2 border-gray-600 hover:bg-gray-700 hover:border-gray-500';
        case 'dark-glass':
          return 'bg-white/10 text-foreground border border-white/20 hover:bg-white/20 backdrop-blur-sm';
        case 'light-glass':
          return 'bg-white/60 text-foreground border border-gray-300/40 hover:bg-white/80 backdrop-blur-sm';
        default:
          return 'contractor-button-secondary';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`contractor-section-header flex items-center gap-2 transition-colors duration-300 ${
            theme === 'tactical' ? 'text-white' : ''
          }`}>
            <Calculator className="h-5 w-5" />
            Construction Pricing Model
          </h2>
          <p className={`text-sm mt-1 transition-colors duration-300 ${
            theme === 'tactical' 
              ? 'text-gray-300' 
              : theme === 'dark-glass'
              ? 'text-muted-foreground/80'
              : 'text-muted-foreground'
          }`}>
            Generate market-based pricing for homes and ADUs with detailed trade breakdowns
          </p>
        </div>
        <Button onClick={handleQuickEstimate} className={getButtonClasses('primary')}>
          Quick Estimate
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="xl:col-span-1 space-y-4">
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle className={`text-lg flex items-center gap-2 transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : ''
              }`}>
                <Home className="h-4 w-4" />
                Project Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Project Type */}
              <div className="space-y-2">
                <Label className={theme === 'tactical' ? 'text-white' : ''}>Project Type</Label>
                <Select 
                  value={state.projectType} 
                  onValueChange={(value: 'home' | 'adu') => updateState({ projectType: value })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={getInputClasses()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4" />
                        Single Family Home
                      </div>
                    </SelectItem>
                    <SelectItem value="adu">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Accessory Dwelling Unit (ADU)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Market Tier */}
              <div className="space-y-2">
                <Label className={theme === 'tactical' ? 'text-white' : ''}>Market Tier</Label>
                <Select 
                  value={state.marketTier} 
                  onValueChange={(value: any) => updateState({ marketTier: value })}
                  disabled={readOnly}
                >
                  <SelectTrigger className={getInputClasses()}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center justify-between w-full">
                        <span>Budget/Entry Level</span>
                        <Badge variant="outline" className="ml-2">
                          ${MARKET_PRICING[state.projectType]?.low?.typical || 215}/SF
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center justify-between w-full">
                        <span>Standard/Mid-Range</span>
                        <Badge variant="outline" className="ml-2">
                          ${MARKET_PRICING[state.projectType]?.medium?.typical || 300}/SF
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center justify-between w-full">
                        <span>Premium/High-End</span>
                        <Badge variant="outline" className="ml-2">
                          ${MARKET_PRICING[state.projectType]?.high?.typical || 425}/SF
                        </Badge>
                      </div>
                    </SelectItem>
                    <SelectItem value="luxury">
                      <div className="flex items-center justify-between w-full">
                        <span>Luxury/Custom</span>
                        <Badge variant="outline" className="ml-2">
                          ${MARKET_PRICING[state.projectType]?.luxury?.typical || 650}/SF
                        </Badge>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Square Footage */}
              <div className="space-y-2">
                <Label className={theme === 'tactical' ? 'text-white' : ''}>Square Footage</Label>
                <Input
                  type="number"
                  value={state.squareFootage}
                  onChange={(e) => updateState({ squareFootage: parseInt(e.target.value) || 0 })}
                  placeholder="2000"
                  readOnly={readOnly}
                  min="1"
                  max="50000"
                  className={getInputClasses()}
                />
              </div>

              {/* Custom Pricing Toggle */}
              <div className="flex items-center justify-between">
                <Label className={theme === 'tactical' ? 'text-white' : ''}>Use Custom Price/SF</Label>
                <Switch
                  checked={state.useCustomPricing}
                  onCheckedChange={(checked) => updateState({ useCustomPricing: checked })}
                  disabled={readOnly}
                />
              </div>

              {/* Custom Pricing Input */}
              {state.useCustomPricing && (
                <div className="space-y-2">
                  <Label className={theme === 'tactical' ? 'text-white' : ''}>Custom Price per SF ($)</Label>
                  <Input
                    type="number"
                    value={state.customPricingPerSF || ''}
                    onChange={(e) => updateState({ customPricingPerSF: parseFloat(e.target.value) || null })}
                    placeholder="300"
                    readOnly={readOnly}
                    min="1"
                    className={getInputClasses()}
                  />
                </div>
              )}

              {/* Market Range Display */}
              <Alert className={theme === 'tactical' ? 'bg-gray-800 border-gray-600' : ''}>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className={theme === 'tactical' ? 'text-gray-200' : ''}>
                  Market range: ${basePricing.marketRange.min.toLocaleString()} - ${basePricing.marketRange.max.toLocaleString()}
                  <br />
                  Using: <strong>${basePricing.pricePerSF}/SF</strong>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Summary Card */}
          <Card className={getCardClasses()}>
            <CardHeader>
              <CardTitle className={`text-lg transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : ''
              }`}>
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className={`contractor-text-label transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-gray-300' : ''
                }`}>
                  Base Total:
                </span>
                <span className={`contractor-text-currency transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-white font-bold' : ''
                }`}>
                  ${finalPricing.subtotal.toLocaleString()}
                </span>
              </div>
              {finalPricing.additionalCosts > 0 && (
                <div className="flex justify-between">
                  <span className={`contractor-text-label transition-colors duration-300 ${
                    theme === 'tactical' ? 'text-gray-300' : ''
                  }`}>
                    Additional Costs:
                  </span>
                  <span className={`contractor-text-currency transition-colors duration-300 ${
                    theme === 'tactical' ? 'text-white font-bold' : ''
                  }`}>
                    ${finalPricing.additionalCosts.toLocaleString()}
                  </span>
                </div>
              )}
              <Separator className={theme === 'tactical' ? 'bg-gray-600' : ''} />
              <div className="flex justify-between text-lg">
                <span className={`contractor-text-value transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-white font-bold' : ''
                }`}>
                  Grand Total:
                </span>
                <span className={`contractor-text-currency text-lg transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-white font-bold' : ''
                }`}>
                  ${finalPricing.grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={theme === 'tactical' ? 'text-gray-300' : 'text-muted-foreground'}>
                  Effective Price/SF:
                </span>
                <span className={theme === 'tactical' ? 'text-gray-200' : ''}>
                  ${finalPricing.effectivePricePSF.toFixed(0)}/SF
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="xl:col-span-2">
          <Tabs defaultValue="trades" className="space-y-4">
            <TabsList className={`grid w-full grid-cols-3 ${
              theme === 'tactical' ? 'bg-gray-800 border border-gray-600' : ''
            }`}>
              <TabsTrigger value="trades" className={
                theme === 'tactical' ? 'data-[state=active]:bg-white data-[state=active]:text-black' : ''
              }>
                Trade Breakdown
              </TabsTrigger>
              <TabsTrigger value="scope" className={
                theme === 'tactical' ? 'data-[state=active]:bg-white data-[state=active]:text-black' : ''
              }>
                Subcontractor Scope
              </TabsTrigger>
              <TabsTrigger value="additional" className={
                theme === 'tactical' ? 'data-[state=active]:bg-white data-[state=active]:text-black' : ''
              }>
                Additional Costs
              </TabsTrigger>
            </TabsList>

            {/* Trade Breakdown Tab */}
            <TabsContent value="trades" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`contractor-section-header transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-white' : ''
                }`}>
                  Trade & Component Breakdown
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTradeDetails(!showTradeDetails)}
                  className={getButtonClasses('secondary')}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {showTradeDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>

              <div className="grid gap-3">
                {Object.entries(tradeCalculations.calculations).map(([trade, calc]) => (
                  <Card key={trade} className={`${getCardClasses()} ${
                    calc.included ? 'scope-item-material' : 'opacity-60'
                  } transition-all duration-300`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={calc.included}
                            onCheckedChange={(checked) => updateTradeBreakdown(trade, { included: checked })}
                            disabled={readOnly}
                          />
                          <div>
                            <div className={`contractor-text-value transition-colors duration-300 ${
                              theme === 'tactical' ? 'text-white' : ''
                            }`}>
                              {calc.name}
                            </div>
                            <div className={`text-xs transition-colors duration-300 ${
                              theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
                            }`}>
                              {state.tradeBreakdowns[trade]?.percentage || 0}% of base cost
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`contractor-text-currency transition-colors duration-300 ${
                            theme === 'tactical' ? 'text-white font-bold' : ''
                          }`}>
                            ${calc.amount.toLocaleString()}
                          </div>
                          {showTradeDetails && (
                            <Input
                              type="number"
                              value={state.tradeBreakdowns[trade]?.customAmount || ''}
                              onChange={(e) => updateTradeBreakdown(trade, { 
                                customAmount: parseFloat(e.target.value) || undefined 
                              })}
                              placeholder={calc.amount.toFixed(0)}
                              className={`w-24 mt-1 text-xs ${getInputClasses()}`}
                              readOnly={readOnly}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Subcontractor Scope Tab */}
            <TabsContent value="scope" className="space-y-4">
              <h3 className={`contractor-section-header transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : ''
              }`}>
                Subcontractor Scope Management
              </h3>
              <div className="grid gap-4">
                {Object.entries(TRADE_BREAKDOWNS).map(([trade, tradeData]) => (
                  <Card key={trade} className={getCardClasses()}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className={`contractor-text-value transition-colors duration-300 ${
                            theme === 'tactical' ? 'text-white' : ''
                          }`}>
                            {tradeData.name}
                          </h4>
                          <Badge className={`transition-all duration-300 ${
                            state.tradeBreakdowns[trade]?.included 
                              ? theme === 'tactical' 
                                ? 'bg-white text-black' 
                                : 'status-active'
                              : theme === 'tactical'
                              ? 'bg-gray-700 text-gray-300 border-gray-600'
                              : 'status-draft'
                          }`}>
                            {state.tradeBreakdowns[trade]?.included ? 'Included' : 'Excluded'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <Label className={`text-xs transition-colors duration-300 ${
                              theme === 'tactical' ? 'text-green-300' : 'text-success'
                            }`}>
                              Typically Included:
                            </Label>
                            <ul className={`mt-1 space-y-1 text-xs transition-colors duration-300 ${
                              theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
                            }`}>
                              {getTypicalInclusions(trade).map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <Label className={`text-xs transition-colors duration-300 ${
                              theme === 'tactical' ? 'text-red-300' : 'text-destructive'
                            }`}>
                              Typically Excluded:
                            </Label>
                            <ul className={`mt-1 space-y-1 text-xs transition-colors duration-300 ${
                              theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
                            }`}>
                              {getTypicalExclusions(trade).map((item, idx) => (
                                <li key={idx}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div className={`pt-2 border-t transition-colors duration-300 ${
                          theme === 'tactical' ? 'border-gray-600' : ''
                        }`}>
                          <Label className={`text-xs transition-colors duration-300 ${
                            theme === 'tactical' ? 'text-white' : ''
                          }`}>
                            Additional Notes:
                          </Label>
                          <Input
                            value={state.tradeBreakdowns[trade]?.subcontractorNotes || ''}
                            onChange={(e) => updateTradeBreakdown(trade, { subcontractorNotes: e.target.value })}
                            placeholder="Special requirements, exclusions, or notes..."
                            className={`mt-1 ${getInputClasses()}`}
                            readOnly={readOnly}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Additional Costs Tab */}
            <TabsContent value="additional" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`contractor-section-header transition-colors duration-300 ${
                  theme === 'tactical' ? 'text-white' : ''
                }`}>
                  Additional Costs & Upgrades
                </h3>
                <Button
                  onClick={addAdditionalCost}
                  size="sm"
                  className={getButtonClasses('primary')}
                  disabled={readOnly}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cost
                </Button>
              </div>

              <div className="space-y-3">
                {state.additionalCosts.map((cost) => (
                  <Card key={cost.id} className={getCardClasses()}>
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-2">
                          <Input
                            value={cost.description}
                            onChange={(e) => updateAdditionalCost(cost.id, { description: e.target.value })}
                            placeholder="Description of additional cost..."
                            readOnly={readOnly}
                            className={getInputClasses()}
                          />
                        </div>
                        <div>
                          <Select
                            value={cost.category}
                            onValueChange={(value: any) => updateAdditionalCost(cost.id, { category: value })}
                            disabled={readOnly}
                          >
                            <SelectTrigger className={getInputClasses()}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="upgrade">Upgrade</SelectItem>
                              <SelectItem value="change">Change Order</SelectItem>
                              <SelectItem value="allowance">Allowance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={cost.amount}
                            onChange={(e) => updateAdditionalCost(cost.id, { amount: parseFloat(e.target.value) || 0 })}
                            placeholder="0"
                            className={`flex-1 ${getInputClasses()}`}
                            readOnly={readOnly}
                            min="0"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeAdditionalCost(cost.id)}
                            disabled={readOnly}
                            className={getButtonClasses('secondary')}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {state.additionalCosts.length === 0 && (
                  <div className={`text-center py-8 transition-colors duration-300 ${
                    theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
                  }`}>
                    <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No additional costs added yet.</p>
                    <p className="text-sm">Click "Add Cost" to include upgrades, change orders, or allowances.</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Helper functions for typical inclusions/exclusions
function getTypicalInclusions(trade: string): string[] {
  const inclusions: Record<string, string[]> = {
    foundation: ['Excavation', 'Concrete work', 'Waterproofing', 'Basic grading'],
    framing: ['Lumber', 'Hardware', 'Labor', 'Structural engineering'],
    roofing: ['Materials', 'Installation', 'Basic flashing', 'Gutters'],
    electrical: ['Rough-in wiring', 'Panel installation', 'Basic fixtures', 'Permits'],
    plumbing: ['Rough-in plumbing', 'Basic fixtures', 'Water heater', 'Permits'],
    hvac: ['Ductwork', 'Equipment', 'Installation', 'Basic controls'],
    insulation: ['Materials', 'Installation', 'Vapor barriers'],
    drywall: ['Materials', 'Installation', 'Primer coat', 'Basic texture'],
    flooring: ['Materials', 'Installation', 'Basic trim', 'Underlayment'],
    kitchen: ['Basic cabinets', 'Countertops', 'Appliance rough-in'],
    bathrooms: ['Basic fixtures', 'Tile work', 'Basic vanity', 'Mirror'],
    permits: ['Building permits', 'Plan review fees', 'Inspection fees'],
    overhead: ['Project management', 'Insurance', 'General conditions'],
    contingency: ['Unforeseen conditions', 'Price fluctuations', 'Change orders']
  };
  
  return inclusions[trade] || [];
}

function getTypicalExclusions(trade: string): string[] {
  const exclusions: Record<string, string[]> = {
    foundation: ['Soil testing', 'Septic systems', 'Well drilling', 'Landscaping'],
    framing: ['Engineered beams', 'Metal framing', 'Specialty hardware'],
    roofing: ['Tile/slate materials', 'Structural repairs', 'Chimney work'],
    electrical: ['Upgrade fixtures', 'Smart home systems', 'Generator hookup'],
    plumbing: ['Upgrade fixtures', 'Water treatment', 'Gas line work'],
    hvac: ['High-efficiency systems', 'Zoning controls', 'Air purification'],
    insulation: ['Spray foam', 'Soundproofing', 'Radiant barriers'],
    drywall: ['Specialty finishes', 'Coffered ceilings', 'Curved walls'],
    flooring: ['Hardwood', 'Natural stone', 'Custom millwork'],
    kitchen: ['Upgrade appliances', 'Custom cabinets', 'Stone countertops'],
    bathrooms: ['Luxury fixtures', 'Steam showers', 'Heated floors'],
    permits: ['Impact fees', 'Utility connections', 'HOA approvals'],
    overhead: ['Extended warranties', 'Premium insurance', 'Expediting'],
    contingency: ['Owner changes', 'Premium upgrades', 'Scope additions']
  };
  
  return exclusions[trade] || [];
}