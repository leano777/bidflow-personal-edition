import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { toast } from 'sonner@2.0.3';

// Types
interface Proposal {
  id: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectAddress: string;
  proposalDate: string;
  validUntil: string;
  version: string;
  scopeOfWork: ScopeItem[];
  laborRates: LaborRates;
  notes: string;
  terms: string;
  paymentTerms: string;
  timeline: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
  totalAmount?: number;
  constructionPricingModel?: any;
  progressBilling?: any;
  clientPortal?: any;
  paymentCollection?: any;
  photoDocumentation?: any;
}

interface ScopeItem {
  id: string;
  description: string;
  category: 'material' | 'labor' | 'other';
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  notes?: string;
  includedInTotal: boolean;
}

interface LaborRates {
  general: number;
  skilled: number;
  specialized: number;
  [key: string]: number;
}

interface ProposalContextType {
  proposals: Proposal[];
  isLoading: boolean;
  error: string | null;
  saveProposal: (proposal: Partial<Proposal>) => Promise<Proposal>;
  updateProposal: (id: string, updates: Partial<Proposal>) => Promise<void>;
  deleteProposal: (id: string) => Promise<void>;
  duplicateProposal: (id: string) => Promise<Proposal>;
  loadProposals: () => Promise<void>;
  getProposalById: (id: string) => Proposal | undefined;
}

const ProposalContext = createContext<ProposalContextType | undefined>(undefined);

// Mock data for development - this simulates a database
const mockProposals: Proposal[] = [
  {
    id: '1',
    projectTitle: 'Kitchen Remodel - Johnson Residence',
    clientName: 'Mike Johnson',
    clientEmail: 'mike@example.com',
    clientPhone: '(555) 123-4567',
    projectAddress: '123 Oak Street, Springfield, IL 62701',
    proposalDate: '2024-01-15',
    validUntil: '2024-02-15',
    version: 'R.1',
    scopeOfWork: [
      {
        id: '1',
        description: 'Demolition of existing kitchen cabinets and countertops',
        category: 'labor',
        quantity: 1,
        unit: 'LS',
        unitPrice: 2500,
        total: 2500,
        includedInTotal: true
      },
      {
        id: '2',
        description: 'Custom maple cabinets with soft-close hinges',
        category: 'material',
        quantity: 15,
        unit: 'LF',
        unitPrice: 450,
        total: 6750,
        includedInTotal: true
      },
      {
        id: '3',
        description: 'Granite countertops installation',
        category: 'material',
        quantity: 45,
        unit: 'SF',
        unitPrice: 85,
        total: 3825,
        includedInTotal: true
      }
    ],
    laborRates: {
      general: 75,
      skilled: 95,
      specialized: 125
    },
    notes: 'Client prefers natural materials and modern design aesthetic.',
    terms: 'Payment due within 30 days of invoice. 10% deposit required to begin work.',
    paymentTerms: 'Net 30',
    timeline: '4-6 weeks',
    status: 'sent',
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-15T09:00:00Z',
    totalAmount: 13075
  },
  {
    id: '2',
    projectTitle: 'Bathroom Addition - Smith Property',
    clientName: 'Sarah Smith',
    clientEmail: 'sarah@example.com',
    clientPhone: '(555) 987-6543',
    projectAddress: '456 Pine Avenue, Springfield, IL 62702',
    proposalDate: '2024-01-20',
    validUntil: '2024-02-20',
    version: 'R.0',
    scopeOfWork: [
      {
        id: '4',
        description: 'Framing for new bathroom addition',
        category: 'labor',
        quantity: 120,
        unit: 'SF',
        unitPrice: 12,
        total: 1440,
        includedInTotal: true
      },
      {
        id: '5',
        description: 'Plumbing rough-in for bathroom fixtures',
        category: 'labor',
        quantity: 1,
        unit: 'LS',
        unitPrice: 3500,
        total: 3500,
        includedInTotal: true
      }
    ],
    laborRates: {
      general: 75,
      skilled: 95,
      specialized: 125
    },
    notes: 'Addition will match existing home architecture.',
    terms: 'Standard terms and conditions apply.',
    paymentTerms: 'Net 30',
    timeline: '8-10 weeks',
    status: 'draft',
    createdAt: '2024-01-20T10:30:00Z',
    updatedAt: '2024-01-20T10:30:00Z',
    totalAmount: 4940
  }
];

// Storage key for localStorage
const STORAGE_KEY = 'lineage_proposals';

// Utility functions
export const generateProposalId = (): string => {
  return `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const createNewVersion = (baseProposal: Proposal): Proposal => {
  const versionMatch = baseProposal.version.match(/^R\.(\d+)$/);
  const currentVersion = versionMatch ? parseInt(versionMatch[1]) : 0;
  const newVersion = `R.${currentVersion + 1}`;
  
  return {
    ...baseProposal,
    id: generateProposalId(),
    version: newVersion,
    status: 'draft' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    // Clear any approval-specific data
    clientPortal: undefined,
    paymentCollection: undefined
  };
};

interface ProposalProviderProps {
  children: ReactNode;
}

export function ProposalProvider({ children }: ProposalProviderProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load proposals from localStorage on mount
  const loadProposals = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedProposals = JSON.parse(stored) as Proposal[];
        setProposals(parsedProposals);
      } else {
        // Initialize with mock data for demo
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProposals));
        setProposals(mockProposals);
      }
    } catch (err) {
      console.error('Failed to load proposals:', err);
      setError('Failed to load proposals from storage');
      // Fallback to mock data
      setProposals(mockProposals);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save proposals to localStorage
  const saveToStorage = useCallback((proposalList: Proposal[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(proposalList));
    } catch (err) {
      console.error('Failed to save proposals:', err);
      toast.error('Failed to save proposals to storage');
    }
  }, []);

  // Save a new proposal
  const saveProposal = useCallback(async (proposalData: Partial<Proposal>): Promise<Proposal> => {
    const newProposal: Proposal = {
      id: generateProposalId(),
      projectTitle: '',
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      projectAddress: '',
      proposalDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      version: 'R.0',
      scopeOfWork: [],
      laborRates: { general: 75, skilled: 95, specialized: 125 },
      notes: '',
      terms: '',
      paymentTerms: '',
      timeline: '',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...proposalData
    };

    const updatedProposals = [...proposals, newProposal];
    setProposals(updatedProposals);
    saveToStorage(updatedProposals);
    
    return newProposal;
  }, [proposals, saveToStorage]);

  // Update an existing proposal
  const updateProposal = useCallback(async (id: string, updates: Partial<Proposal>): Promise<void> => {
    const updatedProposals = proposals.map(proposal =>
      proposal.id === id
        ? { ...proposal, ...updates, updatedAt: new Date().toISOString() }
        : proposal
    );
    
    setProposals(updatedProposals);
    saveToStorage(updatedProposals);
  }, [proposals, saveToStorage]);

  // Delete a proposal
  const deleteProposal = useCallback(async (id: string): Promise<void> => {
    const updatedProposals = proposals.filter(proposal => proposal.id !== id);
    setProposals(updatedProposals);
    saveToStorage(updatedProposals);
  }, [proposals, saveToStorage]);

  // Duplicate a proposal
  const duplicateProposal = useCallback(async (id: string): Promise<Proposal> => {
    const originalProposal = proposals.find(p => p.id === id);
    if (!originalProposal) {
      throw new Error('Proposal not found');
    }

    const duplicatedProposal: Proposal = {
      ...originalProposal,
      id: generateProposalId(),
      projectTitle: `${originalProposal.projectTitle} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // Clear client portal and payment data for the copy
      clientPortal: undefined,
      paymentCollection: undefined
    };

    const updatedProposals = [...proposals, duplicatedProposal];
    setProposals(updatedProposals);
    saveToStorage(updatedProposals);
    
    return duplicatedProposal;
  }, [proposals, saveToStorage]);

  // Get proposal by ID
  const getProposalById = useCallback((id: string): Proposal | undefined => {
    return proposals.find(proposal => proposal.id === id);
  }, [proposals]);

  // Load proposals on mount
  useEffect(() => {
    loadProposals();
  }, [loadProposals]);

  const value: ProposalContextType = {
    proposals,
    isLoading,
    error,
    saveProposal,
    updateProposal,
    deleteProposal,
    duplicateProposal,
    loadProposals,
    getProposalById
  };

  return (
    <ProposalContext.Provider value={value}>
      {children}
    </ProposalContext.Provider>
  );
}

export const useProposal = (): ProposalContextType => {
  const context = useContext(ProposalContext);
  if (context === undefined) {
    throw new Error('useProposal must be used within a ProposalProvider');
  }
  return context;
};