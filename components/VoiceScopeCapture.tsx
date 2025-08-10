// Voice-to-Scope UI Component - BF-003 Implementation
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { 
  Mic, 
  MicOff, 
  Camera, 
  Play, 
  Pause, 
  Square, 
  Download,
  Edit3,
  FileText,
  Ruler,
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import { 
  VoiceScopeService, 
  ScopeCapture, 
  ScopeAnalysisResult,
  VoiceRecorderState,
  demonstrateVoiceScope
} from '../lib/voice-scope';

export interface VoiceScopeCaptureProps {
  onScopeCapture?: (capture: ScopeCapture, analysis: ScopeAnalysisResult) => void;
  onTranscriptionUpdate?: (text: string) => void;
  className?: string;
  enableDemo?: boolean;
}

export default function VoiceScopeCapture({
  onScopeCapture,
  onTranscriptionUpdate,
  className = '',
  enableDemo = true
}: VoiceScopeCaptureProps) {
  // Core state
  const [voiceService] = useState(() => new VoiceScopeService({
    enableRealTime: true,
    enablePhotoCapture: true,
    transcriptionOptions: {
      enhanceConstruction: true,
      includeTimestamps: true
    }
  }));

  const [recorderState, setRecorderState] = useState<VoiceRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioLevel: 0
  });

  // Capture state
  const [currentCaptureId, setCurrentCaptureId] = useState<string | null>(null);
  const [scopeCapture, setScopeCapture] = useState<ScopeCapture | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ScopeAnalysisResult | null>(null);

  // UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [realTimeTranscript, setRealTimeTranscript] = useState('');
  const [editedTranscript, setEditedTranscript] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [processingStep, setProcessingStep] = useState<string>('');

  // Feature support
  const [featureSupport, setFeatureSupport] = useState(VoiceScopeService.getSupportStatus());

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      voiceService.dispose();
    };
  }, [voiceService]);

  /**
   * Start voice recording
   */
  const startRecording = async () => {
    try {
      const captureId = await voiceService.startCapture();
      setCurrentCaptureId(captureId);
      
      // Start real-time transcription if supported
      if (featureSupport.realTimeTranscription) {
        await voiceService.startRealTimeTranscription(
          (text, isFinal) => {
            setRealTimeTranscript(text);
            if (onTranscriptionUpdate) {
              onTranscriptionUpdate(text);
            }
          },
          (measurements) => {
            console.log('Real-time measurements:', measurements);
            toast.info(`Found ${measurements.length} measurements`);
          },
          (error) => {
            toast.error(`Transcription error: ${error}`);
          }
        );
      }

      setRecorderState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioLevel: 0
      });

      // Start duration counter
      let startTime = Date.now();
      durationIntervalRef.current = setInterval(() => {
        setRecorderState(prev => ({
          ...prev,
          duration: Math.floor((Date.now() - startTime) / 1000)
        }));
      }, 1000);

      toast.success('Voice recording started');
      
    } catch (error) {
      toast.error(`Failed to start recording: ${error}`);
    }
  };

  /**
   * Stop recording and process
   */
  const stopRecordingAndProcess = async () => {
    if (!currentCaptureId) return;
    
    setIsProcessing(true);
    setProcessingStep('Stopping recording...');
    
    try {
      // Stop real-time transcription
      voiceService.stopRealTimeTranscription();

      // Clear duration interval
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setProcessingStep('Processing audio...');
      
      // Process photos if any
      let photoUrls: string[] = [];
      if (selectedPhotos.length > 0) {
        photoUrls = await voiceService.addPhotos(currentCaptureId, selectedPhotos);
      }

      // Stop capture and process
      const capture = await voiceService.stopCaptureAndProcess(currentCaptureId, photoUrls);
      setScopeCapture(capture);
      setEditedTranscript(capture.transcription);
      
      setProcessingStep('Organizing scope...');
      
      // Organize scope
      const analysis = await voiceService.organizeScope(capture);
      setAnalysisResult(analysis);

      // Notify parent component
      if (onScopeCapture) {
        onScopeCapture(capture, analysis);
      }

      setRecorderState({
        isRecording: false,
        isPaused: false,
        duration: recorderState.duration,
        audioLevel: 0
      });

      toast.success('Voice capture completed successfully!');
      
    } catch (error) {
      toast.error(`Processing failed: ${error}`);
      console.error('Voice capture error:', error);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
      setCurrentCaptureId(null);
    }
  };

  /**
   * Run demo workflow
   */
  const runDemo = async () => {
    setIsProcessing(true);
    setProcessingStep('Running demonstration...');
    
    try {
      // Run the demonstration
      await demonstrateVoiceScope();
      
      // Create mock data for UI
      const mockCapture: ScopeCapture = {
        id: 'demo_capture',
        transcription: 'We need to install hardwood flooring in the living room that\'s about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides. The bathroom needs 3 new outlets and we should replace the old toilet.',
        editedText: 'We need to install hardwood flooring in the living room that\'s about 20 by 15 feet. Also need to frame out a new wall using 2x4 studs with drywall on both sides. The bathroom needs 3 new outlets and we should replace the old toilet.',
        contextPhotos: [],
        measurements: [
          {
            id: 'demo_1',
            rawText: '20 by 15 feet',
            parsedValue: 300,
            unit: 'SF',
            type: 'square',
            confidence: 0.95,
            context: 'living room that\'s about 20 by 15 feet'
          },
          {
            id: 'demo_2',
            rawText: '3 new outlets',
            parsedValue: 3,
            unit: 'EA',
            type: 'count',
            confidence: 0.9,
            context: 'bathroom needs 3 new outlets'
          }
        ],
        timestamp: new Date(),
        duration: 45,
        confidence: 0.92
      };

      setScopeCapture(mockCapture);
      setEditedTranscript(mockCapture.transcription);
      
      // Organize the mock scope
      const analysis = await voiceService.organizeScope(mockCapture);
      setAnalysisResult(analysis);

      if (onScopeCapture) {
        onScopeCapture(mockCapture, analysis);
      }

      toast.success('Demo completed! Check console for detailed output.');
      
    } catch (error) {
      toast.error(`Demo failed: ${error}`);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  /**
   * Update edited transcription
   */
  const saveEditedTranscription = () => {
    if (scopeCapture) {
      const updated = voiceService.updateTranscription(scopeCapture.id, editedTranscript);
      setScopeCapture(updated);
      setIsEditing(false);
      toast.success('Transcription updated');
    }
  };

  /**
   * Handle photo selection
   */
  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setSelectedPhotos(files);
    toast.info(`${files.length} photos selected`);
  };

  /**
   * Export capture data
   */
  const exportCapture = (format: 'json' | 'text' = 'json') => {
    if (!scopeCapture) return;
    
    const exported = voiceService.exportCapture(scopeCapture, format);
    const blob = new Blob([exported], { 
      type: format === 'json' ? 'application/json' : 'text/plain' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `voice-scope-${scopeCapture.id}.${format}`;
    link.click();
    
    URL.revokeObjectURL(url);
    toast.success(`Exported as ${format.toUpperCase()}`);
  };

  /**
   * Format duration for display
   */
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Feature Support Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Voice-to-Scope Capture
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              {featureSupport.audioRecording ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">Audio Recording</span>
            </div>
            <div className="flex items-center gap-2">
              {featureSupport.realTimeTranscription ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              )}
              <span className="text-sm">Real-time</span>
            </div>
            <div className="flex items-center gap-2">
              {featureSupport.fileTranscription ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">File Processing</span>
            </div>
            <div className="flex items-center gap-2">
              {featureSupport.photoCapture ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">Photo Capture</span>
            </div>
          </div>

          {/* Recording Controls */}
          <div className="flex flex-wrap items-center gap-4">
            {!recorderState.isRecording && !isProcessing ? (
              <>
                <Button onClick={startRecording} className="flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  Start Recording
                </Button>
                {enableDemo && (
                  <Button onClick={runDemo} variant="outline" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Run Demo
                  </Button>
                )}
              </>
            ) : recorderState.isRecording && !isProcessing ? (
              <Button onClick={stopRecordingAndProcess} variant="destructive" className="flex items-center gap-2">
                <Square className="w-4 h-4" />
                Stop & Process
              </Button>
            ) : (
              <Button disabled className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {processingStep || 'Processing...'}
              </Button>
            )}

            {/* Photo Upload */}
            {featureSupport.photoCapture && (
              <>
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Camera className="w-4 h-4" />
                  Add Photos ({selectedPhotos.length})
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Recording Status */}
          {recorderState.isRecording && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  <span className="font-medium">Recording</span>
                </div>
                <span className="text-lg font-mono">
                  {formatDuration(recorderState.duration)}
                </span>
              </div>
              {realTimeTranscript && (
                <div className="mt-2 p-2 bg-white rounded text-sm">
                  <strong>Live Transcript:</strong> {realTimeTranscript}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{processingStep}</span>
            </div>
            <Progress value={50} className="mt-2" />
          </CardContent>
        </Card>
      )}

      {/* Transcription Results */}
      {scopeCapture && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Transcription Results
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {(scopeCapture.confidence ? (scopeCapture.confidence * 100).toFixed(1) : '0.0')}% confidence
                </Badge>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  variant="outline"
                  size="sm"
                >
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <Label htmlFor="edited-transcript">Edit Transcription:</Label>
                <Textarea
                  id="edited-transcript"
                  value={editedTranscript}
                  onChange={(e) => setEditedTranscript(e.target.value)}
                  rows={6}
                  className="min-h-[150px]"
                />
                <div className="flex gap-2">
                  <Button onClick={saveEditedTranscription}>
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => {
                      setEditedTranscript(scopeCapture.transcription);
                      setIsEditing(false);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="whitespace-pre-wrap">{scopeCapture.editedText}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span>Duration: {scopeCapture.duration ? formatDuration(scopeCapture.duration) : 'Unknown'}</span>
                  <span>•</span>
                  <span>Captured: {scopeCapture.timestamp.toLocaleString()}</span>
                  {scopeCapture.contextPhotos.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{scopeCapture.contextPhotos.length} photos</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Measurements */}
      {scopeCapture?.measurements && scopeCapture.measurements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="w-5 h-5" />
              Extracted Measurements ({scopeCapture.measurements.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {scopeCapture.measurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">"{measurement.rawText}"</div>
                    <div className="text-sm text-gray-500">
                      Context: {measurement.context}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {measurement.parsedValue} {measurement.unit}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={measurement.type === 'square' ? 'default' : 'outline'}>
                        {measurement.type}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {(measurement.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scope Analysis */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Scope Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Project Summary */}
              <div>
                <h3 className="font-medium mb-2">Project Summary</h3>
                <p className="text-gray-600">{analysisResult.organized.projectSummary}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span>Timeline: {analysisResult.organized.estimatedTimeline}</span>
                  <span>•</span>
                  <span>Confidence: {(analysisResult.confidence * 100).toFixed(1)}%</span>
                  <span>•</span>
                  <span>Processed in {analysisResult.processingTime}ms</span>
                </div>
              </div>

              {/* Work Categories */}
              {analysisResult.organized.workCategories.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Work Categories ({analysisResult.organized.workCategories.length})</h3>
                  <div className="grid gap-3">
                    {analysisResult.organized.workCategories.map((category) => (
                      <div key={category.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{category.trade}</h4>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                category.riskLevel === 'high' ? 'destructive' :
                                category.riskLevel === 'medium' ? 'default' : 'secondary'
                              }
                            >
                              {category.riskLevel} risk
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {category.estimatedDuration}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          {category.items.map((item) => (
                            <div key={item.id} className="text-sm text-gray-600">
                              • {item.description}
                              {item.quantity && (
                                <span className="ml-2 text-blue-600">
                                  ({item.quantity} {item.unit})
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Labor Requirements */}
              {analysisResult.organized.laborRequirements.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Labor Requirements</h3>
                  <div className="grid gap-2">
                    {analysisResult.organized.laborRequirements.map((labor) => (
                      <div key={labor.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <span className="font-medium">{labor.trade}</span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({labor.skillLevel})
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {labor.crewSize} workers × {labor.hoursRequired} hours
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysisResult.suggestions.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-blue-600">💡 Suggestions</h3>
                  <div className="space-y-1">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <div key={index} className="text-sm text-blue-600">
                        • {suggestion}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {analysisResult.warnings.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2 text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </h3>
                  <div className="space-y-1">
                    {analysisResult.warnings.map((warning, index) => (
                      <div key={index} className="text-sm text-orange-600">
                        • {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="flex gap-2 mt-6 pt-6 border-t">
              <Button 
                onClick={() => exportCapture('json')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </Button>
              <Button 
                onClick={() => exportCapture('text')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Text
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
