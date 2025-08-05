import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Percent, Calculator, TrendingUp, DollarSign, ArrowRight, X, Trash2, AlertTriangle, CheckSquare, Square, Filter, RotateCcw, Layers } from 'lucide-react';
import { LineItemScopeView } from './LineItemScopeView';
import { toast } from 'sonner@2.0.3';

interface ScopeItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  isLabor: boolean;
  laborRate?: number;
  materialCost?: number;
  total: number;
}

interface BulkPricingAdjustmentProps {
  scopeOfWork: ScopeItem[];
  onScopeUpdate: (updatedScope: ScopeItem[]) => void;
  trigger?: React.ReactNode;
}

export function BulkPricingAdjustment({ scopeOfWork, onScopeUpdate, trigger }: BulkPricingAdjustmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'pricing' | 'manage' | 'lineitem'>('lineitem');
  const [percentageIncrease, setPercentageIncrease] = useState<string>('');
  const [targetTotal, setTargetTotal] = useState<string>('');
  const [adjustmentMode, setAdjustmentMode] = useState<'percentage' | 'target'>('percentage');
  const [adjustmentType, setAdjustmentType] = useState<'all' | 'labor' | 'materials'>('all');
  const [previewItems, setPreviewItems] = useState<ScopeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [itemsToRemove, setItemsToRemove] = useState<Set<string>>(new Set());
  const [showRemovalConfirm, setShowRemovalConfirm] = useState(false);

  // Utility function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate current total
  const currentTotal = scopeOfWork.reduce((sum, item) => sum + item.total, 0);
  
  // Calculate total if items were removed
  const totalAfterRemoval = scopeOfWork
    .filter(item => !itemsToRemove.has(item.id))
    .reduce((sum, item) => sum + item.total, 0);
  
  // Calculate impact of removal
  const removalImpact = currentTotal - totalAfterRemoval;

  // Calculate percentage needed to reach target total
  const calculateRequiredPercentage = (target: number) => {
    if (currentTotal === 0) return 0;
    return ((target - currentTotal) / currentTotal) * 100;
  };

  // Apply percentage increase to items based on type and selection
  const applyPercentageIncrease = (percentage: number) => {
    if (percentage === 0 || scopeOfWork.length === 0) {
      setPreviewItems(scopeOfWork);
      return;
    }

    const multiplier = 1 + (percentage / 100);
    const updatedItems = scopeOfWork.map(item => {
      const newItem = { ...item };
      
      // Check if this item should be adjusted based on selection and type filters
      const isSelected = selectedItems.size === 0 || selectedItems.has(item.id);
      const typeMatches = adjustmentType === 'all' || 
                         (adjustmentType === 'labor' && item.isLabor) ||
                         (adjustmentType === 'materials' && !item.isLabor);
      
      if (isSelected && typeMatches) {
        if (newItem.isLabor && newItem.laborRate) {
          newItem.laborRate = newItem.laborRate * multiplier;
          newItem.total = newItem.quantity * newItem.laborRate;
        } else if (!newItem.isLabor && newItem.materialCost !== undefined) {
          newItem.materialCost = newItem.materialCost * multiplier;
          newItem.total = newItem.quantity * newItem.materialCost;
        }
      }
      
      return newItem;
    });

    setPreviewItems(updatedItems);
  };

  // Handle percentage input change
  const handlePercentageChange = (value: string) => {
    setPercentageIncrease(value);
    const percentage = parseFloat(value) || 0;
    applyPercentageIncrease(percentage);
  };

  // Handle target total input change
  const handleTargetTotalChange = (value: string) => {
    setTargetTotal(value);
    const target = parseFloat(value) || 0;
    const requiredPercentage = calculateRequiredPercentage(target);
    setPercentageIncrease(requiredPercentage.toFixed(2));
    applyPercentageIncrease(requiredPercentage);
  };

  // Apply pricing changes to actual scope of work
  const applyPricingChanges = () => {
    if (previewItems.length > 0) {
      onScopeUpdate(previewItems);
      const itemCount = selectedItems.size === 0 ? scopeOfWork.length : selectedItems.size;
      const typeText = adjustmentType === 'all' ? 'all' : adjustmentType;
      toast.success(`Applied ${percentageIncrease}% adjustment to ${itemCount} ${typeText} items`);
      setIsOpen(false);
      resetForm();
    }
  };

  // Remove selected items
  const removeSelectedItems = () => {
    const filteredItems = scopeOfWork.filter(item => !itemsToRemove.has(item.id));
    onScopeUpdate(filteredItems);
    toast.success(`Removed ${itemsToRemove.size} scope items from proposal`);
    setItemsToRemove(new Set());
    setShowRemovalConfirm(false);
    setIsOpen(false);
    resetForm();
  };

  // Reset form
  const resetForm = () => {
    setPercentageIncrease('');
    setTargetTotal('');
    setPreviewItems([]);
    setAdjustmentMode('percentage');
    setAdjustmentType('all');
    setSelectedItems(new Set());
    setItemsToRemove(new Set());
    setShowRemovalConfirm(false);
    setActiveTab('lineitem');
  };

  // Toggle item selection for pricing adjustments
  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  // Toggle item for removal
  const toggleItemRemoval = (itemId: string) => {
    const newRemovalSet = new Set(itemsToRemove);
    if (newRemovalSet.has(itemId)) {
      newRemovalSet.delete(itemId);
    } else {
      newRemovalSet.add(itemId);
    }
    setItemsToRemove(newRemovalSet);
  };

  // Select all items for pricing
  const selectAllForPricing = () => {
    if (selectedItems.size === scopeOfWork.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(scopeOfWork.map(item => item.id)));
    }
  };

  // Select all items for removal
  const selectAllForRemoval = () => {
    if (itemsToRemove.size === scopeOfWork.length) {
      setItemsToRemove(new Set());
    } else {
      setItemsToRemove(new Set(scopeOfWork.map(item => item.id)));
    }
  };

  // Initialize preview when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPreviewItems(scopeOfWork);
    }
  }, [isOpen, scopeOfWork]);

  // Update preview when adjustment settings change
  useEffect(() => {
    if (percentageIncrease && isOpen) {
      const percentage = parseFloat(percentageIncrease) || 0;
      applyPercentageIncrease(percentage);
    }
  }, [adjustmentType, selectedItems]);

  const previewTotal = previewItems.reduce((sum, item) => sum + item.total, 0);
  const totalDifference = previewTotal - currentTotal;
  const percentageDifference = currentTotal > 0 ? (totalDifference / currentTotal) * 100 : 0;

  return (
    <>
      {/* Main Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <div>
            {trigger || (
              <Button variant="outline" size="sm">
                <Calculator className="w-4 h-4 mr-2" />
                Scope Management
              </Button>
            )}
          </div>
        </DialogTrigger>
        
        {/* Override the default DialogContent constraints completely */}
        <DialogContent className="!max-w-[95vw] !w-[95vw] !h-[90vh] !max-h-[90vh] p-0 gap-0">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-3 text-left">
              <Calculator className="w-6 h-6" />
              Scope Management
            </DialogTitle>
            <DialogDescription className="text-left">
              View scope by categories, adjust pricing, or remove items from the proposal.
            </DialogDescription>
          </DialogHeader>

          {/* Main Content Container */}
          <div className="flex-1 min-h-0 flex flex-col">
            <Tabs 
              value={activeTab} 
              onValueChange={(value) => setActiveTab(value as 'pricing' | 'manage' | 'lineitem')} 
              className="flex-1 min-h-0 flex flex-col"
            >
              {/* Tab Navigation */}
              <div className="px-6 py-3 border-b shrink-0">
                <TabsList className="grid w-full max-w-md grid-cols-3">
                  <TabsTrigger value="lineitem" className="flex items-center gap-2 text-sm">
                    <Layers className="w-4 h-4" />
                    Line Items
                  </TabsTrigger>
                  <TabsTrigger value="pricing" className="flex items-center gap-2 text-sm">
                    <Percent className="w-4 h-4" />
                    Bulk Pricing
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="flex items-center gap-2 text-sm">
                    <Trash2 className="w-4 h-4" />
                    Remove Items
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content Container */}
              <div className="flex-1 min-h-0">
                {/* Line Item Tab */}
                <TabsContent value="lineitem" className="h-full m-0 data-[state=active]:flex data-[state=active]:flex-col">
                  <div className="flex-1 min-h-0 p-6 overflow-y-auto">
                    <LineItemScopeView 
                      scopeOfWork={scopeOfWork}
                      onScopeUpdate={onScopeUpdate}
                    />
                  </div>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="h-full m-0 data-[state=active]:flex">
                  <div className="flex-1 min-h-0 flex">
                    {/* Left Panel - Controls */}
                    <div className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
                      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-4">Pricing Controls</h3>
                        
                        {/* Type Filter */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium mb-2 block">Apply To</Label>
                          <div className="grid grid-cols-3 gap-1">
                            <Button
                              variant={adjustmentType === 'all' ? 'default' : 'outline'}
                              onClick={() => setAdjustmentType('all')}
                              size="sm"
                              className="text-xs h-8"
                            >
                              All
                            </Button>
                            <Button
                              variant={adjustmentType === 'labor' ? 'default' : 'outline'}
                              onClick={() => setAdjustmentType('labor')}
                              size="sm"
                              className="text-xs h-8"
                            >
                              Labor
                            </Button>
                            <Button
                              variant={adjustmentType === 'materials' ? 'default' : 'outline'}
                              onClick={() => setAdjustmentType('materials')}
                              size="sm"
                              className="text-xs h-8"
                            >
                              Materials
                            </Button>
                          </div>
                        </div>
                        
                        {/* Mode Selection */}
                        <div className="mb-4">
                          <Label className="text-sm font-medium mb-2 block">Method</Label>
                          <div className="grid grid-cols-2 gap-1">
                            <Button
                              variant={adjustmentMode === 'percentage' ? 'default' : 'outline'}
                              onClick={() => setAdjustmentMode('percentage')}
                              size="sm"
                              className="text-xs h-8"
                            >
                              <Percent className="w-3 h-3 mr-1" />
                              %
                            </Button>
                            <Button
                              variant={adjustmentMode === 'target' ? 'default' : 'outline'}
                              onClick={() => setAdjustmentMode('target')}
                              size="sm"
                              className="text-xs h-8"
                            >
                              <DollarSign className="w-3 h-3 mr-1" />
                              Target
                            </Button>
                          </div>
                        </div>

                        {/* Input Section */}
                        <div className="mb-4">
                          {adjustmentMode === 'percentage' ? (
                            <div>
                              <Label htmlFor="percentage" className="text-sm font-medium mb-2 block">
                                Percentage (%)
                              </Label>
                              <Input
                                id="percentage"
                                type="number"
                                value={percentageIncrease}
                                onChange={(e) => handlePercentageChange(e.target.value)}
                                placeholder="e.g., 10"
                                step="0.1"
                                className="text-sm h-9"
                              />
                            </div>
                          ) : (
                            <div>
                              <Label htmlFor="targetTotal" className="text-sm font-medium mb-2 block">
                                Target Total ($)
                              </Label>
                              <Input
                                id="targetTotal"
                                type="number"
                                value={targetTotal}
                                onChange={(e) => handleTargetTotalChange(e.target.value)}
                                placeholder="Enter target"
                                step="0.01"
                                className="text-sm h-9"
                              />
                            </div>
                          )}
                        </div>

                        <Separator className="mb-4" />

                        {/* Selection */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Selection</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={selectAllForPricing}
                              className="h-6 text-xs"
                            >
                              {selectedItems.size === scopeOfWork.length ? 'Clear' : 'All'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedItems.size === 0 ? 'All items' : `${selectedItems.size} selected`}
                          </p>
                        </div>

                        {/* Summary */}
                        <div className="bg-white p-3 rounded border">
                          <h4 className="text-sm font-semibold mb-3">Summary</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Current:</span>
                              <span className="font-medium">${formatCurrency(currentTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>New:</span>
                              <span className={`font-medium ${totalDifference > 0 ? 'text-green-600' : totalDifference < 0 ? 'text-red-600' : ''}`}>
                                ${formatCurrency(previewTotal)}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span>Difference:</span>
                              <div className="text-right">
                                <div className={`font-semibold ${totalDifference > 0 ? 'text-green-600' : totalDifference < 0 ? 'text-red-600' : ''}`}>
                                  {totalDifference >= 0 ? '+' : ''}${formatCurrency(totalDifference)}
                                </div>
                                {percentageDifference !== 0 && (
                                  <div className={`text-xs ${totalDifference > 0 ? 'text-green-600' : totalDifference < 0 ? 'text-red-600' : ''}`}>
                                    ({percentageDifference > 0 ? '+' : ''}{percentageDifference.toFixed(1)}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 border-t bg-white shrink-0">
                        <div className="space-y-2">
                          <Button 
                            onClick={applyPricingChanges} 
                            disabled={previewItems.length === 0 || totalDifference === 0} 
                            className="w-full h-9"
                            size="sm"
                          >
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Apply Changes
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={resetForm} 
                            className="w-full h-9"
                            size="sm"
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Preview */}
                    <div className="flex-1 min-h-0 flex flex-col bg-white">
                      <div className="p-4 border-b shrink-0">
                        <h3 className="font-semibold">Preview Changes</h3>
                        <p className="text-sm text-muted-foreground">
                          Click items to select/deselect for pricing adjustments
                        </p>
                      </div>
                      
                      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
                        {scopeOfWork.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            <div>
                              <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p>No items to preview</p>
                              <p className="text-sm">Add scope items to see adjustments</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {previewItems.map((item, index) => {
                              const originalItem = scopeOfWork[index];
                              const priceDiff = item.total - originalItem.total;
                              const priceChange = originalItem.total > 0 ? (priceDiff / originalItem.total) * 100 : 0;
                              const isSelected = selectedItems.size === 0 || selectedItems.has(item.id);
                              const typeMatches = adjustmentType === 'all' || 
                                                 (adjustmentType === 'labor' && item.isLabor) ||
                                                 (adjustmentType === 'materials' && !item.isLabor);
                              const willBeAdjusted = isSelected && typeMatches;

                              return (
                                <Card 
                                  key={item.id} 
                                  className={`cursor-pointer transition-all ${
                                    selectedItems.has(item.id) 
                                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => toggleItemSelection(item.id)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Checkbox 
                                          checked={selectedItems.has(item.id)}
                                          className="pointer-events-none"
                                        />
                                        <Badge 
                                          variant={item.isLabor ? "secondary" : "default"} 
                                          className="text-xs shrink-0"
                                        >
                                          {item.isLabor ? "Labor" : "Material"}
                                        </Badge>
                                        <span className="text-sm font-medium truncate">
                                          {item.description || 'Untitled Item'}
                                        </span>
                                      </div>
                                      {willBeAdjusted && priceDiff !== 0 && (
                                        <Badge 
                                          variant="outline"
                                          className={`text-xs shrink-0 ${
                                            priceDiff > 0 ? 'text-green-700 border-green-300' : 'text-red-700 border-red-300'
                                          }`}
                                        >
                                          {priceDiff > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-3 text-sm">
                                      <div>
                                        <span className="text-muted-foreground block text-xs">Qty</span>
                                        <span className="font-medium">{item.quantity} {item.unit}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground block text-xs">Rate</span>
                                        <span className="font-medium">${formatCurrency(item.isLabor ? (item.laborRate || 0) : (item.materialCost || 0))}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-muted-foreground block text-xs">Total</span>
                                        <span className="font-semibold">${formatCurrency(item.total)}</span>
                                        {willBeAdjusted && priceDiff !== 0 && (
                                          <div className={`text-xs ${priceDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {priceDiff > 0 ? '+' : ''}${formatCurrency(priceDiff)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Management Tab */}
                <TabsContent value="manage" className="h-full m-0 data-[state=active]:flex">
                  <div className="flex-1 min-h-0 flex">
                    {/* Left Panel - Controls */}
                    <div className="w-80 bg-slate-50 border-r flex flex-col shrink-0">
                      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-4">Remove Items</h3>
                        
                        {/* Selection Controls */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">Items to Remove</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={selectAllForRemoval}
                              className="h-6 text-xs"
                            >
                              {itemsToRemove.size === scopeOfWork.length ? 'Clear' : 'All'}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {itemsToRemove.size === 0 ? 'No items selected' : `${itemsToRemove.size} items selected`}
                          </p>
                        </div>

                        <Separator className="mb-4" />

                        {/* Impact Summary */}
                        <div className="bg-white p-3 rounded border">
                          <h4 className="text-sm font-semibold mb-3">Removal Impact</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span>Current:</span>
                              <span className="font-medium">${formatCurrency(currentTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>After Removal:</span>
                              <span className="font-medium">${formatCurrency(totalAfterRemoval)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between">
                              <span>Reduction:</span>
                              <div className="text-right">
                                <div className="font-semibold text-red-600">
                                  -${formatCurrency(removalImpact)}
                                </div>
                                {currentTotal > 0 && (
                                  <div className="text-xs text-red-600">
                                    (-{((removalImpact / currentTotal) * 100).toFixed(1)}%)
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {itemsToRemove.size > 0 && (
                          <div className="mt-4 bg-orange-50 border border-orange-200 rounded p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">Warning</span>
                            </div>
                            <p className="text-sm text-orange-700">
                              This will permanently remove {itemsToRemove.size} item{itemsToRemove.size === 1 ? '' : 's'}.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="p-4 border-t bg-white shrink-0">
                        <div className="space-y-2">
                          <Button 
                            onClick={() => setShowRemovalConfirm(true)}
                            disabled={itemsToRemove.size === 0} 
                            variant="destructive"
                            className="w-full h-9"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Remove {itemsToRemove.size} Item{itemsToRemove.size === 1 ? '' : 's'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setItemsToRemove(new Set())} 
                            disabled={itemsToRemove.size === 0}
                            className="w-full h-9"
                            size="sm"
                          >
                            Clear Selection
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Right Panel - Item List */}
                    <div className="flex-1 min-h-0 flex flex-col bg-white">
                      <div className="p-4 border-b shrink-0">
                        <h3 className="font-semibold">Select Items</h3>
                        <p className="text-sm text-muted-foreground">
                          Click items to mark them for removal
                        </p>
                      </div>
                      
                      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
                        {scopeOfWork.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                            <div>
                              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                              <p>No items to manage</p>
                              <p className="text-sm">Add scope items first</p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {scopeOfWork.map((item) => {
                              const isMarkedForRemoval = itemsToRemove.has(item.id);

                              return (
                                <Card 
                                  key={item.id} 
                                  className={`cursor-pointer transition-all ${
                                    isMarkedForRemoval 
                                      ? 'ring-2 ring-red-500 bg-red-50' 
                                      : 'hover:bg-gray-50'
                                  }`}
                                  onClick={() => toggleItemRemoval(item.id)}
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <Checkbox 
                                          checked={isMarkedForRemoval}
                                          className="pointer-events-none"
                                        />
                                        <Badge 
                                          variant={item.isLabor ? "secondary" : "default"} 
                                          className="text-xs shrink-0"
                                        >
                                          {item.isLabor ? "Labor" : "Material"}
                                        </Badge>
                                        <span className="text-sm font-medium truncate">
                                          {item.description || 'Untitled Item'}
                                        </span>
                                      </div>
                                      {isMarkedForRemoval && (
                                        <Badge variant="destructive" className="text-xs shrink-0">
                                          Will be removed
                                        </Badge>
                                      )}
                                    </div>
                                    
                                    <div className="grid grid-cols-4 gap-3 text-sm">
                                      <div>
                                        <span className="text-muted-foreground block text-xs">Qty</span>
                                        <span className="font-medium">{item.quantity} {item.unit}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground block text-xs">Rate</span>
                                        <span className="font-medium">${formatCurrency(item.isLabor ? (item.laborRate || 0) : (item.materialCost || 0))}</span>
                                      </div>
                                      <div>
                                        <span className="text-muted-foreground block text-xs">Total</span>
                                        <span className="font-semibold">${formatCurrency(item.total)}</span>
                                      </div>
                                      <div className="text-right">
                                        <Button
                                          variant={isMarkedForRemoval ? "destructive" : "outline"}
                                          size="sm"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleItemRemoval(item.id);
                                          }}
                                          className="h-7 w-7 p-0"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Removal Confirmation Dialog */}
      {showRemovalConfirm && (
        <Dialog open={showRemovalConfirm} onOpenChange={setShowRemovalConfirm}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                </div>
                Confirm Removal
              </DialogTitle>
              <DialogDescription>
                This action will permanently remove the selected items from your proposal.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to remove {itemsToRemove.size} item{itemsToRemove.size === 1 ? '' : 's'} from the proposal? 
                This will reduce the total cost by <span className="font-semibold text-red-600">${formatCurrency(removalImpact)}</span> and cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setShowRemovalConfirm(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={removeSelectedItems}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Items
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}