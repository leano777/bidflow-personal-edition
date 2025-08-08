import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ProgressBilling } from './ProgressBilling';
import { PhotoIntegration } from './PhotoIntegration';
import { ClientPortal } from './ClientPortal';
import { MaterialDatabase } from './MaterialDatabase';
import { PaymentCollection } from './PaymentCollection';
import { 
  Plus, 
  Trash2, 
  Calculator, 
  Settings, 
  Eye, 
  EyeOff,
  Wrench,
  Package,
  DollarSign,
  Clock,
  Edit3,
  Check,
  X,
  Loader2,
  CreditCard,
  Camera,
  Shield,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ProposalEditorProps {
  proposal: any;
  onProposalUpdate: (proposal: any) => void;
  mode: 'create' | 'edit' | 'version';
  baseProposal?: any;
}

export function ProposalEditor({ proposal, onProposalUpdate, mode, baseProposal }: ProposalEditorProps) {
  const [editingProposal, setEditingProposal] = useState(proposal);
  const [showSettings, setShowSettings] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  // Update local state when proposal prop changes
  useEffect(() => {
    if (proposal) {
      setEditingProposal(proposal);
    }
  }, [proposal]);

  // Show loading if no proposal
  if (!proposal || !editingProposal) {
    return (
      <div className="space-y-8">
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading proposal editor...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle field updates with useCallback to prevent re-renders
  const updateField = useCallback((field: string, value: any) => {
    if (!editingProposal) return;
    
    const updated = { ...editingProposal, [field]: value };
    setEditingProposal(updated);
    onProposalUpdate(updated);
  }, [editingProposal, onProposalUpdate]);

  // Handle scope item updates
  const updateScopeItem = (id: string, updates: any) => {
    if (!editingProposal || !Array.isArray(editingProposal.scopeOfWork)) return;
    
    const updatedScope = editingProposal.scopeOfWork.map((item: any) => {
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
    });
    
    updateField('scopeOfWork', updatedScope);
  };

  // Add scope item
  const addScopeItem = (isLabor: boolean) => {
    if (!editingProposal) return;
    
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: '',
      quantity: 1,
      unit: 'unit',
      isLabor,
      laborRate: isLabor ? 75 : undefined,
      materialCost: !isLabor ? 0 : undefined,
      total: 0
    };
    
    const currentScope = Array.isArray(editingProposal.scopeOfWork) ? editingProposal.scopeOfWork : [];
    const updatedScope = [...currentScope, newItem];
    updateField('scopeOfWork', updatedScope);
    setEditingItem(newItem.id);
  };

  // Remove scope item
  const removeScopeItem = (id: string) => {
    if (!editingProposal || !Array.isArray(editingProposal.scopeOfWork)) return;
    
    const updatedScope = editingProposal.scopeOfWork.filter((item: any) => item.id !== id);
    updateField('scopeOfWork', updatedScope);
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!editingProposal || !Array.isArray(editingProposal.scopeOfWork)) {
      return { materialsTotal: 0, laborTotal: 0, subtotal: 0, markup: 0, total: 0 };
    }
    
    const scopeOfWork = editingProposal.scopeOfWork;
    const materials = scopeOfWork.filter((item: any) => !item.isLabor);
    const labor = scopeOfWork.filter((item: any) => item.isLabor);
    
    const materialsTotal = materials.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const laborTotal = labor.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    const subtotal = materialsTotal + laborTotal;
    const markup = subtotal * 0.30;
    const total = subtotal + markup;
    
    return { materialsTotal, laborTotal, subtotal, markup, total };
  };

  const totals = calculateTotals();
  const units = ['unit', 'units', 'hours', 'sq ft', 'linear ft', 'cubic yards', 'CY', 'blocks', 'lump sum', 'ton', 'tons', 'each', 'lot', 'gallon', 'gallons'];

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) {
      return '0.00';
    }
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Save item edit
  const saveItemEdit = () => {
    setEditingItem(null);
    toast.success('Item updated successfully');
  };

  // Cancel item edit
  const cancelItemEdit = () => {
    setEditingItem(null);
  };

  // Get scope of work array safely
  const scopeOfWork = Array.isArray(editingProposal.scopeOfWork) ? editingProposal.scopeOfWork : [];

  // Handle material selection from database with useCallback
  const handleMaterialSelect = useCallback((material: any) => {
    const newItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      description: material.name,
      quantity: 1,
      unit: material.unit,
      isLabor: false,
      materialCost: material.price,
      total: material.price,
      tags: material.tags || [],
      supplier: material.supplier,
      wasteFactor: material.wasteFactor || 0.10
    };
    
    const currentScope = Array.isArray(editingProposal?.scopeOfWork) ? editingProposal.scopeOfWork : [];
    const updatedScope = [...currentScope, newItem];
    updateField('scopeOfWork', updatedScope);
    setEditingItem(newItem.id);
  }, [editingProposal?.scopeOfWork, updateField, setEditingItem]);

  return (
    <Tabs defaultValue="details" className="space-y-6">
      <div className="glass-panel p-2 rounded-xl">
        <TabsList className="grid w-full grid-cols-6 bg-transparent gap-2">
          <TabsTrigger 
            value="details" 
            className="glass-subtle data-[state=active]:glass-card data-[state=active]:shadow-md transition-all duration-200 gap-2"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Details</span>
          </TabsTrigger>
          <TabsTrigger 
            value="materials"
            className="glass-subtle data-[state=active]:glass-card data-[state=active]:shadow-md transition-all duration-200 gap-2"
          >
            <Package className="w-4 h-4" />
            <span className="hidden sm:inline">Materials</span>
          </TabsTrigger>
          <TabsTrigger 
            value="billing"
            className="glass-subtle data-[state=active]:glass-card data-[state=active]:shadow-md transition-all duration-200 gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
          <TabsTrigger 
            value="photos"
            className="glass-subtle data-[state=active]:glass-card data-[state=active]:shadow-md transition-all duration-200 gap-2"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Photos</span>
          </TabsTrigger>
          <TabsTrigger 
            value="portal"
            className="glass-subtle data-[state=active]:glass-card data-[state=active]:shadow-md transition-all duration-200 gap-2"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Portal</span>
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="glass-subtle data-[state=active]:glass-card data-[state=active]:shadow-md transition-all duration-200 gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="details" className="space-y-8">
      {/* Header with Version Info */}
      {mode === 'version' && baseProposal && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-1">Creating New Version</h3>
                <p className="text-sm text-blue-700">
                  Based on <span className="font-medium">{baseProposal.projectTitle}</span> ({baseProposal.version || 'R.0'})
                </p>
              </div>
              <Badge className="bg-blue-600 text-white shadow-md px-3 py-1">
                {editingProposal.version}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Information */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              Project Information
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
              className="hover:bg-white/70"
            >
              {showSettings ? <EyeOff className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
              <span className="ml-2 hidden sm:inline">
                {showSettings ? 'Hide Details' : 'More Details'}
              </span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="projectTitle" className="text-sm font-semibold text-gray-700">
                Project Title *
              </Label>
              <Input
                id="projectTitle"
                value={editingProposal.projectTitle || ''}
                onChange={(e) => updateField('projectTitle', e.target.value)}
                placeholder="Enter project title"
                className="text-base font-medium border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-sm font-semibold text-gray-700">
                Client Name *
              </Label>
              <Input
                id="clientName"
                value={editingProposal.clientName || ''}
                onChange={(e) => updateField('clientName', e.target.value)}
                placeholder="Enter client name"
                className="text-base font-medium border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDescription" className="text-sm font-semibold text-gray-700">
              Project Description
            </Label>
            <Textarea
              id="projectDescription"
              value={editingProposal.projectDescription || ''}
              onChange={(e) => updateField('projectDescription', e.target.value)}
              placeholder="Describe the project scope and requirements"
              rows={3}
              className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          {showSettings && (
            <div className="pt-4 border-t border-gray-200 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientAddress" className="text-sm font-semibold text-gray-600">
                    Client Address
                  </Label>
                  <Input
                    id="clientAddress"
                    value={editingProposal.clientAddress || ''}
                    onChange={(e) => updateField('clientAddress', e.target.value)}
                    placeholder="Client address"
                    className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectAddress" className="text-sm font-semibold text-gray-600">
                    Project Address
                  </Label>
                  <Input
                    id="projectAddress"
                    value={editingProposal.projectAddress || ''}
                    onChange={(e) => updateField('projectAddress', e.target.value)}
                    placeholder="Project address"
                    className="text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scope of Work */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-5 h-5 text-white" />
              </div>
              Scope of Work & Pricing
            </CardTitle>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => addScopeItem(false)} 
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 font-medium"
              >
                <Package className="w-4 h-4 mr-1" />
                Add Material
              </Button>
              <Button 
                size="sm" 
                onClick={() => addScopeItem(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-md"
              >
                <Wrench className="w-4 h-4 mr-1" />
                Add Labor
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {scopeOfWork.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calculator className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No scope items yet</h3>
              <p className="text-gray-600 mb-6">Add materials or labor items to get started with your proposal.</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => addScopeItem(false)} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                  <Package className="w-4 h-4 mr-2" />
                  Add Material
                </Button>
                <Button onClick={() => addScopeItem(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Wrench className="w-4 h-4 mr-2" />
                  Add Labor
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Materials Section */}
              {scopeOfWork.some((item: any) => !item.isLabor) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Materials</h3>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {scopeOfWork.filter((item: any) => !item.isLabor).length} items
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {scopeOfWork
                      .filter((item: any) => !item.isLabor)
                      .map((item: any) => (
                        <Card key={item.id} className="border border-blue-100 bg-blue-50/30 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            {editingItem === item.id ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-blue-900">Editing Material</h4>
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={saveItemEdit} className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700">
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelItemEdit} className="h-7 w-7 p-0 border-gray-300">
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Input
                                  value={item.description || ''}
                                  onChange={(e) => updateScopeItem(item.id, { description: e.target.value })}
                                  placeholder="Material description"
                                  className="text-sm font-medium"
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Quantity</Label>
                                    <Input
                                      type="number"
                                      value={item.quantity || 0}
                                      onChange={(e) => updateScopeItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                      min="0"
                                      step="0.01"
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Unit</Label>
                                    <Select value={item.unit || 'unit'} onValueChange={(value) => updateScopeItem(item.id, { unit: value })}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {units.map(unit => (
                                          <SelectItem key={unit} value={unit} className="text-sm">{unit}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Unit Cost</Label>
                                    <Input
                                      type="number"
                                      value={item.materialCost || 0}
                                      onChange={(e) => updateScopeItem(item.id, { materialCost: parseFloat(e.target.value) || 0 })}
                                      min="0"
                                      step="0.01"
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Total</Label>
                                    <div className="h-8 px-3 py-1 bg-gray-100 rounded-md border text-sm font-semibold text-green-700 flex items-center">
                                      ${formatCurrency(item.total || 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-900 text-sm">{item.description || 'Untitled Material'}</h4>
                                    <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                      Material
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                                    <div>
                                      <span className="font-medium">Qty:</span> {item.quantity || 0} {item.unit || 'unit'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Rate:</span> ${formatCurrency(item.materialCost || 0)}
                                    </div>
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-green-700">Total: ${formatCurrency(item.total || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingItem(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-blue-100"
                                  >
                                    <Edit3 className="w-3 h-3 text-blue-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeScopeItem(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-100"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* Labor Section */}
              {scopeOfWork.some((item: any) => item.isLabor) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-3 pt-6">
                    <Wrench className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Labor</h3>
                    <Badge variant="outline" className="ml-2 text-xs">
                      {scopeOfWork.filter((item: any) => item.isLabor).length} items
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {scopeOfWork
                      .filter((item: any) => item.isLabor)
                      .map((item: any) => (
                        <Card key={item.id} className="border border-green-100 bg-green-50/30 hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            {editingItem === item.id ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="font-medium text-green-900">Editing Labor</h4>
                                  <div className="flex gap-1">
                                    <Button size="sm" onClick={saveItemEdit} className="h-7 w-7 p-0 bg-green-600 hover:bg-green-700">
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelItemEdit} className="h-7 w-7 p-0 border-gray-300">
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <Input
                                  value={item.description || ''}
                                  onChange={(e) => updateScopeItem(item.id, { description: e.target.value })}
                                  placeholder="Labor description"
                                  className="text-sm font-medium"
                                />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Quantity</Label>
                                    <Input
                                      type="number"
                                      value={item.quantity || 0}
                                      onChange={(e) => updateScopeItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                                      min="0"
                                      step="0.01"
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Unit</Label>
                                    <Select value={item.unit || 'hours'} onValueChange={(value) => updateScopeItem(item.id, { unit: value })}>
                                      <SelectTrigger className="h-8 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {units.map(unit => (
                                          <SelectItem key={unit} value={unit} className="text-sm">{unit}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Hourly Rate</Label>
                                    <Input
                                      type="number"
                                      value={item.laborRate || 0}
                                      onChange={(e) => updateScopeItem(item.id, { laborRate: parseFloat(e.target.value) || 0 })}
                                      min="0"
                                      step="0.01"
                                      className="text-sm h-8"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs font-medium text-gray-600">Total</Label>
                                    <div className="h-8 px-3 py-1 bg-gray-100 rounded-md border text-sm font-semibold text-green-700 flex items-center">
                                      ${formatCurrency(item.total || 0)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className="font-semibold text-gray-900 text-sm">{item.description || 'Untitled Labor'}</h4>
                                    <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                      Labor
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                                    <div>
                                      <span className="font-medium">Qty:</span> {item.quantity || 0} {item.unit || 'hours'}
                                    </div>
                                    <div>
                                      <span className="font-medium">Rate:</span> ${formatCurrency(item.laborRate || 0)}/hr
                                    </div>
                                    <div className="md:col-span-2">
                                      <span className="font-medium text-green-700">Total: ${formatCurrency(item.total || 0)}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-1 ml-4">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setEditingItem(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-green-100"
                                  >
                                    <Edit3 className="w-3 h-3 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeScopeItem(item.id)}
                                    className="h-8 w-8 p-0 hover:bg-red-100"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Summary */}
      {scopeOfWork.length > 0 && (
        <Card className="shadow-xl border-0 bg-gradient-to-br from-green-50 to-blue-50">
          <CardHeader className="bg-gradient-to-r from-green-100 to-blue-100 border-b border-green-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              Cost Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${formatCurrency(totals.materialsTotal)}</div>
                <div className="text-sm text-gray-600 font-medium">Materials</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${formatCurrency(totals.laborTotal)}</div>
                <div className="text-sm text-gray-600 font-medium">Labor</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">${formatCurrency(totals.markup)}</div>
                <div className="text-sm text-gray-600 font-medium">Markup (30%)</div>
              </div>
              <div className="text-center border-l-2 border-gray-300 pl-6">
                <div className="text-3xl font-bold text-gray-900">${formatCurrency(totals.total)}</div>
                <div className="text-sm text-gray-600 font-medium">Total Project Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Additional Information */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-gray-50 border-b">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="timeline" className="text-sm font-semibold text-gray-700">
                Project Timeline
              </Label>
              <Input
                id="timeline"
                value={editingProposal.timeline || ''}
                onChange={(e) => updateField('timeline', e.target.value)}
                placeholder="e.g., 2-3 weeks"
                className="text-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentTerms" className="text-sm font-semibold text-gray-700">
                Payment Terms
              </Label>
              <Input
                id="paymentTerms"
                value={editingProposal.paymentTerms || ''}
                onChange={(e) => updateField('paymentTerms', e.target.value)}
                placeholder="e.g., 50% upfront, 50% on completion"
                className="text-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold text-gray-700">
              Notes & Terms
            </Label>
            <Textarea
              id="notes"
              value={editingProposal.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Additional notes, terms, and conditions"
              rows={4}
              className="text-sm border-gray-300 focus:border-purple-500 focus:ring-purple-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="materials">
        <MaterialDatabase onSelectMaterial={handleMaterialSelect} />
      </TabsContent>

      <TabsContent value="billing">
        <ProgressBilling
          proposal={editingProposal || {}}
          onUpdate={useCallback((billingData) => updateField('progressBilling', billingData), [updateField])}
          totalProjectCost={totals.total || 0}
        />
      </TabsContent>

      <TabsContent value="photos">
        <PhotoIntegration
          proposal={editingProposal || {}}
          onUpdate={useCallback((photoData) => updateField('photos', photoData.photos), [updateField])}
        />
      </TabsContent>

      <TabsContent value="portal">
        <ClientPortal
          proposal={editingProposal || {}}
          onUpdate={useCallback((portalData) => updateField('clientPortal', portalData), [updateField])}
        />
      </TabsContent>

      <TabsContent value="payments">
        <PaymentCollection
          proposal={editingProposal || {}}
          progressBilling={editingProposal?.progressBilling || {}}
          onUpdate={useCallback((paymentData) => updateField('paymentCollection', paymentData), [updateField])}
        />
      </TabsContent>
    </Tabs>
  );
}