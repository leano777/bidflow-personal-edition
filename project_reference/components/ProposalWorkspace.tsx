import { useState, useCallback, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  FileText, 
  Eye, 
  Save, 
  ArrowLeft, 
  Calculator,
  Clock,
  CheckCircle,
  AlertCircle,
  Home,
  Building2,
  CreditCard,
  Camera,
  Users,
  BarChart3,
  Settings
} from 'lucide-react';
import { ProposalEditor } from './ProposalEditor';
import { ProposalPreview } from './ProposalPreview';
import { AIProposalCreator } from './AIProposalCreator';
import { ConstructionPricingModel } from './ConstructionPricingModel';
import { ProgressBilling } from './ProgressBilling';
import { PhotoIntegration } from './PhotoIntegration';
import { ClientPortal } from './ClientPortal';
import { PaymentCollection } from './PaymentCollection';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import { LoadingSpinner } from './LoadingSpinner';
import { useProposal } from '../contexts/ProposalContext';
import { useLoading } from './LoadingSystem';
import { toast } from 'sonner@2.0.3';

interface ProposalWorkspaceProps {
  initialState: {
    proposal: any;
    mode: 'create' | 'edit' | 'version';
    baseProposal?: any;
  } | null;
  onReturnToDashboard: () => void;
}

export function ProposalWorkspace({ initialState, onReturnToDashboard }: ProposalWorkspaceProps) {
  const { saveProposal, updateProposal } = useProposal();
  const { setLoading } = useLoading();
  
  const [currentProposal, setCurrentProposal] = useState(initialState?.proposal);
  const [activeTab, setActiveTab] = useState('editor');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [constructionPricing, setConstructionPricing] = useState<any>(null);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const originalProposalRef = useRef(initialState?.proposal);

  // Auto-save functionality
  const triggerAutoSave = useCallback(async () => {
    if (!currentProposal || isAutoSaving) return;
    
    setIsAutoSaving(true);
    try {
      if (currentProposal.id) {
        await updateProposal(currentProposal.id, currentProposal);
      } else {
        const saved = await saveProposal(currentProposal);
        setCurrentProposal(saved);
      }
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      toast.success('Auto-saved', { duration: 1000 });
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Auto-save failed');
    } finally {
      setIsAutoSaving(false);
    }
  }, [currentProposal, isAutoSaving, updateProposal, saveProposal]);

  // Debounced auto-save
  const scheduleAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    autoSaveTimeoutRef.current = setTimeout(() => {
      triggerAutoSave();
    }, 3000); // Auto-save after 3 seconds of inactivity
  }, [triggerAutoSave]);

  // Handle proposal updates
  const handleProposalUpdate = useCallback((updates: any) => {
    setCurrentProposal((prev: any) => {
      const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
      setHasUnsavedChanges(true);
      scheduleAutoSave();
      return updated;
    });
  }, [scheduleAutoSave]);

  // Handle construction pricing updates
  const handleConstructionPricingUpdate = useCallback((pricingData: any) => {
    setConstructionPricing(pricingData);
    
    // Convert pricing model to scope of work items
    if (pricingData && currentProposal) {
      const scopeItems = Object.entries(pricingData.tradeBreakdowns || {})
        .filter(([_, config]: [string, any]) => config.included)
        .map(([trade, config]: [string, any]) => {
          const tradeData = getTradeDisplayName(trade);
          const amount = config.customAmount || (pricingData.totalBase * (config.percentage / 100));
          
          return {
            id: `pricing_${trade}`,
            description: tradeData,
            category: 'labor',
            quantity: 1,
            unit: 'LS',
            unitPrice: amount,
            total: amount,
            notes: config.subcontractorNotes || '',
            includedInTotal: true
          };
        });

      // Add additional costs as separate items
      const additionalItems = (pricingData.additionalCosts || []).map((cost: any) => ({
        id: `additional_${cost.id}`,
        description: cost.description,
        category: cost.category === 'upgrade' ? 'material' : 'other',
        quantity: 1,
        unit: 'LS',
        unitPrice: cost.amount,
        total: cost.amount,
        notes: `Category: ${cost.category}`,
        includedInTotal: true
      }));

      const updatedScopeOfWork = [...scopeItems, ...additionalItems];
      
      handleProposalUpdate({
        scopeOfWork: updatedScopeOfWork,
        constructionPricingModel: pricingData
      });
      
      toast.success('Construction pricing applied to proposal');
    }
  }, [currentProposal, handleProposalUpdate]);

  // Manual save
  const handleSave = useCallback(async () => {
    if (!currentProposal || isAutoSaving) return;
    
    setLoading(true, 'Saving proposal...');
    try {
      let saved;
      if (currentProposal.id) {
        await updateProposal(currentProposal.id, currentProposal);
        saved = currentProposal;
      } else {
        saved = await saveProposal(currentProposal);
        setCurrentProposal(saved);
      }
      
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      originalProposalRef.current = saved;
      toast.success('Proposal saved successfully');
    } catch (error) {
      console.error('Save failed:', error);
      toast.error('Failed to save proposal');
    } finally {
      setLoading(false);
    }
  }, [currentProposal, isAutoSaving, updateProposal, saveProposal, setLoading]);

  // Handle return to dashboard with unsaved changes check
  const handleReturn = useCallback(() => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to leave?')) {
        onReturnToDashboard();
      }
    } else {
      onReturnToDashboard();
    }
  }, [hasUnsavedChanges, onReturnToDashboard]);

  // Keyboard shortcuts
  const handleUndo = useCallback(() => {
    if (originalProposalRef.current) {
      setCurrentProposal(originalProposalRef.current);
      setHasUnsavedChanges(false);
      toast.info('Changes undone');
    }
  }, []);

  const handleRedo = useCallback(() => {
    // In a full implementation, you'd maintain a history stack
    toast.info('Redo not implemented yet');
  }, []);

  // Calculate completion progress
  const completionProgress = currentProposal ? calculateCompletionProgress(currentProposal) : 0;

  // Clean up auto-save timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (!currentProposal) {
    return (
      <div className="container-padding py-16">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">No Proposal Loaded</h2>
          <p className="text-muted-foreground mb-6">
            Unable to load proposal data. Please return to the dashboard and try again.
          </p>
          <Button onClick={onReturnToDashboard} className="contractor-button-primary">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Keyboard shortcuts */}
      <KeyboardShortcuts
        onSave={handleSave}
        onUndo={handleUndo}
        onRedo={handleRedo}
        context="workspace"
      />

      {/* Header */}
      <div className="modern-header sticky top-0 z-50">
        <div className="container-padding py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Title and status */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReturn}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div>
                <h1 className="text-xl font-bold truncate max-w-md">
                  {currentProposal.projectTitle || 'Untitled Proposal'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">
                    {initialState?.mode === 'create' ? 'Creating' : 
                     initialState?.mode === 'version' ? 'New Version' : 'Editing'}
                  </Badge>
                  {currentProposal.version && (
                    <span>Version {currentProposal.version}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Actions and status */}
            <div className="flex items-center gap-3">
              {/* Completion progress */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Progress:</span>
                <div className="flex items-center gap-2">
                  <Progress value={completionProgress} className="w-20 h-2" />
                  <span className="text-xs font-medium">{completionProgress}%</span>
                </div>
              </div>

              <Separator orientation="vertical" className="h-6" />

              {/* Save status */}
              <div className="flex items-center gap-2 text-sm">
                {isAutoSaving ? (
                  <>
                    <LoadingSpinner size={14} />
                    <span className="text-muted-foreground">Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span className="text-warning">Unsaved</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-success">Saved</span>
                  </>
                ) : null}
                
                {lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(lastSaved)}
                  </span>
                )}
              </div>

              {/* Manual save button */}
              <Button
                onClick={handleSave}
                size="sm"
                disabled={isAutoSaving || !hasUnsavedChanges}
                className="contractor-button-primary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container-padding py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab navigation */}
          <div className="glass-card p-1 rounded-lg">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 gap-1">
              <TabsTrigger value="editor" className="flex items-center gap-2 text-xs">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Editor</span>
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2 text-xs">
                <Calculator className="h-4 w-4" />
                <span className="hidden sm:inline">Pricing</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2 text-xs">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2 text-xs">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Billing</span>
              </TabsTrigger>
              <TabsTrigger value="photos" className="flex items-center gap-2 text-xs">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="client" className="flex items-center gap-2 text-xs">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Client</span>
              </TabsTrigger>
              <TabsTrigger value="payments" className="flex items-center gap-2 text-xs">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Payments</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2 text-xs">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab content */}
          <div className="min-h-[600px]">
            {/* Proposal Editor */}
            <TabsContent value="editor" className="mt-0">
              <ProposalEditor
                proposal={currentProposal}
                onUpdate={handleProposalUpdate}
                mode={initialState?.mode || 'edit'}
              />
            </TabsContent>

            {/* Construction Pricing Model */}
            <TabsContent value="pricing" className="mt-0">
              <div className="glass-card p-6 rounded-lg">
                <ConstructionPricingModel
                  onPricingUpdate={handleConstructionPricingUpdate}
                  initialData={currentProposal.constructionPricingModel}
                />
              </div>
            </TabsContent>

            {/* Proposal Preview */}
            <TabsContent value="preview" className="mt-0">
              <ProposalPreview
                proposal={currentProposal}
                onUpdate={handleProposalUpdate}
              />
            </TabsContent>

            {/* Progress Billing */}
            <TabsContent value="billing" className="mt-0">
              <ProgressBilling
                proposal={currentProposal}
                onUpdate={handleProposalUpdate}
              />
            </TabsContent>

            {/* Photo Integration */}
            <TabsContent value="photos" className="mt-0">
              <PhotoIntegration
                proposal={currentProposal}
                onUpdate={handleProposalUpdate}
              />
            </TabsContent>

            {/* Client Portal */}
            <TabsContent value="client" className="mt-0">
              <ClientPortal
                proposal={currentProposal}
                onUpdate={handleProposalUpdate}
              />
            </TabsContent>

            {/* Payment Collection */}
            <TabsContent value="payments" className="mt-0">
              <PaymentCollection
                proposal={currentProposal}
                onUpdate={handleProposalUpdate}
              />
            </TabsContent>

            {/* AI Proposal Creator */}
            <TabsContent value="ai" className="mt-0">
              <AIProposalCreator
                initialProposal={currentProposal}
                onProposalGenerated={handleProposalUpdate}
                mode="enhance"
              />
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Mobile progress indicator */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Card className="glass-card p-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Complete:</span>
            <div className="flex items-center gap-2">
              <Progress value={completionProgress} className="w-16 h-2" />
              <span className="text-xs font-medium">{completionProgress}%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Helper functions
function calculateCompletionProgress(proposal: any): number {
  if (!proposal) return 0;
  
  const fields = [
    { key: 'projectTitle', weight: 15 },
    { key: 'clientName', weight: 10 },
    { key: 'clientEmail', weight: 5 },
    { key: 'projectAddress', weight: 10 },
    { key: 'scopeOfWork', weight: 30, check: (val: any) => Array.isArray(val) && val.length > 0 },
    { key: 'laborRates', weight: 10, check: (val: any) => val && Object.keys(val).length > 0 },
    { key: 'timeline', weight: 10 },
    { key: 'terms', weight: 10 }
  ];
  
  let completedWeight = 0;
  const totalWeight = fields.reduce((sum, field) => sum + field.weight, 0);
  
  fields.forEach(field => {
    const value = proposal[field.key];
    const isComplete = field.check 
      ? field.check(value)
      : value && value.toString().trim().length > 0;
    
    if (isComplete) {
      completedWeight += field.weight;
    }
  });
  
  return Math.round((completedWeight / totalWeight) * 100);
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function getTradeDisplayName(trade: string): string {
  const tradeNames: Record<string, string> = {
    foundation: 'Foundation & Sitework',
    framing: 'Framing & Structure',
    roofing: 'Roofing',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    hvac: 'HVAC',
    insulation: 'Insulation',
    drywall: 'Drywall & Paint',
    flooring: 'Flooring',
    kitchen: 'Kitchen',
    bathrooms: 'Bathrooms',
    permits: 'Permits & Fees',
    overhead: 'Overhead & Profit',
    contingency: 'Contingency'
  };
  
  return tradeNames[trade] || trade;
}