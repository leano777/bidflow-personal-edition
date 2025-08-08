# Lineage Builders Proposal System v2.1

A comprehensive, AI-powered proposal generation system designed specifically for construction contractors. Features professional proposal templates, automated cost calculations, and extensive brand customization capabilities.

## 🚀 Key Features

### ✨ AI-Powered Proposal Generation
- **Natural Language Processing**: Convert project descriptions into detailed proposals
- **Smart Cost Estimation**: Automatic quantity calculations with waste factors
- **Market Rate Integration**: Current San Diego construction rates built-in
- **Material & Labor Breakdown**: Intelligent categorization and pricing

### 🎨 Brand Customization System
- **Company Branding**: Upload logo, set colors, typography, and layout styles
- **Template Customization**: Choose from Modern, Professional, or Creative templates
- **Header Styles**: Gradient, solid color, minimal, or image backgrounds
- **Brand Settings Management**: Save and reuse branding across all proposals

### 📊 Professional Proposal Templates
- **Print-Ready Designs**: Professional layouts optimized for printing and PDF export
- **Responsive Design**: Optimized for desktop, tablet, and mobile viewing
- **Comprehensive Sections**: Project details, scope of work, cost breakdowns, terms & conditions
- **Digital Signatures**: Professional signature sections for contract execution

### 💼 Advanced Workflow Management
- **Version Control**: Track proposal revisions with clear version history
- **Save & Export**: Multiple export formats (JSON, PDF, Excel)
- **Dashboard Overview**: Manage all proposals from a centralized location
- **Search & Filter**: Quick access to proposals by project or client name

### 📈 Cost Management
- **Automated Calculations**: Real-time cost updates as you modify scope items
- **Overhead & Profit**: Configurable markup percentages (default 30%)
- **Material vs Labor Tracking**: Separate tracking and reporting for materials and labor
- **Detailed Breakdowns**: Line-item details with quantities, units, rates, and totals

## 🛠 Technical Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS v4** for modern, responsive styling
- **Shadcn/UI** components for consistent design system
- **Lucide React** for professional iconography

### Backend
- **Supabase** for database, authentication, and file storage
- **Hono** web framework running on Deno Edge Functions
- **OpenAI API** integration for AI-powered proposal generation
- **Key-Value Store** for flexible data management

### Key Components

#### Core Application
- `App.tsx` - Main application router and state management
- `AppHeader.tsx` - Navigation and branding header
- `HomePage.tsx` - Dashboard with proposal overview and management

#### Proposal Workflow
- `ProposalWorkspace.tsx` - Unified workspace for proposal creation and editing
- `AIProposalCreator.tsx` - AI-powered proposal generation interface
- `ProposalEditor.tsx` - Interactive proposal editing with scope management
- `ProposalPreview.tsx` - Print-ready proposal preview with brand styling

#### Brand Management
- `BrandSettings.tsx` - Comprehensive brand customization interface
- Logo upload and management system
- Color scheme and typography controls
- Template style selection

#### Utility Components
- `StatusBadge.tsx` - Visual status indicators
- `EmptyState.tsx` - User-friendly empty content states
- `LoadingSpinner.tsx` - Consistent loading indicators
- `NotificationToast.tsx` - Rich notification system

## 📋 Development Tickets & Roadmap

### High Priority Features (In Development)
1. **Enhanced Export System** - PDF generation with professional formatting
2. **Version Comparison** - Side-by-side proposal comparison with change tracking
3. **Advanced Scope Management** - Bulk pricing adjustments and material templates
4. **Terms & Conditions Management** - Editable legal terms with save functionality

### Medium Priority Features
5. **Proposal Analytics** - Success rate tracking and cost trend analysis
6. **Advanced AI Features** - Photo analysis and voice input capabilities
7. **CRM Integration** - Client management and follow-up tracking
8. **Mobile Optimization** - Enhanced mobile experience with offline editing

### Low Priority Features
9. **Collaboration Tools** - Multi-user editing and approval workflows
10. **Integration Ecosystem** - QuickBooks, material suppliers, and equipment rental APIs

## 🎯 Brand Customization Features

### Company Information
- Company name, tagline, and contact details
- Business license and certification display
- Professional address and contact formatting

### Visual Branding
- **Logo Management**: Upload, position (left/center/right), and size control
- **Color Schemes**: Primary, secondary, accent, background, and text colors
- **Typography**: Font family selection and size controls
- **Template Styles**: Modern, Professional, or Creative layouts

### Layout Customization
- **Header Styles**: Gradient, solid color, minimal, or image backgrounds
- **Logo Positioning**: Flexible logo placement options
- **Brand Consistency**: Automatic application across all proposal sections

### Terms & Conditions
- Default payment terms and schedules
- Warranty information and policies
- Timeline and project completion terms
- Custom legal clauses and additional terms

## 💡 Usage Guide

### Creating a New Proposal

1. **Access the Dashboard**: Navigate to the main dashboard
2. **Choose Creation Method**:
   - **AI Proposal**: Describe your project in natural language
   - **Manual Create**: Build proposal from scratch
3. **AI Generation**: Paste or type project description for AI analysis
4. **Review & Edit**: Modify generated scope items, quantities, and pricing
5. **Brand Application**: Proposals automatically use your saved brand settings
6. **Preview & Export**: Review final proposal and export in desired format

### Customizing Your Brand

1. **Open Brand Settings**: Click the palette icon in the workspace actions menu
2. **Company Tab**: Update business information and contact details
3. **Branding Tab**: Set color scheme and typography preferences
4. **Logo Tab**: Upload company logo and configure positioning
5. **Layout Tab**: Choose template style and header design
6. **Terms Tab**: Set default terms and conditions
7. **Save Settings**: Apply changes to all future proposals

### Managing Proposals

- **Search & Filter**: Use the search bar to find proposals by project or client name
- **Quick Actions**: Edit, create versions, or delete proposals from card actions
- **Version Control**: Create new versions while maintaining proposal history
- **Export Options**: Download as JSON or generate print-ready formats

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+ 
- Supabase account with project configured
- OpenAI API key for AI features

### Environment Variables
```bash
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Local Development
1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Start development server: `npm run dev`
5. Deploy server functions to Supabase

## 📞 Support & Contact

For technical support or feature requests, please contact:
- **Email**: ramon.lineagebuilderinc@gmail.co
- **Phone**: (909) 240-7090
- **Address**: 16 Angela Ln, San Diego, CA 91911

## 📄 License

© 2024 Lineage Builders Inc. All rights reserved.

---

**Built with ❤️ for the construction industry**