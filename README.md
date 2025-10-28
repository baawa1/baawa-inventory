# BaaWA Accessories Inventory Manager & POS System

A comprehensive inventory management and point-of-sale system built with Next.js 15, featuring AI-powered content generation and seamless Webflow CMS integration.

## 🎯 Project Overview

This is a modern, full-stack inventory management and POS system designed specifically for BaaWA Accessories. The system combines traditional inventory management with cutting-edge AI capabilities and automated e-commerce integration.

## ✨ Key Features

### 🏪 **Point of Sale (POS)**

- Real-time transaction processing
- Multiple payment methods (Cash, Bank Transfer, POS Machine, Credit Card, Mobile Money)
- Barcode scanning integration
- Receipt generation and printing
- Customer information capture
- Offline capability with automatic sync

### 📦 **Inventory Management**

- Complete product catalog with variants
- Stock level tracking and alerts

- Supplier relationship management
- Stock adjustment tracking with audit trails
- CSV import/export functionality

### 🤖 **AI-Powered Content Generation**

- Automated product descriptions
- SEO-optimized content creation
- Social media post generation
- Marketing copy creation
- Multiple tone options and keyword targeting
- Content approval workflow

### 🌐 **Webflow CMS Integration**

- Automatic product synchronization
- Real-time stock status updates
- Image and content management
- Batch sync capabilities
- Error handling and retry logic

### 👥 **Multi-User Support**

- Role-based access control (Admin, Manager, Staff)
- User activity tracking
- Secure authentication
- Session management

### 📊 **Analytics & Reporting**

- Sales performance tracking
- Inventory valuation reports
- Staff performance metrics
- Real-time dashboard
- Export capabilities (CSV, PDF)

## 🛠 Tech Stack

### **Frontend**

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### **Backend**

- **Next.js API Routes** - Serverless API endpoints
- **Prisma ORM** - Database toolkit
- **Supabase** - PostgreSQL database and authentication
- **NextAuth.js** - Authentication framework

### **External Integrations**

- **OpenAI API** - AI content generation
- **Webflow API** - CMS synchronization
- **IndexedDB** - Offline data storage

### **Development Tools**

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **TypeScript** - Static type checking

## 🏗 Project Structure

```
├── prisma/
│   └── schema.prisma          # Database schema
├── scripts/
│   └── migrate.js             # Custom migration script
├── docs/
│   ├── database-migration-workflow.md  # Migration documentation
│   └── migration-quick-reference.md    # Quick reference guide
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (dashboard)/       # Dashboard layout group
│   │   ├── api/              # API routes
│   │   ├── globals.css       # Global styles
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # React components
│   ├── lib/                  # Utility libraries
│   │   ├── db.ts            # Prisma client
│   │   ├── supabase.ts      # Supabase configuration
│   │   └── utils/           # Helper functions
│   └── types/               # TypeScript type definitions
├── tasks/                   # Project documentation
└── custom-instructions/     # Development guidelines
```

## 🗄 Database Schema

The system uses a comprehensive PostgreSQL database schema with the following main entities:

### **Core Entities**

- **Users** - Multi-role user management
- **Products** - Complete product catalog with variants
- **Suppliers** - Supplier information and relationships
- **Sales Transactions** - Complete transaction records
- **Stock Adjustments** - Inventory change tracking

### **Advanced Features**

- **AI Content** - Generated content tracking
- **Webflow Sync** - Integration status tracking
- **Audit Logs** - Complete activity monitoring

## 🚀 Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database (Supabase recommended)
- OpenAI API key
- Webflow API access

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/baawa1/baawa-inventory.git
   cd baawa-inventory
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   - Supabase credentials
   - OpenAI API key
   - Webflow API token
   - NextAuth secret

4. **Database Setup**

   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Check migration status
   npm run db:status
   
   # Deploy migrations (if needed)
   npm run db:deploy
   ```

   > **Note**: We use a custom migration script to handle Supabase connection issues. Always use `npm run db:*` commands instead of direct `npx prisma migrate` commands.

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open [http://localhost:3000](http://localhost:3000)**

## 🗄️ Database Management

### Migration Commands

We use a custom migration script to handle Supabase connection issues. **Always use these commands instead of direct Prisma commands:**

```bash
# Check migration status
npm run db:status

# Deploy pending migrations
npm run db:deploy

# Create new migration
npm run db:dev -- --name descriptive_name

# Resolve failed migration
npm run db:resolve <migration_name>

# Reset migration state (use with caution)
npm run db:reset --confirm
```

### Documentation

- 📖 [Database Migration Workflow](docs/database-migration-workflow.md) - Detailed documentation
- 📋 [Migration Quick Reference](docs/migration-quick-reference.md) - Quick commands reference

### Troubleshooting

If you encounter migration issues:

1. Check migration status: `npm run db:status`
2. Review the [migration workflow documentation](docs/database-migration-workflow.md)
3. Verify your `.env` file has correct `DATABASE_URL` and `DIRECT_URL`
4. Ensure your Supabase project is active

## 📋 Current Progress

### ✅ **Completed Tasks**

#### **1.0 Database Schema & Backend Setup**

- [x] **1.1.0** Initialize Next.js 15 project with TypeScript and Tailwind
- [x] **1.1** Set up Supabase project and configure environment variables
- [x] **1.2** Design and implement Prisma schema for products, users, sales, suppliers, and transactions

**What's Been Accomplished:**

1. **Complete Project Setup**: Next.js 15 with TypeScript, Tailwind CSS, and essential dependencies
2. **Database Infrastructure**:
   - Supabase PostgreSQL database configuration
   - Comprehensive Prisma schema with 13+ models
   - Client-side, server-side, and admin Supabase clients
   - Database connection testing utilities
3. **Type Safety**: Comprehensive TypeScript type definitions for all entities
4. **Environment Configuration**: Secure environment variable setup with examples

### **📁 Key Files Created**

- `prisma/schema.prisma` - Complete database schema
- `src/lib/supabase.ts` - Supabase client configuration
- `src/lib/db.ts` - Prisma client setup
- `src/types/` - TypeScript type definitions
- Environment configuration files

### 🎯 **Next Steps**

- [ ] **1.3** Create database migrations and seed data
- [ ] **1.4** Set up Prisma client and database connection utilities
- [ ] **1.5** Configure TypeScript types for all database entities
- [ ] **1.6** Implement basic CRUD API routes for all entities

## 🔐 Security Features

- **Role-based Access Control**: Admin, Manager, and Staff roles
- **Secure Authentication**: NextAuth.js with Supabase
- **Environment Protection**: Secure credential management
- **Audit Logging**: Complete activity tracking
- **Data Validation**: Zod schema validation

## 🌟 AI Integration Features

- **Content Generation**: Automated product descriptions and marketing copy
- **SEO Optimization**: AI-generated meta tags and descriptions
- **Social Media**: Automated social media post creation
- **Tone Customization**: Multiple writing styles and tones
- **Keyword Targeting**: SEO-focused content generation

## 🔗 External Integrations

### **Webflow CMS**

- Automatic product synchronization
- Real-time inventory updates
- Image and asset management
- Batch operations with error handling

### **OpenAI**

- GPT-powered content generation
- Customizable prompts and tones
- Content versioning and approval

## 📱 Progressive Web App (PWA)

The system is designed as a PWA with:

- Offline functionality for POS operations
- Service worker for caching
- App-like experience on mobile devices
- Background sync capabilities

## 🧪 Testing Strategy

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Complete workflow testing
- **Database Tests**: Schema and query testing

## 📖 Documentation

- **API Documentation**: Complete endpoint documentation
- **Component Library**: shadcn/ui component usage
- **Database Schema**: Entity relationship documentation
- **Development Guidelines**: Code standards and practices

## 🤝 Contributing

This is a private project for BaaWA Accessories. Development follows established coding guidelines and testing standards.

## 🚀 Deployments

- **Production**: Every push to `main` builds and deploys on Vercel.
- **Preview**: Every push to `dev` triggers a preview deployment at `https://baawa-inventory-b9bsgfdy0-baawa1s-projects.vercel.app`.

## 📄 License

Private project - All rights reserved.

---

**Built with ❤️ for BaaWA Accessories**
