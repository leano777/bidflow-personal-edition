import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { 
  Plus, 
  Trash2, 
  DollarSign, 
  Calendar, 
  CheckCircle, 
  Clock, 
  CreditCard,
  Percent,
  Calculator,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ProgressBillingProps {
  proposal: any;
  onUpdate: (updates: any) => void;
  totalProjectCost?: number;
}

export function ProgressBilling({ proposal, onUpdate, totalProjectCost }: ProgressBillingProps) {
  // Calculate total project cost from proposal if not provided
  const calculateProjectTotal = useCallback(() => {
    if (totalProjectCost && totalProjectCost > 0) {
      return totalProjectCost;
    }
    
    if (!proposal?.scopeOfWork || !Array.isArray(proposal.scopeOfWork)) {
      return 0;
    }
    
    return proposal.scopeOfWork
      .filter((item: any) => item.includedInTotal !== false)
      .reduce((sum: number, item: any) => {
        return sum + (parseFloat(item.total) || 0);
      }, 0);
  }, [proposal, totalProjectCost]);

  const projectTotal = calculateProjectTotal();

  // Safely extract billing data with fallbacks
  const proposalProgressBilling = proposal?.progressBilling || {};
  const initialMilestones = Array.isArray(proposalProgressBilling?.milestones) 
    ? proposalProgressBilling.milestones 
    : [];

  const [billingMilestones, setBillingMilestones] = useState(initialMilestones);
  const [paymentTerms, setPaymentTerms] = useState(proposalProgressBilling?.paymentTerms || 'Net 30');
  const [depositRequired, setDepositRequired] = useState(proposalProgressBilling?.depositRequired !== false);
  const [depositAmount, setDepositAmount] = useState(proposalProgressBilling?.depositAmount || 25);

  // Common milestone templates for contractors
  const milestoneTemplates = [
    {
      name: 'Standard 3-Phase',
      milestones: [
        { name: 'Project Start / Materials Deposit', percentage: 35, description: 'Initial payment to begin work and order materials' },
        { name: 'Midpoint Progress', percentage: 35, description: 'Payment upon reaching 50% completion' },
        { name: 'Project Completion', percentage: 30, description: 'Final payment upon project completion' }
      ]
    },
    {
      name: 'Renovation 4-Phase',
      milestones: [
        { name: 'Contract Signing / Permits', percentage: 25, description: 'Initial deposit and permit acquisition' },
        { name: 'Demolition Complete', percentage: 25, description: 'Payment after demolition and prep work' },
        { name: 'Rough-in Complete', percentage: 25, description: 'Payment after framing, electrical, plumbing rough-in' },
        { name: 'Final Completion', percentage: 25, description: 'Final payment upon project completion' }
      ]
    },
    {
      name: 'Large Project 5-Phase',
      milestones: [
        { name: 'Contract & Materials', percentage: 30, description: 'Initial payment for materials and mobilization' },
        { name: 'Foundation/Demo Complete', percentage: 20, description: 'Payment after foundation or demolition work' },
        { name: '50% Construction Complete', percentage: 20, description: 'Payment at halfway point of construction' },
        { name: '90% Construction Complete', percentage: 20, description: 'Payment near project completion' },
        { name: 'Final Walkthrough', percentage: 10, description: 'Final payment after client approval' }
      ]
    }
  ];

  // Store onUpdate in ref to prevent dependency issues
  const updateRef = useRef(onUpdate);
  updateRef.current = onUpdate;

  // Memoize billing data to prevent unnecessary updates
  const billingData = useCallback(() => ({
    progressBilling: {
      milestones: billingMilestones,
      paymentTerms,
      depositRequired,
      depositAmount,
      totalProjectCost: projectTotal
    }
  }), [billingMilestones, paymentTerms, depositRequired, depositAmount, projectTotal]);

  // Safe update function with error handling
  const safeUpdate = useCallback((data: any) => {
    try {
      if (typeof updateRef.current === 'function') {
        updateRef.current(data);
      } else {
        console.warn('onUpdate is not a function in ProgressBilling');
      }
    } catch (error) {
      console.error('Error updating progress billing:', error);
      toast.error('Failed to update billing information');
    }
  }, []);

  useEffect(() => {
    safeUpdate(billingData());
  }, [billingData, safeUpdate]);

  const addMilestone = () => {
    const newMilestone = {
      id: Date.now().toString(),
      name: '',
      percentage: 0,
      description: '',
      dueDate: '',
      status: 'pending',
      amount: 0
    };
    setBillingMilestones([...billingMilestones, newMilestone]);
  };

  const updateMilestone = (id: string, updates: any) => {
    setBillingMilestones(milestones =>
      milestones.map(milestone => {
        if (milestone.id === id) {
          const updated = { ...milestone, ...updates };
          // Calculate amount from percentage
          if (updates.percentage !== undefined) {
            updated.amount = (projectTotal * updates.percentage) / 100;
          }
          return updated;
        }
        return milestone;
      })
    );
  };

  const removeMilestone = (id: string) => {
    setBillingMilestones(milestones => milestones.filter(m => m.id !== id));
  };

  const applyTemplate = (template: any) => {
    const milestones = template.milestones.map((milestone: any, index: number) => ({
      id: `${Date.now()}_${index}`,
      name: milestone.name,
      percentage: milestone.percentage,
      description: milestone.description,
      dueDate: '',
      status: 'pending',
      amount: (projectTotal * milestone.percentage) / 100
    }));
    setBillingMilestones(milestones);
    toast.success(`Applied ${template.name} billing template`);
  };

  const calculateTotalPercentage = () => {
    if (!Array.isArray(billingMilestones)) {
      return 0;
    }
    return billingMilestones.reduce((sum, milestone) => sum + (milestone.percentage || 0), 0);
  };

  const calculateTotalAmount = () => {
    if (!Array.isArray(billingMilestones)) {
      return 0;
    }
    return billingMilestones.reduce((sum, milestone) => sum + (milestone.amount || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || !isFinite(amount)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalPercentage = calculateTotalPercentage();
  const totalAmount = calculateTotalAmount();
  const isValidBilling = Math.abs(totalPercentage - 100) < 0.01;

  // Error handling for missing proposal data
  if (!proposal) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Proposal Data</h3>
            <p className="text-sm text-muted-foreground">
              Unable to load proposal data for progress billing setup.
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
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            Progress Billing & Payments
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set up milestone-based payments to improve cash flow and reduce project risk.
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
                No project total found. Please add scope of work items to calculate billing milestones.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Settings */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Payment Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Payment Terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                  <SelectItem value="Net 15">Net 15 Days</SelectItem>
                  <SelectItem value="Net 30">Net 30 Days</SelectItem>
                  <SelectItem value="2/10 Net 30">2% Discount if paid within 10 days, Net 30</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Deposit Amount (%)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(parseFloat(e.target.value) || 0)}
                  min="0"
                  max="50"
                  step="1"
                  className="flex-1"
                />
                <Badge variant="outline" className="text-sm">
                  {formatCurrency((projectTotal * depositAmount) / 100)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Templates */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Templates</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose a pre-built payment schedule template to get started quickly.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {milestoneTemplates.map((template, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => applyTemplate(template)}
                className="h-auto p-4 text-left justify-start"
                disabled={projectTotal <= 0}
              >
                <div>
                  <div className="font-semibold">{template.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {template.milestones.length} payments
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing Milestones */}
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Payment Milestones</CardTitle>
            <Button 
              onClick={addMilestone} 
              size="sm" 
              className="gap-2"
              disabled={projectTotal <= 0}
            >
              <Plus className="w-4 h-4" />
              Add Milestone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!Array.isArray(billingMilestones) || billingMilestones.length === 0 ? (
            <div className="text-center py-8 bg-muted/20 rounded-lg border-2 border-dashed border-border">
              <Calculator className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-semibold mb-2">No payment milestones set</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {projectTotal <= 0 
                  ? 'Add scope of work items first, then set up payment milestones.'
                  : 'Add payment milestones or use a template to get started.'
                }
              </p>
              <Button 
                onClick={addMilestone} 
                variant="outline"
                disabled={projectTotal <= 0}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Milestone
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {billingMilestones.map((milestone, index) => (
                <Card key={milestone.id} className="border border-border/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Payment {index + 1}
                        </Badge>
                        <Badge 
                          variant={milestone.status === 'paid' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {milestone.status === 'paid' ? (
                            <CheckCircle className="w-3 h-3 mr-1" />
                          ) : (
                            <Clock className="w-3 h-3 mr-1" />
                          )}
                          {milestone.status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMilestone(milestone.id)}
                        className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Milestone Name</Label>
                        <Input
                          value={milestone.name || ''}
                          onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
                          placeholder="e.g., Project Start"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Percentage</Label>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={milestone.percentage || ''}
                            onChange={(e) => updateMilestone(milestone.id, { percentage: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max="100"
                            step="0.1"
                            className="text-sm"
                          />
                          <Percent className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Amount</Label>
                        <div className="flex items-center h-9 px-3 py-2 bg-muted rounded-md border text-sm font-semibold text-green-700">
                          {formatCurrency(milestone.amount || 0)}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Due Date</Label>
                        <Input
                          type="date"
                          value={milestone.dueDate || ''}
                          onChange={(e) => updateMilestone(milestone.id, { dueDate: e.target.value })}
                          className="text-sm"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={milestone.description || ''}
                        onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                        placeholder="Describe when this payment is due and what work should be completed"
                        rows={2}
                        className="text-sm mt-1 resize-none"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      {Array.isArray(billingMilestones) && billingMilestones.length > 0 && (
        <Card className={`glass-card ${!isValidBilling ? 'border-orange-200 bg-orange-50/50' : 'border-green-200 bg-green-50/50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Payment Schedule Summary</h3>
              {!isValidBilling && (
                <Badge variant="destructive" className="gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Total must equal 100%
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {billingMilestones.length}
                </div>
                <div className="text-sm text-muted-foreground">Payment Milestones</div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold ${isValidBilling ? 'text-green-600' : 'text-orange-600'}`}>
                  {totalPercentage.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Total Percentage</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </div>

            {isValidBilling && (
              <div className="mt-4 p-3 bg-green-100 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Payment schedule is complete and ready to use
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}