import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Plus, Trash2, MoreVertical, Eye, EyeOff } from 'lucide-react';
import { VoiceInput } from './VoiceInput';

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

interface LaborRate {
  id: string;
  name: string;
  rate: number;
  unit: string;
}

interface CombinedScopeViewProps {
  scopeOfWork: ScopeItem[];
  laborRates: LaborRate[];
  units: string[];
  onUpdateScopeItem: (id: string, updates: Partial<ScopeItem>) => void;
  onRemoveScopeItem: (id: string) => void;
  onAddScopeItem: (isLabor: boolean) => void;
  showPricing?: boolean;
  onTogglePricing?: () => void;
}

export function CombinedScopeView({
  scopeOfWork,
  laborRates,
  units,
  onUpdateScopeItem,
  onRemoveScopeItem,
  onAddScopeItem,
  showPricing = true,
  onTogglePricing
}: CombinedScopeViewProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Utility function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  // Group items for better organization
  const groupedItems = {
    materials: scopeOfWork.filter(item => !item.isLabor),
    labor: scopeOfWork.filter(item => item.isLabor)
  };

  const calculateCategoryTotal = (items: ScopeItem[]) => {
    return items.reduce((sum, item) => sum + item.total, 0);
  };

  const renderItemRow = (item: ScopeItem) => {
    const isExpanded = expandedItems.has(item.id);

    return (
      <div key={item.id} className="border rounded-lg overflow-hidden">
        {/* Compact Row */}
        <div className="p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <Badge variant={item.isLabor ? "secondary" : "default"} className="shrink-0">
                {item.isLabor ? "Labor" : "Material"}
              </Badge>
              
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.description || 'Untitled Item'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.quantity} {item.unit} × ${formatCurrency(item.isLabor ? (item.laborRate || 0) : (item.materialCost || 0))}
                  {showPricing && (
                    <span className="ml-2 font-medium">
                      = ${formatCurrency(item.total)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {showPricing && (
                <div className="text-right">
                  <div className="font-semibold">
                    ${formatCurrency(item.total)}
                  </div>
                </div>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleItemExpansion(item.id)}
                className="shrink-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t bg-gray-50/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs">Description</Label>
                  <VoiceInput
                    onTranscript={(text) => onUpdateScopeItem(item.id, { description: text })}
                    className="shrink-0"
                  />
                </div>
                <Input
                  value={item.description}
                  onChange={(e) => onUpdateScopeItem(item.id, { description: e.target.value })}
                  placeholder="Enter description"
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateScopeItem(item.id, { quantity: Number(e.target.value) })}
                  min="0"
                  step="0.01"
                  className="text-sm"
                />
              </div>
              
              <div>
                <Label className="text-xs">Unit</Label>
                <Select value={item.unit} onValueChange={(value) => onUpdateScopeItem(item.id, { unit: value })}>
                  <SelectTrigger className="text-sm">
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
                <Label className="text-xs">{item.isLabor ? "Labor Rate" : "Material Price"}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs">$</span>
                  <Input
                    type="number"
                    value={item.isLabor ? item.laborRate || 0 : item.materialCost || 0}
                    onChange={(e) => onUpdateScopeItem(item.id, 
                      item.isLabor 
                        ? { laborRate: Number(e.target.value) }
                        : { materialCost: Number(e.target.value) }
                    )}
                    min="0"
                    step="0.01"
                    className="pl-7 text-sm"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                {item.isLabor && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="text-xs">
                        Quick Rates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {laborRates.map((rate) => (
                        <DropdownMenuItem
                          key={rate.id}
                          onClick={() => onUpdateScopeItem(item.id, { laborRate: rate.rate })}
                          className="text-sm"
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
                  onClick={() => onRemoveScopeItem(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
            Combined Scope of Work
          </div>
          <div className="flex items-center gap-2">
            {onTogglePricing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onTogglePricing}
                title={showPricing ? "Hide pricing" : "Show pricing"}
                className="text-xs"
              >
                {showPricing ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span className="ml-1">{showPricing ? "Hide" : "Show"} Pricing</span>
              </Button>
            )}
            <Button onClick={() => onAddScopeItem(false)} size="sm" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Material
            </Button>
            <Button onClick={() => onAddScopeItem(true)} size="sm" variant="outline" className="text-xs">
              <Plus className="w-3 h-3 mr-1" />
              Labor
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Materials Section */}
          {groupedItems.materials.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  Materials ({groupedItems.materials.length} items)
                </h4>
                {showPricing && (
                  <div className="text-sm font-medium text-blue-600">
                    ${formatCurrency(calculateCategoryTotal(groupedItems.materials))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {groupedItems.materials.map(renderItemRow)}
              </div>
            </div>
          )}

          {/* Labor Section */}
          {groupedItems.labor.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  Labor ({groupedItems.labor.length} items)
                </h4>
                {showPricing && (
                  <div className="text-sm font-medium text-green-600">
                    ${formatCurrency(calculateCategoryTotal(groupedItems.labor))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                {groupedItems.labor.map(renderItemRow)}
              </div>
            </div>
          )}

          {/* Empty State */}
          {scopeOfWork.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <div className="mb-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p>No scope items added yet</p>
                <p className="text-sm">Click "Add Material" or "Add Labor" to get started</p>
              </div>
            </div>
          )}

          {/* Total Summary */}
          {scopeOfWork.length > 0 && showPricing && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Scope of Work:</span>
                <span className="text-lg font-bold text-indigo-600">
                  ${formatCurrency(scopeOfWork.reduce((sum, item) => sum + item.total, 0))}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}