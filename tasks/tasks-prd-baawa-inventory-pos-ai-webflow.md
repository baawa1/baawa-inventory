# Task List: BaaWA Accessories Inventory Manager & POS

Generated from: `prd-baawa-inventory-pos-ai-webflow.md`
Date: 22 June 2025

## Relevant Files

### Completed Files:

- `prisma/schema.prisma` - Complete database schema with integer IDs, all entities: users, products, suppliers, sales, transactions, AI content, and Webflow sync
- `jest.config.js` - Jest configuration with TypeScript support and path mapping
- `package.json` - Updated with testing dependencies and scripts
- `package-lock.json` - Updated dependencies for testing infrastructure
- `src/types/index-new.ts` - Updated TypeScript type definitions for all application entities
- `tests/README.md` - Comprehensive test documentation and guidelines
- `tests/setup.ts` - Jest test environment setup with mocks and utilities
- `tests/utils/test-utils.tsx` - Test utilities, mocks, and helper functions
- `tests/database/prisma-connection.js` - Legacy Prisma connection test (moved from root)
- `tests/database/supabase-tables.test.ts` - Supabase schema validation and integration tests (18 tests)
- `tests/database/supabase-validation.test.ts` - Additional schema and data validation tests (15 tests)
- `tests/lib/db.test.ts` - Database operations and connection tests (14 tests)
- `tests/lib/supabase.test.ts` - Supabase client functionality tests
- `tests/types/validation.test.ts` - Type validation and structure tests (22 tests)
- `tests/integration/database.test.ts` - Database integration and workflow tests
- `tests/api/products.test.ts` - API endpoint tests (placeholder for future implementation)
- `tests/lib/utils/inventory.test.ts` - Inventory utilities tests (placeholder for future implementation)
- `tests/lib/utils/pos.test.ts` - POS utilities tests (placeholder for future implementation)
- `src/app/api/products/route.ts` - Products CRUD API endpoints (GET, POST)
- `src/app/api/products/[id]/route.ts` - Individual product operations (GET, PUT, DELETE)
- `src/app/api/users/route.ts` - Users CRUD API endpoints (GET, POST)
- `src/app/api/users/[id]/route.ts` - Individual user operations (GET, PUT, DELETE)
- `src/app/api/suppliers/route.ts` - Suppliers CRUD API endpoints (GET, POST)
- `src/app/api/suppliers/[id]/route.ts` - Individual supplier operations (GET, PUT, DELETE)
- `src/app/api/sales/route.ts` - Sales transactions CRUD API endpoints (GET, POST)
- `src/app/api/sales/[id]/route.ts` - Individual sales transaction operations (GET, PUT, DELETE)
- `src/app/api/stock-adjustments/route.ts` - Stock adjustments API endpoints (GET, POST)
- `src/lib/validations/common.ts` - Base Zod validation schemas and utility functions
- `src/lib/validations/product.ts` - Product validation schemas (create, update, query)
- `src/lib/validations/user.ts` - User validation schemas (create, update, query)
- `src/lib/validations/supplier.ts` - Supplier validation schemas (create, update, query)
- `src/lib/validations/sale.ts` - Sale validation schemas (create, update, query, business rules)
- `src/lib/validations/stock-adjustment.ts` - Stock adjustment validation schemas
- `src/lib/validations/index.ts` - Validation schemas barrel export file
- `tests/lib/validations.test.ts` - Comprehensive validation schema tests (20 tests)

- `src/lib/auth.ts` - NextAuth.js configuration with Supabase adapter and credentials provider
- `src/lib/auth-helpers.ts` - Authentication helper functions for server-side auth checking
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth.js API route for authentication
- `tests/lib/auth.test.ts` - Authentication system tests (7 tests)
- `tests/utils/seed-users.ts` - Test user seeding utilities with password hashing
- `src/middleware.ts` - Next.js middleware for route protection and role-based access control
- `src/lib/auth-rbac.ts` - Role-based access control hooks and utilities with permission system
- `src/lib/api-middleware.ts` - API route middleware for authentication and role protection
- `src/components/auth/ProtectedRoute.tsx` - Client-side route protection components and HOCs
- `src/components/auth/AuthProvider.tsx` - NextAuth SessionProvider wrapper
- `src/app/unauthorized/page.tsx` - Unauthorized access error page
- `src/components/ui/button.tsx` - shadcn/ui Button component
- `src/components/ui/card.tsx` - shadcn/ui Card component
- `src/components/ui/form.tsx` - shadcn/ui Form components with react-hook-form integration
- `src/components/ui/input.tsx` - shadcn/ui Input component
- `src/components/ui/label.tsx` - shadcn/ui Label component
- `src/components/auth/LoginForm.tsx` - User login form component with validation
- `src/components/auth/RegisterForm.tsx` - User registration form component with validation
- `src/components/auth/LogoutButton.tsx` - Sign out button component
- `src/app/login/page.tsx` - Login page with authentication redirect logic
- `src/app/register/page.tsx` - Registration page with authentication redirect logic
- `src/app/dashboard/page.tsx` - Protected dashboard page with user welcome interface
- `tests/components/auth/LoginForm.test.tsx` - Login form component tests (6 tests)
- `tests/components/auth/RegisterForm.test.tsx` - Registration form component tests (8 tests)
- `tests/lib/auth-rbac.test.ts` - Role-based authentication tests (16 tests)

### Legacy/Placeholder Files (for future development):

- `.env.local` - Environment variables configuration with Supabase, NextAuth, OpenAI, and Webflow credentials
- `.env.example` - Template for environment variables
- `src/lib/supabase.ts` - Supabase client configuration for client-side, server-side, and admin operations
- `src/lib/db.ts` - Prisma client configuration and connection utilities
- `src/types/index.ts` - Legacy types file (deleted, replaced with index-new.ts)
- `src/app/api/products/route.ts` - Product CRUD API endpoints (to be implemented)
- `src/app/api/sales/route.ts` - Sales transaction API endpoints (to be implemented)
- `src/app/api/suppliers/route.ts` - Supplier management API endpoints (to be implemented)
- `src/app/api/ai/generate-content/route.ts` - AI content generation API (to be implemented)
- `src/app/api/webflow/sync/route.ts` - Webflow synchronization API (to be implemented)
- `src/components/inventory/ProductForm.tsx` - Product creation/editing form component (to be implemented)
- `src/components/inventory/ProductList.tsx` - Product listing with search/filter (to be implemented)
- `src/components/pos/POSInterface.tsx` - Main POS checkout interface (to be implemented)
- `src/components/ai/ContentGenerator.tsx` - AI content generation interface (to be implemented)
- `src/components/webflow/SyncManager.tsx` - Webflow sync interface (to be implemented)
- `src/components/reports/Dashboard.tsx` - Reporting dashboard component (to be implemented)
- `src/lib/utils/inventory.ts` - Inventory management utility functions (to be implemented)
- `src/lib/utils/pos.ts` - POS calculation and transaction utilities (to be implemented)
- `src/lib/utils/ai-content.ts` - AI content generation helpers (to be implemented)
- `src/lib/utils/webflow.ts` - Webflow API integration utilities (to be implemented)
- `src/lib/utils/reports.ts` - Report generation utilities (to be implemented)
- `src/lib/utils/csv-import.ts` - CSV product import functionality (to be implemented)
- `src/lib/utils/offline-storage.ts` - IndexedDB offline storage management (to be implemented)
- `src/lib/utils/receipt-generator.ts` - Receipt formatting and generation (to be implemented)
- `src/middleware.ts` - Next.js middleware for authentication and role-based access (to be implemented)
- `src/app/(dashboard)/inventory/page.tsx` - Inventory management page (to be implemented)
- `src/app/(dashboard)/pos/page.tsx` - POS interface page (to be implemented)
- `src/app/(dashboard)/reports/page.tsx` - Reports and analytics page (to be implemented)
- `src/app/(dashboard)/settings/page.tsx` - System settings and user management (to be implemented)
- `src/app/layout.tsx` - Root layout with authentication context (to be implemented)
- `tailwind.config.ts` - Tailwind CSS configuration with BaaWA brand colors (to be implemented)
- `next.config.js` - Next.js configuration for PWA capabilities (to be implemented)

### Test Results Summary:

- ✅ 156 passing tests (database schema, types, connections, integrations, validations, authentication, RBAC, auth forms)
- ❌ 11 expected failing tests (for unimplemented features)
- 🎯 Complete authentication and user management system with forms and validation
- 🎯 Role-based access control with permissions system implemented and tested
- 🎯 Custom login/register forms using shadcn/ui with proper validation
- 🎯 NextAuth.js integration with custom pages and middleware
- 🎯 Complete Supabase database validation and testing infrastructure
- 🎯 Comprehensive Zod validation schemas with business rule enforcement

### Notes

- Database foundation is complete with comprehensive test coverage
- All core Supabase tables created and validated with integer IDs
- Test infrastructure organized and ready for iterative development
- Legacy test files moved to proper test directory structure
- Ready to proceed with API development and frontend components
- Use shadcn components where applicable, do not use custom components for anything that is present in shadcn
- Use `npm run test:all` to run all tests, or specific test scripts for targeted testing
- The app uses App Router structure with route groups for dashboard sections
- Offline functionality requires PWA setup and IndexedDB for local storage
- Role-based access control is implemented through middleware and component-level guards
- Always use MCP to communicate with Supabase or any other app where applicable
- Offline POS → depends on → POS System, Advanced State Management

## Tasks

- [x] 1.0 Database Schema & Backend Setup

  - [x] 1.1.0 Initialize Next.js 15 project with TypeScript and Tailwind.
  - [x] 1.1 Set up Supabase project and configure environment variables
  - [x] 1.2 Design and implement Prisma schema for products, users, sales, suppliers, and transactions
  - [x] 1.3 Create database migrations and seed data
  - [x] 1.4 Set up Prisma client and database connection utilities
  - [x] 1.5 Configure TypeScript types for all database entities
  - [x] 1.6 Implement basic CRUD API routes for all entities
  - [x] 1.7 Add input validation using Zod schemas
  - [x] 1.8 Write unit tests for database utilities and API routes

- [ ] 2.0 Authentication & User Management System

  - [x] 2.1 Configure NextAuth.js with Supabase adapter
  - [x] 2.2 Implement role-based authentication (Admin, Manager, Staff)
  - [x] 2.3 Create user registration and login forms with proper validation
  - [ ] 2.4 Set up middleware for protecting routes based on user roles
  - [ ] 2.5 Build admin user management interface for creating/editing/deactivating users
  - [ ] 2.6 Implement session management and secure logout
  - [ ] 2.7 Add password reset functionality
  - [ ] 2.8 Create authentication context and hooks for role checking
  - [ ] 2.9 Write comprehensive tests for authentication flows

- [ ] 3.0 Core Inventory Management Module

  - [ ] 3.1 Build product creation form with image upload and variant support
  - [ ] 3.2 Implement product listing with search, filter, and pagination
  - [ ] 3.3 Create supplier management interface and purchase order tracking
  - [ ] 3.4 Build CSV import functionality with column mapping and validation
  - [ ] 3.5 Implement stock adjustment features with reason tracking
  - [ ] 3.6 Set up low-stock alerts and reorder level management
  - [ ] 3.7 Create product archiving and status management
  - [ ] 3.8 Build barcode generation and management system
  - [ ] 3.9 Implement inventory reporting and export functionality
  - [ ] 3.10 Add product image management with multiple image support
  - [ ] 3.11 Write comprehensive tests for all inventory features

- [ ] 4.0 Point of Sale (POS) System with Offline Capability

  - [ ] 4.1 Design and build main POS interface with product search and cart management
  - [ ] 4.2 Implement barcode scanning integration for product lookup
  - [ ] 4.3 Build discount application system (per item and total order)
  - [ ] 4.4 Create payment processing interface for cash, bank transfer, and POS machine
  - [ ] 4.5 Implement receipt generation and printing functionality
  - [ ] 4.6 Build customer information capture for loyalty programs
  - [ ] 4.7 Set up IndexedDB for offline transaction storage
  - [ ] 4.8 Implement offline mode detection and transaction queuing
  - [ ] 4.9 Create automatic sync mechanism when connection is restored
  - [ ] 4.10 Build transaction history and sales tracking
  - [ ] 4.11 Add PWA configuration for mobile POS usage
  - [ ] 4.12 Write extensive tests for POS functionality including offline scenarios

- [ ] 5.0 AI Content Generation Integration

  - [ ] 5.1 Set up OpenAI API integration and configure environment variables
  - [ ] 5.2 Build content generation interface with product input fields
  - [ ] 5.3 Implement AI prompt engineering for different content types (descriptions, SEO, social media)
  - [ ] 5.4 Create content preview and editing interface
  - [ ] 5.5 Build approval workflow for AI-generated content
  - [ ] 5.6 Implement tone selection and SEO keyword targeting
  - [ ] 5.7 Add batch content generation for multiple products
  - [ ] 5.8 Create content versioning and history tracking
  - [ ] 5.9 Implement error handling and retry logic for API failures
  - [ ] 5.10 Write tests for AI integration and content generation workflows

- [ ] 6.0 Webflow CMS Integration

  - [ ] 6.1 Set up Webflow API integration and authentication
  - [ ] 6.2 Map inventory system fields to Webflow CMS collection fields
  - [ ] 6.3 Build manual product sync interface with status feedback
  - [ ] 6.4 Implement batch sync functionality for multiple products
  - [ ] 6.5 Create sync status tracking and error reporting
  - [ ] 6.6 Build image upload and management for Webflow assets
  - [ ] 6.7 Implement stock status synchronization (in stock/out of stock)
  - [ ] 6.8 Add sync history and audit trail
  - [ ] 6.9 Create webhook handlers for Webflow updates (if needed)
  - [ ] 6.10 Write comprehensive tests for Webflow integration

- [ ] 7.0 Reporting & Analytics Dashboard
  - [ ] 7.1 Build sales reporting interface with date range filtering
  - [ ] 7.2 Implement inventory reports (current stock, stock value, low stock)
  - [ ] 7.3 Create staff performance tracking and transaction history
  - [ ] 7.4 Build supplier and purchase order reporting
  - [ ] 7.5 Implement data export functionality (CSV, PDF)
  - [ ] 7.6 Create visual charts and graphs using Chart.js or similar
  - [ ] 7.7 Build real-time dashboard with key metrics
  - [ ] 7.8 Implement report scheduling and email delivery (future enhancement)
  - [ ] 7.9 Add custom report builder interface
  - [ ] 7.10 Write tests for reporting functionality and data accuracy

<!--

Here is the terminal prompt: npx shadcn@latest add dashboard-01

Page.tsx: import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { SectionCards } from "@/components/section-cards"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import data from "./data.json"

export default function Page() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <DataTable data={data} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

Data.json: [
  {
    "id": 1,
    "header": "Cover page",
    "type": "Cover page",
    "status": "In Process",
    "target": "18",
    "limit": "5",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 2,
    "header": "Table of contents",
    "type": "Table of contents",
    "status": "Done",
    "target": "29",
    "limit": "24",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 3,
    "header": "Executive summary",
    "type": "Narrative",
    "status": "Done",
    "target": "10",
    "limit": "13",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 4,
    "header": "Technical approach",
    "type": "Narrative",
    "status": "Done",
    "target": "27",
    "limit": "23",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 5,
    "header": "Design",
    "type": "Narrative",
    "status": "In Process",
    "target": "2",
    "limit": "16",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 6,
    "header": "Capabilities",
    "type": "Narrative",
    "status": "In Process",
    "target": "20",
    "limit": "8",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 7,
    "header": "Integration with existing systems",
    "type": "Narrative",
    "status": "In Process",
    "target": "19",
    "limit": "21",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 8,
    "header": "Innovation and Advantages",
    "type": "Narrative",
    "status": "Done",
    "target": "25",
    "limit": "26",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 9,
    "header": "Overview of EMR's Innovative Solutions",
    "type": "Technical content",
    "status": "Done",
    "target": "7",
    "limit": "23",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 10,
    "header": "Advanced Algorithms and Machine Learning",
    "type": "Narrative",
    "status": "Done",
    "target": "30",
    "limit": "28",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 11,
    "header": "Adaptive Communication Protocols",
    "type": "Narrative",
    "status": "Done",
    "target": "9",
    "limit": "31",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 12,
    "header": "Advantages Over Current Technologies",
    "type": "Narrative",
    "status": "Done",
    "target": "12",
    "limit": "0",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 13,
    "header": "Past Performance",
    "type": "Narrative",
    "status": "Done",
    "target": "22",
    "limit": "33",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 14,
    "header": "Customer Feedback and Satisfaction Levels",
    "type": "Narrative",
    "status": "Done",
    "target": "15",
    "limit": "34",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 15,
    "header": "Implementation Challenges and Solutions",
    "type": "Narrative",
    "status": "Done",
    "target": "3",
    "limit": "35",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 16,
    "header": "Security Measures and Data Protection Policies",
    "type": "Narrative",
    "status": "In Process",
    "target": "6",
    "limit": "36",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 17,
    "header": "Scalability and Future Proofing",
    "type": "Narrative",
    "status": "Done",
    "target": "4",
    "limit": "37",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 18,
    "header": "Cost-Benefit Analysis",
    "type": "Plain language",
    "status": "Done",
    "target": "14",
    "limit": "38",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 19,
    "header": "User Training and Onboarding Experience",
    "type": "Narrative",
    "status": "Done",
    "target": "17",
    "limit": "39",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 20,
    "header": "Future Development Roadmap",
    "type": "Narrative",
    "status": "Done",
    "target": "11",
    "limit": "40",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 21,
    "header": "System Architecture Overview",
    "type": "Technical content",
    "status": "In Process",
    "target": "24",
    "limit": "18",
    "reviewer": "Maya Johnson"
  },
  {
    "id": 22,
    "header": "Risk Management Plan",
    "type": "Narrative",
    "status": "Done",
    "target": "15",
    "limit": "22",
    "reviewer": "Carlos Rodriguez"
  },
  {
    "id": 23,
    "header": "Compliance Documentation",
    "type": "Legal",
    "status": "In Process",
    "target": "31",
    "limit": "27",
    "reviewer": "Sarah Chen"
  },
  {
    "id": 24,
    "header": "API Documentation",
    "type": "Technical content",
    "status": "Done",
    "target": "8",
    "limit": "12",
    "reviewer": "Raj Patel"
  },
  {
    "id": 25,
    "header": "User Interface Mockups",
    "type": "Visual",
    "status": "In Process",
    "target": "19",
    "limit": "25",
    "reviewer": "Leila Ahmadi"
  },
  {
    "id": 26,
    "header": "Database Schema",
    "type": "Technical content",
    "status": "Done",
    "target": "22",
    "limit": "20",
    "reviewer": "Thomas Wilson"
  },
  {
    "id": 27,
    "header": "Testing Methodology",
    "type": "Technical content",
    "status": "In Process",
    "target": "17",
    "limit": "14",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 28,
    "header": "Deployment Strategy",
    "type": "Narrative",
    "status": "Done",
    "target": "26",
    "limit": "30",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 29,
    "header": "Budget Breakdown",
    "type": "Financial",
    "status": "In Process",
    "target": "13",
    "limit": "16",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 30,
    "header": "Market Analysis",
    "type": "Research",
    "status": "Done",
    "target": "29",
    "limit": "32",
    "reviewer": "Sophia Martinez"
  },
  {
    "id": 31,
    "header": "Competitor Comparison",
    "type": "Research",
    "status": "In Process",
    "target": "21",
    "limit": "19",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 32,
    "header": "Maintenance Plan",
    "type": "Technical content",
    "status": "Done",
    "target": "16",
    "limit": "23",
    "reviewer": "Alex Thompson"
  },
  {
    "id": 33,
    "header": "User Personas",
    "type": "Research",
    "status": "In Process",
    "target": "27",
    "limit": "24",
    "reviewer": "Nina Patel"
  },
  {
    "id": 34,
    "header": "Accessibility Compliance",
    "type": "Legal",
    "status": "Done",
    "target": "18",
    "limit": "21",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 35,
    "header": "Performance Metrics",
    "type": "Technical content",
    "status": "In Process",
    "target": "23",
    "limit": "26",
    "reviewer": "David Kim"
  },
  {
    "id": 36,
    "header": "Disaster Recovery Plan",
    "type": "Technical content",
    "status": "Done",
    "target": "14",
    "limit": "17",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 37,
    "header": "Third-party Integrations",
    "type": "Technical content",
    "status": "In Process",
    "target": "25",
    "limit": "28",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 38,
    "header": "User Feedback Summary",
    "type": "Research",
    "status": "Done",
    "target": "20",
    "limit": "15",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 39,
    "header": "Localization Strategy",
    "type": "Narrative",
    "status": "In Process",
    "target": "12",
    "limit": "19",
    "reviewer": "Maria Garcia"
  },
  {
    "id": 40,
    "header": "Mobile Compatibility",
    "type": "Technical content",
    "status": "Done",
    "target": "28",
    "limit": "31",
    "reviewer": "James Wilson"
  },
  {
    "id": 41,
    "header": "Data Migration Plan",
    "type": "Technical content",
    "status": "In Process",
    "target": "19",
    "limit": "22",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 42,
    "header": "Quality Assurance Protocols",
    "type": "Technical content",
    "status": "Done",
    "target": "30",
    "limit": "33",
    "reviewer": "Priya Singh"
  },
  {
    "id": 43,
    "header": "Stakeholder Analysis",
    "type": "Research",
    "status": "In Process",
    "target": "11",
    "limit": "14",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 44,
    "header": "Environmental Impact Assessment",
    "type": "Research",
    "status": "Done",
    "target": "24",
    "limit": "27",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 45,
    "header": "Intellectual Property Rights",
    "type": "Legal",
    "status": "In Process",
    "target": "17",
    "limit": "20",
    "reviewer": "Sarah Johnson"
  },
  {
    "id": 46,
    "header": "Customer Support Framework",
    "type": "Narrative",
    "status": "Done",
    "target": "22",
    "limit": "25",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 47,
    "header": "Version Control Strategy",
    "type": "Technical content",
    "status": "In Process",
    "target": "15",
    "limit": "18",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 48,
    "header": "Continuous Integration Pipeline",
    "type": "Technical content",
    "status": "Done",
    "target": "26",
    "limit": "29",
    "reviewer": "Michael Chen"
  },
  {
    "id": 49,
    "header": "Regulatory Compliance",
    "type": "Legal",
    "status": "In Process",
    "target": "13",
    "limit": "16",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 50,
    "header": "User Authentication System",
    "type": "Technical content",
    "status": "Done",
    "target": "28",
    "limit": "31",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 51,
    "header": "Data Analytics Framework",
    "type": "Technical content",
    "status": "In Process",
    "target": "21",
    "limit": "24",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 52,
    "header": "Cloud Infrastructure",
    "type": "Technical content",
    "status": "Done",
    "target": "16",
    "limit": "19",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 53,
    "header": "Network Security Measures",
    "type": "Technical content",
    "status": "In Process",
    "target": "29",
    "limit": "32",
    "reviewer": "Lisa Wong"
  },
  {
    "id": 54,
    "header": "Project Timeline",
    "type": "Planning",
    "status": "Done",
    "target": "14",
    "limit": "17",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 55,
    "header": "Resource Allocation",
    "type": "Planning",
    "status": "In Process",
    "target": "27",
    "limit": "30",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 56,
    "header": "Team Structure and Roles",
    "type": "Planning",
    "status": "Done",
    "target": "20",
    "limit": "23",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 57,
    "header": "Communication Protocols",
    "type": "Planning",
    "status": "In Process",
    "target": "15",
    "limit": "18",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 58,
    "header": "Success Metrics",
    "type": "Planning",
    "status": "Done",
    "target": "30",
    "limit": "33",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 59,
    "header": "Internationalization Support",
    "type": "Technical content",
    "status": "In Process",
    "target": "23",
    "limit": "26",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 60,
    "header": "Backup and Recovery Procedures",
    "type": "Technical content",
    "status": "Done",
    "target": "18",
    "limit": "21",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 61,
    "header": "Monitoring and Alerting System",
    "type": "Technical content",
    "status": "In Process",
    "target": "25",
    "limit": "28",
    "reviewer": "Daniel Park"
  },
  {
    "id": 62,
    "header": "Code Review Guidelines",
    "type": "Technical content",
    "status": "Done",
    "target": "12",
    "limit": "15",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 63,
    "header": "Documentation Standards",
    "type": "Technical content",
    "status": "In Process",
    "target": "27",
    "limit": "30",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 64,
    "header": "Release Management Process",
    "type": "Planning",
    "status": "Done",
    "target": "22",
    "limit": "25",
    "reviewer": "Assign reviewer"
  },
  {
    "id": 65,
    "header": "Feature Prioritization Matrix",
    "type": "Planning",
    "status": "In Process",
    "target": "19",
    "limit": "22",
    "reviewer": "Emma Davis"
  },
  {
    "id": 66,
    "header": "Technical Debt Assessment",
    "type": "Technical content",
    "status": "Done",
    "target": "24",
    "limit": "27",
    "reviewer": "Eddie Lake"
  },
  {
    "id": 67,
    "header": "Capacity Planning",
    "type": "Planning",
    "status": "In Process",
    "target": "21",
    "limit": "24",
    "reviewer": "Jamik Tashpulatov"
  },
  {
    "id": 68,
    "header": "Service Level Agreements",
    "type": "Legal",
    "status": "Done",
    "target": "26",
    "limit": "29",
    "reviewer": "Assign reviewer"
  }
]



App-sidebar.tsx:
"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconSearch,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: IconDashboard,
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: IconListDetails,
    },
    {
      title: "Analytics",
      url: "#",
      icon: IconChartBar,
    },
    {
      title: "Projects",
      url: "#",
      icon: IconFolder,
    },
    {
      title: "Team",
      url: "#",
      icon: IconUsers,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "#",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "#",
      icon: IconSearch,
    },
  ],
  documents: [
    {
      name: "Data Library",
      url: "#",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "#",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "#",
      icon: IconFileWord,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}


Shadcn blocks for reference

Chat-area-iinteractive.tsx: "use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", desktop: 222, mobile: 150 },
  { date: "2024-04-02", desktop: 97, mobile: 180 },
  { date: "2024-04-03", desktop: 167, mobile: 120 },
  { date: "2024-04-04", desktop: 242, mobile: 260 },
  { date: "2024-04-05", desktop: 373, mobile: 290 },
  { date: "2024-04-06", desktop: 301, mobile: 340 },
  { date: "2024-04-07", desktop: 245, mobile: 180 },
  { date: "2024-04-08", desktop: 409, mobile: 320 },
  { date: "2024-04-09", desktop: 59, mobile: 110 },
  { date: "2024-04-10", desktop: 261, mobile: 190 },
  { date: "2024-04-11", desktop: 327, mobile: 350 },
  { date: "2024-04-12", desktop: 292, mobile: 210 },
  { date: "2024-04-13", desktop: 342, mobile: 380 },
  { date: "2024-04-14", desktop: 137, mobile: 220 },
  { date: "2024-04-15", desktop: 120, mobile: 170 },
  { date: "2024-04-16", desktop: 138, mobile: 190 },
  { date: "2024-04-17", desktop: 446, mobile: 360 },
  { date: "2024-04-18", desktop: 364, mobile: 410 },
  { date: "2024-04-19", desktop: 243, mobile: 180 },
  { date: "2024-04-20", desktop: 89, mobile: 150 },
  { date: "2024-04-21", desktop: 137, mobile: 200 },
  { date: "2024-04-22", desktop: 224, mobile: 170 },
  { date: "2024-04-23", desktop: 138, mobile: 230 },
  { date: "2024-04-24", desktop: 387, mobile: 290 },
  { date: "2024-04-25", desktop: 215, mobile: 250 },
  { date: "2024-04-26", desktop: 75, mobile: 130 },
  { date: "2024-04-27", desktop: 383, mobile: 420 },
  { date: "2024-04-28", desktop: 122, mobile: 180 },
  { date: "2024-04-29", desktop: 315, mobile: 240 },
  { date: "2024-04-30", desktop: 454, mobile: 380 },
  { date: "2024-05-01", desktop: 165, mobile: 220 },
  { date: "2024-05-02", desktop: 293, mobile: 310 },
  { date: "2024-05-03", desktop: 247, mobile: 190 },
  { date: "2024-05-04", desktop: 385, mobile: 420 },
  { date: "2024-05-05", desktop: 481, mobile: 390 },
  { date: "2024-05-06", desktop: 498, mobile: 520 },
  { date: "2024-05-07", desktop: 388, mobile: 300 },
  { date: "2024-05-08", desktop: 149, mobile: 210 },
  { date: "2024-05-09", desktop: 227, mobile: 180 },
  { date: "2024-05-10", desktop: 293, mobile: 330 },
  { date: "2024-05-11", desktop: 335, mobile: 270 },
  { date: "2024-05-12", desktop: 197, mobile: 240 },
  { date: "2024-05-13", desktop: 197, mobile: 160 },
  { date: "2024-05-14", desktop: 448, mobile: 490 },
  { date: "2024-05-15", desktop: 473, mobile: 380 },
  { date: "2024-05-16", desktop: 338, mobile: 400 },
  { date: "2024-05-17", desktop: 499, mobile: 420 },
  { date: "2024-05-18", desktop: 315, mobile: 350 },
  { date: "2024-05-19", desktop: 235, mobile: 180 },
  { date: "2024-05-20", desktop: 177, mobile: 230 },
  { date: "2024-05-21", desktop: 82, mobile: 140 },
  { date: "2024-05-22", desktop: 81, mobile: 120 },
  { date: "2024-05-23", desktop: 252, mobile: 290 },
  { date: "2024-05-24", desktop: 294, mobile: 220 },
  { date: "2024-05-25", desktop: 201, mobile: 250 },
  { date: "2024-05-26", desktop: 213, mobile: 170 },
  { date: "2024-05-27", desktop: 420, mobile: 460 },
  { date: "2024-05-28", desktop: 233, mobile: 190 },
  { date: "2024-05-29", desktop: 78, mobile: 130 },
  { date: "2024-05-30", desktop: 340, mobile: 280 },
  { date: "2024-05-31", desktop: 178, mobile: 230 },
  { date: "2024-06-01", desktop: 178, mobile: 200 },
  { date: "2024-06-02", desktop: 470, mobile: 410 },
  { date: "2024-06-03", desktop: 103, mobile: 160 },
  { date: "2024-06-04", desktop: 439, mobile: 380 },
  { date: "2024-06-05", desktop: 88, mobile: 140 },
  { date: "2024-06-06", desktop: 294, mobile: 250 },
  { date: "2024-06-07", desktop: 323, mobile: 370 },
  { date: "2024-06-08", desktop: 385, mobile: 320 },
  { date: "2024-06-09", desktop: 438, mobile: 480 },
  { date: "2024-06-10", desktop: 155, mobile: 200 },
  { date: "2024-06-11", desktop: 92, mobile: 150 },
  { date: "2024-06-12", desktop: 492, mobile: 420 },
  { date: "2024-06-13", desktop: 81, mobile: 130 },
  { date: "2024-06-14", desktop: 426, mobile: 380 },
  { date: "2024-06-15", desktop: 307, mobile: 350 },
  { date: "2024-06-16", desktop: 371, mobile: 310 },
  { date: "2024-06-17", desktop: 475, mobile: 520 },
  { date: "2024-06-18", desktop: 107, mobile: 170 },
  { date: "2024-06-19", desktop: 341, mobile: 290 },
  { date: "2024-06-20", desktop: 408, mobile: 450 },
  { date: "2024-06-21", desktop: 169, mobile: 210 },
  { date: "2024-06-22", desktop: 317, mobile: 270 },
  { date: "2024-06-23", desktop: 480, mobile: 530 },
  { date: "2024-06-24", desktop: 132, mobile: 180 },
  { date: "2024-06-25", desktop: 141, mobile: 190 },
  { date: "2024-06-26", desktop: 434, mobile: 380 },
  { date: "2024-06-27", desktop: 448, mobile: 490 },
  { date: "2024-06-28", desktop: 149, mobile: 200 },
  { date: "2024-06-29", desktop: 103, mobile: 160 },
  { date: "2024-06-30", desktop: 446, mobile: 400 },
]

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Total Visitors</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Total for the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillDesktop" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-desktop)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillMobile" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-mobile)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              defaultIndex={isMobile ? -1 : 10}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="mobile"
              type="natural"
              fill="url(#fillMobile)"
              stroke="var(--color-mobile)"
              stackId="a"
            />
            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#fillDesktop)"
              stroke="var(--color-desktop)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}


Data-table.tsx: "use client"

import * as React from "react"
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconTrendingUp,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const schema = z.object({
  id: z.number(),
  header: z.string(),
  type: z.string(),
  status: z.string(),
  target: z.string(),
  limit: z.string(),
  reviewer: z.string(),
})

// Create a separate component for the drag handle
function DragHandle({ id }: { id: number }) {
  const { attributes, listeners } = useSortable({
    id,
  })

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  )
}

const columns: ColumnDef<z.infer<typeof schema>>[] = [
  {
    id: "drag",
    header: () => null,
    cell: ({ row }) => <DragHandle id={row.original.id} />,
  },
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Header",
    cell: ({ row }) => {
      return <TableCellViewer item={row.original} />
    },
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Section Type",
    cell: ({ row }) => (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.type}
        </Badge>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="text-muted-foreground px-1.5">
        {row.original.status === "Done" ? (
          <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
        ) : (
          <IconLoader />
        )}
        {row.original.status}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: () => <div className="w-full text-right">Target</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-target`} className="sr-only">
          Target
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.target}
          id={`${row.original.id}-target`}
        />
      </form>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="w-full text-right">Limit</div>,
    cell: ({ row }) => (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          toast.promise(new Promise((resolve) => setTimeout(resolve, 1000)), {
            loading: `Saving ${row.original.header}`,
            success: "Done",
            error: "Error",
          })
        }}
      >
        <Label htmlFor={`${row.original.id}-limit`} className="sr-only">
          Limit
        </Label>
        <Input
          className="hover:bg-input/30 focus-visible:bg-background dark:hover:bg-input/30 dark:focus-visible:bg-input/30 h-8 w-16 border-transparent bg-transparent text-right shadow-none focus-visible:border dark:bg-transparent"
          defaultValue={row.original.limit}
          id={`${row.original.id}-limit`}
        />
      </form>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Reviewer",
    cell: ({ row }) => {
      const isAssigned = row.original.reviewer !== "Assign reviewer"

      if (isAssigned) {
        return row.original.reviewer
      }

      return (
        <>
          <Label htmlFor={`${row.original.id}-reviewer`} className="sr-only">
            Reviewer
          </Label>
          <Select>
            <SelectTrigger
              className="w-38 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate"
              size="sm"
              id={`${row.original.id}-reviewer`}
            >
              <SelectValue placeholder="Assign reviewer" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
              <SelectItem value="Jamik Tashpulatov">
                Jamik Tashpulatov
              </SelectItem>
            </SelectContent>
          </Select>
        </>
      )
    },
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
            size="icon"
          >
            <IconDotsVertical />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Make a copy</DropdownMenuItem>
          <DropdownMenuItem>Favorite</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

function DraggableRow({ row }: { row: Row<z.infer<typeof schema>> }) {
  const { transform, transition, setNodeRef, isDragging } = useSortable({
    id: row.original.id,
  })

  return (
    <TableRow
      data-state={row.getIsSelected() && "selected"}
      data-dragging={isDragging}
      ref={setNodeRef}
      className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition,
      }}
    >
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </TableCell>
      ))}
    </TableRow>
  )
}

export function DataTable({
  data: initialData,
}: {
  data: z.infer<typeof schema>[]
}) {
  const [data, setData] = React.useState(() => initialData)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const sortableId = React.useId()
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  )

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => data?.map(({ id }) => id) || [],
    [data]
  )

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id.toString(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (active && over && active.id !== over.id) {
      setData((data) => {
        const oldIndex = dataIds.indexOf(active.id)
        const newIndex = dataIds.indexOf(over.id)
        return arrayMove(data, oldIndex, newIndex)
      })
    }
  }

  return (
    <Tabs
      defaultValue="outline"
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <Label htmlFor="view-selector" className="sr-only">
          View
        </Label>
        <Select defaultValue="outline">
          <SelectTrigger
            className="flex w-fit @4xl/main:hidden"
            size="sm"
            id="view-selector"
          >
            <SelectValue placeholder="Select a view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="outline">Outline</SelectItem>
            <SelectItem value="past-performance">Past Performance</SelectItem>
            <SelectItem value="key-personnel">Key Personnel</SelectItem>
            <SelectItem value="focus-documents">Focus Documents</SelectItem>
          </SelectContent>
        </Select>
        <TabsList className="**:data-[slot=badge]:bg-muted-foreground/30 hidden **:data-[slot=badge]:size-5 **:data-[slot=badge]:rounded-full **:data-[slot=badge]:px-1 @4xl/main:flex">
          <TabsTrigger value="outline">Outline</TabsTrigger>
          <TabsTrigger value="past-performance">
            Past Performance <Badge variant="secondary">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="key-personnel">
            Key Personnel <Badge variant="secondary">2</Badge>
          </TabsTrigger>
          <TabsTrigger value="focus-documents">Focus Documents</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="sm">
            <IconPlus />
            <span className="hidden lg:inline">Add Section</span>
          </Button>
        </div>
      </div>
      <TabsContent
        value="outline"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext
                    items={dataIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="past-performance"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent value="key-personnel" className="flex flex-col px-4 lg:px-6">
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
      <TabsContent
        value="focus-documents"
        className="flex flex-col px-4 lg:px-6"
      >
        <div className="aspect-video w-full flex-1 rounded-lg border border-dashed"></div>
      </TabsContent>
    </Tabs>
  )
}

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--primary)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--primary)",
  },
} satisfies ChartConfig

function TableCellViewer({ item }: { item: z.infer<typeof schema> }) {
  const isMobile = useIsMobile()

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left">
          {item.header}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.header}</DrawerTitle>
          <DrawerDescription>
            Showing total visitors for the last 6 months
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
          {!isMobile && (
            <>
              <ChartContainer config={chartConfig}>
                <AreaChart
                  accessibilityLayer
                  data={chartData}
                  margin={{
                    left: 0,
                    right: 10,
                  }}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 3)}
                    hide
                  />
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                  />
                  <Area
                    dataKey="mobile"
                    type="natural"
                    fill="var(--color-mobile)"
                    fillOpacity={0.6}
                    stroke="var(--color-mobile)"
                    stackId="a"
                  />
                  <Area
                    dataKey="desktop"
                    type="natural"
                    fill="var(--color-desktop)"
                    fillOpacity={0.4}
                    stroke="var(--color-desktop)"
                    stackId="a"
                  />
                </AreaChart>
              </ChartContainer>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Trending up by 5.2% this month{" "}
                  <IconTrendingUp className="size-4" />
                </div>
                <div className="text-muted-foreground">
                  Showing total visitors for the last 6 months. This is just
                  some random text to test the layout. It spans multiple lines
                  and should wrap around.
                </div>
              </div>
              <Separator />
            </>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <Label htmlFor="header">Header</Label>
              <Input id="header" defaultValue={item.header} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue={item.type}>
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Table of Contents">
                      Table of Contents
                    </SelectItem>
                    <SelectItem value="Executive Summary">
                      Executive Summary
                    </SelectItem>
                    <SelectItem value="Technical Approach">
                      Technical Approach
                    </SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Capabilities">Capabilities</SelectItem>
                    <SelectItem value="Focus Documents">
                      Focus Documents
                    </SelectItem>
                    <SelectItem value="Narrative">Narrative</SelectItem>
                    <SelectItem value="Cover Page">Cover Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={item.status}>
                  <SelectTrigger id="status" className="w-full">
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Done">Done</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-3">
                <Label htmlFor="target">Target</Label>
                <Input id="target" defaultValue={item.target} />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="limit">Limit</Label>
                <Input id="limit" defaultValue={item.limit} />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Label htmlFor="reviewer">Reviewer</Label>
              <Select defaultValue={item.reviewer}>
                <SelectTrigger id="reviewer" className="w-full">
                  <SelectValue placeholder="Select a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Eddie Lake">Eddie Lake</SelectItem>
                  <SelectItem value="Jamik Tashpulatov">
                    Jamik Tashpulatov
                  </SelectItem>
                  <SelectItem value="Emily Whalen">Emily Whalen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </form>
        </div>
        <DrawerFooter>
          <Button>Submit</Button>
          <DrawerClose asChild>
            <Button variant="outline">Done</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}


Nav-document.tsx:

"use client"

import {
  IconDots,
  IconFolder,
  IconShare3,
  IconTrash,
  type Icon,
} from "@tabler/icons-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
}: {
  items: {
    name: string
    url: string
    icon: Icon
  }[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Documents</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <a href={item.url}>
                <item.icon />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction
                  showOnHover
                  className="data-[state=open]:bg-accent rounded-sm"
                >
                  <IconDots />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-24 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem>
                  <IconFolder />
                  <span>Open</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconShare3 />
                  <span>Share</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  <IconTrash />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <IconDots className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}


Nav-main.tsx: "use client"

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              tooltip="Quick Create"
              className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear"
            >
              <IconCirclePlusFilled />
              <span>Quick Create</span>
            </SidebarMenuButton>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <IconMail />
              <span className="sr-only">Inbox</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton tooltip={item.title}>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

Nav-secondary.tsx:
"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: Icon
  }[]
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}


Nav-user.tsx:
"use client"

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
} from "@tabler/icons-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconNotification />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

Section-card.tsx:
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $1,250.00
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Trending up this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Visitors for the last 6 months
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            1,234
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingDown />
              -20%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Down 20% this period <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Acquisition needs attention
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            45,678
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong user retention <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Engagement exceed targets</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            4.5%
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +4.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Steady performance increase <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Meets growth projections</div>
        </CardFooter>
      </Card>
    </div>
  )
}

Site-header.tsx:
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

export function SiteHeader() {
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">Documents</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
            <a
              href="https://github.com/shadcn-ui/ui/tree/main/apps/v4/app/(examples)/dashboard"
              rel="noopener noreferrer"
              target="_blank"
              className="dark:text-foreground"
            >
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </header>
  )
}




## Form

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login with your Apple or Google account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid gap-6">
              <div className="flex flex-col gap-4">
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Apple
                </Button>
                <Button variant="outline" className="w-full">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-card text-muted-foreground relative z-10 px-2">
                  Or continue with
                </span>
              </div>
              <div className="grid gap-6">
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input id="password" type="password" required />
                </div>
                <Button type="submit" className="w-full">
                  Login
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="#" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
-->
