import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, FileText, Trash2, RefreshCw, Building, UserIcon, MapPin, Calendar, GitBranch, TrendingUp, Search, Filter, Settings, Users, LogOut, Calculator, Layers } from 'lucide-react';
import { Input } from './ui/input';
import { CRMIntegrations } from './CRMIntegrations';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { User } from '../lib/auth-service';
import type { EstimationProject as EstProject } from '../lib/export-service';

interface SavedProposal {
  id: string;
  projectTitle: string;
  clientName: string;
  projectAddress: string;
  lastSaved: string;
  companyName: string;
  scopeOfWork: any[];
  version?: string;
  baseProposalId?: string;
  previousTotal?: number;
}

interface HomePageProps {
  onNewProposal: () => void;
  onEditProposal: (proposal: any) => void;
  onNewVersion: (baseProposal: any) => void;
  onCreateManual?: () => void;
  onFieldCapture?: () => void;
  onStartEstimation?: () => void;
  onEditEstimationProject?: (project: EstProject) => void;
  currentUser?: User;
  onLogout?: () => void;
}

export function HomePage({ 
  onNewProposal, 
  onEditProposal, 
  onNewVersion, 
  onCreateManual, 
  onFieldCapture,
  onStartEstimation,
  onEditEstimationProject,
  currentUser,
  onLogout
}: HomePageProps) {
  const [savedProposals, setSavedProposals] = useState<SavedProposal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProposal, setSelectedProposal] = useState<SavedProposal | null>(null);
  const [showCRM, setShowCRM] = useState(false);

  // Utility function to format numbers with commas
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const calculateProposalTotal = (proposal: SavedProposal) => {
    if (!proposal.scopeOfWork || proposal.scopeOfWork.length === 0) return 0;
    
    const scopeTotal = proposal.scopeOfWork.reduce((sum, item) => sum + (item.total || 0), 0);
    const markupRate = 0.30; // 30% overhead & markup
    return scopeTotal * (1 + markupRate);
  };

  const getVersionDifference = (proposal: SavedProposal) => {
    if (!proposal.previousTotal || proposal.previousTotal === 0) return null;
    
    const currentTotal = calculateProposalTotal(proposal);
    const difference = currentTotal - proposal.previousTotal;
    const percentageChange = (difference / proposal.previousTotal) * 100;
    
    return {
      amount: difference,
      percentage: percentageChange,
      isIncrease: difference > 0
    };
  };

  const getLatestVersion = (proposals: SavedProposal[], baseId: string) => {
    const versions = proposals.filter(p => 
      p.baseProposalId === baseId || p.id === baseId
    );
    
    // Convert R.x format to numbers for comparison
    const versionNumbers = versions.map(p => {
      if (!p.version) return 0;
      const match = p.version.match(/^R\.(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });
    
    return Math.max(...versionNumbers);
  };

  const filteredProposals = savedProposals.filter(proposal =>
    proposal.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proposal.projectAddress.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedProposals = filteredProposals.reduce((acc, proposal) => {
    const baseId = proposal.baseProposalId || proposal.id;
    if (!acc[baseId]) {
      acc[baseId] = [];
    }
    acc[baseId].push(proposal);
    return acc;
  }, {} as Record<string, SavedProposal[]>);

  // Get the latest version of each proposal group
  const latestProposals = Object.values(groupedProposals).map(group => {
    return group.sort((a, b) => {
      const aVersion = a.version ? parseInt(a.version.replace('R.', '')) : 0;
      const bVersion = b.version ? parseInt(b.version.replace('R.', '')) : 0;
      return bVersion - aVersion;
    })[0];
  });

  const loadSavedProposals = async () => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const loadProposal = async (proposalId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/proposals/${proposalId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        onEditProposal(result.proposal);
        toast.success('Proposal loaded successfully!');
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

  const deleteProposal = async (proposalId: string, proposalTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${proposalTitle}"? This action cannot be undone.`)) {
      return;
    }

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

  const handleClientSelect = (client: any) => {
    // Create a new proposal with client data pre-filled
    const proposalWithClient = {
      companyName: "Lineage Builders Inc.",
      companyAddress: "16 Angela Ln, San Diego, CA 91911",
      companyPhone: "(909) 240-7090",
      companyEmail: "ramon.lineagebuilderinc@gmail.co",
      companyLicense: "",
      clientName: client.name,
      clientAddress: client.address,
      clientPhone: client.phone,
      clientEmail: client.email,
      projectTitle: "",
      projectAddress: client.address,
      proposalDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      projectDescription: "",
      scopeOfWork: [],
      permits: [],
      paymentSchedule: "10% deposit upon contract signing, 50% upon material delivery and project start, 40% upon final completion and approval.",
      warranty: "We provide a 3-year warranty on retaining wall construction and 1-year warranty on concrete work. All materials carry manufacturer warranties.",
      timeline: "Project duration will be determined based on scope of work, weather permitting.",
      additionalTerms: "Client responsible for marking underground utilities before work begins. Weather delays may extend timeline. All excavated soil will be hauled away unless otherwise specified. Changes to scope require written approval and may affect pricing and timeline."
    };
    
    onEditProposal(proposalWithClient);
  };

  useEffect(() => {
    loadSavedProposals();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="mb-8 lg:mb-12">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 lg:mb-8">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent mb-2 lg:mb-3">
                BidFlow Personal
              </h1>
              <p className="text-base sm:text-lg text-slate-600 font-medium">AI-Powered Construction Estimating</p>
              {currentUser && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {currentUser.name}
                  </Badge>
                  <Badge variant={currentUser.role.type === 'estimator' ? 'default' : currentUser.role.type === 'pm' ? 'secondary' : 'outline'}>
                    {currentUser.role.type.toUpperCase()}
                  </Badge>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {currentUser && onLogout && (
                <Button
                  variant="outline"
                  onClick={onLogout}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              )}
              <Button
                variant="outline"
                onClick={loadSavedProposals}
                disabled={isLoading}
                className="border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCRM(!showCRM)}
                className="border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                CRM Settings
              </Button>
              <div className="flex gap-2">
                <Button
                  onClick={onNewProposal}
                  className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
                  size="lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  AI Proposal
                </Button>
                {onCreateManual && (
                  <Button
                    onClick={onCreateManual}
                    variant="outline"
                    className="border-slate-300 hover:bg-slate-50 transition-all duration-200"
                    size="lg"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    New Manual Proposal
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {/* New Tools Section */}
          <div className="flex flex-wrap gap-3 mb-4">
            {onFieldCapture && (
              <Button
                onClick={onFieldCapture}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
                size="lg"
              >
                <MapPin className="w-5 h-5 mr-2" />
                Field Measurement
              </Button>
            )}
            {onStartEstimation && currentUser?.role.permissions.canEdit && (
              <Button
                onClick={onStartEstimation}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
                size="lg"
              >
                <Calculator className="w-5 h-5 mr-2" />
                Estimation Workspace
              </Button>
            )}
          </div>
          {/* Search Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search proposals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus:border-blue-400 focus:ring-blue-400/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 lg:mb-12">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 mb-1">Total Proposals</p>
                  <p className="text-2xl lg:text-3xl font-bold text-blue-900">{Object.keys(groupedProposals).length}</p>
                </div>
                <div className="p-3 bg-blue-500 rounded-full">
                  <FileText className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 mb-1">Total Value</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-900">
                    ${formatCurrency(latestProposals.reduce((sum, proposal) => sum + calculateProposalTotal(proposal), 0))}
                  </p>
                </div>
                <div className="p-3 bg-green-500 rounded-full">
                  <Building className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-violet-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 mb-1">Active Versions</p>
                  <p className="text-2xl lg:text-3xl font-bold text-purple-900">
                    {savedProposals.filter(p => {
                      if (!p.version) return false;
                      const versionNum = parseInt(p.version.replace('R.', ''));
                      return versionNum > 0;
                    }).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-500 rounded-full">
                  <GitBranch className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700 mb-1">This Week</p>
                  <p className="text-2xl lg:text-3xl font-bold text-orange-900">
                    {savedProposals.filter(p => {
                      const daysSinceUpdate = (Date.now() - new Date(p.lastSaved).getTime()) / (1000 * 60 * 60 * 24);
                      return daysSinceUpdate <= 7;
                    }).length}
                  </p>
                </div>
                <div className="p-3 bg-orange-500 rounded-full">
                  <Calendar className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CRM Integrations Section */}
        {showCRM && (
          <div className="mb-8">
            <CRMIntegrations onClientSelect={handleClientSelect} />
          </div>
        )}

        {/* Proposals Grid */}
        <div className="mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-6">Your Proposals</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="h-4 bg-slate-200 rounded mb-3"></div>
                    <div className="h-3 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded mb-4"></div>
                    <div className="h-8 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : latestProposals.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50">
              <CardContent className="p-8 lg:p-12 text-center">
                <div className="p-6 bg-gradient-to-br from-violet-100 to-purple-100 rounded-full w-fit mx-auto mb-6">
                  <FileText className="w-12 h-12 lg:w-16 lg:h-16 text-violet-600" />
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-3">Ready to Create Your First Proposal?</h3>
                <p className="text-slate-600 mb-8 max-w-lg mx-auto">Transform consultation notes into detailed proposals in seconds with AI, or create manually from scratch</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={onNewProposal} 
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    AI Proposal Generator
                  </Button>
                  {onCreateManual && (
                    <Button 
                      onClick={onCreateManual}
                      variant="outline"
                      className="border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      size="lg"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      New Manual Proposal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              {latestProposals.map((proposal) => {
                const versionDiff = getVersionDifference(proposal);
                const allVersions = groupedProposals[proposal.baseProposalId || proposal.id] || [proposal];
                
                return (
                  <Card key={proposal.id} className="group border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden">
                    <CardHeader className="pb-4 bg-gradient-to-r from-slate-50 to-blue-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg font-bold text-slate-800 truncate">
                              {proposal.projectTitle}
                            </CardTitle>
                            {proposal.version && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                                {proposal.version}
                              </Badge>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs bg-white/50 border-slate-200">
                            {proposal.companyName}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-slate-600">
                          <UserIcon className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate font-medium">{proposal.clientName}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <MapPin className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{proposal.projectAddress}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-slate-600">
                          <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                          <span>{new Date(proposal.lastSaved).toLocaleDateString()}</span>
                        </div>

                        {allVersions.length > 1 && (
                          <div className="flex items-center text-sm text-slate-600">
                            <GitBranch className="w-4 h-4 mr-3 flex-shrink-0 text-slate-400" />
                            <span>{allVersions.length} versions</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-4 border border-blue-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm font-medium text-blue-700">Estimated Value</div>
                          {versionDiff && (
                            <Badge 
                              variant={versionDiff.isIncrease ? "default" : "secondary"}
                              className={`text-xs ${
                                versionDiff.isIncrease 
                                  ? 'bg-green-100 text-green-800 border-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-200'
                              }`}
                            >
                              {versionDiff.isIncrease ? '+' : ''}{versionDiff.percentage.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                        <div className="text-xl font-bold text-blue-900">
                          ${formatCurrency(calculateProposalTotal(proposal))}
                        </div>
                        {versionDiff && (
                          <div className={`text-xs mt-1 ${
                            versionDiff.isIncrease ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {versionDiff.isIncrease ? '+' : ''}${formatCurrency(Math.abs(versionDiff.amount))} from previous version
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => loadProposal(proposal.id)}
                          disabled={isLoading}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              className="border-slate-200 hover:bg-slate-50 transition-all duration-200"
                              onClick={() => setSelectedProposal(proposal)}
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Proposal Actions</DialogTitle>
                              <DialogDescription>
                                Choose an action for this proposal. You can create a new version or delete it permanently.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3">
                              <Button
                                onClick={() => onNewVersion(proposal)}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                              >
                                <GitBranch className="w-4 h-4 mr-2" />
                                Create New Version
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => deleteProposal(proposal.id, proposal.projectTitle)}
                                disabled={isLoading}
                                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Proposal
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Toaster />
    </div>
  );
}