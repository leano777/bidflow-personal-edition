import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  ChevronDown, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  Trash2, 
  Plus, 
  Edit3,
  AlertTriangle,
  DollarSign,
  Calculator,
  List,
  Layers,
  Link,
  Unlink,
  FolderTree,
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ScopeItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  isLabor: boolean;
  laborRate?: number;
  materialCost?: number;
  total: number;
  category?: string;
  isHidden?: boolean;
  scopeGroup?: string; // Simple grouping - e.g., "Retaining Wall", "Fire Pit", etc.
  isParentScope?: boolean; // Legacy property, to be phased out
}

interface ScopeCategory {
  name: string;
  items: ScopeItem[];
  scopeGroups: ScopeGroup[]; // Grouped items by scope
  isVisible: boolean;
  isExpanded: boolean;
  total: number;
}

interface ScopeGroup {
  name: string; // e.g., "Retaining Wall", "Fire Pit Installation"
  items: ScopeItem[];
  isExpanded: boolean;
  total: number;
}

interface LineItemScopeViewProps {
  scopeOfWork: ScopeItem[];
  onScopeUpdate: (updatedScope: ScopeItem[]) => void;
}

export function LineItemScopeView({ scopeOfWork, onScopeUpdate }: LineItemScopeViewProps) {
  const [categories, setCategories] = useState<Record<string, ScopeCategory>>({});
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'flat' | 'grouped'>('grouped');
  const [editingItemGroup, setEditingItemGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingItemDescription, setEditingItemDescription] = useState<string | null>(null);
  const [editingDescriptionValue, setEditingDescriptionValue] = useState('');
  const [showRecoveryMessage, setShowRecoveryMessage] = useState(false);

  // Utility function to format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Auto-categorize scope items based on description keywords
  const autoCategorizeItem = (description: string): string => {
    const desc = description.toLowerCase();
    
    // Define category mappings with keywords
    const categoryMappings = [
      {
        category: "Concrete Slab",
        keywords: ["concrete", "slab", "ready-mix", "cement", "pour", "concrete mix", "ready mix", "rebar", "reinforcement", "steel", "mesh", "wire mesh", "#3", "#4", "#5", "reinforcing"]
      },
      {
        category: "Fire Pit",
        keywords: ["fire pit", "firepit", "fire", "pit", "paver", "fire ring", "fire bowl"]
      },
      {
        category: "Retaining Wall",
        keywords: ["retaining wall", "retaining", "wall", "block", "stone wall", "retainer", "wall system"]
      },
      {
        category: "Excavation & Site Prep",
        keywords: ["excavation", "excavate", "dig", "grade", "grading", "site prep", "site preparation", "dirt", "soil", "removal", "haul"]
      },
      {
        category: "Base Materials",
        keywords: ["base", "gravel", "aggregate", "crushed stone", "compaction", "sand", "bedding", "sub-base"]
      },
      {
        category: "Pavers & Hardscape",
        keywords: ["paver", "pavers", "hardscape", "paving", "patio", "walkway", "driveway", "stone", "brick"]
      },
      {
        category: "Drainage",
        keywords: ["drain", "drainage", "pipe", "french drain", "downspout", "gutter", "water management"]
      },
      {
        category: "Landscaping",
        keywords: ["landscape", "plant", "tree", "shrub", "mulch", "soil", "garden", "lawn", "grass", "sod"]
      },
      {
        category: "Labor & Installation",
        keywords: ["labor", "installation", "install", "construction", "build", "assembly", "setup", "work"]
      },
      {
        category: "Equipment & Tools",
        keywords: ["equipment", "tool", "rental", "machinery", "compactor", "excavator", "loader"]
      }
    ];

    // Find the best matching category
    for (const mapping of categoryMappings) {
      for (const keyword of mapping.keywords) {
        if (desc.includes(keyword)) {
          return mapping.category;
        }
      }
    }

    // If no keywords match, try to create a smart category based on the item type
    if (desc.includes("material") || desc.includes("supply")) {
      return "Materials & Supplies";
    }
    
    if (desc.includes("permit") || desc.includes("fee") || desc.includes("inspection")) {
      return "Permits & Fees";
    }

    // Default fallback
    return "Miscellaneous";
  };

  // Organize scope items into categories with scope groups
  useEffect(() => {
    // Safety check: ensure scopeOfWork is an array
    if (!Array.isArray(scopeOfWork)) {
      console.warn('scopeOfWork is not an array:', scopeOfWork);
      return;
    }

    // Debug: Log current scope of work
    console.log('LineItemScopeView: Processing scopeOfWork:', scopeOfWork.length, 'items');
    
    // If we have no scope items, show recovery message and don't process anything
    if (scopeOfWork.length === 0) {
      console.log('No scope items to process');
      setCategories({});
      setShowRecoveryMessage(true);
      return;
    } else {
      setShowRecoveryMessage(false);
    }

    const categoryMap: Record<string, ScopeCategory> = {};

    // Only filter out legacy parent scope items if they actually exist
    const legacyParentItems = scopeOfWork.filter(item => item && item.isParentScope);
    const cleanedScopeOfWork = legacyParentItems.length > 0 
      ? scopeOfWork.filter(item => item && !item.isParentScope)
      : scopeOfWork;

    // First, collect all items by category
    cleanedScopeOfWork.forEach(item => {
      // Use existing category if set, otherwise auto-categorize
      let categoryName = item.category;
      if (!categoryName) {
        categoryName = autoCategorizeItem(item.description || '');
      }
      // Handle legacy categories
      if (categoryName === 'Uncategorized') {
        categoryName = 'Miscellaneous';
      }
      // Migrate "Reinforcement & Rebar" items to "Concrete Slab"
      if (categoryName === 'Reinforcement & Rebar') {
        categoryName = 'Concrete Slab';
      }
      
      if (!categoryMap[categoryName]) {
        categoryMap[categoryName] = {
          name: categoryName,
          items: [],
          scopeGroups: [],
          isVisible: !item.isHidden,
          isExpanded: true,
          total: 0
        };
      }
      
      categoryMap[categoryName].items.push(item);
    });

    // Now organize items by scope groups within each category
    Object.values(categoryMap).forEach(category => {
      const scopeGroupMap: Record<string, ScopeGroup> = {};
      const ungroupedItems: ScopeItem[] = [];

      category.items.forEach(item => {
        if (item.scopeGroup) {
          // Item belongs to a scope group
          if (!scopeGroupMap[item.scopeGroup]) {
            scopeGroupMap[item.scopeGroup] = {
              name: item.scopeGroup,
              items: [],
              isExpanded: true,
              total: 0
            };
          }
          scopeGroupMap[item.scopeGroup].items.push(item);
          scopeGroupMap[item.scopeGroup].total += item.total;
        } else {
          // Item is not grouped
          ungroupedItems.push(item);
        }
      });

      // Set the scope groups
      category.scopeGroups = Object.values(scopeGroupMap);
      
      // Add ungrouped items as individual groups for consistent display
      ungroupedItems.forEach(item => {
        category.scopeGroups.push({
          name: '', // Empty name indicates ungrouped
          items: [item],
          isExpanded: true,
          total: item.total
        });
      });

      // Calculate total for the category
      category.total = category.items
        .filter(item => !item.isHidden)
        .reduce((sum, item) => sum + item.total, 0);
    });

    setCategories(categoryMap);

    // TEMPORARILY DISABLED: Automatic cleanup to prevent data loss
    // Only update scope if we actually removed legacy items and there are items remaining
    // if (legacyParentItems.length > 0 && cleanedScopeOfWork.length > 0 && cleanedScopeOfWork.length !== scopeOfWork.length) {
    //   console.warn('Removing legacy parent scope items:', legacyParentItems);
    //   onScopeUpdate(cleanedScopeOfWork);
    // }
    
    // Debug information
    if (legacyParentItems.length > 0) {
      console.log('Found legacy parent items (not auto-removing):', legacyParentItems);
    }
  }, [scopeOfWork]);

  // Toggle category visibility
  const toggleCategoryVisibility = (categoryName: string) => {
    const updatedScope = scopeOfWork.map(item => {
      if (item.category === categoryName || 
          (!item.category && (categoryName === 'Uncategorized' || categoryName === 'Miscellaneous')) ||
          (item.category === 'Reinforcement & Rebar' && categoryName === 'Concrete Slab')) {
        return { ...item, isHidden: !item.isHidden };
      }
      return item;
    });
    
    onScopeUpdate(updatedScope);
    toast.success(`${categories[categoryName].isVisible ? 'Hidden' : 'Shown'} ${categoryName} category`);
  };

  // Toggle category expansion
  const toggleCategoryExpansion = (categoryName: string) => {
    setCategories(prev => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        isExpanded: !prev[categoryName].isExpanded
      }
    }));
  };

  // Add new category
  const addCategory = () => {
    if (newCategoryName.trim() && !categories[newCategoryName.trim()]) {
      setCategories(prev => ({
        ...prev,
        [newCategoryName.trim()]: {
          name: newCategoryName.trim(),
          items: [],
          scopeGroups: [],
          isVisible: true,
          isExpanded: true,
          total: 0
        }
      }));
      setNewCategoryName('');
      setShowAddCategory(false);
      toast.success(`Added new category: ${newCategoryName.trim()}`);
    }
  };

  // Rename category
  const renameCategory = (oldName: string) => {
    if (editCategoryName.trim() && editCategoryName.trim() !== oldName) {
      const updatedScope = scopeOfWork.map(item => {
        if (item.category === oldName || 
            (!item.category && (oldName === 'Uncategorized' || oldName === 'Miscellaneous')) ||
            (item.category === 'Reinforcement & Rebar' && oldName === 'Concrete Slab')) {
          return { ...item, category: editCategoryName.trim() };
        }
        return item;
      });
      
      onScopeUpdate(updatedScope);
      setEditingCategory(null);
      setEditCategoryName('');
      toast.success(`Renamed category to: ${editCategoryName.trim()}`);
    }
  };

  // Remove entire category
  const removeCategory = (categoryName: string) => {
    const updatedScope = scopeOfWork.filter(item => {
      const itemCategory = item.category || 'Miscellaneous';
      // Also filter out items that were in "Reinforcement & Rebar" if we're removing "Concrete Slab"
      if (categoryName === 'Concrete Slab' && item.category === 'Reinforcement & Rebar') {
        return false;
      }
      return itemCategory !== categoryName;
    });
    
    onScopeUpdate(updatedScope);
    setShowRemoveConfirm(null);
    toast.success(`Removed ${categoryName} category and all its items`);
  };

  // Move item to different category
  const moveItemToCategory = (itemId: string, newCategory: string) => {
    const updatedScope = scopeOfWork.map(item => {
      if (item.id === itemId) {
        return { ...item, category: newCategory === 'Miscellaneous' ? undefined : newCategory };
      }
      return item;
    });
    
    onScopeUpdate(updatedScope);
    toast.success('Item moved to new category');
  };

  // Assign item to a scope group
  const assignToScopeGroup = (itemId: string, groupName: string) => {
    const updatedScope = scopeOfWork.map(item => {
      if (item.id === itemId) {
        return { 
          ...item, 
          scopeGroup: groupName.trim() || undefined 
        };
      }
      return item;
    });
    
    onScopeUpdate(updatedScope);
    setEditingItemGroup(null);
    
    if (groupName.trim()) {
      toast.success(`Item assigned to scope group: ${groupName.trim()}`);
    } else {
      toast.success('Item removed from scope group');
    }
  };

  // Toggle scope group expansion
  const toggleScopeGroupExpansion = (categoryName: string, groupName: string) => {
    setCategories(prev => ({
      ...prev,
      [categoryName]: {
        ...prev[categoryName],
        scopeGroups: prev[categoryName].scopeGroups.map(group => 
          group.name === groupName 
            ? { ...group, isExpanded: !group.isExpanded }
            : group
        )
      }
    }));
  };

  // Get existing scope group names for autocomplete
  const getExistingScopeGroups = (): string[] => {
    const groups = new Set<string>();
    Object.values(categories).forEach(category => {
      category.scopeGroups.forEach(group => {
        if (group.name) {
          groups.add(group.name);
        }
      });
    });
    return Array.from(groups).sort();
  };

  // Check if an item description matches any existing scope group names and auto-assign
  const checkAndAutoAssignToGroup = (itemId: string, newDescription: string) => {
    const existingGroups = getExistingScopeGroups();
    const trimmedDescription = newDescription.trim();
    
    if (!trimmedDescription || existingGroups.length === 0) {
      return null; // Return null instead of false to indicate no match
    }
    
    // Look for exact match (case-insensitive)
    let matchingGroup = existingGroups.find(group => 
      group.toLowerCase() === trimmedDescription.toLowerCase()
    );
    
    // If no exact match, look for partial matches
    if (!matchingGroup) {
      // Check if the description contains any existing group name
      matchingGroup = existingGroups.find(group => 
        trimmedDescription.toLowerCase().includes(group.toLowerCase()) ||
        group.toLowerCase().includes(trimmedDescription.toLowerCase())
      );
    }
    
    // Special logic for common construction terms
    if (!matchingGroup) {
      const descLower = trimmedDescription.toLowerCase();
      
      // Group fire-related items
      if ((descLower.includes('fire') || descLower.includes('pit')) && 
          existingGroups.some(g => g.toLowerCase().includes('fire'))) {
        matchingGroup = existingGroups.find(g => g.toLowerCase().includes('fire'));
      }
      
      // Group retaining wall related items
      else if ((descLower.includes('retaining') || descLower.includes('wall') || 
               descLower.includes('base') || descLower.includes('drainage')) && 
               existingGroups.some(g => g.toLowerCase().includes('retaining') || g.toLowerCase().includes('wall'))) {
        matchingGroup = existingGroups.find(g => 
          g.toLowerCase().includes('retaining') || g.toLowerCase().includes('wall')
        );
      }
      
      // Group concrete/slab related items
      else if ((descLower.includes('concrete') || descLower.includes('slab') || 
               descLower.includes('rebar') || descLower.includes('pour')) && 
               existingGroups.some(g => g.toLowerCase().includes('concrete') || g.toLowerCase().includes('slab'))) {
        matchingGroup = existingGroups.find(g => 
          g.toLowerCase().includes('concrete') || g.toLowerCase().includes('slab')
        );
      }
    }
    
    return matchingGroup; // Return the matching group name or null
  };

  // Enhanced update function for scope items that includes auto-grouping
  const updateScopeItemWithAutoGrouping = (itemId: string, field: string, value: any) => {
    if (field === 'description') {
      // Check for auto-grouping
      const matchingGroup = checkAndAutoAssignToGroup(itemId, value);
      
      // Always update the item, but include the matching group if found
      const updatedScope = scopeOfWork.map(item => {
        if (item.id === itemId) {
          const updates: any = { [field]: value };
          if (matchingGroup) {
            updates.scopeGroup = matchingGroup;
          }
          return { ...item, ...updates };
        }
        return item;
      });
      
      onScopeUpdate(updatedScope);
      
      // Show success message if auto-grouping occurred
      if (matchingGroup) {
        toast.success(`Auto-grouped "${value.trim()}" with existing items under "${matchingGroup}"`);
      }
    } else {
      // Standard update for other fields
      const updatedScope = scopeOfWork.map(item => {
        if (item.id === itemId) {
          return { ...item, [field]: value };
        }
        return item;
      });
      
      onScopeUpdate(updatedScope);
    }
  };

  // Start editing an item's description
  const startEditingDescription = (itemId: string, currentDescription: string) => {
    setEditingItemDescription(itemId);
    setEditingDescriptionValue(currentDescription);
  };

  // Save the edited description with auto-grouping
  const saveEditedDescription = (itemId: string) => {
    const trimmedValue = editingDescriptionValue.trim();
    if (trimmedValue) {
      console.log('Saving description for item:', itemId, 'New description:', trimmedValue);
      updateScopeItemWithAutoGrouping(itemId, 'description', trimmedValue);
    } else {
      console.warn('Attempted to save empty description for item:', itemId);
    }
    setEditingItemDescription(null);
    setEditingDescriptionValue('');
  };

  // Cancel editing description
  const cancelEditingDescription = () => {
    setEditingItemDescription(null);
    setEditingDescriptionValue('');
  };

  // Auto-categorize all uncategorized items and rebar items
  const autoCategorizeScopeItems = () => {
    const updatedScope = scopeOfWork.map(item => {
      // Auto-categorize items that don't have a category, are in "Miscellaneous", or are in "Reinforcement & Rebar"
      if (!item.category || item.category === 'Miscellaneous' || item.category === 'Uncategorized' || item.category === 'Reinforcement & Rebar') {
        const newCategory = autoCategorizeItem(item.description || '');
        return { ...item, category: newCategory === 'Miscellaneous' ? undefined : newCategory };
      }
      return item;
    });
    
    onScopeUpdate(updatedScope);
    const categorizedCount = updatedScope.filter(item => item.category && item.category !== 'Miscellaneous').length;
    const rebarMoved = scopeOfWork.filter(item => item.category === 'Reinforcement & Rebar').length;
    
    if (rebarMoved > 0) {
      toast.success(`Auto-categorized ${categorizedCount} items and moved ${rebarMoved} rebar items to Concrete Slab category`);
    } else {
      toast.success(`Auto-categorized ${categorizedCount} items based on their descriptions`);
    }
  };

  // Calculate totals
  const visibleTotal = Object.values(categories)
    .filter(cat => cat.isVisible)
    .reduce((sum, cat) => sum + cat.total, 0);
  
  const hiddenTotal = Object.values(categories)
    .filter(cat => !cat.isVisible)
    .reduce((sum, cat) => sum + cat.total, 0);

  const grandTotal = visibleTotal + hiddenTotal;

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-600" />
            Scope of Work by Line Item
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Total Categories</div>
              <div className="text-xl font-bold text-blue-600">{Object.keys(categories).length}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Visible Items</div>
              <div className="text-xl font-bold text-green-600">${formatCurrency(visibleTotal)}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Hidden Items</div>
              <div className="text-xl font-bold text-gray-500">${formatCurrency(hiddenTotal)}</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg shadow-sm">
              <div className="text-sm text-gray-600 mb-1">Grand Total</div>
              <div className="text-xl font-bold text-blue-900">${formatCurrency(grandTotal)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-800">Categories</h3>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grouped' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grouped')}
              className="h-8"
            >
              <FolderTree className="w-4 h-4 mr-2" />
              Grouped
            </Button>
            <Button
              variant={viewMode === 'flat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('flat')}
              className="h-8"
            >
              <List className="w-4 h-4 mr-2" />
              Flat
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={autoCategorizeScopeItems}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <Calculator className="w-4 h-4 mr-2" />
            Auto-Categorize
          </Button>
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Category</DialogTitle>
                <DialogDescription>
                  Create a new category to organize your scope of work items.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g., 4 inch Concrete Slab"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowAddCategory(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addCategory} disabled={!newCategoryName.trim()}>
                    Add Category
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryName, category]) => (
          <Card 
            key={categoryName} 
            className={`transition-all duration-200 ${
              category.isVisible 
                ? 'border-green-200 bg-white' 
                : 'border-gray-200 bg-gray-50 opacity-75'
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Expansion Toggle */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCategoryExpansion(categoryName)}
                    className="h-8 w-8 p-0"
                  >
                    {category.isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>

                  {/* Category Name */}
                  {editingCategory === categoryName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editCategoryName}
                        onChange={(e) => setEditCategoryName(e.target.value)}
                        className="h-8 w-48"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') renameCategory(categoryName);
                          if (e.key === 'Escape') {
                            setEditingCategory(null);
                            setEditCategoryName('');
                          }
                        }}
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => renameCategory(categoryName)}
                        className="h-8"
                      >
                        Save
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {categoryName}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {category.items.length} item{category.items.length === 1 ? '' : 's'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingCategory(categoryName);
                          setEditCategoryName(categoryName);
                        }}
                        className="h-6 w-6 p-0"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  {/* Category Total */}
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      category.isVisible ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      ${formatCurrency(category.total)}
                    </div>
                    <div className="text-xs text-gray-500">Category Total</div>
                  </div>

                  {/* Visibility Toggle */}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={category.isVisible}
                      onCheckedChange={() => toggleCategoryVisibility(categoryName)}
                    />
                    {category.isVisible ? (
                      <Eye className="w-4 h-4 text-green-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Remove Category */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                          Remove Category
                        </DialogTitle>
                        <DialogDescription>
                          Are you sure you want to remove the {categoryName} category? 
                          This will permanently delete all {category.items.length} items in this category
                          and remove ${formatCurrency(category.total)} from the proposal total.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline">Cancel</Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => removeCategory(categoryName)}
                        >
                          Remove Category
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            {/* Category Items */}
            {category.isExpanded && (
              <CardContent className="pt-0">
                {viewMode === 'flat' ? (
                  // Flat view - show all items individually
                  category.items.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <List className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No items in this category</p>
                      <p className="text-sm">Items will appear here when added to this category</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {category.items.map((item) => (
                        <Card 
                          key={item.id} 
                          className={`ml-6 transition-all duration-200 ${
                            item.isHidden ? 'opacity-50 bg-gray-50' : 'bg-white hover:shadow-md'
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3 flex-1">
                                <Badge 
                                  variant={item.isLabor ? "secondary" : "default"} 
                                  className="text-xs"
                                >
                                  {item.isLabor ? "Labor" : "Material"}
                                </Badge>
                                {editingItemDescription === item.id ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      value={editingDescriptionValue}
                                      onChange={(e) => setEditingDescriptionValue(e.target.value)}
                                      className="h-8 font-medium"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditedDescription(item.id);
                                        if (e.key === 'Escape') cancelEditingDescription();
                                      }}
                                      onBlur={() => saveEditedDescription(item.id)}
                                      autoFocus
                                    />
                                  </div>
                                ) : (
                                  <span 
                                    className={`font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                                      item.isHidden ? 'text-gray-500' : 'text-gray-800'
                                    }`}
                                    onClick={() => startEditingDescription(item.id, item.description || '')}
                                    title="Click to edit description"
                                  >
                                    {item.description || 'Untitled Item'}
                                  </span>
                                )}
                                {item.scopeGroup && (
                                  <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                    {item.scopeGroup}
                                  </Badge>
                                )}
                                {item.isHidden && (
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    Hidden
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2">
                                {/* Group assignment dropdown */}
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreVertical className="w-3 h-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => startEditingDescription(item.id, item.description || '')}>
                                      <Edit3 className="w-4 h-4 mr-2" />
                                      Edit Description
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => {
                                      setEditingItemGroup(item.id);
                                      setNewGroupName(item.scopeGroup || '');
                                    }}>
                                      <FolderTree className="w-4 h-4 mr-2" />
                                      {item.scopeGroup ? 'Change Group' : 'Assign to Group'}
                                    </DropdownMenuItem>
                                    {item.scopeGroup && (
                                      <DropdownMenuItem onClick={() => assignToScopeGroup(item.id, '')}>
                                        <Unlink className="w-4 h-4 mr-2" />
                                        Remove from Group
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                                
                                <div className="text-right">
                                  <div className={`text-lg font-bold ${
                                    item.isHidden ? 'text-gray-500' : 'text-blue-600'
                                  }`}>
                                    ${formatCurrency(item.total)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="block text-gray-500 mb-1">Quantity</span>
                                <span className="font-medium">
                                  {item.quantity} {item.unit}
                                </span>
                              </div>
                              <div>
                                <span className="block text-gray-500 mb-1">
                                  {item.isLabor ? 'Labor Rate' : 'Material Cost'}
                                </span>
                                <span className="font-medium">
                                  ${formatCurrency(
                                    item.isLabor ? (item.laborRate || 0) : (item.materialCost || 0)
                                  )}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="block text-gray-500 mb-1">Per Unit Cost</span>
                                <span className="font-medium">
                                  ${formatCurrency(item.total / item.quantity)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  // Grouped view - show items organized by scope groups
                  category.scopeGroups.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FolderTree className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No items in this category</p>
                      <p className="text-sm">Items will appear here when added to this category</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {category.scopeGroups.map((scopeGroup, groupIndex) => (
                        <Card 
                          key={scopeGroup.name || `ungrouped-${groupIndex}`} 
                          className={`ml-6 transition-all duration-200 bg-white hover:shadow-md ${
                            scopeGroup.name ? 'border-blue-200' : 'border-gray-200'
                          }`}
                        >
                          {scopeGroup.name ? (
                            // Named scope group
                            <>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3 flex-1">
                                    {scopeGroup.items.length > 1 && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => toggleScopeGroupExpansion(categoryName, scopeGroup.name)}
                                        className="h-6 w-6 p-0"
                                      >
                                        {scopeGroup.isExpanded ? (
                                          <ChevronDown className="w-4 h-4" />
                                        ) : (
                                          <ChevronRight className="w-4 h-4" />
                                        )}
                                      </Button>
                                    )}
                                    
                                    <Badge variant="default" className="text-xs">
                                      Scope Group
                                    </Badge>
                                    
                                    <span className="font-medium text-gray-800">
                                      {scopeGroup.name}
                                    </span>
                                    
                                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-600">
                                      {scopeGroup.items.length} item{scopeGroup.items.length === 1 ? '' : 's'}
                                    </Badge>
                                  </div>
                                  
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600">
                                      ${formatCurrency(scopeGroup.total)}
                                    </div>
                                    <div className="text-xs text-gray-500">Group Total</div>
                                  </div>
                                </div>
                              </CardContent>

                              {/* Group Items */}
                              {scopeGroup.isExpanded && (
                                <div className="border-t bg-gray-50 px-4 pb-4">
                                  <div className="space-y-2 mt-4">
                                    {scopeGroup.items.map((item) => (
                                      <Card 
                                        key={item.id} 
                                        className={`ml-8 transition-all duration-200 ${
                                          item.isHidden ? 'opacity-50 bg-gray-100' : 'bg-white hover:shadow-sm'
                                        }`}
                                      >
                                        <CardContent className="p-3">
                                          <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2 flex-1">
                                              <Badge 
                                                variant={item.isLabor ? "secondary" : "outline"} 
                                                className="text-xs"
                                              >
                                                {item.isLabor ? "Labor" : "Material"}
                                              </Badge>
                                              {editingItemDescription === item.id ? (
                                                <Input
                                                  value={editingDescriptionValue}
                                                  onChange={(e) => setEditingDescriptionValue(e.target.value)}
                                                  className="h-7 text-sm font-medium"
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEditedDescription(item.id);
                                                    if (e.key === 'Escape') cancelEditingDescription();
                                                  }}
                                                  onBlur={() => saveEditedDescription(item.id)}
                                                  autoFocus
                                                />
                                              ) : (
                                                <span 
                                                  className={`text-sm font-medium cursor-pointer hover:bg-gray-100 px-1 py-0.5 rounded ${
                                                    item.isHidden ? 'text-gray-500' : 'text-gray-700'
                                                  }`}
                                                  onClick={() => startEditingDescription(item.id, item.description || '')}
                                                  title="Click to edit description"
                                                >
                                                  {item.description || 'Untitled Item'}
                                                </span>
                                              )}
                                              {item.isHidden && (
                                                <Badge variant="outline" className="text-xs text-gray-500">
                                                  Hidden
                                                </Badge>
                                              )}
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    <MoreVertical className="w-3 h-3" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => startEditingDescription(item.id, item.description || '')}>
                                                    <Edit3 className="w-4 h-4 mr-2" />
                                                    Edit Description
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem onClick={() => {
                                                    setEditingItemGroup(item.id);
                                                    setNewGroupName(item.scopeGroup || '');
                                                  }}>
                                                    <FolderTree className="w-4 h-4 mr-2" />
                                                    Change Group
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => assignToScopeGroup(item.id, '')}>
                                                    <Unlink className="w-4 h-4 mr-2" />
                                                    Remove from Group
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                              
                                              <div className="text-right">
                                                <div className={`text-sm font-bold ${
                                                  item.isHidden ? 'text-gray-500' : 'text-green-600'
                                                }`}>
                                                  ${formatCurrency(item.total)}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-3 gap-3 text-xs">
                                            <div>
                                              <span className="block text-gray-500 mb-1">Quantity</span>
                                              <span className="font-medium">
                                                {item.quantity} {item.unit}
                                              </span>
                                            </div>
                                            <div>
                                              <span className="block text-gray-500 mb-1">
                                                {item.isLabor ? 'Rate' : 'Cost'}
                                              </span>
                                              <span className="font-medium">
                                                ${formatCurrency(
                                                  item.isLabor ? (item.laborRate || 0) : (item.materialCost || 0)
                                                )}
                                              </span>
                                            </div>
                                            <div className="text-right">
                                              <span className="block text-gray-500 mb-1">Per Unit</span>
                                              <span className="font-medium">
                                                ${formatCurrency(item.total / item.quantity)}
                                              </span>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            // Ungrouped individual item
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3 flex-1">
                                  <Badge 
                                    variant={scopeGroup.items[0].isLabor ? "secondary" : "outline"} 
                                    className="text-xs"
                                  >
                                    {scopeGroup.items[0].isLabor ? "Labor" : "Material"}
                                  </Badge>
                                  {editingItemDescription === scopeGroup.items[0].id ? (
                                    <Input
                                      value={editingDescriptionValue}
                                      onChange={(e) => setEditingDescriptionValue(e.target.value)}
                                      className="h-8 font-medium"
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEditedDescription(scopeGroup.items[0].id);
                                        if (e.key === 'Escape') cancelEditingDescription();
                                      }}
                                      onBlur={() => saveEditedDescription(scopeGroup.items[0].id)}
                                      autoFocus
                                    />
                                  ) : (
                                    <span 
                                      className={`font-medium cursor-pointer hover:bg-gray-100 px-2 py-1 rounded ${
                                        scopeGroup.items[0].isHidden ? 'text-gray-500' : 'text-gray-800'
                                      }`}
                                      onClick={() => startEditingDescription(scopeGroup.items[0].id, scopeGroup.items[0].description || '')}
                                      title="Click to edit description"
                                    >
                                      {scopeGroup.items[0].description || 'Untitled Item'}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs text-gray-500">
                                    Ungrouped
                                  </Badge>
                                  {scopeGroup.items[0].isHidden && (
                                    <Badge variant="outline" className="text-xs text-gray-500">
                                      Hidden
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="w-3 h-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => startEditingDescription(scopeGroup.items[0].id, scopeGroup.items[0].description || '')}>
                                        <Edit3 className="w-4 h-4 mr-2" />
                                        Edit Description
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => {
                                        setEditingItemGroup(scopeGroup.items[0].id);
                                        setNewGroupName('');
                                      }}>
                                        <FolderTree className="w-4 h-4 mr-2" />
                                        Assign to Group
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  
                                  <div className="text-right">
                                    <div className={`text-lg font-bold ${
                                      scopeGroup.items[0].isHidden ? 'text-gray-500' : 'text-blue-600'
                                    }`}>
                                      ${formatCurrency(scopeGroup.items[0].total)}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="block text-gray-500 mb-1">Quantity</span>
                                  <span className="font-medium">
                                    {scopeGroup.items[0].quantity} {scopeGroup.items[0].unit}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-gray-500 mb-1">
                                    {scopeGroup.items[0].isLabor ? 'Labor Rate' : 'Material Cost'}
                                  </span>
                                  <span className="font-medium">
                                    ${formatCurrency(
                                      scopeGroup.items[0].isLabor ? (scopeGroup.items[0].laborRate || 0) : (scopeGroup.items[0].materialCost || 0)
                                    )}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-gray-500 mb-1">Per Unit Cost</span>
                                  <span className="font-medium">
                                    ${formatCurrency(scopeGroup.items[0].total / scopeGroup.items[0].quantity)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {Object.keys(categories).length === 0 && (
        <Card className={`border-dashed border-2 ${showRecoveryMessage ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            {showRecoveryMessage ? (
              <>
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h3 className="text-lg font-semibold text-yellow-700 mb-2">Scope Items Missing</h3>
                <p className="text-yellow-600 mb-4 max-w-md">
                  It appears your scope of work items may have been lost. This could happen due to:
                </p>
                <ul className="text-sm text-yellow-600 mb-6 text-left">
                  <li>• Data synchronization issues</li>
                  <li>• Browser session interruption</li>
                  <li>• Component state conflicts</li>
                </ul>
                <p className="text-sm text-yellow-600 mb-6 max-w-md">
                  Check your browser's console for any error messages, or try refreshing the page to reload your data.
                </p>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.reload()}
                    className="border-yellow-600 text-yellow-600 hover:bg-yellow-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Page
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Layers className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Scope Categories</h3>
                <p className="text-gray-500 mb-6 max-w-md">
                  Add scope of work items to see them automatically organized by categories. 
                  Items are intelligently grouped based on their descriptions.
                </p>
                <div className="flex gap-3">
                  <Button onClick={() => setShowAddCategory(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Category
                  </Button>
                  <Button variant="outline" onClick={autoCategorizeScopeItems}>
                    <Calculator className="w-4 h-4 mr-2" />
                    Auto-Categorize Items
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign to Scope Group Dialog */}
      <Dialog open={editingItemGroup !== null} onOpenChange={(open) => !open && setEditingItemGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign to Scope Group</DialogTitle>
            <DialogDescription>
              Choose an existing group or create a new one to organize related items together. Groups help organize work by project areas like Retaining Wall or Fire Pit Installation.
            </DialogDescription>
          </DialogHeader>
          {editingItemGroup && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium">
                  {scopeOfWork.find(item => item.id === editingItemGroup)?.description || 'Selected Item'}
                </div>
                <div className="text-sm text-gray-600">
                  Current group: {scopeOfWork.find(item => item.id === editingItemGroup)?.scopeGroup || 'None'}
                </div>
              </div>
              
              <div>
                <Label htmlFor="groupName">Scope Group</Label>
                <Select
                  value={newGroupName}
                  onValueChange={(value) => {
                    setNewGroupName(value);
                    if (value === 'none') {
                      assignToScopeGroup(editingItemGroup, '');
                    } else if (value !== 'new') {
                      assignToScopeGroup(editingItemGroup, value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select or create a scope group..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      <span className="flex items-center gap-2">
                        <Unlink className="w-4 h-4 text-gray-500" />
                        <span>Remove from group</span>
                      </span>
                    </SelectItem>
                    {getExistingScopeGroups().length > 0 && (
                      <>
                        <Separator />
                        <span className="px-2 py-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide block">
                          Existing Groups
                        </span>
                        {getExistingScopeGroups().map((groupName) => (
                          <SelectItem key={groupName} value={groupName}>
                            <span className="flex items-center gap-2">
                              <FolderTree className="w-4 h-4 text-blue-500" />
                              <span>{groupName}</span>
                            </span>
                          </SelectItem>
                        ))}
                        <Separator />
                      </>
                    )}
                    <SelectItem value="new">
                      <span className="flex items-center gap-2">
                        <Plus className="w-4 h-4 text-green-500" />
                        <span>Create new group...</span>
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-gray-500 mt-1 block">
                  <strong>Tip:</strong> Items with matching names will automatically group together when renamed.
                </span>
              </div>

              {newGroupName === 'new' && (
                <div>
                  <Label htmlFor="newGroupInput">New Group Name</Label>
                  <Input
                    id="newGroupInput"
                    value=""
                    onChange={(e) => {
                      if (e.target.value.trim()) {
                        assignToScopeGroup(editingItemGroup, e.target.value.trim());
                      }
                    }}
                    placeholder="e.g., Retaining Wall, Fire Pit Installation"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                        assignToScopeGroup(editingItemGroup, e.currentTarget.value.trim());
                      }
                      if (e.key === 'Escape') {
                        setNewGroupName('');
                      }
                    }}
                    autoFocus
                  />
                </div>
              )}
              
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => {
                  setEditingItemGroup(null);
                  setNewGroupName('');
                }}>
                  Close
                </Button>
                {newGroupName === 'new' && (
                  <Button variant="outline" onClick={() => setNewGroupName('')}>
                    Back to Selection
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}