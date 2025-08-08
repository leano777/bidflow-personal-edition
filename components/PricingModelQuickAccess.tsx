import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Calculator, Home, Building, TrendingUp, ArrowRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner@2.0.3';

interface PricingModelQuickAccessProps {
  onCreateProposal?: (method: 'ai' | 'manual', pricingData?: any) => void;
}

export function PricingModelQuickAccess({ onCreateProposal }: PricingModelQuickAccessProps) {
  const { theme } = useTheme();
  
  const [quickEstimate, setQuickEstimate] = useState({
    projectType: 'homes' as 'homes' | 'adus', // Fixed to match MARKET_PRICING keys
    marketTier: 'medium' as 'low' | 'medium' | 'high' | 'luxury',
    squareFootage: 2000
  });

  // Separate state for the input display value to allow temporary empty strings
  const [squareFootageInput, setSquareFootageInput] = useState('2000');

  // Market pricing data (corrected to match keys)
  const MARKET_PRICING = {
    homes: {
      low: { min: 180, max: 250, typical: 215 },
      medium: { min: 250, max: 350, typical: 300 },
      high: { min: 350, max: 500, typical: 425 },
      luxury: { min: 500, max: 800, typical: 650 }
    },
    adus: {
      low: { min: 200, max: 280, typical: 240 },
      medium: { min: 280, max: 380, typical: 330 },
      high: { min: 380, max: 520, typical: 450 },
      luxury: { min: 520, max: 750, typical: 635 }
    }
  };

  // Safe access to pricing data with fallbacks
  const getPricingData = () => {
    try {
      const projectPricing = MARKET_PRICING[quickEstimate.projectType];
      if (!projectPricing) {
        console.error('Invalid project type:', quickEstimate.projectType);
        return MARKET_PRICING.homes.medium; // fallback
      }
      
      const tierPricing = projectPricing[quickEstimate.marketTier];
      if (!tierPricing) {
        console.error('Invalid market tier:', quickEstimate.marketTier);
        return projectPricing.medium; // fallback
      }
      
      return tierPricing;
    } catch (error) {
      console.error('Error accessing pricing data:', error);
      return MARKET_PRICING.homes.medium; // fallback
    }
  };

  // Calculate estimates with error handling
  const pricingData = getPricingData();
  const estimatedCost = pricingData.typical * (quickEstimate.squareFootage || 1);
  const marketRange = {
    min: pricingData.min * (quickEstimate.squareFootage || 1),
    max: pricingData.max * (quickEstimate.squareFootage || 1)
  };

  // Theme-aware classes
  const getCardClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'contractor-card card-hover bg-gray-900 border-gray-600 text-white';
      case 'dark-glass':
        return 'contractor-card card-hover glass-card';
      case 'light-glass':
        return 'contractor-card card-hover glass-card';
      default:
        return 'contractor-card card-hover';
    }
  };

  const getInputClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'bg-black border-white text-white placeholder:text-gray-400 focus:border-white focus:ring-white/30';
      case 'dark-glass':
        return 'bg-white/10 border-white/20 text-foreground backdrop-blur-sm';
      case 'light-glass':
        return 'bg-white/60 border-gray-300/40 backdrop-blur-sm';
      default:
        return '';
    }
  };

  const getSelectClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'bg-black border-white text-white data-[placeholder]:text-gray-400 [&>span]:text-white';
      case 'dark-glass':
        return 'bg-white/10 border-white/20 text-foreground backdrop-blur-sm';
      case 'light-glass':
        return 'bg-white/60 border-gray-300/40 backdrop-blur-sm';
      default:
        return '';
    }
  };

  const getIconClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'text-white stroke-2';
      case 'dark-glass':
        return 'text-foreground/80';
      case 'light-glass':
        return 'text-foreground/80';
      default:
        return 'text-primary';
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

  const getGlassClasses = () => {
    switch (theme) {
      case 'tactical':
        return 'bg-gray-800 border border-gray-600 rounded-lg p-4';
      case 'dark-glass':
        return 'glass-subtle backdrop-blur-sm rounded-lg p-4';
      case 'light-glass':
        return 'glass-subtle backdrop-blur-sm rounded-lg p-4';
      default:
        return 'glass-subtle rounded-lg p-4';
    }
  };

  // Handle creating proposal with pricing data
  const handleCreateProposalWithPricing = useCallback(() => {
    try {
      const pricingData = {
        projectType: quickEstimate.projectType === 'homes' ? 'home' : 'adu', // Convert back to singular
        marketTier: quickEstimate.marketTier,
        squareFootage: quickEstimate.squareFootage,
        estimatedCost,
        pricePerSF: getPricingData().typical
      };

      onCreateProposal?.('manual', pricingData);
      toast.success(`Creating proposal with ${pricingData.projectType} pricing model`);
    } catch (error) {
      console.error('Error creating proposal with pricing:', error);
      toast.error('Failed to create proposal with pricing data');
    }
  }, [quickEstimate, estimatedCost, onCreateProposal]);

  const handleQuickEstimate = useCallback(() => {
    try {
      const displayType = quickEstimate.projectType === 'homes' ? 'home' : 'ADU';
      toast.success(
        `Quick Estimate: $${estimatedCost.toLocaleString()} for ${quickEstimate.squareFootage} SF ${displayType}`,
        { duration: 5000 }
      );
    } catch (error) {
      console.error('Error generating quick estimate:', error);
      toast.error('Failed to generate quick estimate');
    }
  }, [estimatedCost, quickEstimate]);

  // Safe update function
  const updateProjectType = useCallback((value: string) => {
    if (value === 'home' || value === 'homes') {
      setQuickEstimate(prev => ({ ...prev, projectType: 'homes' }));
    } else if (value === 'adu' || value === 'adus') {
      setQuickEstimate(prev => ({ ...prev, projectType: 'adus' }));
    }
  }, []);

  // Update input display when squareFootage changes from other sources
  const prevSquareFootage = useRef(quickEstimate.squareFootage);
  if (prevSquareFootage.current !== quickEstimate.squareFootage) {
    prevSquareFootage.current = quickEstimate.squareFootage;
    setSquareFootageInput(quickEstimate.squareFootage.toString());
  }

  const updateMarketTier = useCallback((value: string) => {
    if (['low', 'medium', 'high', 'luxury'].includes(value)) {
      setQuickEstimate(prev => ({ ...prev, marketTier: value as any }));
    }
  }, []);

  const updateSquareFootage = useCallback((value: string) => {
    // Always update the input display value to allow clearing
    setSquareFootageInput(value);
    
    // Only update the actual squareFootage state if we have a valid number
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0) {
      setQuickEstimate(prev => ({ ...prev, squareFootage: parsed }));
    }
  }, []);

  // Handle blur event to ensure we have a valid value when user finishes editing
  const handleSquareFootageBlur = useCallback(() => {
    const parsed = parseInt(squareFootageInput);
    if (isNaN(parsed) || parsed <= 0) {
      // Reset to previous valid value if invalid input
      setSquareFootageInput(quickEstimate.squareFootage.toString());
    } else {
      // Ensure state is synced with valid input
      setQuickEstimate(prev => ({ ...prev, squareFootage: parsed }));
    }
  }, [squareFootageInput, quickEstimate.squareFootage]);

  return (
    <Card className={getCardClasses()}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 transition-colors duration-300 ${
          theme === 'tactical' ? 'text-white' : ''
        }`}>
          <Calculator className={`h-5 w-5 transition-colors duration-300 ${
            theme === 'tactical' ? 'text-white stroke-2' : 'text-primary'
          }`} />
          Construction Pricing Model
        </CardTitle>
        <p className={`text-sm transition-colors duration-300 ${
          theme === 'tactical' 
            ? 'text-gray-300' 
            : theme === 'dark-glass'
            ? 'text-muted-foreground/80'
            : 'text-muted-foreground'
        }`}>
          Get instant square footage pricing for homes and ADUs based on market tiers
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Project Type */}
          <div className="space-y-2">
            <Label className={`text-xs contractor-text-label transition-colors duration-300 ${
              theme === 'tactical' ? 'text-gray-300' : ''
            }`}>
              Project Type
            </Label>
            <Select 
              value={quickEstimate.projectType} 
              onValueChange={updateProjectType}
            >
              <SelectTrigger className={`h-9 ${getSelectClasses()}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={theme === 'tactical' ? 'bg-black border-white' : ''}>
                <SelectItem 
                  value="homes"
                  className={theme === 'tactical' ? 'text-white hover:bg-gray-800 focus:bg-gray-800 data-[highlighted]:bg-gray-800' : ''}
                >
                  <div className="flex items-center gap-2">
                    <Home className={`h-4 w-4 ${getIconClasses()}`} />
                    <span className={theme === 'tactical' ? 'text-white font-semibold' : ''}>Home</span>
                  </div>
                </SelectItem>
                <SelectItem 
                  value="adus"
                  className={theme === 'tactical' ? 'text-white hover:bg-gray-800 focus:bg-gray-800 data-[highlighted]:bg-gray-800' : ''}
                >
                  <div className="flex items-center gap-2">
                    <Building className={`h-4 w-4 ${getIconClasses()}`} />
                    <span className={theme === 'tactical' ? 'text-white font-semibold' : ''}>ADU</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Market Tier */}
          <div className="space-y-2">
            <Label className={`text-xs contractor-text-label transition-colors duration-300 ${
              theme === 'tactical' ? 'text-gray-300' : ''
            }`}>
              Market Tier
            </Label>
            <Select 
              value={quickEstimate.marketTier} 
              onValueChange={updateMarketTier}
            >
              <SelectTrigger className={`h-9 ${getSelectClasses()}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={theme === 'tactical' ? 'bg-black border-white' : ''}>
                <SelectItem 
                  value="low"
                  className={theme === 'tactical' ? 'text-white hover:bg-gray-800 focus:bg-gray-800 data-[highlighted]:bg-gray-800' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={theme === 'tactical' ? 'text-white font-semibold' : ''}>Budget</span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${theme === 'tactical' ? 'bg-black border-white text-white' : ''}`}
                    >
                      ${MARKET_PRICING[quickEstimate.projectType]?.low?.typical || 215}/SF
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem 
                  value="medium"
                  className={theme === 'tactical' ? 'text-white hover:bg-gray-800 focus:bg-gray-800 data-[highlighted]:bg-gray-800' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={theme === 'tactical' ? 'text-white font-semibold' : ''}>Standard</span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${theme === 'tactical' ? 'bg-black border-white text-white' : ''}`}
                    >
                      ${MARKET_PRICING[quickEstimate.projectType]?.medium?.typical || 300}/SF
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem 
                  value="high"
                  className={theme === 'tactical' ? 'text-white hover:bg-gray-800 focus:bg-gray-800 data-[highlighted]:bg-gray-800' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={theme === 'tactical' ? 'text-white font-semibold' : ''}>Premium</span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${theme === 'tactical' ? 'bg-black border-white text-white' : ''}`}
                    >
                      ${MARKET_PRICING[quickEstimate.projectType]?.high?.typical || 425}/SF
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem 
                  value="luxury"
                  className={theme === 'tactical' ? 'text-white hover:bg-gray-800 focus:bg-gray-800 data-[highlighted]:bg-gray-800' : ''}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={theme === 'tactical' ? 'text-white font-semibold' : ''}>Luxury</span>
                    <Badge 
                      variant="outline" 
                      className={`ml-2 ${theme === 'tactical' ? 'bg-black border-white text-white' : ''}`}
                    >
                      ${MARKET_PRICING[quickEstimate.projectType]?.luxury?.typical || 650}/SF
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Square Footage */}
          <div className="space-y-2">
            <Label className={`text-xs contractor-text-label transition-colors duration-300 ${
              theme === 'tactical' ? 'text-gray-300' : ''
            }`}>
              Square Footage
            </Label>
            <Input
              type="number"
              value={squareFootageInput}
              onChange={(e) => updateSquareFootage(e.target.value)}
              onBlur={handleSquareFootageBlur}
              placeholder="2000"
              className={`h-9 ${getInputClasses()}`}
              min="1"
              max="50000"
            />
          </div>
        </div>

        {/* Estimate Display */}
        <div className={`${getGlassClasses()} space-y-3`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-4 w-4 transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white stroke-2' : 'text-success'
              }`} />
              <span className={`contractor-text-label transition-colors duration-300 ${
                theme === 'tactical' ? 'text-gray-300' : ''
              }`}>
                Quick Estimate
              </span>
            </div>
            <Badge className={`transition-all duration-300 font-bold ${
              theme === 'tactical' 
                ? 'bg-white text-black border-white' 
                : theme === 'dark-glass'
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'status-active'
            }`}>
              ${pricingData.typical}/SF
            </Badge>
          </div>
          
          <div className="text-center">
            <div className={`contractor-text-currency text-2xl transition-colors duration-300 ${
              theme === 'tactical' ? 'text-white font-bold' : ''
            }`}>
              ${estimatedCost.toLocaleString()}
            </div>
            <div className={`text-xs mt-1 transition-colors duration-300 ${
              theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
            }`}>
              Range: ${marketRange.min.toLocaleString()} - ${marketRange.max.toLocaleString()}
            </div>
          </div>

          <Separator className={theme === 'tactical' ? 'bg-gray-600' : ''} />

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className={`contractor-text-value transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : ''
              }`}>
                {quickEstimate.squareFootage.toLocaleString()}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
              }`}>
                Square Feet
              </div>
            </div>
            <div>
              <div className={`contractor-text-value capitalize transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : ''
              }`}>
                {quickEstimate.marketTier}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
              }`}>
                Market Tier
              </div>
            </div>
            <div>
              <div className={`contractor-text-value transition-colors duration-300 ${
                theme === 'tactical' ? 'text-white' : ''
              }`}>
                {quickEstimate.projectType === 'homes' ? 'Home' : 'ADU'}
              </div>
              <div className={`text-xs transition-colors duration-300 ${
                theme === 'tactical' ? 'text-gray-400' : 'text-muted-foreground'
              }`}>
                Project Type
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <Button
            onClick={handleQuickEstimate}
            variant="outline"
            size="sm"
            className={getButtonClasses('secondary')}
          >
            <Calculator className={`h-4 w-4 mr-2 ${getIconClasses()}`} />
            Quick Estimate
          </Button>
          
          <Button
            onClick={handleCreateProposalWithPricing}
            size="sm"
            className={getButtonClasses('primary')}
          >
            Create Proposal
            <ArrowRight className={`h-4 w-4 ml-2 ${getIconClasses()}`} />
          </Button>
        </div>

        {/* Key Features */}
        <div className={`pt-2 border-t transition-colors duration-300 ${
          theme === 'tactical' ? 'border-gray-600' : 'border-border'
        }`}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                theme === 'tactical' ? 'bg-white' : 'bg-primary'
              }`}></div>
              <span className={theme === 'tactical' ? 'text-gray-300' : 'text-muted-foreground'}>
                Market-based pricing
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                theme === 'tactical' ? 'bg-white' : 'bg-success'
              }`}></div>
              <span className={theme === 'tactical' ? 'text-gray-300' : 'text-muted-foreground'}>
                Trade breakdowns
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                theme === 'tactical' ? 'bg-white' : 'bg-accent'
              }`}></div>
              <span className={theme === 'tactical' ? 'text-gray-300' : 'text-muted-foreground'}>
                Subcontractor scope
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                theme === 'tactical' ? 'bg-white' : 'bg-warning'
              }`}></div>
              <span className={theme === 'tactical' ? 'text-gray-300' : 'text-muted-foreground'}>
                Custom adjustments
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}