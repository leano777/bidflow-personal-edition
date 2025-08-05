// Pricing Engine UI Component - BF-002 Implementation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle, Loader2, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { PricingService } from '../lib/pricing';
import type { EstimateRequest, PricingCalculation } from '../lib/pricing';

interface PricingEngineProps {
  onEstimateGenerated?: (calculations: PricingCalculation[]) => void;
  initialRequests?: EstimateRequest[];
}

export function PricingEngine({ onEstimateGenerated, initialRequests = [] }: PricingEngineProps) {
  const [pricingService] = useState(() => new PricingService());
  const [requests, setRequests] = useState<EstimateRequest[]>(initialRequests);
  const [currentRequest, setCurrentRequest] = useState<Partial<EstimateRequest>>({
    measurementType: 'linear'
  });
  const [calculations, setCalculations] = useState<PricingCalculation[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [dbStats, setDbStats] = useState<any>(null);

  useEffect(() => {
    // Load database stats
    const stats = pricingService.getDatabaseStats();
    setDbStats(stats);
  }, [pricingService]);

  const handleAddRequest = () => {
    if (!currentRequest.description || !currentRequest.quantity) {
      toast.error('Please enter description and quantity');
      return;
    }

    const newRequest: EstimateRequest = {
      description: currentRequest.description,
      quantity: currentRequest.quantity,
      measurementType: currentRequest.measurementType || 'linear',
      unit: currentRequest.unit,
      location: currentRequest.location,
      urgency: currentRequest.urgency,
      qualityLevel: currentRequest.qualityLevel
    };

    setRequests(prev => [...prev, newRequest]);
    setCurrentRequest({ measurementType: currentRequest.measurementType });
    toast.success('Item added to estimate request');
  };

  const handleRemoveRequest = (index: number) => {
    setRequests(prev => prev.filter((_, i) => i !== index));
  };

  const handleCalculateEstimates = async () => {
    if (requests.length === 0) {
      toast.error('Please add at least one item to estimate');
      return;
    }

    setIsCalculating(true);
    setShowResults(false);

    try {
      const result = await pricingService.generateMultipleEstimates(requests);
      
      setCalculations(result.calculations);
      setShowResults(true);
      
      if (onEstimateGenerated) {
        onEstimateGenerated(result.calculations);
      }

      toast.success(`Generated ${result.calculations.length} estimates totaling $${result.totalEstimate.toFixed(2)}`);
      
    } catch (error) {
      console.error('Error calculating estimates:', error);
      toast.error('Failed to calculate estimates');
    } finally {
      setIsCalculating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const totalEstimate = calculations.reduce((sum, calc) => sum + calc.lineItemTotal, 0);
  const averageConfidence = calculations.length > 0 
    ? calculations.reduce((sum, calc) => sum + calc.confidenceScore, 0) / calculations.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Intelligent Pricing Engine
            <Badge variant="outline" className="ml-2">BF-002</Badge>
          </CardTitle>
          {dbStats && (
            <div className="text-sm text-muted-foreground">
              Database: {dbStats.activeRules} pricing rules • {dbStats.categories} categories • Last updated: {new Date(dbStats.lastSync).toLocaleDateString()}
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Add Item Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Estimate Item</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="e.g., chain link fence around backyard"
                value={currentRequest.description || ''}
                onChange={(e) => setCurrentRequest(prev => ({ ...prev, description: e.target.value }))}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    placeholder="150"
                    value={currentRequest.quantity || ''}
                    onChange={(e) => setCurrentRequest(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="measurementType">Type</Label>
                  <Select
                    value={currentRequest.measurementType}
                    onValueChange={(value: 'linear' | 'square' | 'cubic' | 'count') => 
                      setCurrentRequest(prev => ({ ...prev, measurementType: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="linear">Linear Feet</SelectItem>
                      <SelectItem value="square">Square Feet</SelectItem>
                      <SelectItem value="cubic">Cubic Feet</SelectItem>
                      <SelectItem value="count">Count/Each</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (Optional)</Label>
                  <Input
                    id="location"
                    placeholder="e.g., San Francisco"
                    value={currentRequest.location || ''}
                    onChange={(e) => setCurrentRequest(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="qualityLevel">Quality</Label>
                  <Select
                    value={currentRequest.qualityLevel}
                    onValueChange={(value: 'basic' | 'standard' | 'premium') => 
                      setCurrentRequest(prev => ({ ...prev, qualityLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standard" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleAddRequest} className="w-full">
            <TrendingUp className="w-4 h-4 mr-2" />
            Add to Estimate
          </Button>
        </CardContent>
      </Card>

      {/* Request List */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estimate Items ({requests.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{request.description}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.quantity} {request.measurementType}
                      {request.location && ` • ${request.location}`}
                      {request.qualityLevel && ` • ${request.qualityLevel}`}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveRequest(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t">
              <Button 
                onClick={handleCalculateEstimates} 
                disabled={isCalculating}
                className="w-full"
                size="lg"
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculating Estimates...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Calculate Intelligent Estimates
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {showResults && calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Pricing Results</span>
              <Badge variant="outline">
                {(averageConfidence * 100).toFixed(1)}% Confidence
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">${formatCurrency(totalEstimate)}</div>
                <div className="text-sm text-muted-foreground">Total Estimate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{calculations.length}</div>
                <div className="text-sm text-muted-foreground">Line Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{(averageConfidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg. Confidence</div>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-4">
              {calculations.map((calc, index) => (
                <div key={calc.lineItemId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-medium">{calc.description}</h4>
                      <div className="text-sm text-muted-foreground">
                        {calc.quantity} {calc.unit} • {calc.complexityLevel} complexity
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${formatCurrency(calc.lineItemTotal)}</div>
                      <div className="text-sm text-muted-foreground">
                        ${formatCurrency(calc.lineItemTotal / calc.quantity)}/{calc.unit}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Materials</div>
                      <div className="font-medium">${formatCurrency(calc.materialTotal)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Labor</div>
                      <div className="font-medium">${formatCurrency(calc.laborTotal)}</div>
                      <div className="text-xs text-muted-foreground">{calc.laborHours.toFixed(1)} hrs</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Waste</div>
                      <div className="font-medium">${formatCurrency(calc.wasteAmount)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Confidence</div>
                      <div className="flex items-center gap-1">
                        {calc.confidenceScore >= 0.8 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : calc.confidenceScore >= 0.6 ? (
                          <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-medium">{(calc.confidenceScore * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}