import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CalendarDays, Phone, Mail, MapPin, Calculator, FileText, Printer, Plus, Trash2, MoreVertical, Settings, Edit3, Save, Eye, EyeOff, Download, Upload, List, RefreshCw, ArrowLeft, TrendingUp, TrendingDown, Minus, X, Percent, LayoutList, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './ui/sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { VoiceInput } from './VoiceInput';
import { PhotoAnalysis } from './PhotoAnalysis';
import { BulkPricingAdjustment } from './BulkPricingAdjustment';
import { CombinedScopeView } from './CombinedScopeView';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

interface ScopeItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  isLabor: boolean;
  laborRate?: number; // For labor items
  materialCost?: number; // For material items
  total: number;
}

interface LaborRate {
  id: string;
  name: string;
  rate: number;
  unit: string;
}

interface ProposalData {
  // Company Info
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyLicense: string;
  
  // Client Info
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  
  // Project Info
  projectTitle: string;
  projectAddress: string;
  proposalDate: string;
  validUntil: string;
  
  // Proposal Details
  projectDescription: string;
  scopeOfWork: ScopeItem[];
  permits: LineItem[];
  
  // Terms
  paymentSchedule: string;
  warranty: string;
  timeline: string;
  additionalTerms: string;
}

interface ProposalTemplateProps {
  initialProposal?: any;
  onBackToHome: () => void;
  isNewVersion?: boolean;
  baseProposal?: any;
}

export function ProposalTemplate({ initialProposal, onBackToHome, isNewVersion, baseProposal }: ProposalTemplateProps) {
  const [isEditing, setIsEditing] = useState(true);
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [showTermsSection, setShowTermsSection] = useState(true);
  const [showCostBreakdown, setShowCostBreakdown] = useState(true);
  const [showQuantitiesInScope, setShowQuantitiesInScope] = useState(false);
  const [savedProposals, setSavedProposals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSavedProposals, setShowSavedProposals] = useState(false);
  const [showComparisonSidebar, setShowComparisonSidebar] = useState(true);
  const [scopeViewMode, setScopeViewMode] = useState<'traditional' | 'combined'>('traditional');
  const [showPricingInCombined, setShowPricingInCombined] = useState(true);
  const [showLumpSumPricing, setShowLumpSumPricing] = useState(false);
  const [showProjectDescription, setShowProjectDescription] = useState(true);
  
  // Export control state
  const [exportSettings, setExportSettings] = useState({
    includeProjectDescription: true,
    includeScopeOfWork: true,
    includeWorkSequence: false,
    includePricing: true,
    includeTermsAndConditions: true,
    includeCostBreakdown: false,
    includeSignatureSection: true
  });
  
  // Utility function to format numbers with commas
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Helper function to get next version number
  const getNextVersion = (currentVersion: string | undefined) => {
    if (!currentVersion) {
      return 'R.1';
    }
    
    const versionMatch = currentVersion.match(/^R\.(\d+)$/);
    if (versionMatch) {
      const currentNumber = parseInt(versionMatch[1], 10);
      return `R.${currentNumber + 1}`;
    }
    
    return 'R.1';
  };

  // Helper function to get previous version for display
  const getPreviousVersion = (currentVersion: string | undefined) => {
    if (!currentVersion) return 'R.0';
    
    const versionMatch = currentVersion.match(/^R\.(\d+)$/);
    if (versionMatch) {
      const currentNumber = parseInt(versionMatch[1], 10);
      return currentNumber > 0 ? `R.${currentNumber - 1}` : 'R.0';
    }
    
    return 'R.0';
  };
  
  // Function to get blank proposal template
  const getBlankProposal = (): ProposalData => ({
    // Company Info (keep company details)
    companyName: "Lineage Builders Inc.",
    companyAddress: "16 Angela Ln, San Diego, CA 91911",
    companyPhone: "(909) 240-7090",
    companyEmail: "ramon.lineagebuilderinc@gmail.co",
    companyLicense: "",
    
    // Client Info (blank)
    clientName: "",
    clientAddress: "",
    clientPhone: "",
    clientEmail: "",
    
    // Project Info (blank with today's date)
    projectTitle: "",
    projectAddress: "",
    proposalDate: new Date().toISOString().split('T')[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    
    // Proposal Details (blank)
    projectDescription: "",
    scopeOfWork: [],
    permits: [],
    
    // Terms (standard templates)
    paymentSchedule: "10% deposit upon contract signing, 50% upon material delivery and project start, 40% upon final completion and approval.",
    warranty: "We provide a 3-year warranty on retaining wall construction and 1-year warranty on concrete work. All materials carry manufacturer warranties.",
    timeline: "Project duration will be determined based on scope of work, weather permitting.",
    additionalTerms: "Client responsible for marking underground utilities before work begins. Weather delays may extend timeline. All excavated soil will be hauled away unless otherwise specified. Changes to scope require written approval and may affect pricing and timeline."
  });
  
  // Available units for dropdown
  const units = [
    'unit', 'units', 'hours', 'sq ft', 'linear ft', 'cubic yards', 'CY', 
    'blocks', 'lump sum', 'ton', 'tons', 'each', 'lot', 'gallon', 'gallons'
  ];
  const [laborRates, setLaborRates] = useState<LaborRate[]>([
    { id: '1', name: 'Base Prep & Excavation', rate: 65, unit: 'hour' },
    { id: '2', name: 'Skilled Installation Work', rate: 75, unit: 'hour' },
    { id: '3', name: 'Form & Rebar Work', rate: 65, unit: 'hour' },
  ]);
  const [selectedLaborRate, setSelectedLaborRate] = useState<string>('1');
  const [proposal, setProposal] = useState<ProposalData>(getBlankProposal());

  // Load saved proposals on mount and handle initial proposal
  useEffect(() => {
    loadSavedProposals();
    
    // If an initial proposal is provided, load it
    if (initialProposal) {
      // Ensure version is set if not already present
      const proposalWithVersion = {
        ...initialProposal,
        version: initialProposal.version || 'R.0'
      };
      setProposal(proposalWithVersion);
      if (initialProposal.laborRates) {
        setLaborRates(initialProposal.laborRates);
      }
      if (initialProposal.displayPreferences) {
        setShowLumpSumPricing(initialProposal.displayPreferences.showLumpSumPricing || false);
        setShowCostBreakdown(initialProposal.displayPreferences.showCostBreakdown ?? true);
        setShowTermsSection(initialProposal.displayPreferences.showTermsSection ?? true);
        setShowQuantitiesInScope(initialProposal.displayPreferences.showQuantitiesInScope || false);
        setShowProjectDescription(initialProposal.displayPreferences.showProjectDescription ?? true);
      }
    } else {
      // If no initial proposal, ensure we start with blank data and set initial version
      const blankWithVersion = {
        ...getBlankProposal(),
        version: 'R.0'
      };
      setProposal(blankWithVersion);
    }
    
    // If this is a new version and no initial proposal is provided, set up version tracking
    if (isNewVersion && baseProposal && !initialProposal) {
      const newVersion = getNextVersion(baseProposal.version);
      setProposal(prev => ({
        ...prev,
        version: newVersion,
        baseProposalId: baseProposal.baseProposalId || baseProposal.id,
        previousTotal: calculateProposalTotal(baseProposal)
      }));
    }
  }, [initialProposal, isNewVersion, baseProposal]);

  const calculateProposalTotal = (proposalData: any) => {
    if (!proposalData.scopeOfWork || proposalData.scopeOfWork.length === 0) return 0;
    
    const scopeTotal = proposalData.scopeOfWork.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const markupRate = 0.30; // 30% overhead & markup
    return scopeTotal * (1 + markupRate);
  };

  const calculateSubtotal = (items: LineItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const calculateScopeSubtotals = () => {
    const materials = proposal.scopeOfWork.filter(item => !item.isLabor);
    const labor = proposal.scopeOfWork.filter(item => item.isLabor);
    return {
      materials: materials.reduce((sum, item) => sum + item.total, 0),
      labor: labor.reduce((sum, item) => sum + item.total, 0)
    };
  };

  const { materials: materialsSubtotal, labor: laborSubtotal } = calculateScopeSubtotals();
  const permitsSubtotal = calculateSubtotal(proposal.permits);
  const scopeSubtotal = materialsSubtotal + laborSubtotal;
  const markupRate = 0.30; // 30% overhead & markup
  const scopeWithMarkup = scopeSubtotal * (1 + markupRate);
  const total = scopeWithMarkup + permitsSubtotal;

  // Calculate base proposal totals for comparison
  const getBaseProposalTotals = () => {
    if (!baseProposal || !baseProposal.scopeOfWork) return { materials: 0, labor: 0, scope: 0, scopeWithMarkup: 0, total: 0 };
    
    const baseMaterials = baseProposal.scopeOfWork.filter((item: any) => !item.isLabor);
    const baseLabor = baseProposal.scopeOfWork.filter((item: any) => item.isLabor);
    const baseMaterialsSubtotal = baseMaterials.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const baseLaborSubtotal = baseLabor.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const baseScopeSubtotal = baseMaterialsSubtotal + baseLaborSubtotal;
    const baseScopeWithMarkup = baseScopeSubtotal * (1 + markupRate);
    const basePermitsSubtotal = baseProposal.permits ? baseProposal.permits.reduce((sum: number, item: any) => sum + (item.total || 0), 0) : 0;
    const baseTotal = baseScopeWithMarkup + basePermitsSubtotal;
    
    return {
      materials: baseMaterialsSubtotal,
      labor: baseLaborSubtotal,
      scope: baseScopeSubtotal,
      scopeWithMarkup: baseScopeWithMarkup,
      total: baseTotal
    };
  };

  const baseProposalTotals = getBaseProposalTotals();

  const handlePrint = () => {
    window.print();
  };

  const addScopeItem = (isLabor: boolean) => {
    const newItem: ScopeItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      unit: 'unit',
      isLabor,
      laborRate: isLabor ? laborRates.find(rate => rate.id === selectedLaborRate)?.rate || 75 : undefined,
      materialCost: !isLabor ? 0 : undefined,
      total: 0
    };
    setProposal(prev => ({
      ...prev,
      scopeOfWork: [...prev.scopeOfWork, newItem]
    }));
  };

  const handlePhotoAnalysisResults = (items: any[]) => {
    // Add AI-generated scope items
    setProposal(prev => ({
      ...prev,
      scopeOfWork: [...prev.scopeOfWork, ...items]
    }));
    toast.success(`Added ${items.length} items from photo analysis`);
  };

  const handleConditionsDetected = (conditions: string[]) => {
    // Add conditions to project description
    if (conditions.length > 0) {
      const conditionsText = `\n\nSite Conditions Detected:\n${conditions.map(c => `• ${c}`).join('\n')}`;
      setProposal(prev => ({
        ...prev,
        projectDescription: prev.projectDescription + conditionsText
      }));
      toast.success(`Added ${conditions.length} site conditions to description`);
    }
  };

  const updateScopeItem = (id: string, updates: Partial<ScopeItem>) => {
    setProposal(prev => ({
      ...prev,
      scopeOfWork: prev.scopeOfWork.map(item => {
        if (item.id === id) {
          const updatedItem = { ...item, ...updates };
          // Recalculate total
          if (updatedItem.isLabor) {
            updatedItem.total = updatedItem.quantity * (updatedItem.laborRate || 0);
          } else {
            updatedItem.total = updatedItem.quantity * (updatedItem.materialCost || 0);
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const removeScopeItem = (id: string) => {
    setProposal(prev => ({
      ...prev,
      scopeOfWork: prev.scopeOfWork.filter(item => item.id !== id)
    }));
  };

  // Handle bulk scope update from BulkPricingAdjustment
  const handleBulkScopeUpdate = (updatedScope: ScopeItem[]) => {
    setProposal(prev => ({
      ...prev,
      scopeOfWork: updatedScope
    }));
  };

  const updateLaborRate = (rateId: string, rate: number, unit: string, name: string) => {
    setLaborRates(prev => prev.map(r => 
      r.id === rateId ? { ...r, rate, unit, name } : r
    ));
  };

  const addLaborRate = () => {
    const newRate: LaborRate = {
      id: Date.now().toString(),
      name: 'New Labor Type',
      rate: 75,
      unit: 'hour'
    };
    setLaborRates(prev => [...prev, newRate]);
  };

  const saveTerms = () => {
    setIsEditingTerms(false);
  };

  // Database functions
  const saveProposalToDatabase = async () => {
    setIsLoading(true);
    try {
      const proposalData = {
        ...proposal,
        laborRates,
        lastSaved: new Date().toISOString(),
        version: proposal.version || 'R.0',
        baseProposalId: proposal.baseProposalId,
        previousTotal: proposal.previousTotal,
        displayPreferences: {
          showLumpSumPricing,
          showCostBreakdown,
          showTermsSection,
          showQuantitiesInScope,
          showProjectDescription
        },
        exportSettings
      };
      
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/proposals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(proposalData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Also save to localStorage as backup
        localStorage.setItem('currentProposal', JSON.stringify(proposalData));
        const versionText = proposalData.version ? ` (${proposalData.version})` : '';
        toast.success(`Proposal saved to database successfully!${versionText}`);
        loadSavedProposals(); // Refresh the list
      } else {
        toast.error(`Failed to save proposal: ${result.error}`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save proposal to database. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSavedProposals = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/proposals`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setSavedProposals(result.proposals);
      } else {
        toast.error(`Failed to load proposals: ${result.error}`);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load saved proposals.');
    }
  };

  const loadProposalFromDatabase = async (proposalId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/proposals/${proposalId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        const proposalData = result.proposal;
        setProposal(proposalData);
        if (proposalData.laborRates) {
          setLaborRates(proposalData.laborRates);
        }
        if (proposalData.displayPreferences) {
          setShowLumpSumPricing(proposalData.displayPreferences.showLumpSumPricing || false);
          setShowCostBreakdown(proposalData.displayPreferences.showCostBreakdown ?? true);
          setShowTermsSection(proposalData.displayPreferences.showTermsSection ?? true);
          setShowQuantitiesInScope(proposalData.displayPreferences.showQuantitiesInScope || false);
          setShowProjectDescription(proposalData.displayPreferences.showProjectDescription ?? true);
        }
        if (proposalData.exportSettings) {
          setExportSettings(proposalData.exportSettings);
        }
        toast.success('Proposal loaded successfully!');
        setShowSavedProposals(false);
      } else {
        toast.error(`Failed to load proposal: ${result.error}`);
      }
    } catch (error) {
      console.error('Load error:', error);
      toast.error('Failed to load proposal from database.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProposal = async (proposalId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/proposals/${proposalId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('Proposal deleted successfully!');
        loadSavedProposals(); // Refresh the list
      } else {
        toast.error(`Failed to delete proposal: ${result.error}`);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete proposal.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProposal = () => {
    try {
      const proposalData = {
        ...proposal,
        laborRates,
        lastSaved: new Date().toISOString(),
        version: proposal.version || 'R.0',
        displayPreferences: {
          showLumpSumPricing,
          showCostBreakdown,
          showTermsSection,
          showQuantitiesInScope,
          showProjectDescription
        },
        exportSettings
      };
      
      // Save to localStorage
      localStorage.setItem('currentProposal', JSON.stringify(proposalData));
      
      // Create downloadable JSON file
      const dataStr = JSON.stringify(proposalData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const versionSuffix = proposalData.version ? ` - ${proposalData.version}` : '';
      const exportFileDefaultName = `${proposal.projectTitle || 'New'} - Lineage Builders Inc Proposal${versionSuffix}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Proposal downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download proposal. Please try again.');
    }
  };

  const loadProposal = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const proposalData = JSON.parse(e.target?.result as string);
            setProposal(proposalData);
            if (proposalData.laborRates) {
              setLaborRates(proposalData.laborRates);
            }
            if (proposalData.displayPreferences) {
              setShowLumpSumPricing(proposalData.displayPreferences.showLumpSumPricing || false);
              setShowCostBreakdown(proposalData.displayPreferences.showCostBreakdown ?? true);
              setShowTermsSection(proposalData.displayPreferences.showTermsSection ?? true);
              setShowQuantitiesInScope(proposalData.displayPreferences.showQuantitiesInScope || false);
              setShowProjectDescription(proposalData.displayPreferences.showProjectDescription ?? true);
            }
            if (proposalData.exportSettings) {
              setExportSettings(proposalData.exportSettings);
            }
            toast.success('Proposal loaded successfully!');
          } catch (error) {
            toast.error('Failed to load proposal. Invalid file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Get work packages for client view with overhead & markup included
  const getWorkPackages = () => {
    if (proposal.scopeOfWork.length === 0) return [];
    
    const markupRate = 0.30; // 30% overhead & markup
    
    // Create comprehensive work packages with detailed sequences
    const workPackages = [];
    
    // Group items by type to create comprehensive packages
    const materials = proposal.scopeOfWork.filter(item => !item.isLabor);
    const labor = proposal.scopeOfWork.filter(item => item.isLabor);
    
    // Check for concrete-related work
    const concreteItems = proposal.scopeOfWork.filter(item => 
      item.description.toLowerCase().includes('concrete') || 
      item.description.toLowerCase().includes('slab')
    );
    
    if (concreteItems.length > 0) {
      const total = concreteItems.reduce((sum, item) => sum + item.total, 0) * (1 + markupRate);
      workPackages.push({
        title: "Concrete Slab Installation",
        subtitle: "4-inch thick concrete slab with rebar reinforcement, compacted base, and standard grey broom finish",
        total: total,
        workSequence: [
          "Site excavation and grading to proper elevation",
          "Install and compact aggregate base material", 
          "Set concrete forms to specified dimensions",
          "Install rebar reinforcement grid per specifications",
          "Pour ready-mix concrete and strike to grade",
          "Float, trowel and apply standard grey broom finish",
          "Apply curing compound and protect during cure period"
        ]
      });
    }
    
    // Check for fire pit work
    const firePitItems = proposal.scopeOfWork.filter(item => 
      item.description.toLowerCase().includes('fire') || 
      item.description.toLowerCase().includes('pit')
    );
    
    if (firePitItems.length > 0) {
      const total = firePitItems.reduce((sum, item) => sum + item.total, 0) * (1 + markupRate);
      workPackages.push({
        title: "Fire Pit Installation",
        subtitle: "Decorative paver fire pit with proper base preparation",
        total: total,
        workSequence: [
          "Excavate fire pit area to required depth",
          "Install and compact base materials",
          "Set bedding sand to proper grade and slope", 
          "Install fire pit pavers with proper joints",
          "Complete final grading and cleanup around fire pit"
        ]
      });
    }
    
    // Check for retaining wall work
    const wallItems = proposal.scopeOfWork.filter(item => 
      item.description.toLowerCase().includes('wall') || 
      item.description.toLowerCase().includes('retaining')
    );
    
    if (wallItems.length > 0) {
      const total = wallItems.reduce((sum, item) => sum + item.total, 0) * (1 + markupRate);
      workPackages.push({
        title: "Retaining Wall Construction", 
        subtitle: "Capstone retaining wall with proper drainage and backfill",
        total: total,
        workSequence: [
          "Excavate wall foundation to required depth",
          "Install and compact base aggregate material",
          "Set first course of blocks level and square",
          "Install subsequent courses with proper setback",
          "Install drainage pipe and filter fabric behind wall",
          "Backfill wall cavity with specified gravel material",
          "Install capstones with adhesive and finish joints",
          "Complete final grading and site cleanup"
        ]
      });
    }
    
    // If no specific packages found, create generic packages
    if (workPackages.length === 0) {
      if (materials.length > 0) {
        const materialTotal = materials.reduce((sum, item) => sum + item.total, 0) * (1 + markupRate);
        workPackages.push({
          title: "Materials & Supplies",
          subtitle: "All materials and supplies required for the project", 
          total: materialTotal,
          workSequence: materials.map(item => `${item.description} (${item.quantity} ${item.unit})`)
        });
      }
      
      if (labor.length > 0) {
        const laborTotal = labor.reduce((sum, item) => sum + item.total, 0) * (1 + markupRate);
        workPackages.push({
          title: "Labor & Installation",
          subtitle: "Professional labor and installation services",
          total: laborTotal, 
          workSequence: labor.map(item => `${item.description} (${item.quantity} ${item.unit})`)
        });
      }
    }
    
    return workPackages;
  };

  // Render version comparison sidebar
  const renderComparisonSidebar = () => {
    if (!isNewVersion || !baseProposal || !showComparisonSidebar) return null;

    const materialsDiff = materialsSubtotal - baseProposalTotals.materials;
    const laborDiff = laborSubtotal - baseProposalTotals.labor;
    const totalDiff = total - baseProposalTotals.total;
    
    const materialsPercent = baseProposalTotals.materials > 0 ? ((materialsDiff / baseProposalTotals.materials) * 100) : 0;
    const laborPercent = baseProposalTotals.labor > 0 ? ((laborDiff / baseProposalTotals.labor) * 100) : 0;
    const totalPercent = baseProposalTotals.total > 0 ? ((totalDiff / baseProposalTotals.total) * 100) : 0;

    return (
      <div className="w-80 bg-white border-l border-gray-200 shadow-lg">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Version Comparison</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowComparisonSidebar(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {proposal.version || 'R.0'} vs {getPreviousVersion(proposal.version)}
          </div>
        </div>

        <div className="p-4 space-y-4 h-[calc(100vh-120px)] overflow-y-auto">
          {/* Materials Comparison */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Materials</span>
              <div className="flex items-center gap-1">
                {materialsDiff > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : materialsDiff < 0 ? (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                ) : (
                  <Minus className="w-3 h-3 text-gray-500" />
                )}
                <span className={`text-xs font-medium ${
                  materialsDiff > 0 ? 'text-red-600' : 
                  materialsDiff < 0 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {materialsPercent > 0 ? '+' : ''}{materialsPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Previous: ${formatCurrency(baseProposalTotals.materials)}</div>
              <div>Current: ${formatCurrency(materialsSubtotal)}</div>
              <div className={`font-medium ${
                materialsDiff > 0 ? 'text-red-600' : 
                materialsDiff < 0 ? 'text-green-600' : 'text-gray-500'
              }`}>
                {materialsDiff >= 0 ? '+' : ''}${formatCurrency(materialsDiff)}
              </div>
            </div>
          </div>

          {/* Labor Comparison */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Labor</span>
              <div className="flex items-center gap-1">
                {laborDiff > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-500" />
                ) : laborDiff < 0 ? (
                  <TrendingDown className="w-3 h-3 text-green-500" />
                ) : (
                  <Minus className="w-3 h-3 text-gray-500" />
                )}
                <span className={`text-xs font-medium ${
                  laborDiff > 0 ? 'text-red-600' : 
                  laborDiff < 0 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {laborPercent > 0 ? '+' : ''}{laborPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>Previous: ${formatCurrency(baseProposalTotals.labor)}</div>
              <div>Current: ${formatCurrency(laborSubtotal)}</div>
              <div className={`font-medium ${
                laborDiff > 0 ? 'text-red-600' : 
                laborDiff < 0 ? 'text-green-600' : 'text-gray-500'
              }`}>
                {laborDiff >= 0 ? '+' : ''}${formatCurrency(laborDiff)}
              </div>
            </div>
          </div>

          {/* Total Comparison */}
          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-800">Total Project Cost</span>
              <div className="flex items-center gap-1">
                {totalDiff > 0 ? (
                  <TrendingUp className="w-4 h-4 text-red-500" />
                ) : totalDiff < 0 ? (
                  <TrendingDown className="w-4 h-4 text-green-500" />
                ) : (
                  <Minus className="w-4 h-4 text-gray-500" />
                )}
                <span className={`text-sm font-bold ${
                  totalDiff > 0 ? 'text-red-600' : 
                  totalDiff < 0 ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {totalPercent > 0 ? '+' : ''}{totalPercent.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <div>Previous: ${formatCurrency(baseProposalTotals.total)}</div>
              <div>Current: ${formatCurrency(total)}</div>
              <Separator className="my-2" />
              <div className={`font-bold text-base ${
                totalDiff > 0 ? 'text-red-600' : 
                totalDiff < 0 ? 'text-green-600' : 'text-gray-700'
              }`}>
                {totalDiff >= 0 ? '+' : ''}${formatCurrency(totalDiff)}
              </div>
            </div>
          </div>

          {/* Quick Summary */}
          <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
            {totalDiff > 0 ? (
              <span>This revision is ${formatCurrency(totalDiff)} ({totalPercent.toFixed(1)}%) higher than the previous version.</span>
            ) : totalDiff < 0 ? (
              <span>This revision is ${formatCurrency(Math.abs(totalDiff))} ({Math.abs(totalPercent).toFixed(1)}%) lower than the previous version.</span>
            ) : (
              <span>This revision has the same total cost as the previous version.</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isEditing) {
    return (
      <>
        <style dangerouslySetInnerHTML={{
          __html: `
            @media print {
              * {
                color: #000000 !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .text-blue-600, .text-blue-700, .text-green-600, .text-green-700, 
              .text-purple-600, .text-purple-700, .text-gray-600, .text-gray-700, 
              .text-gray-800, .text-gray-500 {
                color: #000000 !important;
              }
            }
          `
        }} />
        <div className="max-w-4xl mx-auto p-8 bg-white print:p-0">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-blue-600 pb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">{proposal.companyName}</h1>
          <div className="flex justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {proposal.companyAddress}
            </div>
            <div className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {proposal.companyPhone}
            </div>
            <div className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {proposal.companyEmail}
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-2">{proposal.companyLicense}</div>
        </div>

        {/* Proposal Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">PROJECT PROPOSAL</h2>
              <div className="space-y-2">
                <div><strong>Proposal Date:</strong> {proposal.proposalDate}</div>
                <div><strong>Valid Until:</strong> {proposal.validUntil}</div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="text-lg px-4 py-2">
                Proposal #{Math.random().toString(36).substr(2, 9).toUpperCase()}
              </Badge>
            </div>
          </div>

          {/* Client and Project Info */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-800 mb-3">CLIENT INFORMATION</h3>
              <div className="space-y-1 text-sm">
                <div>{proposal.clientName || 'Client Name'}</div>
                <div>{proposal.clientAddress || 'Client Address'}</div>
                <div>{proposal.clientPhone || 'Client Phone'}</div>
                <div>{proposal.clientEmail || 'Client Email'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-3">PROJECT DETAILS</h3>
              <div className="space-y-1 text-sm">
                <div><strong>Project:</strong> {proposal.projectTitle || 'Project Title'}</div>
                <div><strong>Location:</strong> {proposal.projectAddress || 'Project Address'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Project Description */}
        {exportSettings.includeProjectDescription && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-3">PROJECT DESCRIPTION</h3>
            <p className="text-gray-700 leading-relaxed">{proposal.projectDescription || 'Project description will be added here.'}</p>
          </div>
        )}

        {/* Scope of Work */}
        {exportSettings.includeScopeOfWork && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-gray-800">SCOPE OF WORK</h3>
              <div className="flex items-center gap-4 print:hidden">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Work sequence:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowQuantitiesInScope(!showQuantitiesInScope)}
                    className="text-gray-600 hover:text-gray-800"
                    title={showQuantitiesInScope ? "Hide work sequence" : "Show work sequence"}
                  >
                    {showQuantitiesInScope ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Pricing:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLumpSumPricing(!showLumpSumPricing)}
                    className="text-gray-600 hover:text-gray-800"
                    title={showLumpSumPricing ? "Show detailed pricing breakdown" : "Hide breakdown, show total only"}
                  >
                    {showLumpSumPricing ? <Calculator className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              {proposal.scopeOfWork.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No scope items have been added yet.
                </div>
              ) : showLumpSumPricing ? (
                // Lump Sum View - Simple work description without pricing
                <div className="text-left">
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-600 pl-6 py-4">
                      <span className="w-2 h-2 bg-blue-600 rounded-full inline-block mr-3"></span>
                      <span className="text-gray-700 leading-relaxed">
                        {proposal.projectDescription || "Complete project work as specified including all materials, labor, and services required."}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                // Detailed View - Show work packages with pricing if enabled
                getWorkPackages().map((pkg, index) => (
                  <div key={index} className="border-l-4 border-blue-600 pl-6 py-4">
                    {/* Package Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                      <div className="flex-1">
                        <div className={`flex ${exportSettings.includePricing ? 'justify-between' : 'justify-start'} items-start mb-2`}>
                          <h4 className="font-bold text-gray-800 text-lg">{pkg.title}</h4>
                          {exportSettings.includePricing && (
                            <span className="font-bold text-blue-600 text-lg ml-4">${formatCurrency(pkg.total)}</span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-4 text-left">{pkg.subtitle}</p>
                      </div>
                    </div>
                    
                    {/* Work Sequence - Only show when enabled */}
                    {exportSettings.includeWorkSequence && (
                      <div className="ml-5 space-y-2">
                        {pkg.workSequence.map((step, stepIndex) => (
                          <div key={stepIndex} className="flex items-start gap-2 text-left">
                            <span className="text-gray-400 mt-1">•</span>
                            <span className="text-sm text-gray-600">{step}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        {exportSettings.includeCostBreakdown && !showLumpSumPricing && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-800">COST BREAKDOWN</h3>
              <div className="flex items-center gap-2 print:hidden">
                <span className="text-sm text-gray-600">Internal Use</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                  className="text-gray-600 hover:text-gray-800"
                  title="Hide cost breakdown"
                >
                  <EyeOff className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Materials Table */}
            {proposal.scopeOfWork.filter(item => !item.isLabor).length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Materials</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Unit</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Price</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.scopeOfWork.filter(item => !item.isLabor).map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.quantity}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.unit}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(item.materialCost || 0)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={4} className="border border-gray-300 px-3 py-2 text-right text-sm">Materials Subtotal:</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(materialsSubtotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Labor Table */}
            {proposal.scopeOfWork.filter(item => item.isLabor).length > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Labor</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Unit</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Rate</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.scopeOfWork.filter(item => item.isLabor).map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-3 py-2 text-sm">{item.description}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.quantity}</td>
                          <td className="border border-gray-300 px-3 py-2 text-center text-sm">{item.unit}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(item.laborRate || 0)}</td>
                          <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                      <tr className="bg-green-50 font-semibold">
                        <td colSpan={4} className="border border-gray-300 px-3 py-2 text-right text-sm">Labor Subtotal:</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(laborSubtotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Overhead & Profit Breakdown */}
            {scopeSubtotal > 0 && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-700 mb-3">Overhead & Profit</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left text-sm font-semibold">Description</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Base Amount</th>
                        <th className="border border-gray-300 px-3 py-2 text-center text-sm font-semibold">Rate</th>
                        <th className="border border-gray-300 px-3 py-2 text-right text-sm font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="bg-white">
                        <td className="border border-gray-300 px-3 py-2 text-sm">Scope Subtotal (Materials + Labor)</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">—</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">—</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(scopeSubtotal)}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="border border-gray-300 px-3 py-2 text-sm">Overhead & Business Operations</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">${formatCurrency(scopeSubtotal)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">20%</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(scopeSubtotal * 0.20)}</td>
                      </tr>
                      <tr className="bg-white">
                        <td className="border border-gray-300 px-3 py-2 text-sm">Profit Margin</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">${formatCurrency(scopeSubtotal)}</td>
                        <td className="border border-gray-300 px-3 py-2 text-center text-sm">10%</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(scopeSubtotal * 0.10)}</td>
                      </tr>
                      <tr className="bg-blue-50 font-semibold">
                        <td colSpan={3} className="border border-gray-300 px-3 py-2 text-right text-sm">Scope Total with Overhead & Profit:</td>
                        <td className="border border-gray-300 px-3 py-2 text-right text-sm">${formatCurrency(scopeWithMarkup)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cost Summary */}
        {exportSettings.includePricing && (
          <div className="bg-blue-50 p-4 rounded-lg mb-8">
            {showLumpSumPricing ? (
              // Lump Sum Display - Clean total only with new label
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  Total Project Investment:
                </div>
                <div className="text-4xl font-bold text-blue-600">
                  ${formatCurrency(total)}
                </div>
              </div>
            ) : (
              // Detailed Breakdown Display
              <>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Scope of Work (with 30% overhead & markup):</span>
                  <span>${formatCurrency(scopeWithMarkup)}</span>
                </div>
                {permitsSubtotal > 0 && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold">Permits & Fees:</span>
                    <span>${formatCurrency(permitsSubtotal)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center text-xl font-bold text-blue-600">
                  <span>Total Project Investment:</span>
                  <span>${formatCurrency(total)}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Terms and Conditions */}
        {exportSettings.includeTermsAndConditions && (
          <div className="mb-8">
            <h3 className="font-bold text-gray-800 mb-4">TERMS & CONDITIONS</h3>
            <div className="space-y-4 text-sm">
              <div>
                <strong>Payment Schedule:</strong>
                <p className="mt-1 text-gray-700">{proposal.paymentSchedule}</p>
              </div>
              
              <div>
                <strong>Timeline:</strong>
                <p className="mt-1 text-gray-700">{proposal.timeline}</p>
              </div>
              
              <div>
                <strong>Warranty:</strong>
                <p className="mt-1 text-gray-700">{proposal.warranty}</p>
              </div>
              
              <div>
                <strong>Additional Terms:</strong>
                <p className="mt-1 text-gray-700">{proposal.additionalTerms}</p>
              </div>
            </div>
          </div>
        )}

        {/* Signature Section */}
        {exportSettings.includeSignatureSection && (
          <div className="border-t-2 border-gray-200 pt-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold mb-4">CONTRACTOR ACCEPTANCE</h4>
              <div className="space-y-4">
                <div>
                  <div className="border-b border-gray-400 h-8 mb-2"></div>
                  <div className="text-sm text-gray-600">Authorized Signature</div>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-2"></div>
                  <div className="text-sm text-gray-600">Print Name & Title</div>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-2"></div>
                  <div className="text-sm text-gray-600">Date</div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">CLIENT ACCEPTANCE</h4>
              <div className="space-y-4">
                <div>
                  <div className="border-b border-gray-400 h-8 mb-2"></div>
                  <div className="text-sm text-gray-600">Client Signature</div>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-2"></div>
                  <div className="text-sm text-gray-600">Print Name</div>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-2"></div>
                  <div className="text-sm text-gray-600">Date</div>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="fixed bottom-4 right-4 print:hidden">
          <div className="flex gap-2">
            <Button onClick={onBackToHome} variant="outline" className="border-gray-300 text-gray-600 hover:bg-gray-50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            <Button onClick={() => setIsEditing(true)} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
        <Toaster />
      </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="flex h-screen">
        {/* Main Content Area */}
        <div className={`flex-1 overflow-y-auto ${isNewVersion && showComparisonSidebar ? 'pr-4' : ''}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 lg:mb-12">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 lg:mb-0">
                <Button 
                  variant="ghost" 
                  onClick={onBackToHome} 
                  className="self-start text-slate-600 hover:text-slate-800 hover:bg-white/50 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
                      {isNewVersion ? 'New Revision' : 'Proposal Editor'}
                    </h1>
                    {(proposal.version || isNewVersion) && (
                      <Badge className={`${isNewVersion ? 'bg-green-100 text-green-800 border-green-200' : 'bg-blue-100 text-blue-800 border-blue-200'}`}>
                        {proposal.version || 'R.0'}
                      </Badge>
                    )}
                  </div>
                  {isNewVersion && baseProposal && (
                    <div className="flex items-center gap-4">
                      <p className="text-sm text-slate-600">
                        Creating {proposal.version || 'R.0'} based on "{baseProposal.projectTitle}" 
                        {baseProposal.previousTotal && (
                          <span className="ml-2 text-gray-500">
                            (Previous total: ${baseProposal.previousTotal.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})})
                          </span>
                        )}
                      </p>
                      {!showComparisonSidebar && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowComparisonSidebar(true)}
                          className="text-xs"
                        >
                          <Calculator className="w-3 h-3 mr-1" />
                          Show Comparison
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Dialog open={showSavedProposals} onOpenChange={setShowSavedProposals}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50" onClick={loadSavedProposals}>
                    <List className="w-4 h-4 mr-2" />
                    Saved Proposals
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <span>Saved Proposals</span>
                      <Button variant="ghost" size="sm" onClick={loadSavedProposals} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                    </DialogTitle>
                    <DialogDescription>
                      Select a saved proposal to load or delete existing proposals.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    {savedProposals.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No saved proposals found.
                      </div>
                    ) : (
                      savedProposals.map((savedProposal) => (
                        <div key={savedProposal.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold">{savedProposal.projectTitle || 'Untitled Project'}</h4>
                                {savedProposal.version && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                    {savedProposal.version}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{savedProposal.clientName || 'No Client'} - {savedProposal.projectAddress || 'No Address'}</p>
                              <div className="flex items-center gap-4 mt-1">
                                <p className="text-xs text-gray-500">
                                  Last saved: {new Date(savedProposal.lastSaved).toLocaleString()}
                                </p>
                                {savedProposal.baseProposalId && (
                                  <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                    Revision
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => loadProposalFromDatabase(savedProposal.id)}
                                disabled={isLoading}
                              >
                                Load
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteProposal(savedProposal.id)}
                                disabled={isLoading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={loadProposal} variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">
                <Upload className="w-4 h-4 mr-2" />
                Load File
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Save to Database
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Proposal</DialogTitle>
                    <DialogDescription>
                      Save this proposal to the database for future access and sharing.
                    </DialogDescription>
                    {proposal.version && (
                      <div className="mt-3">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          Version {proposal.version}
                        </Badge>
                      </div>
                    )}
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-3">Proposal Details</h4>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div>Project: {proposal.projectTitle || 'Untitled Project'}</div>
                        <div>Client: {proposal.clientName || 'No client specified'}</div>
                        <div>Total: ${formatCurrency(total)}</div>
                        {proposal.version && (
                          <div className="flex items-center gap-2 mt-2">
                            <span>Revision:</span>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                              {proposal.version}
                            </Badge>
                          </div>
                        )}
                        {isNewVersion && baseProposal && (
                          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                            This is a revision of "{baseProposal.projectTitle}"
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                      <Button
                        onClick={saveProposalToDatabase}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        {isLoading ? 'Saving...' : 'Save Proposal'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button onClick={saveProposal} variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
                <Button onClick={() => setIsEditing(false)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-200">
                  <FileText className="w-4 h-4 mr-2" />
                  Preview Proposal
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {/* Company Information */}
              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Company Information
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={proposal.companyName}
                    onChange={(e) => setProposal(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="companyAddress">Address</Label>
                  <Input
                    id="companyAddress"
                    value={proposal.companyAddress}
                    onChange={(e) => setProposal(prev => ({ ...prev, companyAddress: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="companyPhone">Phone</Label>
                    <Input
                      id="companyPhone"
                      value={proposal.companyPhone}
                      onChange={(e) => setProposal(prev => ({ ...prev, companyPhone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      value={proposal.companyEmail}
                      onChange={(e) => setProposal(prev => ({ ...prev, companyEmail: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyLicense">License Number</Label>
                  <Input
                    id="companyLicense"
                    value={proposal.companyLicense}
                    onChange={(e) => setProposal(prev => ({ ...prev, companyLicense: e.target.value }))}
                  />
                </div>
              </CardContent>
            </Card>

              {/* Client Information */}
              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100">
                  <CardTitle className="flex items-center gap-3 text-slate-800">
                    <div className="p-2 bg-green-500 rounded-full">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    Client Information
                  </CardTitle>
                </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="clientName">Client Name</Label>
                  <Input
                    id="clientName"
                    value={proposal.clientName}
                    onChange={(e) => setProposal(prev => ({ ...prev, clientName: e.target.value }))}
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <Label htmlFor="clientAddress">Address</Label>
                  <Input
                    id="clientAddress"
                    value={proposal.clientAddress}
                    onChange={(e) => setProposal(prev => ({ ...prev, clientAddress: e.target.value }))}
                    placeholder="Enter client address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="clientPhone">Phone</Label>
                    <Input
                      id="clientPhone"
                      value={proposal.clientPhone}
                      onChange={(e) => setProposal(prev => ({ ...prev, clientPhone: e.target.value }))}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="clientEmail">Email</Label>
                    <Input
                      id="clientEmail"
                      value={proposal.clientEmail}
                      onChange={(e) => setProposal(prev => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="Enter email address"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Information */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    Project Information
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Project Description:</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowProjectDescription(!showProjectDescription)}
                        className="text-gray-600 hover:text-gray-800"
                        title={showProjectDescription ? "Hide project description" : "Show project description"}
                      >
                        {showProjectDescription ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </Button>
                    </div>
                    {proposal.version && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Version:</span>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {proposal.version}
                        </Badge>
                      </div>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projectTitle">Project Title</Label>
                    <Input
                      id="projectTitle"
                      value={proposal.projectTitle}
                      onChange={(e) => setProposal(prev => ({ ...prev, projectTitle: e.target.value }))}
                      placeholder="Enter project title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="projectAddress">Project Address</Label>
                    <Input
                      id="projectAddress"
                      value={proposal.projectAddress}
                      onChange={(e) => setProposal(prev => ({ ...prev, projectAddress: e.target.value }))}
                      placeholder="Enter project address"
                    />
                  </div>
                  <div>
                    <Label htmlFor="proposalDate">Proposal Date</Label>
                    <Input
                      id="proposalDate"
                      type="date"
                      value={proposal.proposalDate}
                      onChange={(e) => setProposal(prev => ({ ...prev, proposalDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validUntil">Valid Until</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={proposal.validUntil}
                      onChange={(e) => setProposal(prev => ({ ...prev, validUntil: e.target.value }))}
                    />
                  </div>
                </div>
                {showProjectDescription && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="projectDescription">Project Description</Label>
                      <VoiceInput
                        onTranscript={(text) => setProposal(prev => ({ 
                          ...prev, 
                          projectDescription: prev.projectDescription + text + ' '
                        }))}
                        append={true}
                      />
                    </div>
                    <Textarea
                      id="projectDescription"
                      value={proposal.projectDescription}
                      onChange={(e) => setProposal(prev => ({ ...prev, projectDescription: e.target.value }))}
                      rows={3}
                      placeholder="Describe the project scope, materials, and deliverables"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Photo Analysis */}
            <Card className="lg:col-span-2">
              <PhotoAnalysis 
                onScopeItemsGenerated={handlePhotoAnalysisResults}
                onConditionsDetected={handleConditionsDetected}
              />
            </Card>

            {/* Scope of Work Editor */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                    Scope of Work
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View Mode Toggle */}
                    <div className="flex items-center gap-1 mr-2">
                      <Button
                        variant={scopeViewMode === 'traditional' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScopeViewMode('traditional')}
                        className="text-xs"
                      >
                        Traditional
                      </Button>
                      <Button
                        variant={scopeViewMode === 'combined' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setScopeViewMode('combined')}
                        className="text-xs"
                      >
                        <LayoutList className="w-3 h-3 mr-1" />
                        Combined
                      </Button>
                    </div>

                    {/* Action Buttons */}
                    <BulkPricingAdjustment
                      scopeOfWork={proposal.scopeOfWork}
                      onScopeUpdate={handleBulkScopeUpdate}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Calculator className="w-4 h-4 mr-2" />
                          Scope Management
                        </Button>
                      }
                    />
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Labor Rates
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Manage Labor Rates</DialogTitle>
                          <DialogDescription>
                            Configure hourly rates for different types of labor work.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {laborRates.map((rate) => (
                            <div key={rate.id} className="grid grid-cols-4 gap-4 items-center">
                              <Input
                                value={rate.name}
                                onChange={(e) => updateLaborRate(rate.id, rate.rate, rate.unit, e.target.value)}
                                placeholder="Labor type"
                              />
                              <Input
                                type="number"
                                value={rate.rate}
                                onChange={(e) => updateLaborRate(rate.id, Number(e.target.value), rate.unit, rate.name)}
                                placeholder="Rate"
                              />
                              <Select value={rate.unit} onValueChange={(value) => updateLaborRate(rate.id, rate.rate, value, rate.name)}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="hour">per hour</SelectItem>
                                  <SelectItem value="sq ft">per sq ft</SelectItem>
                                  <SelectItem value="linear ft">per linear ft</SelectItem>
                                  <SelectItem value="unit">per unit</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setLaborRates(prev => prev.filter(r => r.id !== rate.id))}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                          <Button onClick={addLaborRate} variant="outline" className="w-full">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Labor Rate
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Render based on view mode */}
                {scopeViewMode === 'combined' ? (
                  <CombinedScopeView
                    scopeOfWork={proposal.scopeOfWork}
                    laborRates={laborRates}
                    units={units}
                    onUpdateScopeItem={updateScopeItem}
                    onRemoveScopeItem={removeScopeItem}
                    onAddScopeItem={addScopeItem}
                    showPricing={showPricingInCombined}
                    onTogglePricing={() => setShowPricingInCombined(!showPricingInCombined)}
                  />
                ) : (
                  // Traditional view
                  <div className="space-y-4">
                    {proposal.scopeOfWork.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant={item.isLabor ? "secondary" : "default"}>
                            {item.isLabor ? "Labor" : "Material"}
                          </Badge>
                          <div className="flex items-center gap-2">
                            {item.isLabor && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  {laborRates.map((rate) => (
                                    <DropdownMenuItem
                                      key={rate.id}
                                      onClick={() => updateScopeItem(item.id, { laborRate: rate.rate })}
                                    >
                                      {rate.name} - ${rate.rate}/{rate.unit}
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => removeScopeItem(item.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div className="md:col-span-2">
                            <div className="flex items-center justify-between mb-2">
                              <Label>Description</Label>
                              <VoiceInput
                                onTranscript={(text) => updateScopeItem(item.id, { description: text })}
                                className="shrink-0"
                              />
                            </div>
                            <Input
                              value={item.description}
                              onChange={(e) => updateScopeItem(item.id, { description: e.target.value })}
                              placeholder="Enter description"
                            />
                          </div>
                          
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateScopeItem(item.id, { quantity: Number(e.target.value) })}
                              min="0"
                              step="0.01"
                            />
                          </div>
                          
                          <div>
                            <Label>Unit</Label>
                            <Select value={item.unit} onValueChange={(value) => updateScopeItem(item.id, { unit: value })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit === 'CY' ? 'CY (Cubic Yards)' : unit.charAt(0).toUpperCase() + unit.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label>{item.isLabor ? "Labor Rate" : "Material Price"}</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                              <Input
                                type="number"
                                value={item.isLabor ? item.laborRate || 0 : item.materialCost || 0}
                                onChange={(e) => updateScopeItem(item.id, 
                                  item.isLabor 
                                    ? { laborRate: Number(e.target.value) }
                                    : { materialCost: Number(e.target.value) }
                                )}
                                min="0"
                                step="0.01"
                                className="pl-7"
                                placeholder={item.isLabor ? "0.00" : "0.00"}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="font-semibold">Total: ${formatCurrency(item.total)}</span>
                        </div>
                      </div>
                    ))}
                    
                    {proposal.scopeOfWork.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        No items added yet. Click "Add Material" or "Add Labor" to get started.
                      </div>
                    )}

                    {/* Add Item Buttons for Traditional View */}
                    <div className="flex gap-2 justify-center pt-4">
                      <Button onClick={() => addScopeItem(false)} size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Material
                      </Button>
                      <Button onClick={() => addScopeItem(true)} size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Labor
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Permits Section */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
                  Permits & Fees
                </div>
                <Button onClick={() => {
                  const newPermit: LineItem = {
                    id: Date.now().toString(),
                    description: '',
                    quantity: 1,
                    unit: 'permit',
                    unitPrice: 0,
                    total: 0
                  };
                  setProposal(prev => ({ ...prev, permits: [...prev.permits, newPermit] }));
                }} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Permit
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {proposal.permits.map((permit) => (
                  <div key={permit.id} className="grid grid-cols-5 gap-3 items-center p-3 border rounded-lg">
                    <div className="col-span-2">
                      <Input
                        value={permit.description}
                        onChange={(e) => {
                          const updatedPermits = proposal.permits.map(p => 
                            p.id === permit.id ? { ...p, description: e.target.value } : p
                          );
                          setProposal(prev => ({ ...prev, permits: updatedPermits }));
                        }}
                        placeholder="Permit description"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={permit.quantity}
                        onChange={(e) => {
                          const quantity = Number(e.target.value);
                          const updatedPermits = proposal.permits.map(p => 
                            p.id === permit.id ? { ...p, quantity, total: quantity * p.unitPrice } : p
                          );
                          setProposal(prev => ({ ...prev, permits: updatedPermits }));
                        }}
                        min="1"
                      />
                    </div>
                    <div>
                      <Input
                        type="number"
                        value={permit.unitPrice}
                        onChange={(e) => {
                          const unitPrice = Number(e.target.value);
                          const updatedPermits = proposal.permits.map(p => 
                            p.id === permit.id ? { ...p, unitPrice, total: p.quantity * unitPrice } : p
                          );
                          setProposal(prev => ({ ...prev, permits: updatedPermits }));
                        }}
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">${formatCurrency(permit.total)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          const updatedPermits = proposal.permits.filter(p => p.id !== permit.id);
                          setProposal(prev => ({ ...prev, permits: updatedPermits }));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Cost Summary
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                      title={showCostBreakdown ? "Hide detailed breakdown in preview" : "Show detailed breakdown in preview"}
                    >
                      {showCostBreakdown ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm text-gray-600">
                      {showCostBreakdown ? "Breakdown visible" : "Breakdown hidden"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLumpSumPricing(!showLumpSumPricing)}
                      title={showLumpSumPricing ? "Show detailed line item pricing" : "Hide breakdown, show total only"}
                    >
                      {showLumpSumPricing ? <Calculator className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </Button>
                    <span className="text-sm text-gray-600">
                      {showLumpSumPricing ? "Total only" : "Full breakdown"}
                    </span>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="font-semibold text-blue-700">Materials</div>
                  <div className="text-2xl font-bold text-blue-600">${formatCurrency(materialsSubtotal)}</div>
                  <div className="text-sm text-gray-600">{proposal.scopeOfWork.filter(item => !item.isLabor).length} items</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="font-semibold text-green-700">Labor</div>
                  <div className="text-2xl font-bold text-green-600">${formatCurrency(laborSubtotal)}</div>
                  <div className="text-sm text-gray-600">{proposal.scopeOfWork.filter(item => item.isLabor).length} items</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="font-semibold text-purple-700">Permits</div>
                  <div className="text-2xl font-bold text-purple-600">${formatCurrency(permitsSubtotal)}</div>
                  <div className="text-sm text-gray-600">{proposal.permits.length} permits</div>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="text-center">
                <div className="text-lg">Total Project Cost</div>
                <div className="text-3xl font-bold text-gray-800">${formatCurrency(total)}</div>
                <div className="text-sm text-gray-600">Scope pricing includes 30% overhead & markup</div>
                
                {/* Version comparison */}
                {isNewVersion && proposal.previousTotal && proposal.previousTotal > 0 && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="text-sm font-medium text-yellow-800 mb-1">
                      {proposal.version || 'R.0'} vs {getPreviousVersion(proposal.version)} Comparison
                    </div>
                    <div className="flex items-center justify-center gap-4 text-sm">
                      <span className="text-gray-600">Previous: ${formatCurrency(proposal.previousTotal)}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-600">Current: ${formatCurrency(total)}</span>
                    </div>
                    <div className="mt-1">
                      {total > proposal.previousTotal ? (
                        <span className="text-red-600 font-medium">
                          +${formatCurrency(total - proposal.previousTotal)} 
                          ({(((total - proposal.previousTotal) / proposal.previousTotal) * 100).toFixed(1)}% increase)
                        </span>
                      ) : total < proposal.previousTotal ? (
                        <span className="text-green-600 font-medium">
                          -${formatCurrency(proposal.previousTotal - total)} 
                          ({(((proposal.previousTotal - total) / proposal.previousTotal) * 100).toFixed(1)}% decrease)
                        </span>
                      ) : (
                        <span className="text-gray-600 font-medium">No change in price</span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-xs text-gray-500 mt-2">
                  Use the eye toggle above to show/hide detailed cost breakdown in proposal preview
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Control Panel */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Export Control Panel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                Choose which sections to include in the final export/preview:
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeProjectDescription"
                    checked={exportSettings.includeProjectDescription}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeProjectDescription: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeProjectDescription" className="text-sm">Project Description</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeScopeOfWork"
                    checked={exportSettings.includeScopeOfWork}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeScopeOfWork: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeScopeOfWork" className="text-sm">Scope of Work</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeWorkSequence"
                    checked={exportSettings.includeWorkSequence}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeWorkSequence: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeWorkSequence" className="text-sm">Work Sequence</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includePricing"
                    checked={exportSettings.includePricing}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includePricing: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includePricing" className="text-sm">Pricing</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeTermsAndConditions"
                    checked={exportSettings.includeTermsAndConditions}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeTermsAndConditions: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeTermsAndConditions" className="text-sm">Terms & Conditions</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeCostBreakdown"
                    checked={exportSettings.includeCostBreakdown}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeCostBreakdown: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeCostBreakdown" className="text-sm">Cost Breakdown</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSignatureSection"
                    checked={exportSettings.includeSignatureSection}
                    onChange={(e) => setExportSettings(prev => ({ ...prev, includeSignatureSection: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="includeSignatureSection" className="text-sm">Signature Section</label>
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-xs text-gray-500">
                  These settings control what appears in the final proposal when you click "Preview Proposal". 
                  Use these toggles to create clean, client-ready documents.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Terms & Conditions Editor */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                  Terms & Conditions
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowTermsSection(!showTermsSection)}
                    title={showTermsSection ? "Hide in preview" : "Show in preview"}
                  >
                    {showTermsSection ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  {isEditingTerms ? (
                    <Button onClick={saveTerms} size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  ) : (
                    <Button onClick={() => setIsEditingTerms(true)} variant="outline" size="sm">
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingTerms ? (
                <>
                  <div>
                    <Label htmlFor="paymentSchedule">Payment Schedule</Label>
                    <Textarea
                      id="paymentSchedule"
                      value={proposal.paymentSchedule}
                      onChange={(e) => setProposal(prev => ({ ...prev, paymentSchedule: e.target.value }))}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timeline">Timeline</Label>
                    <Textarea
                      id="timeline"
                      value={proposal.timeline}
                      onChange={(e) => setProposal(prev => ({ ...prev, timeline: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="warranty">Warranty</Label>
                    <Textarea
                      id="warranty"
                      value={proposal.warranty}
                      onChange={(e) => setProposal(prev => ({ ...prev, warranty: e.target.value }))}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="additionalTerms">Additional Terms</Label>
                    <Textarea
                      id="additionalTerms"
                      value={proposal.additionalTerms}
                      onChange={(e) => setProposal(prev => ({ ...prev, additionalTerms: e.target.value }))}
                      rows={4}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <strong>Payment Schedule:</strong>
                    <p className="mt-1 text-gray-700">{proposal.paymentSchedule}</p>
                  </div>
                  
                  <div>
                    <strong>Timeline:</strong>
                    <p className="mt-1 text-gray-700">{proposal.timeline}</p>
                  </div>
                  
                  <div>
                    <strong>Warranty:</strong>
                    <p className="mt-1 text-gray-700">{proposal.warranty}</p>
                  </div>
                  
                  <div>
                    <strong>Additional Terms:</strong>
                    <p className="mt-1 text-gray-700">{proposal.additionalTerms}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
            </div>
          </div>
        </div>
        
        {/* Version Comparison Sidebar */}
        {renderComparisonSidebar()}
      </div>
      
      <Toaster />
    </div>
  );
}