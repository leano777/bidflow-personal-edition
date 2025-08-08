import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { ProposalWorkspace } from './components/ProposalWorkspace';
import { AppHeader } from './components/AppHeader';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProposalProvider, createNewVersion } from './contexts/ProposalContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingProvider, LoadingOverlay, OperationsPanel } from './components/LoadingSystem';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { toast } from 'sonner@2.0.3';

// Create empty proposal structure
const createEmptyProposal = () => ({
  id: undefined,
  projectTitle: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  projectAddress: '',
  proposalDate: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  version: 'R.0',
  scopeOfWork: [],
  laborRates: {
    general: 75,
    skilled: 95,
    specialized: 125,
  },
  notes: '',
  terms: '',
  paymentTerms: '',
  timeline: '',
  status: 'draft',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  // Add missing fields for integrations
  photoIntegration: {
    enabled: false,
    autoAnalysis: false,
    photos: []
  },
  clientPortal: {
    enabled: false,
    accessCode: '',
    allowComments: true,
    showPricing: false
  },
  paymentCollection: {
    enabled: false,
    depositPercentage: 20,
    milestones: [],
    acceptedMethods: ['card', 'ach']
  }
});

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'workspace'>('dashboard');
  const [workspaceState, setWorkspaceState] = useState<{
    proposal: any;
    mode: 'create' | 'edit' | 'version';
    baseProposal?: any;
  } | null>(null);

  // Unified proposal creation flow
  const handleCreateProposal = (method: 'ai' | 'manual', baseProposal?: any) => {
    const mode = baseProposal ? 'version' : 'create';
    const proposal = baseProposal 
      ? createNewVersion(baseProposal) 
      : createEmptyProposal();
    
    setWorkspaceState({
      proposal,
      mode,
      baseProposal
    });
    setCurrentView('workspace');
    
    // Show appropriate message
    if (method === 'ai') {
      toast.info('Starting AI-powered proposal creation');
    } else if (baseProposal) {
      toast.success(`Created new version: ${proposal.version}`);
    } else {
      toast.info('Creating new proposal');
    }
  };

  // Edit existing proposal
  const handleEditProposal = (proposal: any) => {
    // Ensure proposal has all required fields
    const completeProposal = {
      ...createEmptyProposal(),
      ...proposal,
      scopeOfWork: proposal.scopeOfWork || [],
      laborRates: proposal.laborRates || {
        general: 75,
        skilled: 95,
        specialized: 125,
      },
      // Ensure integration fields exist
      photoIntegration: proposal.photoIntegration || {
        enabled: false,
        autoAnalysis: false,
        photos: []
      },
      clientPortal: proposal.clientPortal || {
        enabled: false,
        accessCode: '',
        allowComments: true,
        showPricing: false
      },
      paymentCollection: proposal.paymentCollection || {
        enabled: false,
        depositPercentage: 20,
        milestones: [],
        acceptedMethods: ['card', 'ach']
      }
    };

    setWorkspaceState({
      proposal: completeProposal,
      mode: 'edit'
    });
    setCurrentView('workspace');
    toast.info(`Editing: ${proposal.projectTitle || 'Untitled Proposal'}`);
  };

  // Handle proposal updates from various components
  const handleProposalUpdate = (updates: any) => {
    if (!workspaceState) {
      console.error('No workspace state available for update');
      return;
    }

    try {
      const updatedProposal = {
        ...workspaceState.proposal,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      setWorkspaceState({
        ...workspaceState,
        proposal: updatedProposal
      });

      // Show success message for specific updates
      if (updates.photoIntegration) {
        toast.success('Photo integration settings updated');
      } else if (updates.clientPortal) {
        toast.success('Client portal settings updated');
      } else if (updates.paymentCollection) {
        toast.success('Payment collection settings updated');
      } else {
        toast.success('Proposal updated successfully');
      }

      console.log('Proposal updated:', updatedProposal);
    } catch (error) {
      console.error('Error updating proposal:', error);
      toast.error('Failed to update proposal');
    }
  };

  // Return to dashboard
  const handleReturnToDashboard = () => {
    setCurrentView('dashboard');
    setWorkspaceState(null);
    toast.success('Returned to dashboard');
  };

  // Global shortcuts
  const handleSave = () => {
    // This will be handled by the ProposalWorkspace
    if (currentView === 'workspace') {
      // The workspace will handle the save
      return;
    }
    toast.info('Nothing to save');
  };

  const handlePrint = () => {
    if (currentView === 'workspace') {
      window.print();
      toast.success('Print dialog opened');
    } else {
      toast.info('Switch to proposal view to print');
    }
  };

  const handleNew = () => {
    if (currentView === 'workspace') {
      // Confirm if there are unsaved changes
      const hasUnsavedChanges = true; // This would come from context
      if (hasUnsavedChanges) {
        if (confirm('You have unsaved changes. Create new proposal anyway?')) {
          handleCreateProposal('manual');
        }
      } else {
        handleCreateProposal('manual');
      }
    } else {
      handleCreateProposal('manual');
    }
  };

  const handleHelp = () => {
    // Show contextual help
    const shortcuts = currentView === 'workspace' 
      ? 'Workspace shortcuts: Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y (Redo), Ctrl+M (Add Material), Ctrl+L (Add Labor)'
      : 'Dashboard shortcuts: Ctrl+N (New Proposal), Ctrl+/ (Help)';
    
    toast.info(shortcuts, { duration: 8000 });
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
        toast.error('Application error occurred. Please refresh the page.');
      }}
    >
      <ThemeProvider>
        <LoadingProvider>
          <ProposalProvider>
            <div className="min-h-screen dashboard-bg">
              {/* Global keyboard shortcuts */}
              <KeyboardShortcuts
                onSave={handleSave}
                onPrint={handlePrint}
                onNew={handleNew}
                onHelp={handleHelp}
                context="global"
              />

              {/* Loading overlay */}
              <LoadingOverlay />

              {/* Operations panel (development mode) */}
              {process.env.NODE_ENV === 'development' && <OperationsPanel />}

              {/* Header */}
              <ErrorBoundary fallback={
                <div className="bg-destructive/10 border-b border-destructive/20">
                  <div className="container-padding py-4">
                    <p className="text-destructive text-sm text-center">
                      Header failed to load. Some features may not be available.
                    </p>
                  </div>
                </div>
              }>
                <AppHeader 
                  currentView={currentView}
                  workspaceState={workspaceState}
                  onReturnToDashboard={handleReturnToDashboard}
                />
              </ErrorBoundary>

              {/* Main content with improved layout and padding */}
              <main className="animate-fade-in">
                <ErrorBoundary
                  onError={(error) => {
                    toast.error('Main content failed to load');
                    console.error('Main content error:', error);
                  }}
                >
                  {currentView === 'dashboard' ? (
                    <div className="section-spacing">
                      <div className="container-padding">
                        <div className="max-w-7xl mx-auto">
                          <ErrorBoundary
                            fallback={
                              <div className="glass-card p-8 text-center">
                                <h2 className="text-xl font-bold mb-4">Dashboard Unavailable</h2>
                                <p className="text-muted-foreground mb-4">
                                  The dashboard failed to load. Please refresh the page.
                                </p>
                                <button
                                  onClick={() => window.location.reload()}
                                  className="contractor-button-primary"
                                >
                                  Refresh Page
                                </button>
                              </div>
                            }
                          >
                            <HomePage 
                              onCreateProposal={handleCreateProposal}
                              onEditProposal={handleEditProposal}
                            />
                          </ErrorBoundary>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="min-h-[calc(100vh-80px)]">
                      <ErrorBoundary
                        fallback={
                          <div className="container-padding py-8">
                            <div className="max-w-4xl mx-auto">
                              <div className="glass-card p-8 text-center">
                                <h2 className="text-xl font-bold mb-4">Workspace Unavailable</h2>
                                <p className="text-muted-foreground mb-4">
                                  The proposal workspace failed to load.
                                </p>
                                <div className="flex gap-4 justify-center">
                                  <button
                                    onClick={handleReturnToDashboard}
                                    className="contractor-button-secondary"
                                  >
                                    Return to Dashboard
                                  </button>
                                  <button
                                    onClick={() => window.location.reload()}
                                    className="contractor-button-primary"
                                  >
                                    Refresh Page
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        }
                      >
                        <ProposalWorkspace 
                          initialState={workspaceState}
                          onReturnToDashboard={handleReturnToDashboard}
                          onProposalUpdate={handleProposalUpdate}
                        />
                      </ErrorBoundary>
                    </div>
                  )}
                </ErrorBoundary>
              </main>

              {/* Footer - Clean footer only on dashboard with proper padding */}
              {currentView === 'dashboard' && (
                <ErrorBoundary
                  fallback={null} // Footer is not critical, just hide it on error
                >
                  <footer className="border-t border-border glass-subtle mt-16">
                    <div className="container-padding py-6">
                      <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                          <div className="text-sm text-muted-foreground">
                            © 2024 Lineage Builders Inc. Professional Proposal System
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span>Version 2.2</span>
                            <span>•</span>
                            <span>Built for Professional Contractors</span>
                            <span>•</span>
                            <button
                              onClick={handleHelp}
                              className="hover:text-foreground transition-colors"
                              title="Show keyboard shortcuts (Ctrl + /)"
                            >
                              Shortcuts
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </footer>
                </ErrorBoundary>
              )}
            </div>
          </ProposalProvider>
        </LoadingProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}