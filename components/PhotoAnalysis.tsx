import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Camera, Upload, X, Check, Eye, Zap, AlertTriangle, Ruler } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AnalysisResult {
  id: string;
  description: string;
  category: 'materials' | 'labor' | 'condition' | 'measurement' | 'hazard';
  confidence: number;
  suggestedQuantity?: number;
  suggestedUnit?: string;
  suggestedPrice?: number;
  notes?: string;
}

interface PhotoAnalysisProps {
  onScopeItemsGenerated: (items: any[]) => void;
  onConditionsDetected: (conditions: string[]) => void;
}

export function PhotoAnalysis({ onScopeItemsGenerated, onConditionsDetected }: PhotoAnalysisProps) {
  const [images, setImages] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    setImages(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const analyzePhotos = async () => {
    if (images.length === 0) {
      toast.error('Please select at least one photo to analyze');
      return;
    }

    setAnalyzing(true);
    setProgress(0);
    setResults([]);

    try {
      // Convert images to base64
      const imageData = await Promise.all(
        images.map(async (image) => {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(image);
          });
        })
      );

      setProgress(30);

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/analyze-photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          images: imageData,
          analysisType: 'construction_assessment'
        })
      });

      setProgress(70);

      const result = await response.json();

      if (result.success) {
        setResults(result.analysis || []);
        setProgress(100);
        toast.success(`Analysis complete! Found ${result.analysis?.length || 0} items`);
        setShowResults(true);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Photo analysis error:', error);
      toast.error('Failed to analyze photos. Please try again.');
    } finally {
      setAnalyzing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const applySuggestions = () => {
    // Convert analysis results to scope items
    const scopeItems = results
      .filter(result => result.category === 'materials' || result.category === 'labor')
      .map(result => ({
        id: Date.now().toString() + Math.random(),
        description: result.description,
        quantity: result.suggestedQuantity || 1,
        unit: result.suggestedUnit || 'unit',
        isLabor: result.category === 'labor',
        materialCost: result.category === 'materials' ? result.suggestedPrice || 0 : undefined,
        laborRate: result.category === 'labor' ? result.suggestedPrice || 75 : undefined,
        total: (result.suggestedQuantity || 1) * (result.suggestedPrice || 0),
        aiGenerated: true,
        confidence: result.confidence
      }));

    // Extract conditions and hazards
    const conditions = results
      .filter(result => result.category === 'condition' || result.category === 'hazard')
      .map(result => result.description);

    onScopeItemsGenerated(scopeItems);
    onConditionsDetected(conditions);

    toast.success(`Added ${scopeItems.length} items and ${conditions.length} conditions`);
    setShowResults(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'materials': return '🧱';
      case 'labor': return '👷';
      case 'condition': return '📋';
      case 'measurement': return '📏';
      case 'hazard': return '⚠️';
      default: return '📷';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'materials': return 'bg-blue-100 text-blue-800';
      case 'labor': return 'bg-green-100 text-green-800';
      case 'condition': return 'bg-gray-100 text-gray-800';
      case 'measurement': return 'bg-purple-100 text-purple-800';
      case 'hazard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            AI Photo Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFileSelect(e.dataTransfer.files);
            }}
          >
            <div className="space-y-4">
              <Camera className="w-12 h-12 mx-auto text-gray-400" />
              <div>
                <p className="font-medium">Upload site photos for AI analysis</p>
                <p className="text-sm text-gray-600">
                  Get automatic scope suggestions, measurements, and condition assessments
                </p>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Choose Files
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files)}
                />
              </div>
              <p className="text-xs text-gray-500">
                Upload up to 5 images (JPG, PNG, WebP • Max 10MB each)
              </p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {analyzing && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analyzing photos...</span>
                    <span className="text-sm text-gray-600">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={analyzePhotos}
                  disabled={analyzing}
                  className="flex-1"
                >
                  {analyzing ? (
                    <>
                      <Zap className="w-4 h-4 mr-2 animate-pulse" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze Photos
                    </>
                  )}
                </Button>
                {results.length > 0 && (
                  <Button variant="outline" onClick={() => setShowResults(true)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Results
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Photo Analysis Results</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No analysis results available.</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3">
                  {results.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{getCategoryIcon(result.category)}</span>
                            <Badge className={getCategoryColor(result.category)}>
                              {result.category}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(result.confidence * 100)}% confidence
                            </Badge>
                          </div>
                          
                          <h4 className="font-semibold mb-1">{result.description}</h4>
                          
                          <div className="text-sm text-gray-600 space-y-1">
                            {result.suggestedQuantity && (
                              <div className="flex items-center gap-4">
                                <span><Ruler className="w-3 h-3 inline mr-1" />Quantity: {result.suggestedQuantity} {result.suggestedUnit}</span>
                                {result.suggestedPrice && (
                                  <span>Price: ${result.suggestedPrice}</span>
                                )}
                              </div>
                            )}
                            {result.notes && (
                              <p className="text-xs bg-gray-50 p-2 rounded">{result.notes}</p>
                            )}
                          </div>
                        </div>
                        
                        {result.confidence > 0.7 && (
                          <Check className="w-5 h-5 text-green-600 mt-1" />
                        )}
                        {result.confidence < 0.5 && (
                          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-1" />
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button onClick={applySuggestions} className="flex-1">
                    <Check className="w-4 h-4 mr-2" />
                    Apply Suggestions
                  </Button>
                  <Button variant="outline" onClick={() => setShowResults(false)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}