import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  ExternalLink,
  Copy,
  Mail,
  Shield,
  Zap,
  Calendar,
  Receipt
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface PaymentCollectionProps {
  proposal: any;
  progressBilling?: any;
  onUpdate: (updates: any) => void;
}

interface PaymentLink {
  id: string;
  type: 'deposit' | 'milestone' | 'final';
  amount: number;
  description: string;
  status: 'pending' | 'paid' | 'failed' | 'expired';
  url: string;
  dueDate?: string;
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
}

export function PaymentCollection({ proposal, progressBilling, onUpdate }: PaymentCollectionProps) {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>(proposal?.paymentLinks || []);
  const [stripeSettings, setStripeSettings] = useState({
    isEnabled: proposal?.stripeSettings?.isEnabled || false,
    publishableKey: proposal?.stripeSettings?.publishableKey || '',
    accountId: proposal?.stripeSettings?.accountId || '',
    processingFee: proposal?.stripeSettings?.processingFee || 2.9, // Stripe's standard rate
    collectProcessingFee: proposal?.stripeSettings?.collectProcessingFee || false
  });

  const [paymentSettings, setPaymentSettings] = useState({
    acceptCards: proposal?.paymentSettings?.acceptCards || true,
    acceptBankTransfer: proposal?.paymentSettings?.acceptBankTransfer || false,
    acceptCheck: proposal?.paymentSettings?.acceptCheck || true,
    requirePaymentUpfront: proposal?.paymentSettings?.requirePaymentUpfront || false,
    lateFeePercentage: proposal?.paymentSettings?.lateFeePercentage || 0,
    gracePeriodDays: proposal?.paymentSettings?.gracePeriodDays || 5
  });

  // Store onUpdate in ref to prevent dependency issues
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;

  // Safe update function with error handling
  const safeUpdate = useCallback((data: any) => {
    try {
      if (typeof updateRef.current === 'function') {
        updateRef.current(data);
      } else {
        console.warn('onUpdate is not a function in PaymentCollection');
      }
    } catch (error) {
      console.error('Error updating payment collection:', error);
      toast.error('Failed to update payment information');
    }
  }, []);

  // Memoize payment data to prevent unnecessary updates
  const paymentData = useCallback(() => ({
    paymentLinks,
    stripeSettings,
    paymentSettings
  }), [paymentLinks, stripeSettings, paymentSettings]);

  useEffect(() => {
    safeUpdate(paymentData());
  }, [paymentData, safeUpdate]);

  const generatePaymentLink = (type: 'deposit' | 'milestone', amount: number, description: string, dueDate?: string) => {
    // In a real app, this would call Stripe API to create payment link
    const link: PaymentLink = {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      description,
      status: 'pending',
      url: `https://checkout.stripe.com/c/pay/cs_test_${Math.random().toString(36).substr(2, 20)}`,
      dueDate
    };

    setPaymentLinks(prev => [...prev, link]);
    toast.success(`Payment link created for ${description}`);
    return link;
  };

  const createDepositLink = () => {
    const depositAmount = (calculateProjectTotal() * (proposal?.depositAmount || 25)) / 100;
    generatePaymentLink('deposit', depositAmount, 'Project Deposit', getTomorrowDate());
  };

  const createMilestoneLinks = () => {
    if (!progressBilling?.progressBilling || !Array.isArray(progressBilling.progressBilling)) {
      toast.error('Set up progress billing first');
      return;
    }

    const milestones = progressBilling.progressBilling;
    milestones.forEach((milestone: any) => {
      if (milestone.amount > 0) {
        generatePaymentLink('milestone', milestone.amount, milestone.name, milestone.dueDate);
      }
    });

    toast.success(`Created ${milestones.length} milestone payment links`);
  };

  const calculateProjectTotal = () => {
    if (!proposal?.scopeOfWork || !Array.isArray(proposal.scopeOfWork)) {
      return 0;
    }
    const subtotal = proposal.scopeOfWork.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
    return subtotal * 1.30; // 30% markup
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const copyPaymentLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success('Payment link copied to clipboard');
  };

  const sendPaymentLink = (link: PaymentLink) => {
    const subject = `Payment Request: ${link.description}`;
    const body = `
Hi ${proposal?.clientName || 'Valued Client'},

Your payment link is ready for ${link.description}.

Amount: ${formatCurrency(link.amount)}
Due Date: ${link.dueDate ? new Date(link.dueDate).toLocaleDateString() : 'Upon receipt'}

Secure Payment Link: ${link.url}

This link accepts all major credit cards and is secured by Stripe.

Questions? Reply to this email or call us at (555) 123-4567.

Best regards,
Lineage Builders Inc.
    `.trim();

    const mailtoUrl = `mailto:${proposal?.clientEmail || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
    toast.success('Email client opened with payment request');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return CheckCircle;
      case 'pending': return Clock;
      case 'failed': return AlertCircle;
      case 'expired': return AlertCircle;
      default: return Clock;
    }
  };

  const calculateTotalCollected = () => {
    return paymentLinks
      .filter(link => link.status === 'paid')
      .reduce((sum, link) => sum + (link.paidAmount || link.amount), 0);
  };

  const calculateTotalPending = () => {
    return paymentLinks
      .filter(link => link.status === 'pending')
      .reduce((sum, link) => sum + link.amount, 0);
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
              Unable to load proposal data for payment collection setup. Please ensure you have a valid proposal loaded.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectTotal = calculateProjectTotal();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            Payment Collection
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Create secure payment links for deposits and milestone payments. Powered by Stripe.
          </p>
          {projectTotal > 0 && (
            <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                Project Total: {formatCurrency(projectTotal)}
              </Badge>
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Show warning if no project total */}
      {projectTotal <= 0 && (
        <Card className="glass-card border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">
                No project total found. Please add scope of work items to calculate payments.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Overview */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Payment Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(projectTotal)}
              </div>
              <div className="text-sm text-muted-foreground">Total Project</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(calculateTotalCollected())}
              </div>
              <div className="text-sm text-muted-foreground">Collected</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">
                {formatCurrency(calculateTotalPending())}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Receipt className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(projectTotal - calculateTotalCollected() - calculateTotalPending())}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Payment Processing Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h3 className="font-semibold">Enable Online Payments</h3>
              <p className="text-sm text-muted-foreground">
                Accept credit cards and bank transfers securely through Stripe
              </p>
            </div>
            <Button
              variant={stripeSettings.isEnabled ? 'default' : 'outline'}
              onClick={() => setStripeSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
            >
              {stripeSettings.isEnabled ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          {stripeSettings.isEnabled && (
            <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="font-semibold">Stripe Configuration</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Processing Fee (%)</Label>
                  <Input
                    type="number"
                    value={stripeSettings.processingFee}
                    onChange={(e) => setStripeSettings(prev => ({ 
                      ...prev, 
                      processingFee: parseFloat(e.target.value) || 0 
                    }))}
                    step="0.1"
                    min="0"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    Stripe's standard rate is 2.9% + $0.30 per transaction
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={stripeSettings.collectProcessingFee}
                      onChange={(e) => setStripeSettings(prev => ({ 
                        ...prev, 
                        collectProcessingFee: e.target.checked 
                      }))}
                      className="w-4 h-4"
                    />
                    <Label>Pass processing fee to client</Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Add processing fee to payment amount
                  </p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900">Secure Payment Processing</p>
                    <p className="text-blue-700">
                      All payments are processed securely through Stripe. Your clients' payment information is never stored on your servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Create Payment Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={createDepositLink}
              disabled={!stripeSettings.isEnabled || projectTotal <= 0}
              className="h-auto p-4 justify-start gap-3"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Create Deposit Link</div>
                <div className="text-sm opacity-80">
                  {formatCurrency((projectTotal * (proposal?.depositAmount || 25)) / 100)} deposit
                </div>
              </div>
            </Button>

            <Button 
              onClick={createMilestoneLinks}
              disabled={!stripeSettings.isEnabled || !progressBilling?.progressBilling || !Array.isArray(progressBilling.progressBilling) || projectTotal <= 0}
              variant="outline"
              className="h-auto p-4 justify-start gap-3"
            >
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold">Create Milestone Links</div>
                <div className="text-sm opacity-80">
                  All progress payment links
                </div>
              </div>
            </Button>
          </div>

          {(!stripeSettings.isEnabled || projectTotal <= 0) && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                <p className="text-sm text-orange-800">
                  {projectTotal <= 0 
                    ? 'Add scope of work items and enable payment processing to create payment links.'
                    : 'Enable payment processing above to create payment links.'
                  }
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Links */}
      {paymentLinks.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Payment Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentLinks.map(link => {
              const StatusIcon = getStatusIcon(link.status);
              
              return (
                <div key={link.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <div className="font-semibold">{link.description}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(link.amount)}
                        {link.dueDate && ` • Due ${new Date(link.dueDate).toLocaleDateString()}`}
                        {link.paidAt && ` • Paid ${new Date(link.paidAt).toLocaleDateString()}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(link.status)}>
                      {link.status}
                    </Badge>
                    
                    {link.status === 'pending' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPaymentLink(link.url)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => sendPaymentLink(link)}
                          className="h-8 w-8 p-0"
                        >
                          <Mail className="w-3 h-3" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(link.url, '_blank')}
                          className="h-8 w-8 p-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Demo Payment Actions */}
      {paymentLinks.length > 0 && process.env.NODE_ENV === 'development' && (
        <Card className="glass-card border-dashed">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Demo: Simulate Payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pendingLink = paymentLinks.find(link => link.status === 'pending');
                  if (pendingLink) {
                    setPaymentLinks(prev => prev.map(link => 
                      link.id === pendingLink.id 
                        ? { 
                            ...link, 
                            status: 'paid' as const, 
                            paidAt: new Date().toISOString(),
                            paymentMethod: 'Visa ending in 4242'
                          }
                        : link
                    ));
                    toast.success('Payment marked as paid');
                  }
                }}
                disabled={!paymentLinks.some(link => link.status === 'pending')}
              >
                Mark Payment as Paid
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pendingLink = paymentLinks.find(link => link.status === 'pending');
                  if (pendingLink) {
                    setPaymentLinks(prev => prev.map(link => 
                      link.id === pendingLink.id 
                        ? { ...link, status: 'failed' as const }
                        : link
                    ));
                    toast.error('Payment marked as failed');
                  }
                }}
                disabled={!paymentLinks.some(link => link.status === 'pending')}
              >
                Mark Payment as Failed
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}