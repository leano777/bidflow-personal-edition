# Bidflow Project Reference - Artifact Inventory

## Overview
This reference folder contains all available project artifacts collected on 2025-08-07 for comprehensive analysis.

## Documentation Files
Located in `./documentation/`:
- **README.md** - Main project documentation and overview
- **DEVELOPMENT_TICKETS.md** - Development tasks and tickets
- **Guidelines.md** - Project guidelines and standards
- **Attributions.md** - Third-party attributions and credits

## Main Application
- **App.tsx** - Root application component

## Component Library
Located in `./components/`:

### Main Application Components (24 files):
- AIProposalCreator.tsx
- AppHeader.tsx
- BrandSettings.tsx
- BulkPricingAdjustment.tsx
- ClientPortal.tsx
- CombinedScopeView.tsx
- ConstructionPricingModel.tsx
- CRMIntegrations.tsx
- EmptyState.tsx
- ErrorBoundary.tsx
- HomePage.tsx
- KeyboardShortcuts.tsx
- LineItemScopeView.tsx
- LoadingSpinner.tsx
- LoadingSystem.tsx
- MaterialDatabase.tsx
- NavigationBreadcrumbs.tsx
- NotificationToast.tsx
- PaymentCollection.tsx
- PhotoAnalysis.tsx
- PhotoIntegration.tsx
- PricingModelQuickAccess.tsx
- ProgressBilling.tsx
- ProposalEditor.tsx
- ProposalPreview.tsx
- ProposalTemplate.tsx
- ProposalWorkspace.tsx
- StatusBadge.tsx
- SystemLayout.tsx
- ThemeSelector.tsx
- VoiceInput.tsx

### UI Components Library (47 files):
Located in `./components/ui/`:
- Comprehensive shadcn/ui component library including:
  - Form controls (input, textarea, select, checkbox, radio-group, etc.)
  - Layout components (card, separator, sheet, sidebar, etc.)
  - Navigation (breadcrumb, navigation-menu, pagination, etc.)
  - Feedback (alert, toast/sonner, progress, skeleton, etc.)
  - Overlays (dialog, popover, tooltip, hover-card, etc.)
  - Data display (table, chart, avatar, badge, etc.)
  - Interactive elements (button, toggle, slider, etc.)

### Figma Integration:
Located in `./components/figma/`:
- ImageWithFallback.tsx

## Context Providers
Located in `./contexts/`:
- **ProposalContext.tsx** - Proposal state management
- **ThemeContext.tsx** - Theme management

## Utilities
Located in `./utils/`:
- **supabase/info.tsx** - Supabase configuration and utilities

## Styles
Located in `./styles/`:
- **globals.css** - Global CSS styles

## Backend/Database
Located in `./supabase/`:
- **functions/server/index.tsx** - Server functions
- **functions/server/kv_store.tsx** - Key-value store implementation

## Project Statistics
- **Total Files**: 80+ artifacts
- **Main Components**: 24 custom components
- **UI Components**: 47 shadcn/ui components
- **Context Providers**: 2 React contexts
- **Documentation Files**: 4 markdown files
- **Backend Functions**: 2 Supabase functions

## Technology Stack Identified
- **Frontend**: React + TypeScript (TSX files)
- **UI Library**: shadcn/ui component system
- **Backend**: Supabase
- **Styling**: CSS with global styles
- **State Management**: React Context API
- **Build Tool**: Likely Vite/Next.js (based on structure)

## Key Features Identified
Based on component names and structure:
- AI-powered proposal creation
- Construction pricing models
- Photo analysis and integration
- Client portal functionality
- CRM integrations
- Progress billing
- Voice input capabilities
- Material database
- Brand customization
- Payment collection
- Bulk pricing adjustments

## Analysis Readiness
All project artifacts have been successfully aggregated into this reference folder structure for comprehensive analysis. The collection includes:
- Complete source code
- All documentation
- Context notes and guidelines
- Component library
- Utility functions
- Styling assets
- Backend functions

This reference provides a complete snapshot of the Bidflow project for analysis and development planning.
