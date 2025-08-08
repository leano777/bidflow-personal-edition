import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Search, 
  Plus, 
  Edit, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Building,
  Zap,
  Wrench,
  Paintbrush,
  Hammer,
  Calculator,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface MaterialDatabaseProps {
  onSelectMaterial: (material: Material) => void;
}

interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  lastUpdated: string;
  supplier: string;
  description: string;
  wasteFactor: number;
  tags: string[];
  priceHistory?: { date: string; price: number }[];
}

// Sample material database - moved outside component to prevent recreation
const sampleMaterials: Material[] = [
    // Framing Materials
    {
      id: '1',
      name: '2x4x8 SPF Stud',
      category: 'framing',
      unit: 'each',
      price: 4.25,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'Kiln-dried spruce-pine-fir framing lumber',
      wasteFactor: 0.10,
      tags: ['lumber', 'framing', 'structural']
    },
    {
      id: '2',
      name: '2x6x8 SPF Stud',
      category: 'framing',
      unit: 'each',
      price: 6.75,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'Kiln-dried spruce-pine-fir framing lumber',
      wasteFactor: 0.10,
      tags: ['lumber', 'framing', 'structural']
    },
    {
      id: '3',
      name: '2x10x12 SPF Board',
      category: 'framing',
      unit: 'each',
      price: 22.50,
      lastUpdated: '2024-01-15',
      supplier: 'Lowes',
      description: 'Dimensional lumber for floor joists and beams',
      wasteFactor: 0.15,
      tags: ['lumber', 'joists', 'structural']
    },
    {
      id: '4',
      name: '3/4" OSB Sheathing 4x8',
      category: 'framing',
      unit: 'sheet',
      price: 32.00,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'Oriented Strand Board for wall/roof sheathing',
      wasteFactor: 0.08,
      tags: ['sheathing', 'osb', 'structural']
    },

    // Electrical Materials
    {
      id: '5',
      name: '12-2 NM Cable',
      category: 'electrical',
      unit: 'ft',
      price: 0.85,
      lastUpdated: '2024-01-15',
      supplier: 'Electrical Supply Co',
      description: '12 AWG non-metallic cable for 20A circuits',
      wasteFactor: 0.15,
      tags: ['wire', 'electrical', '20amp']
    },
    {
      id: '6',
      name: '14-2 NM Cable',
      category: 'electrical',
      unit: 'ft',
      price: 0.65,
      lastUpdated: '2024-01-15',
      supplier: 'Electrical Supply Co',
      description: '14 AWG non-metallic cable for 15A circuits',
      wasteFactor: 0.15,
      tags: ['wire', 'electrical', '15amp']
    },
    {
      id: '7',
      name: 'Standard Outlet 15A',
      category: 'electrical',
      unit: 'each',
      price: 1.25,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'Standard duplex receptacle outlet',
      wasteFactor: 0.05,
      tags: ['outlet', 'receptacle', '15amp']
    },
    {
      id: '8',
      name: 'GFCI Outlet 20A',
      category: 'electrical',
      unit: 'each',
      price: 12.50,
      lastUpdated: '2024-01-15',
      supplier: 'Electrical Supply Co',
      description: 'Ground fault circuit interrupter outlet',
      wasteFactor: 0.05,
      tags: ['gfci', 'safety', '20amp']
    },

    // Plumbing Materials
    {
      id: '9',
      name: '1/2" PEX Tubing',
      category: 'plumbing',
      unit: 'ft',
      price: 0.45,
      lastUpdated: '2024-01-15',
      supplier: 'Ferguson',
      description: 'Cross-linked polyethylene water supply tubing',
      wasteFactor: 0.12,
      tags: ['pex', 'water', 'supply']
    },
    {
      id: '10',
      name: '3/4" PEX Tubing',
      category: 'plumbing',
      unit: 'ft',
      price: 0.75,
      lastUpdated: '2024-01-15',
      supplier: 'Ferguson',
      description: 'Cross-linked polyethylene water supply tubing',
      wasteFactor: 0.12,
      tags: ['pex', 'water', 'main']
    },
    {
      id: '11',
      name: '3" PVC DWV Pipe',
      category: 'plumbing',
      unit: 'ft',
      price: 3.25,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'PVC drain, waste, and vent pipe',
      wasteFactor: 0.10,
      tags: ['pvc', 'drain', 'waste']
    },

    // Finishing Materials
    {
      id: '12',
      name: '1/2" Drywall 4x8',
      category: 'finishing',
      unit: 'sheet',
      price: 15.50,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'Standard gypsum wallboard',
      wasteFactor: 0.12,
      tags: ['drywall', 'interior', 'walls']
    },
    {
      id: '13',
      name: 'Joint Compound 5-gal',
      category: 'finishing',
      unit: 'bucket',
      price: 28.00,
      lastUpdated: '2024-01-15',
      supplier: 'Lowes',
      description: 'All-purpose joint compound',
      wasteFactor: 0.08,
      tags: ['compound', 'drywall', 'finishing']
    },
    {
      id: '14',
      name: 'Interior Paint - Gallon',
      category: 'finishing',
      unit: 'gallon',
      price: 45.00,
      lastUpdated: '2024-01-15',
      supplier: 'Sherwin Williams',
      description: 'Premium interior latex paint',
      wasteFactor: 0.05,
      tags: ['paint', 'interior', 'latex']
    },

    // Hardware
    {
      id: '15',
      name: '3" Wood Screws (lb)',
      category: 'hardware',
      unit: 'lb',
      price: 12.50,
      lastUpdated: '2024-01-15',
      supplier: 'Fasteners Plus',
      description: 'Coarse thread wood screws',
      wasteFactor: 0.05,
      tags: ['screws', 'fasteners', 'wood']
    },
    {
      id: '16',
      name: '16d Common Nails (lb)',
      category: 'hardware',
      unit: 'lb',
      price: 3.25,
      lastUpdated: '2024-01-15',
      supplier: 'Home Depot',
      description: 'Common framing nails',
      wasteFactor: 0.05,
      tags: ['nails', 'framing', 'fasteners']
    }
];

export function MaterialDatabase({ onSelectMaterial }: MaterialDatabaseProps) {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Memoize categories to prevent recreation
  const categories = useMemo(() => [
    { id: 'all', name: 'All Materials', icon: Package, color: 'text-gray-600' },
    { id: 'framing', name: 'Framing', icon: Building, color: 'text-brown-600' },
    { id: 'electrical', name: 'Electrical', icon: Zap, color: 'text-yellow-600' },
    { id: 'plumbing', name: 'Plumbing', icon: Wrench, color: 'text-blue-600' },
    { id: 'finishing', name: 'Finishing', icon: Paintbrush, color: 'text-purple-600' },
    { id: 'hardware', name: 'Hardware', icon: Hammer, color: 'text-gray-600' },
  ], []);

  // Load materials only once
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call
    const loadMaterials = async () => {
      // Use setTimeout to simulate async loading
      return new Promise<Material[]>((resolve) => {
        setTimeout(() => {
          resolve(sampleMaterials);
        }, 500);
      });
    };

    loadMaterials().then((loadedMaterials) => {
      setMaterials(loadedMaterials);
      setIsLoading(false);
    });
  }, []); // Empty dependency array - only run once

  // Memoize filtered materials to prevent unnecessary recalculations
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      const matchesSearch = material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchTerm, selectedCategory]);

  // Memoize utility functions
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  const getCategoryIcon = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.icon : Package;
  }, [categories]);

  const getCategoryColor = useCallback((categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.color : 'text-gray-600';
  }, [categories]);

  // Stable callback for adding materials
  const addToProposal = useCallback((material: Material) => {
    onSelectMaterial(material);
    toast.success(`Added ${material.name} to proposal`);
  }, [onSelectMaterial]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            Material Database
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Browse and select from our database of construction materials with current pricing.
          </p>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card className="glass-card">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto">
              {categories.map(category => {
                const Icon = category.icon;
                const isActive = selectedCategory === category.id;
                return (
                  <Button
                    key={category.id}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Grid */}
      <Card className="glass-card">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
              <p className="text-muted-foreground">Loading materials...</p>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No materials found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMaterials.map(material => {
                const Icon = getCategoryIcon(material.category);
                const categoryColor = getCategoryColor(material.category);
                
                return (
                  <Card key={material.id} className="border hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className={`w-5 h-5 ${categoryColor}`} />
                          <Badge variant="outline" className="text-xs">
                            {categories.find(c => c.id === material.category)?.name}
                          </Badge>
                        </div>
                        
                        {material.wasteFactor > 0.12 && (
                          <AlertTriangle className="w-4 h-4 text-orange-500" title="High waste factor" />
                        )}
                      </div>
                      
                      <h3 className="font-semibold mb-2 line-clamp-2">{material.name}</h3>
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {material.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Price:</span>
                          <span className="font-semibold text-green-600">
                            {formatCurrency(material.price)}/{material.unit}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Waste Factor:</span>
                          <span className="text-sm font-medium">
                            {(material.wasteFactor * 100).toFixed(0)}%
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Supplier:</span>
                          <span className="text-sm">{material.supplier}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Updated:</span>
                          <span className="text-sm">{formatDate(material.lastUpdated)}</span>
                        </div>
                      </div>
                      
                      {material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {material.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                      
                      <Button 
                        onClick={() => addToProposal(material)}
                        size="sm" 
                        className="w-full gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add to Proposal
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Add Common Materials */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Add Common Items</CardTitle>
          <p className="text-sm text-muted-foreground">
            Frequently used materials for quick proposal building
          </p>
        </CardHeader>
        <CardContent>
          <QuickAddSection addToProposal={addToProposal} formatCurrency={formatCurrency} />
        </CardContent>
      </Card>
    </div>
  );
}

// Separate component for quick add section to prevent inline object creation
function QuickAddSection({ addToProposal, formatCurrency }: {
  addToProposal: (material: Material) => void;
  formatCurrency: (amount: number) => string;
}) {
  // Memoize quick items to prevent recreation
  const quickItems = useMemo(() => [
    { name: '2x4 Lumber', price: 4.25, unit: 'each' },
    { name: 'Drywall Sheet', price: 15.50, unit: 'sheet' },
    { name: 'Interior Paint', price: 45.00, unit: 'gallon' },
    { name: 'PEX Tubing', price: 0.45, unit: 'ft' },
  ], []);

  const handleQuickAdd = useCallback((item: any, index: number) => {
    const material: Material = {
      id: `quick-${index}`,
      name: item.name,
      category: 'quick',
      unit: item.unit,
      price: item.price,
      lastUpdated: new Date().toISOString().split('T')[0],
      supplier: 'Quick Add',
      description: `Commonly used ${item.name.toLowerCase()}`,
      wasteFactor: 0.10,
      tags: ['common']
    };
    addToProposal(material);
  }, [addToProposal]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {quickItems.map((item, index) => (
        <Button
          key={index}
          variant="outline"
          className="h-auto p-3 text-left justify-start flex-col items-start"
          onClick={() => handleQuickAdd(item, index)}
        >
          <div className="font-semibold text-sm">{item.name}</div>
          <div className="text-green-600 font-medium">
            {formatCurrency(item.price)}/{item.unit}
          </div>
        </Button>
      ))}
    </div>
  );
}