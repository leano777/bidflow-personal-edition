import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  ExternalLink, 
  Mail, 
  Lock, 
  Eye, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  Share2,
  User,
  Calendar,
  DollarSign,
  FileText,
  Phone,
  Copy,
  Shield
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ClientPortalProps {
  proposal: any;
  onUpdate: (updates: any) => void;
}

export function ClientPortal({ proposal, onUpdate }: ClientPortalProps) {
  const [portalSettings, setPortalSettings] = useState({
    isEnabled: proposal?.clientPortal?.isEnabled || false,
    accessCode: proposal?.clientPortal?.accessCode || generateAccessCode(),
    allowComments: proposal?.clientPortal?.allowComments || true,
    requireApproval: proposal?.clientPortal?.requireApproval || true,
    emailNotifications: proposal?.clientPortal?.emailNotifications || true,
    expiresAt: proposal?.clientPortal?.expiresAt || getDefaultExpiryDate(),
    customMessage: proposal?.clientPortal?.customMessage || '',
    branding: proposal?.clientPortal?.branding || {
      showLogo: true,
      companyName: 'Lineage Builders Inc.',
      primaryColor: '#2563eb'
    }
  });

  const [clientFeedback, setClientFeedback] = useState(proposal?.clientPortal?.feedback || []);
  const [portalUrl, setPortalUrl] = useState('');

  function generateAccessCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  function getDefaultExpiryDate() {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  }

  // Store onUpdate in ref to prevent dependency issues
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;

  // Safe update function with error handling
  const safeUpdate = useCallback((data: any) => {
    try {
      if (typeof updateRef.current === 'function') {
        updateRef.current(data);
      } else {
        console.warn('onUpdate is not a function in ClientPortal');
      }
    } catch (error) {
      console.error('Error updating client portal:', error);
      toast.error('Failed to update client portal information');
    }
  }, []);

  // Memoize portal data to prevent unnecessary updates
  const portalData = useCallback(() => ({
    clientPortal: {
      ...portalSettings,
      feedback: clientFeedback,
      portalUrl: portalUrl
    }
  }), [portalSettings, clientFeedback, portalUrl]);

  useEffect(() => {
    // Generate portal URL
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/portal/${proposal?.id || 'preview'}?code=${portalSettings.accessCode}`;
    
    if (url !== portalUrl) {
      setPortalUrl(url);
    }
  }, [proposal?.id, portalSettings.accessCode, portalUrl]);

  useEffect(() => {
    // Update parent component only when data actually changes
    safeUpdate(portalData());
  }, [portalData, safeUpdate]);

  const updateSettings = (updates: any) => {
    setPortalSettings(prev => ({ ...prev, ...updates }));
  };

  const copyPortalUrl = () => {
    navigator.clipboard.writeText(portalUrl);
    toast.success('Portal URL copied to clipboard');
  };

  const sendPortalInvite = () => {
    // In a real app, this would send an email
    const subject = `Proposal Review: ${proposal?.projectTitle || 'Your Project'}`;
    const body = `
Hi ${proposal?.clientName || 'Valued Client'},

Your construction proposal is ready for review. Please visit the secure client portal to view the details and provide your feedback.

Portal Link: ${portalUrl}
Access Code: ${portalSettings.accessCode}

This link expires on ${new Date(portalSettings.expiresAt).toLocaleDateString()}.

Best regards,
${portalSettings.branding.companyName}
    `.trim();

    const mailtoUrl = `mailto:${proposal?.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
    toast.success('Email client opened with invitation');
  };

  const addFeedback = (type: 'comment' | 'approval' | 'request_change', message: string) => {
    const feedback = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toISOString(),
      author: proposal?.clientName || 'Client'
    };
    setClientFeedback(prev => [...prev, feedback]);
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateProjectTotal = () => {
    const scopeOfWork = proposal?.scopeOfWork || [];
    const subtotal = scopeOfWork.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    return subtotal * 1.30; // 30% markup
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'changes_requested': return 'bg-orange-100 text-orange-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Error handling for missing proposal data
  if (!proposal) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Proposal Data</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load proposal data for client portal setup. Please ensure you have a valid proposal loaded.
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
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            Client Portal
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create a secure portal for clients to review proposals, leave feedback, and approve projects.
          </p>
        </CardHeader>
      </Card>

      {/* Portal Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Portal Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Portal Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Enable Client Portal</h3>
              <p className="text-sm text-muted-foreground">
                Allow clients to view and interact with this proposal online
              </p>
            </div>
            <Button
              variant={portalSettings.isEnabled ? 'default' : 'outline'}
              onClick={() => updateSettings({ isEnabled: !portalSettings.isEnabled })}
            >
              {portalSettings.isEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {portalSettings.isEnabled && (
            <div className="space-y-4">
              {/* Access Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Access Code</Label>
                  <div className="flex gap-2">
                    <Input
                      value={portalSettings.accessCode}
                      onChange={(e) => updateSettings({ accessCode: e.target.value.toUpperCase() })}
                      className="font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => updateSettings({ accessCode: generateAccessCode() })}
                    >
                      Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Clients need this code to access the portal
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Expires On</Label>
                  <Input
                    type="date"
                    value={portalSettings.expiresAt}
                    onChange={(e) => updateSettings({ expiresAt: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Portal access will be disabled after this date
                  </p>
                </div>
              </div>

              {/* Feature Settings */}
              <div className="space-y-3">
                <h4 className="font-semibold">Features</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={portalSettings.allowComments}
                      onChange={(e) => updateSettings({ allowComments: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Allow client comments and questions</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={portalSettings.requireApproval}
                      onChange={(e) => updateSettings({ requireApproval: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Require client approval to proceed</span>
                  </label>
                  
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={portalSettings.emailNotifications}
                      onChange={(e) => updateSettings({ emailNotifications: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Send email notifications for activity</span>
                  </label>
                </div>
              </div>

              {/* Custom Message */}
              <div className="space-y-2">
                <Label>Welcome Message (Optional)</Label>
                <Textarea
                  value={portalSettings.customMessage}
                  onChange={(e) => updateSettings({ customMessage: e.target.value })}
                  placeholder="Add a personalized message for your client..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Portal URL & Sharing */}
      {portalSettings.isEnabled && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Share Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Portal URL</Label>
              <div className="flex gap-2">
                <Input
                  value={portalUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button variant="outline" onClick={copyPortalUrl}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={sendPortalInvite} className="gap-2">
                <Mail className="w-4 h-4" />
                Send Email Invitation
              </Button>
              
              <Button variant="outline" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                Preview Portal
              </Button>
            </div>

            <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
              <h4 className="font-semibold mb-2">Client Instructions:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                <li>Click the portal link or copy it to your browser</li>
                <li>Enter access code: <code className="bg-muted px-1 rounded">{portalSettings.accessCode}</code></li>
                <li>Review the proposal details and pricing</li>
                <li>Leave comments or questions if needed</li>
                <li>Approve or request changes when ready</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portal Preview */}
      {portalSettings.isEnabled && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Portal Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              This is how your client will see the proposal
            </p>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-6 bg-background">
              {/* Portal Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-xl font-bold">{proposal?.projectTitle || 'Project Proposal'}</h1>
                  <p className="text-muted-foreground">For {proposal?.clientName || 'Client'}</p>
                </div>
                <Badge className={getStatusColor(proposal?.status || 'pending')}>
                  {proposal?.status || 'Pending Review'}
                </Badge>
              </div>

              {/* Custom Message */}
              {portalSettings.customMessage && (
                <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm">{portalSettings.customMessage}</p>
                </div>
              )}

              {/* Project Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 border rounded-lg">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculateProjectTotal())}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Investment</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-600">
                    {proposal?.timeline || '2-3 weeks'}
                  </div>
                  <div className="text-sm text-muted-foreground">Timeline</div>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-600">
                    {proposal?.scopeOfWork?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Scope Items</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                <Button className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Approve Proposal
                </Button>
                
                <Button variant="outline" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Request Changes
                </Button>
                
                <Button variant="outline" className="gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Questions? Contact Us</h3>
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>(555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>info@lineagebuilders.com</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Feedback */}
      {clientFeedback.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Client Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientFeedback.map(feedback => (
                <div key={feedback.id} className="flex gap-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {feedback.type === 'approval' ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : feedback.type === 'request_change' ? (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{feedback.author}</span>
                      <Badge variant="outline" className="text-xs">
                        {feedback.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(feedback.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm">{feedback.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Feedback (for testing) */}
      {portalSettings.isEnabled && process.env.NODE_ENV === 'development' && (
        <Card className="glass-card border-dashed">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Demo: Simulate Client Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFeedback('comment', 'This looks great! I have a few questions about the timeline.')}
              >
                Add Comment
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFeedback('approval', 'I approve this proposal. When can we start?')}
              >
                Approve
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => addFeedback('request_change', 'Could we add an additional bathroom to the scope?')}
              >
                Request Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}