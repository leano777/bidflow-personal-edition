import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface LineItem {
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

export interface PricingBreakdown {
  subtotal: number
  overhead: number
  profit: number
  tax: number
  total: number
  contingency?: number
  bondAndInsurance?: number
}

export interface EstimationProject {
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

export class ExportService {
  static async exportToExcel(project: EstimationProject): Promise<void> {
    // Create new workbook
    const wb = XLSX.utils.book_new()
    
    // Project Summary Sheet
    const summaryData = [
      ['Project Information'],
      ['Project Name', project.name],
      ['Description', project.description],
      ['Created By', project.createdBy],
      ['Last Modified', project.lastModified.toLocaleDateString()],
      ['Status', project.status],
      ['Version', project.version],
      [],
      ['Cost Summary'],
      ['Subtotal', `$${project.pricingBreakdown.subtotal.toFixed(2)}`],
      ['Overhead (15%)', `$${project.pricingBreakdown.overhead.toFixed(2)}`],
      ['Profit (10%)', `$${project.pricingBreakdown.profit.toFixed(2)}`],
      ['Contingency (5%)', `$${(project.pricingBreakdown.contingency || 0).toFixed(2)}`],
      ['Bond & Insurance (3%)', `$${(project.pricingBreakdown.bondAndInsurance || 0).toFixed(2)}`],
      ['Tax (13% HST)', `$${project.pricingBreakdown.tax.toFixed(2)}`],
      ['Total', `$${project.pricingBreakdown.total.toFixed(2)}`]
    ]
    
    const summaryWS = XLSX.utils.aoa_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(wb, summaryWS, 'Summary')
    
    // Line Items Sheet
    const lineItemHeaders = [
      'Description',
      'Quantity',
      'Unit',
      'Unit Cost',
      'Total',
      'Category',
      'Sub Category',
      'Labor Hours',
      'Material Cost',
      'Equipment Cost',
      'Source',
      'Confidence',
      'Notes'
    ]
    
    const lineItemData = [
      lineItemHeaders,
      ...project.lineItems.map(item => [
        item.description,
        item.quantity,
        item.unit,
        item.unitCost,
        item.total,
        item.category,
        item.subCategory || '',
        item.laborHours || 0,
        item.materialCost || 0,
        item.equipmentCost || 0,
        item.source.toUpperCase(),
        item.confidence ? `${(item.confidence * 100).toFixed(0)}%` : '',
        item.notes || ''
      ])
    ]
    
    const lineItemWS = XLSX.utils.aoa_to_sheet(lineItemData)
    
    // Auto-size columns
    const colWidths = lineItemHeaders.map(() => ({ wch: 15 }))
    colWidths[0] = { wch: 30 } // Description column wider
    lineItemWS['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(wb, lineItemWS, 'Line Items')
    
    // Category Breakdown Sheet
    const categoryBreakdown = project.lineItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.total
      return acc
    }, {} as Record<string, number>)
    
    const categoryData = [
      ['Category Breakdown'],
      ['Category', 'Total', 'Percentage'],
      ...Object.entries(categoryBreakdown).map(([category, total]) => [
        category,
        `$${total.toFixed(2)}`,
        `${((total / project.pricingBreakdown.subtotal) * 100).toFixed(1)}%`
      ])
    ]
    
    const categoryWS = XLSX.utils.aoa_to_sheet(categoryData)
    XLSX.utils.book_append_sheet(wb, categoryWS, 'Categories')
    
    // Raw Text Sheet (if exists)
    if (project.rawText) {
      const rawTextData = [
        ['Raw Input Text'],
        [project.rawText]
      ]
      const rawTextWS = XLSX.utils.aoa_to_sheet(rawTextData)
      XLSX.utils.book_append_sheet(wb, rawTextWS, 'Raw Text')
    }
    
    // Download file
    const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_estimate.xlsx`
    XLSX.writeFile(wb, fileName)
  }
  
  static async exportToPDF(project: EstimationProject): Promise<void> {
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 20
    let currentY = margin
    
    // Helper function to check if we need a new page
    const checkPageBreak = (neededHeight: number) => {
      if (currentY + neededHeight > pageHeight - margin) {
        pdf.addPage()
        currentY = margin
        return true
      }
      return false
    }
    
    // Helper function to add text with word wrap
    const addWrappedText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      lines.forEach((line: string, index: number) => {
        pdf.text(line, x, y + (index * fontSize * 0.5))
      })
      return lines.length * fontSize * 0.5
    }
    
    // Title
    pdf.setFontSize(20)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Construction Estimate', pageWidth / 2, currentY, { align: 'center' })
    currentY += 15
    
    // Project Information
    pdf.setFontSize(16)
    pdf.text('Project Information', margin, currentY)
    currentY += 10
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    const projectInfo = [
      [`Project Name: ${project.name}`],
      [`Description: ${project.description}`],
      [`Created By: ${project.createdBy}`],
      [`Last Modified: ${project.lastModified.toLocaleDateString()}`],
      [`Status: ${project.status.toUpperCase()}`],
      [`Version: ${project.version}`]
    ]
    
    projectInfo.forEach(([text]) => {
      checkPageBreak(8)
      currentY += addWrappedText(text, margin, currentY, pageWidth - 2 * margin)
      currentY += 3
    })
    
    currentY += 10
    
    // Cost Summary
    checkPageBreak(80)
    pdf.setFontSize(16)
    pdf.setFont('helvetica', 'bold')
    pdf.text('Cost Summary', margin, currentY)
    currentY += 10
    
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'normal')
    
    const costSummary = [
      ['Subtotal', `$${project.pricingBreakdown.subtotal.toFixed(2)}`],
      ['Overhead (15%)', `$${project.pricingBreakdown.overhead.toFixed(2)}`],
      ['Profit (10%)', `$${project.pricingBreakdown.profit.toFixed(2)}`],
      ['Contingency (5%)', `$${(project.pricingBreakdown.contingency || 0).toFixed(2)}`],
      ['Bond & Insurance (3%)', `$${(project.pricingBreakdown.bondAndInsurance || 0).toFixed(2)}`],
      ['Tax (13% HST)', `$${project.pricingBreakdown.tax.toFixed(2)}`]
    ]
    
    costSummary.forEach(([label, value]) => {
      checkPageBreak(6)
      pdf.text(label, margin, currentY)
      pdf.text(value, pageWidth - margin, currentY, { align: 'right' })
      currentY += 6
    })
    
    // Total line
    checkPageBreak(8)
    pdf.setFont('helvetica', 'bold')
    pdf.line(margin, currentY, pageWidth - margin, currentY)
    currentY += 4
    pdf.text('TOTAL', margin, currentY)
    pdf.text(`$${project.pricingBreakdown.total.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' })
    currentY += 15
    
    // Line Items
    if (project.lineItems.length > 0) {
      checkPageBreak(50)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Line Items', margin, currentY)
      currentY += 15
      
      // Table headers
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'bold')
      const colWidths = [60, 20, 15, 25, 25, 35]
      const headers = ['Description', 'Qty', 'Unit', 'Rate', 'Total', 'Category']
      
      let currentX = margin
      headers.forEach((header, index) => {
        pdf.text(header, currentX, currentY)
        currentX += colWidths[index]
      })
      currentY += 8
      
      pdf.line(margin, currentY - 3, pageWidth - margin, currentY - 3)
      
      // Line items
      pdf.setFont('helvetica', 'normal')
      project.lineItems.forEach((item) => {
        checkPageBreak(12)
        
        currentX = margin
        const rowData = [
          item.description.length > 30 ? item.description.substring(0, 27) + '...' : item.description,
          item.quantity.toString(),
          item.unit,
          `$${item.unitCost.toFixed(2)}`,
          `$${item.total.toFixed(2)}`,
          item.category
        ]
        
        rowData.forEach((data, index) => {
          if (index === 0) {
            // Description might need wrapping
            addWrappedText(data, currentX, currentY, colWidths[index] - 5, 9)
          } else {
            pdf.text(data, currentX, currentY)
          }
          currentX += colWidths[index]
        })
        currentY += 8
      })
    }
    
    // Category Breakdown
    const categoryBreakdown = project.lineItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.total
      return acc
    }, {} as Record<string, number>)
    
    if (Object.keys(categoryBreakdown).length > 0) {
      checkPageBreak(30)
      currentY += 10
      
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Category Breakdown', margin, currentY)
      currentY += 15
      
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      
      Object.entries(categoryBreakdown).forEach(([category, total]) => {
        checkPageBreak(6)
        const percentage = ((total / project.pricingBreakdown.subtotal) * 100).toFixed(1)
        pdf.text(`${category}:`, margin, currentY)
        pdf.text(`$${total.toFixed(2)} (${percentage}%)`, pageWidth - margin, currentY, { align: 'right' })
        currentY += 6
      })
    }
    
    // Footer
    const pageCount = (pdf as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' })
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, margin, pageHeight - 10)
    }
    
    // Download file
    const fileName = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_estimate.pdf`
    pdf.save(fileName)
  }
  
  // Template for bulk operations
  static generateExcelTemplate(): void {
    const wb = XLSX.utils.book_new()
    
    const templateHeaders = [
      'Description',
      'Quantity',
      'Unit',
      'Unit Cost',
      'Category',
      'Sub Category',
      'Labor Hours',
      'Material Cost',
      'Equipment Cost',
      'Notes'
    ]
    
    const templateData = [
      templateHeaders,
      ['Example: Concrete Foundation', 100, 'sf', 12.50, 'Concrete', 'Foundation', 8, 1000, 250, 'Include rebar and forms'],
      ['Example: Framing - 2x4 Studs', 200, 'lf', 3.75, 'Carpentry', 'Framing', 12, 600, 150, '16" on center'],
      // Add more example rows as needed
    ]
    
    const ws = XLSX.utils.aoa_to_sheet(templateData)
    
    // Auto-size columns
    const colWidths = templateHeaders.map(() => ({ wch: 15 }))
    colWidths[0] = { wch: 30 } // Description column wider
    ws['!cols'] = colWidths
    
    XLSX.utils.book_append_sheet(wb, ws, 'Line Items Template')
    XLSX.writeFile(wb, 'estimation_template.xlsx')
  }
  
  static async importFromExcel(file: File): Promise<LineItem[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
          
          // Skip header row
          const dataRows = jsonData.slice(1).filter(row => row.length > 0 && row[0])
          
          const lineItems: LineItem[] = dataRows.map((row, index) => ({
            id: (Date.now() + index).toString(),
            description: row[0] || '',
            quantity: parseFloat(row[1]) || 1,
            unit: row[2] || 'ea',
            unitCost: parseFloat(row[3]) || 0,
            total: (parseFloat(row[1]) || 1) * (parseFloat(row[3]) || 0),
            category: row[4] || 'General',
            subCategory: row[5] || '',
            laborHours: parseFloat(row[6]) || 0,
            materialCost: parseFloat(row[7]) || 0,
            equipmentCost: parseFloat(row[8]) || 0,
            notes: row[9] || '',
            source: 'manual' as const
          }))
          
          resolve(lineItems)
        } catch (error) {
          reject(new Error('Failed to parse Excel file'))
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }
}
