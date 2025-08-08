import { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import {
  Plus,
  FileText,
  Search,
  Filter,
  Clock,
  CheckCircle,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  Calculator,
  Sparkles,
  Home,
  Building2,
  Zap,
  Target,
  BarChart3,
  Briefcase
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { EmptyState } from './EmptyState';
import { PricingModelQuickAccess } from './PricingModelQuickAccess';
import { LoadingSpinner } from './LoadingSpinner';
import { useProposal } from '../contexts/ProposalContext';
import { useLoading } from './LoadingSystem';
import { toast } from 'sonner@2.0.3';

interface HomePageProps {
  onCreateProposal: (method: 'ai' | 'manual', baseProposal?: any) => void;
  onEditProposal: (proposal: any) => void;
}

export function HomePage({ onCreateProposal, onEditProposal }: HomePageProps) {
  const { proposals: rawProposals, deleteProposal, duplicateProposal, isLoading } = useProposal();
  const { setLoading } = useLoading();
  
  // Ensure proposals is always an array
  const proposals = rawProposals || [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'amount'>('date');
  const [selectedProposals, setSelectedProposals] = useState<string[]>([]);

  // Filter and sort proposals
  const filteredProposals = proposals
    .filter(proposal => {
      const matchesSearch = !searchQuery || 
        proposal.projectTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        proposal.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || proposal.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return (a.projectTitle || '').localeCompare(b.projectTitle || '');
        case 'amount':
          const aTotal = calculateProposalTotal(a);
          const bTotal = calculateProposalTotal(b);
          return bTotal - aTotal;
        case 'date':
        default:
          return new Date(b.updatedAt || b.createdAt).getTime() - 
                 new Date(a.updatedAt || a.createdAt).getTime();
      }
    });

  // Calculate dashboard statistics
  const stats = {
    total: proposals.length,
    draft: proposals.filter(p => p.status === 'draft').length,
    sent: proposals.filter(p => p.status === 'sent').length,
    approved: proposals.filter(p => p.status === 'approved').length,
    totalValue: proposals.reduce((sum, p) => sum + calculateProposalTotal(p), 0),
    avgValue: proposals.length ? proposals.reduce((sum, p) => sum + calculateProposalTotal(p), 0) / proposals.length : 0
  };

  // Handle proposal actions
  const handleDeleteProposal = useCallback(async (id: string) => {
    if (confirm('Are you sure you want to delete this proposal? This action cannot be undone.')) {
      setLoading(true, 'Deleting proposal...');
      try {
        await deleteProposal(id);
        toast.success('Proposal deleted successfully');
      } catch (error) {
        toast.error('Failed to delete proposal');
      } finally {
        setLoading(false);
      }
    }
  }, [deleteProposal, setLoading]);

  const handleDuplicateProposal = useCallback(async (proposal: any) => {
    setLoading(true, 'Duplicating proposal...');
    try {
      const duplicated = await duplicateProposal(proposal.id);
      toast.success('Proposal duplicated successfully');
      onEditProposal(duplicated);
    } catch (error) {
      toast.error('Failed to duplicate proposal');
    } finally {
      setLoading(false);
    }
  }, [duplicateProposal, onEditProposal, setLoading]);

  // Handle creation with pricing data
  const handleCreateWithPricing = useCallback((method: 'ai' | 'manual', pricingData?: any) => {
    if (pricingData) {
      // Create a base proposal with pricing information
      const baseProposal = {
        projectTitle: `${pricingData.projectType === 'adu' ? 'ADU' : 'Home'} Construction - ${pricingData.squareFootage} SF`,
        notes: `Market tier: ${pricingData.marketTier}, Estimated cost: $${pricingData.estimatedCost?.toLocaleString()}`,
        constructionPricingModel: pricingData
      };
      onCreateProposal(method, baseProposal);
    } else {
      onCreateProposal(method);
    }
  }, [onCreateProposal]);

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="p-2 bg-primary rounded-lg">
            <Briefcase className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Lineage Builders</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Professional proposal system for general contractors. Create detailed estimates, 
          manage client relationships, and grow your construction business.
        </p>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <Button
            onClick={() => onCreateProposal('manual')}
            size="lg"
            className="contractor-button-primary"
          >
            <Plus className="h-5 w-5 mr-2" /> 
            New Proposal
          </Button>
          <Button
            onClick={() => onCreateProposal('ai')}
            size="lg"
            variant="outline"
            className="contractor-button-secondary"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            AI-Powered Proposal
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="contractor-text-value">{stats.total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <div>
                <div className="contractor-text-value">{stats.draft}</div>
                <div className="text-xs text-muted-foreground">Draft</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <div>
                <div className="contractor-text-value">{stats.sent}</div>
                <div className="text-xs text-muted-foreground">Sent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <div>
                <div className="contractor-text-value">{stats.approved}</div>
                <div className="text-xs text-muted-foreground">Approved</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-success" />
              <div>
                <div className="contractor-text-currency text-sm">${stats.totalValue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Value</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="contractor-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <div>
                <div className="contractor-text-currency text-sm">${stats.avgValue.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Avg Value</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Featured Tools Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="contractor-section-header">Featured Tools</h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Construction Pricing Model */}
          <PricingModelQuickAccess onCreateProposal={handleCreateWithPricing} />

          {/* AI Proposal Creator */}
          <Card className="contractor-card card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent" />
                AI Proposal Creator
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Generate professional proposals from natural language descriptions
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="glass-subtle rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  "I need a proposal for a 2,500 SF home addition with kitchen remodel..."
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="h-3 w-3 text-accent" />
                  <span>Powered by OpenAI GPT-4</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Smart scope generation</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Auto-pricing</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>Professional format</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-warning rounded-full"></div>
                  <span>Instant generation</span>
                </div>
              </div>
              
              <Button
                onClick={() => onCreateProposal('ai')}
                className="w-full contractor-button-primary"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Try AI Creator
              </Button>
            </CardContent>
          </Card>

          {/* Progress Billing */}
          <Card className="contractor-card card-hover">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Progress Billing
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Set up milestone-based payments and track project progress
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Foundation</span>
                  <Badge className="status-active">Paid</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Framing</span>
                  <Badge className="status-pending">Pending</Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Final</span>
                  <Badge className="status-draft">Scheduled</Badge>
                </div>
              </div>
              
              <div className="pt-2 border-t border-border">
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <span>Custom milestones</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-success rounded-full"></div>
                    <span>Auto-invoicing</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>Payment tracking</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-warning rounded-full"></div>
                    <span>Progress photos</span>
                  </div>
                </div>
              </div>
              
              <Button
                onClick={() => onCreateProposal('manual')}
                variant="outline"
                className="w-full contractor-button-secondary"
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Set Up Billing
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Proposals Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="contractor-section-header">Recent Proposals</h2>
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search proposals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="contractor-input text-sm px-3 py-2 rounded-md"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="contractor-input text-sm px-3 py-2 rounded-md"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="amount">Sort by Amount</option>
            </select>
          </div>
        </div>

        {/* Proposals List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size={32} />
            <span className="ml-3">Loading proposals...</span>
          </div>
        ) : filteredProposals.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={searchQuery || statusFilter !== 'all' ? 'No proposals found' : 'No proposals yet'}
            description={
              searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'Create your first proposal to get started with professional estimates.'
            }
            action={
              <Button
                onClick={() => onCreateProposal('manual')}
                className="contractor-button-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Proposal
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4">
            {filteredProposals.slice(0, 10).map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onEdit={() => onEditProposal(proposal)}
                onDuplicate={() => handleDuplicateProposal(proposal)}
                onDelete={() => handleDeleteProposal(proposal.id)}
                onCreateVersion={() => onCreateProposal('manual', proposal)}
              />
            ))}
            
            {filteredProposals.length > 10 && (
              <Card className="contractor-card">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground">
                    Showing 10 of {filteredProposals.length} proposals
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    View All Proposals
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Proposal Card Component
interface ProposalCardProps {
  proposal: any;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onCreateVersion: () => void;
}

function ProposalCard({ proposal, onEdit, onDuplicate, onDelete, onCreateVersion }: ProposalCardProps) {
  const total = calculateProposalTotal(proposal);
  const hasConstructionPricing = proposal.constructionPricingModel;

  return (
    <Card className="contractor-card card-hover">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="contractor-text-value truncate">
                {proposal.projectTitle || 'Untitled Proposal'}
              </h3>
              <StatusBadge status={proposal.status} />
              {hasConstructionPricing && (
                <Badge variant="outline" className="badge-material">
                  <Calculator className="h-3 w-3 mr-1" />
                  Pricing Model
                </Badge>
              )}
            </div>
            
            <div className="space-y-1 text-sm text-muted-foreground">
              {proposal.clientName && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {proposal.clientName}
                </div>
              )}
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(proposal.updatedAt || proposal.createdAt).toLocaleDateString()}
                </div>
                
                {proposal.version && (
                  <div className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    v{proposal.version}
                  </div>
                )}
                
                {total > 0 && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    <span className="contractor-text-currency">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-4">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDuplicate}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onCreateVersion}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to calculate proposal total
function calculateProposalTotal(proposal: any): number {
  if (!proposal || !proposal.scopeOfWork || !Array.isArray(proposal.scopeOfWork)) {
    return 0;
  }
  
  return proposal.scopeOfWork
    .filter((item: any) => item.includedInTotal !== false)
    .reduce((sum: number, item: any) => {
      return sum + (parseFloat(item.total) || 0);
    }, 0);
}