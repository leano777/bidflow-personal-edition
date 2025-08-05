// Estimate Compilation UI Component - BF-005 Implementation

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { 
  FileText, 
  Calculator, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  BarChart3,
  Brain,
  Shield,
  Layers,
  Download,
  RefreshCw,
  Loader2,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { EstimateCompiler as EstimateCompilerEngine, CompilationOptions } from '../lib/compilation';
import { PricingService } from '../lib/pricing';
import type { 
  CompleteEstimate, 
  ProjectSummary, 
  WorkPhase,
  CostSummary,
  EstimateRecommendation,
  AlternativeEstimate
} from '../lib/compilation/types';
import type { EstimateRequest, PricingCalculation } from '../lib/pricing/types';

interface EstimateCompilerProps {
  onEstimateCompleted?: (estimate: CompleteEstimate) => void;
  initialProject?: Partial<ProjectSummary>;
  initialPricingData?: PricingCalculation[];
}

interface CompilationStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  duration?: number;
}

export function EstimateCompiler({ 
  onEstimateCompleted, 
  initialProject, 
  initialPricingData = [] 
}: EstimateCompilerProps) {
  // Core state
  const [compiler] = useState(() => new EstimateCompilerEngine());
  const [pricingService] = useState(() => new PricingService());
  
  // Project state
  const [project, setProject] = useState<Partial<ProjectSummary>>(initialProject || {
    name: '',
    address: '',
    clientName: '',
    clientContact: '',
    projectType: 'Residential',
    totalSquareFootage: undefined,
    totalLinearFootage: undefined
  });

  // Pricing data state
  const [pricingRequests, setPricingRequests] = useState<EstimateRequest[]>([]);
  const [pricingCalculations, setPricingCalculations] = useState<PricingCalculation[]>(initialPricingData);

  // Compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compilationSteps, setCompilationSteps] = useState<CompilationStep[]>([]);
  const [compilationOptions, setCompilationOptions] = useState<CompilationOptions>({
    generateRecommendations: true,
    generateAlternatives: true,
    performQualityControl: true,
    markupRate: 0.20,
    contingencyRate: 0.05,
    overheadRate: 0.15
  });

  // Results state
  const [completeEstimate, setCompleteEstimate] = useState<CompleteEstimate | null>(null);
  const [activeTab, setActiveTab] = useState<'setup' | 'compilation' | 'results'>('setup');

  // Initialize compilation steps
  useEffect(() => {
    setCompilationSteps([
      { id: 'organize', name: 'Organize Work Phases', description: 'Categorizing line items into construction phases', status: 'pending', progress: 0 },
      { id: 'calculate', name: 'Calculate Costs', description: 'Computing totals with overhead and markup', status: 'pending', progress: 0 },
      { id: 'quality', name: 'Quality Control', description: 'Validating data and identifying risks', status: 'pending', progress: 0 },
      { id: 'recommendations', name: 'Generate Recommendations', description: 'AI-powered optimization suggestions', status: 'pending', progress: 0 },
      { id: 'scenarios', name: 'Alternative Scenarios', description: 'Creating pricing alternatives', status: 'pending', progress: 0 },
      { id: 'finalize', name: 'Finalize Estimate', description: 'Assembling complete estimate package', status: 'pending', progress: 0 }
    ]);
  }, []);

  const updateStepStatus = (stepId: string, status: CompilationStep['status'], progress: number = 0) => {
    setCompilationSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, progress, duration: status === 'completed' ? Date.now() : step.duration }
        : step
    ));
  };

  const handleAddPricingRequest = () => {
    const newRequest: EstimateRequest = {
      description: '',
      quantity: 0,
      measurementType: 'linear'
    };
    setPricingRequests(prev => [...prev, newRequest]);
  };

  const handleUpdatePricingRequest = (index: number, updates: Partial<EstimateRequest>) => {
    setPricingRequests(prev => prev.map((req, i) => i === index ? { ...req, ...updates } : req));
  };

  const handleRemovePricingRequest = (index: number) => {
    setPricingRequests(prev => prev.filter((_, i) => i !== index));
  };

  const handleGeneratePricing = async () => {
    if (pricingRequests.length === 0) {
      toast.error('Please add at least one pricing request');
      return;
    }

    try {
      const result = await pricingService.generateMultipleEstimates(pricingRequests);
      setPricingCalculations(result.calculations);
      toast.success(`Generated ${result.calculations.length} pricing calculations`);
    } catch (error) {
      console.error('Error generating pricing:', error);
      toast.error('Failed to generate pricing calculations');
    }
  };

  const handleStartCompilation = async () => {
    if (!project.name || !project.clientName) {
      toast.error('Please fill in project name and client name');
      return;
    }

    if (pricingCalculations.length === 0) {
      toast.error('Please generate pricing calculations first');
      return;
    }

    setIsCompiling(true);
    setActiveTab('compilation');

    const projectSummary: ProjectSummary = {
      id: `project_${Date.now()}`,
      name: project.name,
      address: project.address || '',
      clientName: project.clientName,
      clientContact: project.clientContact || '',
      totalSquareFootage: project.totalSquareFootage,
      totalLinearFootage: project.totalLinearFootage,
      projectType: project.projectType || 'Residential',
      estimatedDuration: { value: 0, unit: 'days' },
      createdAt: new Date(),
      lastModified: new Date()
    };

    try {
      // Step 1: Organize phases
      updateStepStatus('organize', 'running');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate processing
      updateStepStatus('organize', 'completed', 100);

      // Step 2: Calculate costs
      updateStepStatus('calculate', 'running');
      await new Promise(resolve => setTimeout(resolve, 800));
      updateStepStatus('calculate', 'completed', 100);

      // Step 3: Quality control
      updateStepStatus('quality', 'running');
      await new Promise(resolve => setTimeout(resolve, 1200));
      updateStepStatus('quality', 'completed', 100);

      // Step 4: Generate recommendations
      if (compilationOptions.generateRecommendations) {
        updateStepStatus('recommendations', 'running');
        await new Promise(resolve => setTimeout(resolve, 1500));
        updateStepStatus('recommendations', 'completed', 100);
      } else {
        updateStepStatus('recommendations', 'completed', 100);
      }

      // Step 5: Generate scenarios
      if (compilationOptions.generateAlternatives) {
        updateStepStatus('scenarios', 'running');
        await new Promise(resolve => setTimeout(resolve, 2000));
        updateStepStatus('scenarios', 'completed', 100);
      } else {
        updateStepStatus('scenarios', 'completed', 100);
      }

      // Step 6: Finalize
      updateStepStatus('finalize', 'running');
      const estimate = await compiler.compileCompleteEstimate(
        pricingCalculations,
        projectSummary,
        compilationOptions
      );
      updateStepStatus('finalize', 'completed', 100);

      setCompleteEstimate(estimate);
      setActiveTab('results');
      
      if (onEstimateCompleted) {
        onEstimateCompleted(estimate);
      }

      toast.success('Estimate compilation completed successfully!');

    } catch (error) {
      console.error('Compilation error:', error);
      const failedStep = compilationSteps.find(step => step.status === 'running');
      if (failedStep) {
        updateStepStatus(failedStep.id, 'error');
      }
      toast.error('Estimate compilation failed');
    } finally {
      setIsCompiling(false);
    }
  };

  const handleExportEstimate = async (format: 'json' | 'csv') => {
    if (!completeEstimate) return;

    try {
      const exported = await compiler.exportEstimate(completeEstimate, format);
      
      // Create download
      const blob = new Blob([exported.toString()], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estimate_${completeEstimate.project.name.replace(/\s+/g, '_')}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Estimate exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export estimate');
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getOverallProgress = () => {
    if (compilationSteps.length === 0) return 0;
    const totalProgress = compilationSteps.reduce((sum, step) => sum + step.progress, 0);
    return totalProgress / compilationSteps.length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Complete Estimate Compilation
            <Badge variant="outline" className="ml-2">BF-005</Badge>
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Advanced estimate compilation with AI recommendations and alternative scenarios
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="compilation" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            Compilation
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2" disabled={!completeEstimate}>
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Setup Tab */}
        <TabsContent value="setup" className="space-y-6">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    value={project.name || ''}
                    onChange={(e) => setProject(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientName">Client Name *</Label>
                  <Input
                    id="clientName"
                    value={project.clientName || ''}
                    onChange={(e) => setProject(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectAddress">Project Address</Label>
                  <Input
                    id="projectAddress"
                    value={project.address || ''}
                    onChange={(e) => setProject(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Enter project address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="clientContact">Client Contact</Label>
                  <Input
                    id="clientContact"
                    value={project.clientContact || ''}
                    onChange={(e) => setProject(prev => ({ ...prev, clientContact: e.target.value }))}
                    placeholder="Phone or email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="squareFootage">Total Square Footage</Label>
                  <Input
                    id="squareFootage"
                    type="number"
                    value={project.totalSquareFootage || ''}
                    onChange={(e) => setProject(prev => ({ ...prev, totalSquareFootage: Number(e.target.value) || undefined }))}
                    placeholder="e.g., 2500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linearFootage">Total Linear Footage</Label>
                  <Input
                    id="linearFootage"
                    type="number"
                    value={project.totalLinearFootage || ''}
                    onChange={(e) => setProject(prev => ({ ...prev, totalLinearFootage: Number(e.target.value) || undefined }))}
                    placeholder="e.g., 1200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Calculations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Pricing Calculations</span>
                <Button onClick={handleAddPricingRequest} size="sm">
                  Add Item
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pricingRequests.map((request, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-5 gap-2 p-3 border rounded-lg">
                  <Textarea
                    placeholder="Description"
                    value={request.description}
                    onChange={(e) => handleUpdatePricingRequest(index, { description: e.target.value })}
                    className="min-h-[60px]"
                  />
                  <Input
                    type="number"
                    placeholder="Quantity"
                    value={request.quantity || ''}
                    onChange={(e) => handleUpdatePricingRequest(index, { quantity: Number(e.target.value) })}
                  />
                  <select
                    value={request.measurementType}
                    onChange={(e) => handleUpdatePricingRequest(index, { measurementType: e.target.value as any })}
                    className="px-3 py-2 border border-input rounded-md"
                  >
                    <option value="linear">Linear Feet</option>
                    <option value="square">Square Feet</option>
                    <option value="cubic">Cubic Feet</option>
                    <option value="count">Count</option>
                  </select>
                  <Input
                    placeholder="Location (optional)"
                    value={request.location || ''}
                    onChange={(e) => handleUpdatePricingRequest(index, { location: e.target.value })}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePricingRequest(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}

              {pricingRequests.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No pricing requests added. Click "Add Item" to get started.
                </div>
              )}

              {pricingRequests.length > 0 && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={handleGeneratePricing} className="flex-1">
                    <Brain className="w-4 h-4 mr-2" />
                    Generate Pricing ({pricingRequests.length} items)
                  </Button>
                  {pricingCalculations.length > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {pricingCalculations.length} calculations ready
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compilation Options */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compilation Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="markupRate">Markup Rate (%)</Label>
                  <Input
                    id="markupRate"
                    type="number"
                    step="0.01"
                    value={(compilationOptions.markupRate || 0.20) * 100}
                    onChange={(e) => setCompilationOptions(prev => ({ 
                      ...prev, 
                      markupRate: Number(e.target.value) / 100 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contingencyRate">Contingency (%)</Label>
                  <Input
                    id="contingencyRate"
                    type="number"
                    step="0.01"
                    value={(compilationOptions.contingencyRate || 0.05) * 100}
                    onChange={(e) => setCompilationOptions(prev => ({ 
                      ...prev, 
                      contingencyRate: Number(e.target.value) / 100 
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="overheadRate">Overhead (%)</Label>
                  <Input
                    id="overheadRate"
                    type="number"
                    step="0.01"
                    value={(compilationOptions.overheadRate || 0.15) * 100}
                    onChange={(e) => setCompilationOptions(prev => ({ 
                      ...prev, 
                      overheadRate: Number(e.target.value) / 100 
                    }))}
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={compilationOptions.generateRecommendations !== false}
                    onChange={(e) => setCompilationOptions(prev => ({ 
                      ...prev, 
                      generateRecommendations: e.target.checked 
                    }))}
                  />
                  Generate AI Recommendations
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={compilationOptions.generateAlternatives !== false}
                    onChange={(e) => setCompilationOptions(prev => ({ 
                      ...prev, 
                      generateAlternatives: e.target.checked 
                    }))}
                  />
                  Generate Alternative Scenarios
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={compilationOptions.performQualityControl !== false}
                    onChange={(e) => setCompilationOptions(prev => ({ 
                      ...prev, 
                      performQualityControl: e.target.checked 
                    }))}
                  />
                  Perform Quality Control
                </label>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={handleStartCompilation}
                  disabled={isCompiling || !project.name || !project.clientName || pricingCalculations.length === 0}
                  size="lg"
                  className="w-full"
                >
                  {isCompiling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Compiling Estimate...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Start Estimate Compilation
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compilation Tab */}
        <TabsContent value="compilation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Compilation Progress</span>
                <Badge variant={isCompiling ? "default" : "secondary"}>
                  {isCompiling ? 'Running' : 'Completed'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(getOverallProgress())}%</span>
                </div>
                <Progress value={getOverallProgress()} className="h-2" />
              </div>

              <div className="space-y-3">
                {compilationSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div className="shrink-0">
                      {step.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                      {step.status === 'running' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />}
                      {step.status === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                      {step.status === 'pending' && <Clock className="w-5 h-5 text-gray-400" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{step.name}</div>
                      <div className="text-sm text-muted-foreground">{step.description}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {step.status === 'completed' && step.duration && 
                        `${((step.duration - (compilationSteps[index - 1]?.duration || 0)) / 1000).toFixed(1)}s`
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {completeEstimate && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <div className="text-2xl font-bold">${formatCurrency(completeEstimate.costSummary.contractTotal)}</div>
                    <div className="text-sm text-muted-foreground">Total Contract</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Layers className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                    <div className="text-2xl font-bold">{completeEstimate.workBreakdown.length}</div>
                    <div className="text-sm text-muted-foreground">Work Phases</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <Shield className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                    <div className="text-2xl font-bold">{(completeEstimate.qualityMetrics.overallConfidence * 100).toFixed(1)}%</div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                    <div className="text-2xl font-bold">{completeEstimate.recommendations.length}</div>
                    <div className="text-sm text-muted-foreground">Recommendations</div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Results */}
              <Accordion type="multiple" className="space-y-2">
                <AccordionItem value="cost-summary">
                  <AccordionTrigger>Cost Summary</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Direct Costs</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Materials:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.materialTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Labor:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.laborTotal)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Equipment:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.equipmentTotal)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Direct Total:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.directCostTotal)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Indirect Costs</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Overhead:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.overhead)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>General Conditions:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.generalConditions)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Markup:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.markup)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Contingency:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.contingency)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Contract Total:</span>
                            <span>${formatCurrency(completeEstimate.costSummary.contractTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="work-phases">
                  <AccordionTrigger>Work Phases ({completeEstimate.workBreakdown.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {completeEstimate.workBreakdown.map((phase) => (
                        <div key={phase.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{phase.phase}</h4>
                            <Badge variant={phase.riskLevel === 'high' ? 'destructive' : phase.riskLevel === 'medium' ? 'secondary' : 'default'}>
                              {phase.riskLevel} risk
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{phase.description}</div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{phase.items.length} items</span>
                            <span className="font-medium">${formatCurrency(phase.phaseTotal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="recommendations">
                  <AccordionTrigger>Recommendations ({completeEstimate.recommendations.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {completeEstimate.recommendations.map((rec) => (
                        <div key={rec.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium">{rec.title}</h4>
                            <Badge variant={rec.priority === 'critical' ? 'destructive' : rec.priority === 'high' ? 'secondary' : 'outline'}>
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                          {rec.impact.costSavings && (
                            <div className="text-sm text-green-600">
                              Potential savings: ${formatCurrency(rec.impact.costSavings)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scenarios">
                  <AccordionTrigger>Alternative Scenarios ({completeEstimate.alternativeScenarios.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      {completeEstimate.alternativeScenarios.map((scenario) => (
                        <div key={scenario.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">{scenario.name}</h4>
                            <div className="text-right">
                              <div className="font-medium">${formatCurrency(scenario.costSummary.contractTotal)}</div>
                              <div className="text-sm text-muted-foreground">
                                {scenario.costVariation > 0 ? '+' : ''}{(scenario.costVariation * 100).toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{scenario.description}</p>
                          <div className="text-sm">
                            <div className="text-green-600">Advantages: {scenario.advantages.length}</div>
                            <div className="text-orange-600">Tradeoffs: {scenario.tradeoffs.length}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Options</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button onClick={() => handleExportEstimate('json')} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export JSON
                    </Button>
                    <Button onClick={() => handleExportEstimate('csv')} variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}