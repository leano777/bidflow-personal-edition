import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ArrowLeft, Sparkles, Wand2, FileText, User, MapPin, Calculator, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from './ui/sonner';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AIProposalCreatorProps {
  onProposalGenerated: (proposal: any) => void;
  onBackToHome: () => void;
}

export function AIProposalCreator({ onProposalGenerated, onBackToHome }: AIProposalCreatorProps) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const exampleText = `Client: Paul Horton
Address: 1234 Australia Ln, San Diego, CA
Phone: (619) 555-0123
Email: paul.horton@email.com

Project: Backyard landscape renovation with concrete patio, fire pit, and retaining wall

Scope of Work:
- Install 4-inch thick concrete slab 20x30 feet (600 sq ft) with rebar reinforcement
- Standard grey broom finish
- Excavation and base prep required
- Decorative paver fire pit 6 feet diameter in center of patio
- Build capstone retaining wall 50 linear feet, 3 feet high
- Includes proper drainage, gravel backfill, and capstones
- All materials and labor included
- Site cleanup and final grading

Timeline: 2-3 weeks
Budget range: $15,000 - $25,000`;

  const steps = [
    { name: 'Parsing Input', description: 'Extracting client and project information' },
    { name: 'Calculating Materials', description: 'Determining quantities with waste factors' },
    { name: 'Labor Analysis', description: 'Breaking down work phases and hours' },
    { name: 'Cost Estimation', description: 'Applying current market rates' },
    { name: 'Finalizing Proposal', description: 'Structuring the complete proposal' }
  ];

  const processWithAI = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter project details to process');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentStep(steps[0].name);

    try {
      // Simulate progress through steps
      for (let i = 0; i < steps.length; i++) {
        setCurrentStep(steps[i].name);
        setProgress((i + 1) * 20);
        
        // Add delay to show progress
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Call the backend AI processing endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/ai-process-proposal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ inputText })
      });

      const result = await response.json();

      if (result.success) {
        setProgress(100);
        setCurrentStep('Complete');
        toast.success('Proposal generated successfully!');
        
        // Pass the generated proposal data back to parent
        onProposalGenerated(result.proposal);
      } else {
        throw new Error(result.error || 'Failed to process proposal');
      }
    } catch (error) {
      console.error('AI processing error:', error);
      toast.error(`Failed to generate proposal: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProgress(0);
      setCurrentStep('');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8 lg:mb-12">
          <Button 
            variant="ghost" 
            onClick={onBackToHome}
            className="self-start text-slate-600 hover:text-slate-800 hover:bg-white/50 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-800 to-blue-600 bg-clip-text text-transparent">
              AI Proposal Generator
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Transform consultation notes into detailed proposals instantly
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Input Section */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white hover:shadow-2xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <CardTitle className="flex items-center gap-3 text-slate-800">
                  <div className="p-2 bg-violet-500 rounded-full">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 lg:p-8">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="project-input" className="text-lg font-medium text-slate-700">
                      Describe Your Project
                    </Label>
                    <p className="text-sm text-slate-500 mt-1 mb-3">
                      Include client information, project scope, measurements, materials, and any special requirements
                    </p>
                    <Textarea
                      id="project-input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Enter project details here..."
                      rows={12}
                      className="resize-none border-slate-200 focus:border-violet-400 focus:ring-violet-400/20 transition-all duration-200"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={() => setInputText(exampleText)}
                      variant="outline"
                      className="border-slate-300 text-slate-600 hover:bg-slate-50 transition-all duration-200"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Load Example
                    </Button>
                    <Button
                      onClick={() => setInputText('')}
                      variant="outline"
                      className="border-slate-300 text-slate-600 hover:bg-slate-50 transition-all duration-200"
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            {/* Features Card */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-emerald-50 to-green-50 border-b border-emerald-100">
                <CardTitle className="flex items-center gap-3 text-slate-800 text-lg">
                  <div className="p-2 bg-emerald-500 rounded-full">
                    <Wand2 className="w-4 h-4 text-white" />
                  </div>
                  AI Features
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-blue-500" />
                    <span className="text-sm">Auto-extract client info</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calculator className="w-4 h-4 text-green-500" />
                    <span className="text-sm">Calculate quantities + 10% waste</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span className="text-sm">Organize work phases</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <span className="text-sm">Estimate labor hours</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips Card */}
            <Card className="border-0 shadow-lg bg-white">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <CardTitle className="flex items-center gap-3 text-slate-800 text-lg">
                  <div className="p-2 bg-amber-500 rounded-full">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  Pro Tips
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm text-slate-600">
                  <p>• Include specific measurements</p>
                  <p>• Mention material preferences</p>
                  <p>• Note site conditions</p>
                  <p>• Specify finish requirements</p>
                  <p>• Include timeline expectations</p>
                </div>
              </CardContent>
            </Card>

            {/* Processing Status */}
            {isProcessing && (
              <Card className="border-0 shadow-lg bg-white">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-3 text-slate-800 text-lg">
                    <div className="p-2 bg-blue-500 rounded-full">
                      <Sparkles className="w-4 h-4 text-white animate-spin" />
                    </div>
                    Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">
                        {currentStep}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {progress}%
                      </Badge>
                    </div>
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-slate-500">
                      {steps.find(s => s.name === currentStep)?.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={processWithAI}
            disabled={isProcessing || !inputText.trim()}
            size="lg"
            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 px-8 py-4 text-lg"
          >
            {isProcessing ? (
              <>
                <Sparkles className="w-5 h-5 mr-3 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5 mr-3" />
                Generate Proposal with AI
              </>
            )}
          </Button>
          <p className="text-sm text-slate-500 mt-3">
            AI will analyze your input and create a detailed proposal in seconds
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}