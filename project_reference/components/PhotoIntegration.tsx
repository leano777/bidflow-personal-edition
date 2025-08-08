import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  Download,
  Image as ImageIcon,
  MapPin,
  Calendar,
  Clock,
  Tag,
  Grid,
  List,
  X,
  Plus,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PhotoIntegrationProps {
  proposal?: any;
  proposalId?: string;
  onUpdate: (updates: any) => void;
}

interface Photo {
  id: string;
  file?: File;
  url: string;
  thumbnail: string;
  name: string;
  description: string;
  category: 'before' | 'during' | 'after' | 'materials' | 'damage' | 'progress' | 'reference';
  tags: string[];
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  timestamp: string;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
}

export function PhotoIntegration({ proposal, proposalId, onUpdate }: PhotoIntegrationProps) {
  // Handle both prop variations for backward compatibility
  const currentProposal = proposal;
  const currentProposalId = proposalId || proposal?.id;

  const [photos, setPhotos] = useState<Photo[]>(currentProposal?.photos || []);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'before', label: 'Before', color: 'bg-blue-100 text-blue-800' },
    { value: 'during', label: 'Progress', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'after', label: 'After', color: 'bg-green-100 text-green-800' },
    { value: 'materials', label: 'Materials', color: 'bg-purple-100 text-purple-800' },
    { value: 'damage', label: 'Damage', color: 'bg-red-100 text-red-800' },
    { value: 'reference', label: 'Reference', color: 'bg-gray-100 text-gray-800' }
  ];

  const tagSuggestions = [
    'foundation', 'framing', 'electrical', 'plumbing', 'drywall', 'flooring',
    'roofing', 'siding', 'windows', 'doors', 'kitchen', 'bathroom',
    'demolition', 'inspection', 'materials delivery', 'cleanup'
  ];

  // Store onUpdate in ref to prevent dependency issues
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;

  // Safe update function with error handling
  const safeUpdate = useCallback((data: any) => {
    try {
      if (typeof updateRef.current === 'function') {
        updateRef.current(data);
      } else {
        console.warn('onUpdate is not a function in PhotoIntegration');
      }
    } catch (error) {
      console.error('Error updating photo integration:', error);
      toast.error('Failed to update photo information');
    }
  }, []);

  // Memoize photo data to prevent unnecessary updates
  const photoData = useCallback(() => ({
    photos
  }), [photos]);

  useEffect(() => {
    safeUpdate(photoData());
  }, [photoData, safeUpdate]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    const newPhotos: Photo[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      // Create photo object
      const photo: Photo = {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: URL.createObjectURL(file),
        thumbnail: URL.createObjectURL(file),
        name: file.name,
        description: '',
        category: 'before',
        tags: [],
        timestamp: new Date().toISOString(),
        fileSize: file.size
      };

      // Get image dimensions
      const img = new Image();
      img.onload = () => {
        photo.dimensions = {
          width: img.width,
          height: img.height
        };
      };
      img.src = photo.url;

      // Try to get location if available
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          
          photo.location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            address: 'Location captured'
          };
        } catch (error) {
          // Location not available, continue without it
        }
      }

      newPhotos.push(photo);
    }

    setPhotos(prev => [...prev, ...newPhotos]);
    setIsUploading(false);
    toast.success(`Added ${newPhotos.length} photo(s)`);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updatePhoto = (id: string, updates: Partial<Photo>) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === id ? { ...photo, ...updates } : photo
    ));
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo && photo.url.startsWith('blob:')) {
        URL.revokeObjectURL(photo.url);
        URL.revokeObjectURL(photo.thumbnail);
      }
      return prev.filter(p => p.id !== id);
    });
    toast.success('Photo deleted');
  };

  const addTag = (photoId: string, tag: string) => {
    if (!tag.trim()) return;
    
    updatePhoto(photoId, {
      tags: [...(photos.find(p => p.id === photoId)?.tags || []), tag.trim()]
    });
  };

  const removeTag = (photoId: string, tagIndex: number) => {
    const photo = photos.find(p => p.id === photoId);
    if (!photo) return;
    
    const newTags = photo.tags.filter((_, index) => index !== tagIndex);
    updatePhoto(photoId, { tags: newTags });
  };

  const filteredPhotos = selectedCategory === 'all' 
    ? photos 
    : photos.filter(photo => photo.category === selectedCategory);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category: string) => {
    return categories.find(cat => cat.value === category)?.color || 'bg-gray-100 text-gray-800';
  };

  // Error handling for missing proposal data
  if (!currentProposal && !currentProposalId) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Proposal Data</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load proposal data for photo integration. Please ensure you have a valid proposal loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            Project Photos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Document your project with before, during, and after photos. Perfect for proposals and client communication.
          </p>
          {currentProposalId && (
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                Proposal ID: {currentProposalId}
              </Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Upload Section */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="border-2 border-dashed border-border rounded-lg p-8 hover:border-primary/50 transition-colors">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept="image/*"
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <ImageIcon className="w-8 h-8 text-primary" />
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Add Project Photos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Drag and drop photos here, or click to browse. Multiple files supported.
                  </p>
                </div>
                
                <div className="flex gap-3 justify-center">
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => {
                      // In a real app, this would open camera on mobile
                      fileInputRef.current?.click();
                    }}
                    className="gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Take Photo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter and View Controls */}
      {photos.length > 0 && (
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory('all')}
                >
                  All ({photos.length})
                </Button>
                {categories.map(category => {
                  const count = photos.filter(p => p.category === category.value).length;
                  return count > 0 ? (
                    <Button
                      key={category.value}
                      variant={selectedCategory === category.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label} ({count})
                    </Button>
                  ) : null;
                })}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Photos Display */}
      {filteredPhotos.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="p-8 text-center">
            <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No photos yet</h3>
            <p className="text-muted-foreground">
              {selectedCategory === 'all' 
                ? 'Upload your first project photo to get started.'
                : `No photos in the ${categories.find(c => c.value === selectedCategory)?.label} category.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredPhotos.map(photo => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                      <img
                        src={photo.thumbnail}
                        alt={photo.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    </div>
                    
                    <div className="absolute top-2 left-2">
                      <Badge className={`text-xs ${getCategoryColor(photo.category)}`}>
                        {categories.find(c => c.value === photo.category)?.label}
                      </Badge>
                    </div>
                    
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deletePhoto(photo.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium truncate">{photo.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(photo.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPhotos.map(photo => (
                  <div key={photo.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50">
                    <div className="w-16 h-16 overflow-hidden rounded border bg-muted flex-shrink-0">
                      <img
                        src={photo.thumbnail}
                        alt={photo.name}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedPhoto(photo)}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium truncate">{photo.name}</p>
                        <Badge className={`text-xs ${getCategoryColor(photo.category)}`}>
                          {categories.find(c => c.value === photo.category)?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(photo.timestamp)}
                        </span>
                        <span>{formatFileSize(photo.fileSize)}</span>
                        {photo.dimensions && (
                          <span>{photo.dimensions.width} × {photo.dimensions.height}</span>
                        )}
                        {photo.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            GPS
                          </span>
                        )}
                      </div>
                      
                      {photo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {photo.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedPhoto(photo)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePhoto(photo.id)}
                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Photo Details Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{selectedPhoto.name}</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPhoto(null)}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="aspect-video overflow-hidden rounded-lg border bg-muted">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.name}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <Label>Category</Label>
                    <select
                      value={selectedPhoto.category}
                      onChange={(e) => updatePhoto(selectedPhoto.id, { category: e.target.value as any })}
                      className="w-full mt-1 px-3 py-2 border rounded-md bg-background"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={selectedPhoto.description}
                      onChange={(e) => updatePhoto(selectedPhoto.id, { description: e.target.value })}
                      placeholder="Add a description for this photo"
                      rows={3}
                      className="mt-1 resize-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                      {selectedPhoto.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs gap-1">
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTag(selectedPhoto.id, index)}
                            className="h-3 w-3 p-0 hover:bg-destructive/20"
                          >
                            <X className="w-2 h-2" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add tag"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addTag(selectedPhoto.id, e.currentTarget.value);
                            e.currentTarget.value = '';
                          }
                        }}
                        className="text-sm"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tagSuggestions.filter(tag => !selectedPhoto.tags.includes(tag)).slice(0, 6).map(tag => (
                        <Button
                          key={tag}
                          variant="ghost"
                          size="sm"
                          onClick={() => addTag(selectedPhoto.id, tag)}
                          className="h-6 text-xs"
                        >
                          <Plus className="w-2 h-2 mr-1" />
                          {tag}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      {formatDate(selectedPhoto.timestamp)}
                    </div>
                    <div>Size: {formatFileSize(selectedPhoto.fileSize)}</div>
                    {selectedPhoto.dimensions && (
                      <div>Dimensions: {selectedPhoto.dimensions.width} × {selectedPhoto.dimensions.height}</div>
                    )}
                    {selectedPhoto.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3" />
                        GPS Location Available
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}