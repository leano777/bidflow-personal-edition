import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  Download, 
  FileText, 
  Table, 
  Mail, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Loader2,
  FileDown,
  Package
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from './ui/dropdown-menu';
import { useToast } from './ui/use-toast';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface ExportManagerProps {
  proposal: any;
  brandSettings: any;
  onEmailSend?: (format: 'pdf' | 'excel', emailData: any) => Promise<void>;
  disabled?: boolean;
}

interface ExportJob {
  id: string;
  format: 'pdf' | 'excel';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  fileName: string;
  downloadUrl?: string;
  error?: string;
  createdAt: Date;
}

export function ExportManager({ proposal, brandSettings, onEmailSend, disabled = false }: ExportManagerProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const downloadRef = useRef<HTMLAnchorElement>(null);

  // Generate unique job ID
  const generateJobId = () => `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create export job
  const createExportJob = (format: 'pdf' | 'excel'): ExportJob => {
    const jobId = generateJobId();
    const fileName = `${proposal?.projectTitle || 'Proposal'}_${format.toUpperCase()}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    
    return {
      id: jobId,
      format,
      status: 'pending',
      progress: 0,
      fileName,
      createdAt: new Date()
    };
  };

  // Update export job status
  const updateExportJob = (jobId: string, updates: Partial<ExportJob>) => {
    setExportJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, ...updates } : job
    ));
  };

  // Remove completed jobs after delay
  const cleanupCompletedJob = (jobId: string) => {
    setTimeout(() => {
      setExportJobs(prev => prev.filter(job => job.id !== jobId));
    }, 30000); // Remove after 30 seconds
  };

  // PDF Export Function
  const exportToPDF = async (job: ExportJob) => {
    try {
      updateExportJob(job.id, { status: 'processing', progress: 10 });

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        updateExportJob(job.id, { 
          progress: Math.min(90, job.progress + Math.random() * 20) 
        });
      }, 500);

      // Prepare data for PDF generation
      const exportData = {
        proposal,
        brandSettings,
        exportOptions: {
          includeLineItems: true,
          includeBrandLogo: true,
          includeSignatures: true,
          includeTerms: true,
          templateStyle: brandSettings?.templateStyle || 'professional',
          headerStyle: brandSettings?.headerStyle || 'gradient'
        }
      };

      updateExportJob(job.id, { progress: 50 });

      // Call backend PDF generation endpoint
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/export/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`PDF generation failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      updateExportJob(job.id, { 
        status: 'completed', 
        progress: 100, 
        downloadUrl 
      });

      // Auto-download
      if (downloadRef.current) {
        downloadRef.current.href = downloadUrl;
        downloadRef.current.download = job.fileName;
        downloadRef.current.click();
      }

      toast({
        title: "PDF Export Complete",
        description: `${job.fileName} has been generated successfully.`,
      });

      cleanupCompletedJob(job.id);

    } catch (error) {
      console.error('PDF export error:', error);
      updateExportJob(job.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'PDF export failed' 
      });
      
      toast({
        title: "PDF Export Failed",
        description: "There was an error generating the PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Excel Export Function
  const exportToExcel = async (job: ExportJob) => {
    try {
      updateExportJob(job.id, { status: 'processing', progress: 10 });

      const progressInterval = setInterval(() => {
        updateExportJob(job.id, { 
          progress: Math.min(90, job.progress + Math.random() * 20) 
        });
      }, 500);

      // Prepare structured data for Excel
      const exportData = {
        proposal: {
          ...proposal,
          // Process scope of work for Excel format
          scopeOfWork: proposal?.scopeOfWork?.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            materialCost: item.materialCost || 0,
            laborRate: item.laborRate || 0,
            laborHours: item.laborHours || 0,
            total: item.total || 0,
            category: item.isLabor ? 'Labor' : 'Materials',
            wasteFactor: item.wasteFactor || 0
          }))
        },
        brandSettings,
        exportOptions: {
          includeSummary: true,
          includeDetailedBreakdown: true,
          includeFormulas: true,
          separateWorksheets: true
        }
      };

      updateExportJob(job.id, { progress: 50 });

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-e0c14ace/export/excel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`Excel generation failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);

      updateExportJob(job.id, { 
        status: 'completed', 
        progress: 100, 
        downloadUrl 
      });

      // Auto-download
      if (downloadRef.current) {
        downloadRef.current.href = downloadUrl;
        downloadRef.current.download = job.fileName;
        downloadRef.current.click();
      }

      toast({
        title: "Excel Export Complete",
        description: `${job.fileName} has been generated successfully.`,
      });

      cleanupCompletedJob(job.id);

    } catch (error) {
      console.error('Excel export error:', error);
      updateExportJob(job.id, { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Excel export failed' 
      });
      
      toast({
        title: "Excel Export Failed",
        description: "There was an error generating the Excel file. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Main export handler
  const handleExport = async (format: 'pdf' | 'excel') => {
    if (!proposal) {
      toast({
        title: "Export Error", 
        description: "No proposal data available for export.",
        variant: "destructive"
      });
      return;
    }

    const job = createExportJob(format);
    setExportJobs(prev => [job, ...prev]);
    setIsExporting(true);

    try {
      if (format === 'pdf') {
        await exportToPDF(job);
      } else {
        await exportToExcel(job);
      }
    } finally {
      setIsExporting(false);
    }
  };

  // Email export handler
  const handleEmailExport = async (format: 'pdf' | 'excel') => {
    if (!onEmailSend) {
      toast({
        title: "Email Not Available",
        description: "Email functionality is not configured.",
        variant: "destructive"
      });
      return;
    }

    try {
      const emailData = {
        recipientEmail: proposal?.clientEmail || '',
        recipientName: proposal?.clientName || '',
        subject: `Proposal: ${proposal?.projectTitle || 'Construction Project'}`,
        message: `Please find attached the proposal for your ${proposal?.projectTitle || 'construction project'}.`,
        attachmentFormat: format
      };

      await onEmailSend(format, emailData);
      
      toast({
        title: "Email Sent",
        description: `Proposal ${format.toUpperCase()} has been sent successfully.`,
      });
    } catch (error) {
      console.error('Email export error:', error);
      toast({
        title: "Email Failed",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Get status icon
  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
    }
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const activeJobs = exportJobs.filter(job => job.status === 'processing' || job.status === 'pending');
  const recentJobs = exportJobs.slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Export Manager
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Export Actions */}
        <div className="flex flex-wrap gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="default" 
                className="gap-2"
                disabled={disabled || isExporting}
              >
                <FileText className="w-4 h-4" />
                PDF Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>PDF Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </DropdownMenuItem>
              {onEmailSend && (
                <DropdownMenuItem onClick={() => handleEmailExport('pdf')}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email PDF
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                className="gap-2"
                disabled={disabled || isExporting}
              >
                <Table className="w-4 h-4" />
                Excel Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Excel Options</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Download Excel
              </DropdownMenuItem>
              {onEmailSend && (
                <DropdownMenuItem onClick={() => handleEmailExport('excel')}>
                  <Mail className="w-4 h-4 mr-2" />
                  Email Excel
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Active Exports */}
        {activeJobs.length > 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Active Exports
            </h4>
            {activeJobs.map(job => (
              <div key={job.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="text-sm font-medium">{job.fileName}</span>
                    <Badge variant={getStatusBadgeVariant(job.status)} className="text-xs">
                      {job.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {job.progress}%
                  </span>
                </div>
                <Progress value={job.progress} className="h-2" />
                {job.error && (
                  <p className="text-xs text-red-600 mt-1">{job.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Recent Exports */}
        {recentJobs.length > 0 && activeJobs.length === 0 && (
          <div className="space-y-2">
            <Separator />
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              Recent Exports
            </h4>
            {recentJobs.map(job => (
              <div key={job.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status)}
                  <span className="text-sm">{job.fileName}</span>
                  <Badge variant={getStatusBadgeVariant(job.status)} className="text-xs">
                    {job.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {job.createdAt.toLocaleTimeString()}
                  </span>
                  {job.downloadUrl && job.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (downloadRef.current) {
                          downloadRef.current.href = job.downloadUrl!;
                          downloadRef.current.download = job.fileName;
                          downloadRef.current.click();
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Export Info */}
        <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
          <h5 className="font-semibold mb-1">Export Features:</h5>
          <ul className="space-y-1 ml-2">
            <li>• PDF exports include full branding and professional formatting</li>
            <li>• Excel exports provide detailed breakdowns with formulas</li>
            <li>• All exports maintain brand consistency and styling</li>
            <li>• Files are automatically downloaded upon completion</li>
          </ul>
        </div>

        {/* Hidden download anchor */}
        <a ref={downloadRef} style={{ display: 'none' }} />
      </CardContent>
    </Card>
  );
}

export default ExportManager;
