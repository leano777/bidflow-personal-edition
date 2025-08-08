import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Building2, MapPin, Phone, Mail, Calendar, FileText, Globe, Package, Wrench, DollarSign, Settings, Eye, EyeOff, Printer, Palette, Calculator, Receipt, List } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import ExportManager from './ExportManager';

interface ProposalPreviewProps {
  proposal: any;
  mode: 'create' | 'edit' | 'version';
  baseProposal?: any;
  brandSettings?: any;
  onBrandSettingsOpen?: () => void;
}

export function ProposalPreview({ proposal, mode, baseProposal, brandSettings: propBrandSettings, onBrandSettingsOpen }: ProposalPreviewProps) {
  const [brandSettings, setBrandSettings] = useState<any>(null);
  const [previewSettings, setPreviewSettings] = useState({
    showDetailedInfo: true,
    showLineItemDetails: false, // Individual line item details (internal only)
    showPricingBreakdown: false, // Materials/Labor sections breakdown
    showTerms: true,
    showSignatures: true,
    printMode: false,
    showPricing: true,
    pricingMode: 'client' as 'client' | 'internal' // Client vs Internal pricing view
  });

  // Toggle setting handler
  const toggleSetting = (key: keyof typeof previewSettings) => {
    console.log(`Toggling ${key} from ${previewSettings[key]} to ${!previewSettings[key]}`);
    setPreviewSettings(prev => {
      const newSettings = {
        ...prev,
        [key]: !prev[key]
      };
      console.log('New preview settings:', newSettings);
      return newSettings;
    });
  };

  // Toggle pricing mode
  const togglePricingMode = () => {
    setPreviewSettings(prev => ({
      ...prev,
      pricingMode: prev.pricingMode === 'client' ? 'internal' : 'client'
    }));
  };

  // Handle print mode
  const handlePrintMode = () => {
    setTimeout(() => window.print(), 100);
  };

  // Load brand settings if not provided as prop
  useEffect(() => {
    if (propBrandSettings) {
      setBrandSettings(propBrandSettings);
    } else {
      loadBrandSettings();
    }
  }, [propBrandSettings]);

  const loadBrandSettings = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/brand-settings`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      const result = await response.json();
      
      if (result.success && result.settings) {
        setBrandSettings(result.settings);
      } else {
        // Use default settings
        setBrandSettings({
          companyName: 'Lineage Builders Inc.',
          tagline: 'Professional Construction Services',
          address: '16 Angela Ln, San Diego, CA 91911',
          phone: '(909) 240-7090',
          email: 'ramon.lineagebuilderinc@gmail.co',
          website: 'www.lineagebuilders.com',
          license: 'CA License #123456',
          primaryColor: '#2563eb',
          secondaryColor: '#f59e0b',
          accentColor: '#10b981',
          backgroundColor: '#ffffff',
          textColor: '#1a1d23',
          templateStyle: 'modern',
          headerStyle: 'gradient',
          logoUrl: '',
          logoPosition: 'left',
          logoSize: 'medium'
        });
      }
    } catch (error) {
      console.error('Load brand settings error:', error);
      // Use defaults on error
      setBrandSettings({
        companyName: 'Lineage Builders Inc.',
        tagline: 'Professional Construction Services',
        address: '16 Angela Ln, San Diego, CA 91911',
        phone: '(909) 240-7090',
        email: 'ramon.lineagebuilderinc@gmail.co',
        primaryColor: '#2563eb',
        headerStyle: 'gradient'
      });
    }
  };

  // Calculate totals and organize by professional categories
  const calculateTotalsAndCategories = () => {
    const scopeOfWork = proposal?.scopeOfWork || [];
    const materials = scopeOfWork.filter((item: any) => !item.isLabor);
    const labor = scopeOfWork.filter((item: any) => item.isLabor);
    
    const materialsTotal = materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const laborTotal = labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const subtotal = materialsTotal + laborTotal;
    const markup = subtotal * 0.30;
    const total = subtotal + markup;
    
    // Professional categories for client view
    const categories = [
      {
        name: 'Materials & Supplies',
        description: 'All materials, supplies, and equipment required for the project',
        total: materialsTotal + (materialsTotal * 0.15), // Include partial markup for materials
        icon: Package,
        color: 'blue'
      },
      {
        name: 'Labor & Installation',
        description: 'Professional installation and labor services',
        total: laborTotal + (laborTotal * 0.45), // Include higher markup for labor
        icon: Wrench,
        color: 'green'
      }
    ];
    
    const categorizedTotal = categories.reduce((sum, cat) => sum + cat.total, 0);
    
    return { 
      materialsTotal, 
      laborTotal, 
      subtotal, 
      markup, 
      total,
      categories,
      categorizedTotal
    };
  };

  const totals = calculateTotalsAndCategories();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get logo size classes
  const getLogoSizeClass = () => {
    if (!brandSettings?.logoSize) return 'w-12 h-12';
    switch (brandSettings.logoSize) {
      case 'small': return 'w-8 h-8';
      case 'medium': return 'w-12 h-12';
      case 'large': return 'w-16 h-16';
      default: return 'w-12 h-12';
    }
  };

  // Get header style
  const getHeaderStyle = () => {
    if (!brandSettings) return {};
    
    const baseStyle = {
      color: '#ffffff',
      padding: '2rem'
    };

    switch (brandSettings.headerStyle) {
      case 'gradient':
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${brandSettings.primaryColor || '#2563eb'}, ${brandSettings.secondaryColor || '#3b82f6'})`
        };
      case 'solid':
        return {
          ...baseStyle,
          backgroundColor: brandSettings.primaryColor || '#2563eb'
        };
      case 'minimal':
        return {
          ...baseStyle,
          backgroundColor: brandSettings.backgroundColor || '#ffffff',
          color: brandSettings.textColor || '#1a1d23',
          borderBottom: `1px solid ${brandSettings.primaryColor || '#2563eb'}`
        };
      default:
        return {
          ...baseStyle,
          background: `linear-gradient(135deg, ${brandSettings.primaryColor || '#2563eb'}, ${brandSettings.secondaryColor || '#3b82f6'})`
        };
    }
  };

  // Get template-specific styles
  const getTemplateStyles = () => {
    if (!brandSettings) return {};
    
    const styles: any = {
      fontFamily: brandSettings.fontFamily || 'Inter',
      fontSize: brandSettings.bodyFontSize || '14px',
      color: brandSettings.textColor || '#1a1d23'
    };

    if (brandSettings.templateStyle === 'creative') {
      styles.borderRadius = '0.75rem';
      styles.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1)';
    } else if (brandSettings.templateStyle === 'professional') {
      styles.borderRadius = '0.25rem';
      styles.border = '2px solid #e5e7eb';
    }

    return styles;
  };

  if (!brandSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading brand settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Manager */}
      <div className="print:hidden">
        <ExportManager 
          proposal={proposal}
          brandSettings={brandSettings}
          disabled={!proposal}
        />
      </div>

      {/* Preview Controls */}
      <Card className="glass-card shadow-md print:hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Settings className="w-4 h-4 text-primary-foreground" />
              </div>
              Preview Controls
            </CardTitle>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {/* Pricing Mode Toggle */}
              <Button
                size="sm"
                variant={previewSettings.pricingMode === 'internal' ? 'default' : 'outline'}
                onClick={togglePricingMode}
                className="gap-2"
              >
                {previewSettings.pricingMode === 'internal' ? (
                  <>
                    <Calculator className="w-4 h-4" />
                    <span className="hidden sm:inline">Internal</span>
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span className="hidden sm:inline">Client</span>
                  </>
                )}
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrintMode}
                className="gap-2"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print</span>
              </Button>
              
              {onBrandSettingsOpen && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onBrandSettingsOpen}
                  className="gap-2"
                >
                  <Palette className="w-4 h-4" />
                  <span className="hidden sm:inline">Brand</span>
                </Button>
              )}
              
              {/* Settings Dropdown - Fixed Implementation */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 p-0">
                  <div className="p-4 space-y-4">
                    <div className="font-semibold text-sm text-foreground border-b border-border pb-2">
                      Display Options
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="detailed-info" className="text-sm font-medium cursor-pointer">
                          Project Details
                        </Label>
                        <Switch
                          id="detailed-info"
                          checked={previewSettings.showDetailedInfo}
                          onCheckedChange={() => toggleSetting('showDetailedInfo')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-pricing" className="text-sm font-medium cursor-pointer">
                          Show Pricing
                        </Label>
                        <Switch
                          id="show-pricing"
                          checked={previewSettings.showPricing}
                          onCheckedChange={() => toggleSetting('showPricing')}
                        />
                      </div>

                      {previewSettings.showPricing && (
                        <div className="flex items-center justify-between">
                          <Label htmlFor="pricing-breakdown" className="text-sm font-medium cursor-pointer">
                            Pricing Breakdown
                          </Label>
                          <Switch
                            id="pricing-breakdown"
                            checked={previewSettings.showPricingBreakdown}
                            onCheckedChange={() => toggleSetting('showPricingBreakdown')}
                          />
                        </div>
                      )}
                      
                      {previewSettings.pricingMode === 'internal' && previewSettings.showPricingBreakdown && (
                        <div className="flex items-center justify-between">
                          <Label htmlFor="line-details" className="text-sm font-medium cursor-pointer">
                            Line Item Details
                          </Label>
                          <Switch
                            id="line-details"
                            checked={previewSettings.showLineItemDetails}
                            onCheckedChange={() => toggleSetting('showLineItemDetails')}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-terms" className="text-sm font-medium cursor-pointer">
                          Terms & Conditions
                        </Label>
                        <Switch
                          id="show-terms"
                          checked={previewSettings.showTerms}
                          onCheckedChange={() => toggleSetting('showTerms')}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-signatures" className="text-sm font-medium cursor-pointer">
                          Signature Section
                        </Label>
                        <Switch
                          id="show-signatures"
                          checked={previewSettings.showSignatures}
                          onCheckedChange={() => toggleSetting('showSignatures')}
                        />
                      </div>
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        {/* Status Indicators */}
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            <Badge variant={previewSettings.pricingMode === 'client' ? "default" : "outline"} className="text-xs">
              {previewSettings.pricingMode === 'client' ? <Receipt className="w-3 h-3 mr-1" /> : <Calculator className="w-3 h-3 mr-1" />}
              {previewSettings.pricingMode === 'client' ? 'Client View' : 'Internal View'}
            </Badge>
            <Badge variant={previewSettings.showDetailedInfo ? "default" : "outline"} className="text-xs">
              {previewSettings.showDetailedInfo ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Project Details
            </Badge>
            <Badge variant={previewSettings.showPricing ? "default" : "outline"} className="text-xs">
              {previewSettings.showPricing ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Pricing
            </Badge>
            {previewSettings.showPricing && (
              <Badge variant={previewSettings.showPricingBreakdown ? "default" : "outline"} className="text-xs">
                {previewSettings.showPricingBreakdown ? <List className="w-3 h-3 mr-1" /> : <DollarSign className="w-3 h-3 mr-1" />}
                {previewSettings.showPricingBreakdown ? 'Breakdown' : 'Total Only'}
              </Badge>
            )}
            {previewSettings.pricingMode === 'internal' && previewSettings.showPricingBreakdown && (
              <Badge variant={previewSettings.showLineItemDetails ? "default" : "outline"} className="text-xs">
                {previewSettings.showLineItemDetails ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
                Line Items
              </Badge>
            )}
            <Badge variant={previewSettings.showTerms ? "default" : "outline"} className="text-xs">
              {previewSettings.showTerms ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Terms
            </Badge>
            <Badge variant={previewSettings.showSignatures ? "default" : "outline"} className="text-xs">
              {previewSettings.showSignatures ? <Eye className="w-3 h-3 mr-1" /> : <EyeOff className="w-3 h-3 mr-1" />}
              Signatures
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Proposal Document */}
      <div 
        className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none print:max-w-none border border-gray-200"
        style={getTemplateStyles()}
      >
        {/* Professional Header */}
        <div 
          className="text-white print:text-black"
          style={getHeaderStyle()}
        >
          <div className={`flex items-start ${brandSettings.logoPosition === 'center' ? 'justify-center text-center' : brandSettings.logoPosition === 'right' ? 'justify-end' : 'justify-between'}`}>
            {/* Company Info Section */}
            <div className={brandSettings.logoPosition === 'right' ? 'order-2' : ''}>
              <div className="flex items-center gap-4 mb-6">
                {/* Logo */}
                {brandSettings.logoUrl && brandSettings.logoPosition === 'left' && (
                  <ImageWithFallback
                    src={brandSettings.logoUrl}
                    alt={`${brandSettings.companyName} Logo`}
                    className={`${getLogoSizeClass()} object-contain`}
                  />
                )}
                
                <div className={brandSettings.logoPosition === 'center' ? 'text-center' : ''}>
                  <h1 
                    className="font-bold mb-2 tracking-tight"
                    style={{ 
                      fontSize: brandSettings.headerFontSize || '32px',
                      color: brandSettings.headerStyle === 'minimal' ? brandSettings.textColor : '#ffffff'
                    }}
                  >
                    {brandSettings.companyName}
                  </h1>
                  <p 
                    className={`${brandSettings.headerStyle === 'minimal' ? 'text-gray-600' : 'text-blue-100'} text-lg font-medium`}
                  >
                    {brandSettings.tagline}
                  </p>
                  
                  {/* Center Logo */}
                  {brandSettings.logoUrl && brandSettings.logoPosition === 'center' && (
                    <div className="mt-4">
                      <ImageWithFallback
                        src={brandSettings.logoUrl}
                        alt={`${brandSettings.companyName} Logo`}
                        className={`${getLogoSizeClass()} object-contain mx-auto`}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contact Information Grid */}
              <div className={`grid grid-cols-2 gap-4 text-sm ${brandSettings.headerStyle === 'minimal' ? 'text-gray-700' : 'text-blue-100'} ${brandSettings.logoPosition === 'center' ? 'text-center' : ''}`}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{brandSettings.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{brandSettings.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{brandSettings.email}</span>
                </div>
                {brandSettings.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">{brandSettings.website}</span>
                  </div>
                )}
              </div>
              
              {brandSettings.license && (
                <div className={`text-xs mt-3 px-3 py-1 rounded ${brandSettings.headerStyle === 'minimal' ? 'bg-gray-100 text-gray-700' : 'bg-white/20 text-white'} inline-block font-medium`}>
                  {brandSettings.license}
                </div>
              )}
            </div>
            
            {/* Proposal Info Section */}
            {brandSettings.logoPosition !== 'center' && (
              <div className={`text-right ${brandSettings.logoPosition === 'right' ? 'order-1 mr-8' : ''}`}>
                {/* Right Logo */}
                {brandSettings.logoUrl && brandSettings.logoPosition === 'right' && (
                  <div className="mb-4">
                    <ImageWithFallback
                      src={brandSettings.logoUrl}
                      alt={`${brandSettings.companyName} Logo`}
                      className={`${getLogoSizeClass()} object-contain ml-auto`}
                    />
                  </div>
                )}
                
                <h2 
                  className="font-bold mb-4 tracking-wide"
                  style={{ 
                    fontSize: brandSettings.headerFontSize || '32px',
                    color: brandSettings.headerStyle === 'minimal' ? brandSettings.textColor : '#ffffff'
                  }}
                >
                  PROPOSAL
                </h2>
                
                {proposal?.version && (
                  <Badge 
                    className="mb-4 px-3 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: brandSettings.headerStyle === 'minimal' ? brandSettings.primaryColor : '#ffffff',
                      color: brandSettings.headerStyle === 'minimal' ? '#ffffff' : brandSettings.primaryColor
                    }}
                  >
                    Version {proposal.version}
                  </Badge>
                )}
                
                <div className={`text-sm ${brandSettings.headerStyle === 'minimal' ? 'text-gray-600' : 'text-blue-100'}`}>
                  <div className="flex items-center gap-2 justify-end mb-2">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{formatDate(proposal?.proposalDate)}</span>
                  </div>
                  <div className="text-xs opacity-80">
                    Valid until: {formatDate(proposal?.validUntil)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8" style={{ fontFamily: brandSettings.fontFamily }}>
          {/* Project Information */}
          <Card className="border-2 shadow-lg" style={{ borderColor: brandSettings.primaryColor + '30' }}>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <CardTitle className="text-xl font-bold flex items-center gap-3" style={{ color: brandSettings.primaryColor }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: brandSettings.primaryColor }}>
                  <FileText className="w-5 h-5 text-white" />
                </div>
                Project Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2" style={{ color: brandSettings.textColor }}>Project Details</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-600 mb-1">Project Title:</span>
                      <p className="text-base font-bold" style={{ color: brandSettings.textColor }}>{proposal?.projectTitle || 'Not specified'}</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-600 mb-1">Project Address:</span>
                      <p className="text-sm font-medium" style={{ color: brandSettings.textColor }}>{proposal?.projectAddress || 'Not specified'}</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-600 mb-1">Valid Until:</span>
                      <p className="text-sm font-medium text-red-600">{formatDate(proposal?.validUntil)}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-bold mb-4 border-b border-gray-200 pb-2" style={{ color: brandSettings.textColor }}>Client Information</h3>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-600 mb-1">Client Name:</span>
                      <p className="text-base font-bold" style={{ color: brandSettings.textColor }}>{proposal?.clientName || 'Not specified'}</p>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-gray-600 mb-1">Client Address:</span>
                      <p className="text-sm font-medium" style={{ color: brandSettings.textColor }}>{proposal?.clientAddress || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {proposal?.projectDescription && previewSettings.showDetailedInfo && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold mb-3" style={{ color: brandSettings.textColor }}>Project Description</h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-lg border">
                    {proposal.projectDescription}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing Section - ENHANCED WITH BREAKDOWN TOGGLE */}
          {proposal?.scopeOfWork && proposal.scopeOfWork.length > 0 && previewSettings.showPricing && (
            <Card className="border-2 shadow-lg" style={{ borderColor: brandSettings.primaryColor + '30' }}>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-green-50 border-b">
                <CardTitle className="text-xl font-bold flex items-center justify-between" style={{ color: brandSettings.primaryColor }}>
                  <span>Project Pricing</span>
                  <div className="flex items-center gap-2">
                    {previewSettings.pricingMode === 'internal' && (
                      <Badge variant="outline" className="text-xs">
                        Internal View
                      </Badge>
                    )}
                    {!previewSettings.showPricingBreakdown && (
                      <Badge variant="secondary" className="text-xs">
                        Total Only
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                
                {/* TOTAL ONLY VIEW - Clean, no breakdown */}
                {!previewSettings.showPricingBreakdown && (
                  <div className="space-y-6">
                    <div className="text-center mb-8">
                      <p className="text-sm text-muted-foreground">
                        Complete project pricing for your construction needs
                      </p>
                    </div>

                    {/* Single Total Card - Professional */}
                    <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-400 shadow-xl">
                      <CardContent className="p-8">
                        <div className="text-center space-y-4">
                          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <DollarSign className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Total Project Investment</h3>
                            <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                              Complete project cost including all materials, labor, equipment, and professional services required to complete your project to the highest standards.
                            </p>
                          </div>
                          <div className="p-6 bg-white rounded-xl shadow-md border-2 border-green-300">
                            <p className="text-5xl font-bold text-green-700 mb-2">
                              ${formatCurrency(previewSettings.pricingMode === 'client' ? totals.categorizedTotal : totals.total)}
                            </p>
                            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
                              Complete Project Cost
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <div className="text-center text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium mb-2">What's Included:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        <p>✓ All materials and supplies</p>
                        <p>✓ Professional installation</p>
                        <p>✓ Equipment and tools</p>
                        <p>✓ Project management</p>
                        <p>✓ Quality assurance</p>
                        <p>✓ Cleanup and disposal</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* BREAKDOWN VIEW - Show categories/detailed breakdown */}
                {previewSettings.showPricingBreakdown && (
                  <>
                    {/* CLIENT VIEW - Professional Lump Sum Categories */}
                    {previewSettings.pricingMode === 'client' && (
                      <div className="space-y-6">
                        <div className="text-center mb-8">
                          <p className="text-sm text-muted-foreground">
                            Professional pricing breakdown for your project
                          </p>
                        </div>

                        <div className="grid gap-6">
                          {totals.categories.map((category, index) => {
                            const Icon = category.icon;
                            return (
                              <Card key={index} className={`border-2 shadow-lg hover:shadow-xl transition-shadow ${
                                category.color === 'blue' ? 'border-blue-200 bg-blue-50/30' : 'border-green-200 bg-green-50/30'
                              }`}>
                                <CardContent className="p-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                        category.color === 'blue' ? 'bg-blue-600' : 'bg-green-600'
                                      }`}>
                                        <Icon className="w-6 h-6 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="text-xl font-bold text-gray-900 mb-1">
                                          {category.name}
                                        </h4>
                                        <p className="text-sm text-gray-600 max-w-md">
                                          {category.description}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className={`text-3xl font-bold ${
                                        category.color === 'blue' ? 'text-blue-700' : 'text-green-700'
                                      }`}>
                                        ${formatCurrency(category.total)}
                                      </p>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {/* Client Total */}
                        <Card className="bg-gradient-to-br from-gray-100 to-green-100 border-2 border-green-400 shadow-xl">
                          <CardContent className="p-8">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
                                  <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900">Total Project Investment</h3>
                                  <p className="text-sm text-gray-600 mt-1">Complete project cost including all materials and professional services</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-4xl font-bold text-green-700">
                                  ${formatCurrency(totals.categorizedTotal)}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <div className="text-center text-sm text-muted-foreground bg-gray-50 p-4 rounded-lg">
                          <p>This proposal includes all materials, labor, equipment, and professional services required to complete your project to the highest standards.</p>
                        </div>
                      </div>
                    )}

                    {/* INTERNAL VIEW - Detailed Breakdown with Line Items */}
                    {previewSettings.pricingMode === 'internal' && (
                      <>
                        {/* Materials Cards */}
                        {proposal.scopeOfWork.filter((item: any) => !item.isLabor).length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Package className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="text-lg font-bold" style={{ color: brandSettings.textColor }}>Materials</h4>
                              <Badge className="bg-blue-100 text-blue-800 text-xs">
                                {proposal.scopeOfWork.filter((item: any) => !item.isLabor).length} items
                              </Badge>
                            </div>
                            
                            <div className="grid gap-4">
                              {proposal.scopeOfWork.filter((item: any) => !item.isLabor).map((item: any, index: number) => (
                                <Card key={index} className="border border-blue-200 bg-blue-50/50 shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 mb-2">{item.description}</h5>
                                        {previewSettings.showLineItemDetails && (
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-600 font-medium">Quantity:</span>
                                              <p className="font-bold text-gray-900">{item.quantity} {item.unit}</p>
                                            </div>
                                            <div>
                                              <span className="text-gray-600 font-medium">Unit Cost:</span>
                                              <p className="font-bold text-gray-900">${formatCurrency(item.materialCost || 0)}</p>
                                            </div>
                                            <div className="md:col-span-2">
                                              <span className="text-gray-600 font-medium">Line Total:</span>
                                              <p className="text-lg font-bold text-blue-700">${formatCurrency(item.total)}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-300">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-blue-900">Materials Subtotal:</span>
                                <span className="text-xl font-bold text-blue-700">${formatCurrency(totals.materialsTotal)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Labor Cards */}
                        {proposal.scopeOfWork.filter((item: any) => item.isLabor).length > 0 && (
                          <div className="mb-8">
                            <div className="flex items-center gap-3 mb-6">
                              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                                <Wrench className="w-4 h-4 text-white" />
                              </div>
                              <h4 className="text-lg font-bold" style={{ color: brandSettings.textColor }}>Labor</h4>
                              <Badge className="bg-green-100 text-green-800 text-xs">
                                {proposal.scopeOfWork.filter((item: any) => item.isLabor).length} items
                              </Badge>
                            </div>
                            
                            <div className="grid gap-4">
                              {proposal.scopeOfWork.filter((item: any) => item.isLabor).map((item: any, index: number) => (
                                <Card key={index} className="border border-green-200 bg-green-50/50 shadow-sm hover:shadow-md transition-shadow">
                                  <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                      <div className="flex-1">
                                        <h5 className="font-bold text-gray-900 mb-2">{item.description}</h5>
                                        {previewSettings.showLineItemDetails && (
                                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                              <span className="text-gray-600 font-medium">Quantity:</span>
                                              <p className="font-bold text-gray-900">{item.quantity} {item.unit}</p>
                                            </div>
                                            <div>
                                              <span className="text-gray-600 font-medium">Rate:</span>
                                              <p className="font-bold text-gray-900">${formatCurrency(item.laborRate || 0)}/hr</p>
                                            </div>
                                            <div className="md:col-span-2">
                                              <span className="text-gray-600 font-medium">Line Total:</span>
                                              <p className="text-lg font-bold text-green-700">${formatCurrency(item.total)}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                            
                            <div className="mt-4 p-4 bg-green-100 rounded-lg border border-green-300">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-green-900">Labor Subtotal:</span>
                                <span className="text-xl font-bold text-green-700">${formatCurrency(totals.laborTotal)}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Internal Total with Markup */}
                        <Card className="bg-gradient-to-br from-gray-100 to-green-100 border-2 border-green-300 shadow-lg">
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Project Subtotal:</span>
                                <span className="font-bold">${formatCurrency(totals.subtotal)}</span>
                              </div>
                              <div className="flex justify-between items-center text-lg">
                                <span className="font-semibold">Overhead & Profit (30%):</span>
                                <span className="font-bold text-orange-600">${formatCurrency(totals.markup)}</span>
                              </div>
                              <Separator className="my-4" />
                              <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-md border-2 border-green-400">
                                <div className="flex items-center gap-3">
                                  <DollarSign className="w-8 h-8 text-green-600" />
                                  <span className="text-xl font-bold text-gray-900">TOTAL PROJECT COST:</span>
                                </div>
                                <span className="text-3xl font-bold" style={{ color: brandSettings.accentColor || '#10b981' }}>
                                  ${formatCurrency(totals.total)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Terms & Conditions */}
          {previewSettings.showTerms && (
            <Card className="border-2 shadow-lg" style={{ borderColor: brandSettings.primaryColor + '30' }}>
              <CardHeader className="bg-gradient-to-r from-gray-50 to-yellow-50 border-b">
                <CardTitle className="text-xl font-bold" style={{ color: brandSettings.primaryColor }}>
                  Terms & Conditions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold mb-2 text-green-700">Payment Schedule</h4>
                      <p className="text-sm text-gray-700 leading-relaxed bg-green-50 p-3 rounded border">
                        {proposal?.paymentSchedule || brandSettings.defaultPaymentTerms || "10% deposit upon contract signing, 50% upon material delivery and project start, 40% upon final completion and approval."}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-bold mb-2 text-blue-700">Timeline</h4>
                      <p className="text-sm text-gray-700 leading-relaxed bg-blue-50 p-3 rounded border">
                        {proposal?.timeline || brandSettings.defaultTimeline || "Project duration will be determined based on scope of work, weather permitting."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-bold mb-2 text-purple-700">Warranty</h4>
                      <p className="text-sm text-gray-700 leading-relaxed bg-purple-50 p-3 rounded border">
                        {proposal?.warranty || brandSettings.defaultWarranty || "We provide a 3-year warranty on retaining wall construction and 1-year warranty on concrete work. All materials carry manufacturer warranties."}
                      </p>
                    </div>

                    {brandSettings.customTerms && (
                      <div>
                        <h4 className="font-bold mb-2 text-orange-700">Additional Terms</h4>
                        <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap bg-orange-50 p-3 rounded border">
                          {brandSettings.customTerms}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Signature Section */}
          {previewSettings.showSignatures && (
            <Card className="border-2 shadow-lg" style={{ borderColor: brandSettings.primaryColor + '30' }}>
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-6 text-center" style={{ color: brandSettings.textColor }}>
                  Agreement Signatures
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="text-center">
                    <div className="border-b-2 border-gray-400 mb-3 pb-12"></div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800">Client Signature</p>
                      <p className="text-sm text-gray-600">Date: _______________</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="border-b-2 border-gray-400 mb-3 pb-12"></div>
                    <div className="space-y-1">
                      <p className="font-bold text-gray-800">Contractor Signature</p>
                      <p className="text-sm text-gray-600">Date: _______________</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}