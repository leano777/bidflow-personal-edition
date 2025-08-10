'use client'

import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { ScrollArea } from './ui/scroll-area'
import { Progress } from './ui/progress'
import { Alert, AlertDescription, AlertTitle } from './ui/alert'
import { 
  FileText, 
  Calculator, 
  Download, 
  Upload, 
  Edit3, 
  Save, 
  RefreshCw, 
  HelpCircle,
  User,
  Settings,
  Eye,
  Lock,
  Trash2,
  Copy,
  Plus
} from 'lucide-react'

// Types
interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitCost: number
  laborHours?: number
  materialCost?: number
  equipmentCost?: number
  total: number
  category: string
  subCategory?: string
  notes?: string
  source: 'ai' | 'manual'
  confidence?: number
  explanation?: string
}

interface PricingBreakdown {
  subtotal: number
  overhead: number
  profit: number
  tax: number
  total: number
  contingency?: number
  bondAndInsurance?: number
}

interface UserRole {
  type: 'estimator' | 'pm' | 'viewer'
  permissions: {
    canEdit: boolean
    canDelete: boolean
    canExport: boolean
    canViewCosts: boolean
    canApprove: boolean
  }
}

interface EstimationProject {
  id: string
  name: string
  description: string
  rawText: string
  lineItems: LineItem[]
  pricingBreakdown: PricingBreakdown
  createdBy: string
  lastModified: Date
  status: 'draft' | 'review' | 'approved' | 'archived'
  version: number
}

// Schema for form validation
const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unit: z.string().min(1, 'Unit is required'),
  unitCost: z.number().positive('Unit cost must be positive'),
  laborHours: z.number().optional(),
  materialCost: z.number().optional(),
  equipmentCost: z.number().optional(),
  category: z.string().min(1, 'Category is required'),
  subCategory: z.string().optional(),
  notes: z.string().optional()
})

interface EstimationWorkspaceProps {
  userRole: UserRole
  project?: EstimationProject
  onSave: (project: EstimationProject) => void
  onExport: (format: 'excel' | 'pdf') => void
}

export default function EstimationWorkspace({ 
  userRole, 
  project,
  onSave,
  onExport
}: EstimationWorkspaceProps) {
  const [rawText, setRawText] = useState(project?.rawText || '')
  const [lineItems, setLineItems] = useState<LineItem[]>(project?.lineItems || [])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [selectedItem, setSelectedItem] = useState<LineItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  const form = useForm<z.infer<typeof lineItemSchema>>({
    resolver: zodResolver(lineItemSchema),
    defaultValues: {
      description: '',
      quantity: 1,
      unit: '',
      unitCost: 0,
      laborHours: 0,
      materialCost: 0,
      equipmentCost: 0,
      category: '',
      subCategory: '',
      notes: ''
    }
  })

  // Calculate pricing breakdown
  const calculatePricingBreakdown = (items: LineItem[]): PricingBreakdown => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const overhead = subtotal * 0.15 // 15% overhead
    const profit = subtotal * 0.10 // 10% profit
    const contingency = subtotal * 0.05 // 5% contingency
    const bondAndInsurance = subtotal * 0.03 // 3% bond & insurance
    const beforeTax = subtotal + overhead + profit + contingency + bondAndInsurance
    const tax = beforeTax * 0.13 // 13% tax (HST in Ontario)
    const total = beforeTax + tax

    return {
      subtotal,
      overhead,
      profit,
      tax,
      total,
      contingency,
      bondAndInsurance
    }
  }

  const pricingBreakdown = calculatePricingBreakdown(lineItems)

  // Simulate AI processing of raw text
  const processRawText = async () => {
    if (!rawText.trim()) return

    setIsProcessing(true)
    setProcessingProgress(0)

    // Simulate processing steps
    const steps = [
      'Analyzing text structure...',
      'Extracting quantities and materials...',
      'Matching with pricing database...',
      'Calculating costs...',
      'Finalizing line items...'
    ]

    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setProcessingProgress(((i + 1) / steps.length) * 100)
    }

    // Mock AI-generated line items
    const mockItems: LineItem[] = [
      {
        id: Date.now().toString() + '1',
        description: 'Excavation - General',
        quantity: 150,
        unit: 'cy',
        unitCost: 25,
        laborHours: 20,
        materialCost: 0,
        equipmentCost: 3750,
        total: 3750,
        category: 'Site Preparation',
        source: 'ai',
        confidence: 0.92,
        explanation: 'Estimated based on cubic yard calculations from text description'
      },
      {
        id: Date.now().toString() + '2',
        description: 'Concrete Foundation - 8" thick',
        quantity: 2400,
        unit: 'sf',
        unitCost: 8.50,
        laborHours: 80,
        materialCost: 15400,
        equipmentCost: 4900,
        total: 20400,
        category: 'Concrete',
        source: 'ai',
        confidence: 0.87,
        explanation: 'Material cost includes concrete, rebar, and forms'
      }
    ]

    setLineItems([...lineItems, ...mockItems])
    setIsProcessing(false)
    setUnsavedChanges(true)
  }

  const handleLineItemEdit = (item: LineItem) => {
    setSelectedItem(item)
    form.reset({
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
      laborHours: item.laborHours || 0,
      materialCost: item.materialCost || 0,
      equipmentCost: item.equipmentCost || 0,
      category: item.category,
      subCategory: item.subCategory || '',
      notes: item.notes || ''
    })
    setIsEditing(true)
  }

  const handleLineItemSave = (data: z.infer<typeof lineItemSchema>) => {
    const total = data.quantity * data.unitCost
    
    if (selectedItem) {
      // Update existing item
      const updatedItems = lineItems.map(item =>
        item.id === selectedItem.id
          ? {
              ...item,
              ...data,
              total,
              source: 'manual' as const
            }
          : item
      )
      setLineItems(updatedItems)
    } else {
      // Add new item
      const newItem: LineItem = {
        id: Date.now().toString(),
        ...data,
        total,
        source: 'manual'
      }
      setLineItems([...lineItems, newItem])
    }
    
    setIsEditing(false)
    setSelectedItem(null)
    setUnsavedChanges(true)
    form.reset()
  }

  const handleLineItemDelete = (itemId: string) => {
    setLineItems(lineItems.filter(item => item.id !== itemId))
    setUnsavedChanges(true)
  }

  const handleLineItemDuplicate = (item: LineItem) => {
    const duplicatedItem: LineItem = {
      ...item,
      id: Date.now().toString(),
      description: `${item.description} (Copy)`
    }
    setLineItems([...lineItems, duplicatedItem])
    setUnsavedChanges(true)
  }

  const handleSave = () => {
    const updatedProject: EstimationProject = {
      id: project?.id || Date.now().toString(),
      name: project?.name || 'New Estimation',
      description: project?.description || '',
      rawText,
      lineItems,
      pricingBreakdown,
      createdBy: project?.createdBy || 'current-user',
      lastModified: new Date(),
      status: 'draft',
      version: (project?.version || 0) + 1
    }
    onSave(updatedProject)
    setUnsavedChanges(false)
  }

  const ExplainTooltip = ({ explanation }: { explanation?: string }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{explanation || 'Cost calculation based on industry standards'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estimation Workspace</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={userRole.type === 'estimator' ? 'default' : userRole.type === 'pm' ? 'secondary' : 'outline'}>
                {userRole.type.toUpperCase()}
              </Badge>
              {unsavedChanges && <Badge variant="destructive">Unsaved Changes</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport('excel')}
              disabled={!userRole.permissions.canExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onExport('pdf')}
              disabled={!userRole.permissions.canExport}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button 
              onClick={handleSave}
              disabled={!userRole.permissions.canEdit || !unsavedChanges}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content - Three Panes */}
      <div className="flex-1 flex">
        {/* Left Pane - Raw Text Input */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Raw Input
              </h2>
              <Button 
                onClick={processRawText}
                disabled={!rawText.trim() || isProcessing || !userRole.permissions.canEdit}
                size="sm"
              >
                {isProcessing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Process
              </Button>
            </div>
          </div>
          
          <div className="flex-1 p-4">
            <Textarea
              placeholder="Paste or type your project scope, specifications, or field notes here..."
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value)
                setUnsavedChanges(true)
              }}
              className="h-full resize-none"
              disabled={!userRole.permissions.canEdit}
            />
            
            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Processing...</span>
                  <span className="text-sm text-gray-600">{processingProgress.toFixed(0)}%</span>
                </div>
                <Progress value={processingProgress} className="w-full" />
              </div>
            )}
          </div>
        </div>

        {/* Center Pane - Structured Grid */}
        <div className="w-1/3 bg-white border-r flex flex-col">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center">
                <Edit3 className="h-5 w-5 mr-2" />
                Line Items ({lineItems.length})
              </h2>
              <Button 
                onClick={() => setIsEditing(true)}
                disabled={!userRole.permissions.canEdit}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {lineItems.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm">{item.description}</h3>
                          <Badge variant={item.source === 'ai' ? 'secondary' : 'outline'} className="text-xs">
                            {item.source.toUpperCase()}
                          </Badge>
                          {item.explanation && <ExplainTooltip explanation={item.explanation} />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLineItemEdit(item)}
                          disabled={!userRole.permissions.canEdit}
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLineItemDuplicate(item)}
                          disabled={!userRole.permissions.canEdit}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLineItemDelete(item.id)}
                          disabled={!userRole.permissions.canDelete}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Qty:</span> {item.quantity} {item.unit}
                      </div>
                      <div>
                        <span className="text-gray-500">Rate:</span> ${item.unitCost.toFixed(2)}
                      </div>
                      <div className="col-span-2 flex justify-between items-center pt-2 border-t">
                        <span className="font-medium">Total:</span>
                        <span className="font-bold text-green-600">${item.total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    {item.confidence && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Confidence:</span>
                          <span>{(item.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <Progress value={item.confidence * 100} className="h-1 mt-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {lineItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No line items yet</p>
                  <p className="text-sm">Process raw text or add items manually</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Right Pane - Pricing Breakdown */}
        <div className="w-1/3 bg-white flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Pricing Summary
            </h2>
          </div>
          
          <div className="flex-1 p-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {userRole.permissions.canViewCosts ? (
                  <>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">${pricingBreakdown.subtotal.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <span>Overhead (15%):</span>
                        <ExplainTooltip explanation="General overhead including office expenses, insurance, and administrative costs" />
                      </div>
                      <span className="font-medium">${pricingBreakdown.overhead.toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <span>Profit (10%):</span>
                        <ExplainTooltip explanation="Company profit margin" />
                      </div>
                      <span className="font-medium">${pricingBreakdown.profit.toFixed(2)}</span>
                    </div>
                    
                    {pricingBreakdown.contingency && (
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <span>Contingency (5%):</span>
                          <ExplainTooltip explanation="Buffer for unexpected costs and changes" />
                        </div>
                        <span className="font-medium">${pricingBreakdown.contingency.toFixed(2)}</span>
                      </div>
                    )}
                    
                    {pricingBreakdown.bondAndInsurance && (
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <span>Bond & Insurance (3%):</span>
                          <ExplainTooltip explanation="Performance bond and liability insurance costs" />
                        </div>
                        <span className="font-medium">${pricingBreakdown.bondAndInsurance.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <div className="flex items-center gap-2">
                        <span>Tax (13% HST):</span>
                        <ExplainTooltip explanation="Harmonized Sales Tax" />
                      </div>
                      <span className="font-medium">${pricingBreakdown.tax.toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${pricingBreakdown.total.toFixed(2)}</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Cost details restricted</p>
                    <p className="text-sm">Contact your estimator for pricing information</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Category Breakdown */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-lg">By Category</CardTitle>
              </CardHeader>
              <CardContent>
                {userRole.permissions.canViewCosts && lineItems.length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(
                      lineItems.reduce((acc, item) => {
                        acc[item.category] = (acc[item.category] || 0) + item.total
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([category, total]) => {
                      const percentage = (total / pricingBreakdown.subtotal) * 100
                      return (
                        <div key={category} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{category}</span>
                            <span className="font-medium">${total.toFixed(2)}</span>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No items to display</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Line Item Edit Modal/Form */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {selectedItem ? 'Edit Line Item' : 'Add New Line Item'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleLineItemSave)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      {...form.register('description')}
                      placeholder="Enter item description"
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.description.message}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.01"
                      {...form.register('quantity', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unit">Unit *</Label>
                    <Input
                      id="unit"
                      {...form.register('unit')}
                      placeholder="sf, lf, ea, etc."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="unitCost">Unit Cost *</Label>
                    <Input
                      id="unitCost"
                      type="number"
                      step="0.01"
                      {...form.register('unitCost', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="laborHours">Labor Hours</Label>
                    <Input
                      id="laborHours"
                      type="number"
                      step="0.1"
                      {...form.register('laborHours', { valueAsNumber: true })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={(value) => form.setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Site Preparation">Site Preparation</SelectItem>
                        <SelectItem value="Concrete">Concrete</SelectItem>
                        <SelectItem value="Masonry">Masonry</SelectItem>
                        <SelectItem value="Steel">Steel</SelectItem>
                        <SelectItem value="Carpentry">Carpentry</SelectItem>
                        <SelectItem value="Thermal & Moisture">Thermal & Moisture</SelectItem>
                        <SelectItem value="Doors & Windows">Doors & Windows</SelectItem>
                        <SelectItem value="Finishes">Finishes</SelectItem>
                        <SelectItem value="Specialties">Specialties</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                        <SelectItem value="Mechanical">Mechanical</SelectItem>
                        <SelectItem value="Electrical">Electrical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="subCategory">Sub Category</Label>
                    <Input
                      id="subCategory"
                      {...form.register('subCategory')}
                      placeholder="Optional sub-category"
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      {...form.register('notes')}
                      placeholder="Additional notes or specifications"
                      rows={3}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setSelectedItem(null)
                      form.reset()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedItem ? 'Update' : 'Add'} Item
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
