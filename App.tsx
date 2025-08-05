import { useState } from 'react';
import { HomePage } from './components/HomePage';
import { ProposalTemplate } from './components/ProposalTemplate';
import { AIProposalCreator } from './components/AIProposalCreator';
import MeasurementCapture from './components/measurement/MeasurementCapture';

export default function App() {
  const [currentView, setCurrentView] = useState<'home' | 'ai-creator' | 'proposal' | 'field-capture'>('home');
  const [currentProposal, setCurrentProposal] = useState<any>(null);
  const [isNewVersion, setIsNewVersion] = useState(false);
  const [baseProposal, setBaseProposal] = useState<any>(null);
  const [fieldData, setFieldData] = useState<any>(null);

  const handleNewProposal = () => {
    setCurrentProposal(null);
    setIsNewVersion(false);
    setBaseProposal(null);
    setCurrentView('ai-creator');
  };

  const handleCreateManual = () => {
    setCurrentProposal(null);
    setIsNewVersion(false);
    setBaseProposal(null);
    setCurrentView('proposal');
  };

  const handleAIProposalGenerated = (proposal: any) => {
    setCurrentProposal(proposal);
    setIsNewVersion(false);
    setBaseProposal(null);
    setCurrentView('proposal');
  };

  const handleEditProposal = (proposal: any) => {
    setCurrentProposal(proposal);
    setIsNewVersion(false);
    setBaseProposal(null);
    setCurrentView('proposal');
  };

  // Helper function to get next version number
  const getNextVersion = (currentVersion: string | undefined) => {
    if (!currentVersion) {
      // First version starts at R.0
      return 'R.0';
    }
    
    // Extract the number from R.x format
    const versionMatch = currentVersion.match(/^R\.(\d+)$/);
    if (versionMatch) {
      const currentNumber = parseInt(versionMatch[1], 10);
      return `R.${currentNumber + 1}`;
    }
    
    // Fallback for any non-standard version formats
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

  const handleNewVersion = (proposal: any) => {
    // Create a new proposal object that copies the scope of work from the base proposal
    const newVersionProposal = {
      // Copy all the basic proposal data
      ...proposal,
      // Set version info using R.x format
      version: getNextVersion(proposal.version),
      baseProposalId: proposal.baseProposalId || proposal.id,
      previousTotal: calculateProposalTotal(proposal),
      // Update dates
      proposalDate: new Date().toISOString().split('T')[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      // Copy scope of work with new IDs to avoid conflicts
      scopeOfWork: proposal.scopeOfWork.map((item: any) => ({
        ...item,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9) // Generate new unique ID
      })),
      // Remove the original id so it gets saved as a new proposal
      id: undefined
    };
    
    setCurrentProposal(newVersionProposal);
    setIsNewVersion(true);
    setBaseProposal(proposal);
    setCurrentView('proposal');
  };

  // Helper function to calculate proposal total (same logic as in ProposalTemplate)
  const calculateProposalTotal = (proposalData: any) => {
    if (!proposalData.scopeOfWork || proposalData.scopeOfWork.length === 0) return 0;
    
    const scopeTotal = proposalData.scopeOfWork.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const markupRate = 0.30; // 30% overhead & markup
    return scopeTotal * (1 + markupRate);
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setCurrentProposal(null);
    setIsNewVersion(false);
    setBaseProposal(null);
  };

  const handleBackToHomeFromAI = () => {
    setCurrentView('home');
  };

  const handleFieldCapture = () => {
    setCurrentView('field-capture');
  };

  const handleBackFromFieldCapture = () => {
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'home' ? (
        <HomePage 
          onNewProposal={handleNewProposal}
          onEditProposal={handleEditProposal}
          onNewVersion={handleNewVersion}
          onCreateManual={handleCreateManual}
          onFieldCapture={handleFieldCapture}
        />
      ) : currentView === 'ai-creator' ? (
        <AIProposalCreator 
          onProposalGenerated={handleAIProposalGenerated}
          onBackToHome={handleBackToHomeFromAI}
        />
      ) : currentView === 'field-capture' ? (
        <MeasurementCapture
          onBack={handleBackFromFieldCapture}
          onDataCollected={(data) => {
            setFieldData(data);
            setCurrentView('home');
          }}
        />
      ) : (
        <ProposalTemplate 
          initialProposal={currentProposal}
          onBackToHome={handleBackToHome}
          isNewVersion={isNewVersion}
          baseProposal={baseProposal}
        />
      )}
    </div>
  );
}