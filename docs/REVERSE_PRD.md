# 📋 BaaWA Accessories - Inventory POS System
## Reverse Product Requirements Document

### **Executive Summary**

A full-featured, production-grade inventory management and point-of-sale system built for retail operations. The application features enterprise-level authentication, role-based access control, complete inventory tracking with weighted average costing, multi-payment POS, financial management, and automated backups.

**Key Statistics:**
- 26 database models
- 108 API endpoints
- 3 user roles with 72 granular permissions
- Multi-tier authentication system
- 9 stock transaction types
- Security score: 7.5/10

---

## **1. DATABASE ARCHITECTURE**

### **Core Models (26 Total)**

**User Management:**
- User (multi-status authentication flow)
- SessionBlacklist (revoked sessions)

**Inventory Core:**
- Product (SKU-based with cost/price tracking)
- Category (hierarchical with parent-child)
- Brand
- Supplier

**Stock Management:**
- StockAddition (purchases)
- StockAdjustment (manual corrections with approval)
- StockReconciliation (physical counts)
- StockReconciliationItem (reconciliation details)
- StockTransaction (complete audit trail)

**Point of Sale:**
- SalesTransaction (transaction header)
- SalesItem (line items)
- SplitPayment (multi-payment support)
- TransactionPayment (debt payments)
- TransactionFee (additional charges)
- Customer (customer records)
- Coupon (promotions)

**Financial Management:**
- FinancialTransaction (income/expenses)
- ExpenseDetail
- IncomeDetail
- FinancialReport

**System & Audit:**
- AuditLog (activity trail)
- AIContent (AI-generated content tracking)
- RateLimit
- BackupLog
- GoogleOAuthToken

---

## **2. AUTHENTICATION & AUTHORIZATION**

### **Multi-Tier Authentication Flow**

**Tier 1: Email Verification**
```
Register → PENDING → Email Sent → Verify → VERIFIED
```

**Tier 2: Admin Approval**
```
VERIFIED → Pending Approval Screen → Admin Review → APPROVED/REJECTED
```

**Tier 3: Active Session**
```
APPROVED → Dashboard Access → Activity Tracking → Auto-refresh
```

### **User Statuses**
- PENDING (just registered)
- VERIFIED (email confirmed)
- APPROVED (full access)
- REJECTED (denied access)
- SUSPENDED (revoked access)

### **Role-Based Access Control**

**ADMIN (Level 3)**
- Full system access
- User management
- Financial analytics (profit margins, ROI)
- Product cost prices
- System configuration
- All reports

**MANAGER (Level 2)**
- Inventory management (create, edit)
- Finance transactions (create, view own)
- Non-financial reports
- POS access
- Customer management
- Cannot see: Cost prices, profit margins, revenue totals

**STAFF (Level 1)**
- Inventory view-only
- POS access
- Sales processing
- Basic reports
- Limited to selling prices only

**72 Granular Permissions** across categories:
- Inventory, Sales, POS, Reports, Settings, Finance, Financial Analytics, Product Cost, Supplier, Customer, Business Intelligence, System Security

---

## **3. CORE FEATURES**

### **A. Point of Sale (POS)**

**Transaction Processing:**
- Real-time product search with barcode support
- Shopping cart with quantity management
- Price override (with reason tracking)
- Coupon application (percentage/fixed)
- Transaction fees
- Split payment across multiple methods
- Debt tracking with partial payments
- Customer information capture
- Receipt generation and reprinting

**Payment Methods:**
- Cash, Bank Transfer, POS Machine, Credit Card, Mobile Money, Debt
- Split payments supported

**Payment Statuses:**
- Pending, Paid, Partial (debt), Refunded, Cancelled

**POS Features:**
- Offline capability (IndexedDB)
- Barcode scanner integration
- Receipt printer support
- Customer history lookup
- Stock availability checking
- Real-time inventory updates

### **B. Inventory Management**

**Product Management:**
- Complete CRUD operations
- SKU-based identification (auto-generated)
- Multi-image support
- Category and brand assignment
- Supplier relationships
- Stock level tracking with min stock alerts
- Cost and selling price management
- Service item support
- Product archival (soft delete)
- Tags for organization

**Stock Operations:**

1. **Stock Additions** (Purchases)
   - Weighted average cost calculation
   - Previous/new stock tracking
   - Reference numbers
   - Cost per unit tracking
   - Supplier association

2. **Stock Adjustments** (Manual corrections)
   - Approval workflow (Manager creates, Admin approves)
   - Reason tracking
   - Old/new quantity snapshots
   - Reference numbers

3. **Stock Reconciliations** (Physical counts)
   - Workflow: DRAFT → PENDING → APPROVED
   - Multi-item reconciliation
   - System vs physical count comparison
   - Discrepancy tracking with reasons
   - Estimated financial impact calculation

4. **Stock Transactions** (Audit trail)
   - 9 types: SALE, PURCHASE, ADJUSTMENT_IN, ADJUSTMENT_OUT, RECONCILIATION, RETURN, DAMAGE, THEFT, LOSS
   - Quantity tracking
   - Reference to source operation
   - Stock snapshots (before/after)

**Stock Features:**
- Low stock alerts (configurable threshold)
- Out of stock monitoring
- Stock history per product
- Batch operations
- CSV import/export

### **C. Customer Management**

**Customer Records:**
- Contact information (name, email, phone)
- Billing/shipping addresses
- Customer type (individual/business)
- Purchase history
- Notes field
- Active status

**Customer Analytics:**
- Total spent
- Total orders
- Average order value
- Last purchase date
- Top customers ranking

### **D. Financial Management**

**Transaction Types:**

**Income:**
- Sources: SALES, SERVICES, INVESTMENTS, ROYALTIES, COMMISSIONS, OTHER
- Payer information tracking

**Expenses:**
- Types: INVENTORY_PURCHASES, UTILITIES, RENT, SALARIES, MARKETING, OFFICE_SUPPLIES, TRAVEL, INSURANCE, MAINTENANCE, OTHER
- Vendor information tracking

**Workflow:**
- Manager creates → Status: PENDING
- Admin approves → Status: APPROVED
- Included in financial reports

**Financial Reports:**
- Income statement
- Profit & loss
- Cash flow
- Expense breakdown
- Revenue analysis (Admin-only)
- Profit margins (Admin-only)
- ROI calculations

### **E. Reporting & Analytics**

**Dashboard Analytics:**
- Real-time KPIs
- Sales trends (7, 30, 90 days)
- Revenue charts
- Low stock alerts
- Recent transactions
- Top products
- Top customers
- Category performance

**Inventory Reports:**
- Stock levels
- Low stock items
- Stock value (weighted average cost)
- Stock movement history
- Product performance
- Category/brand analysis

**Sales Reports:**
- Daily/weekly/monthly sales
- Sales by staff
- Sales by payment method
- Sales by customer
- Product sales ranking
- Discount analysis

### **F. Coupon System**

**Coupon Features:**
- Code-based system
- Types: PERCENTAGE, FIXED
- Minimum amount requirements
- Usage limits (max uses tracking)
- Validity periods
- Active/inactive status
- Real-time validation
- Usage analytics

---

## **4. USER WORKFLOWS**

### **User Onboarding**
```
Registration → Email Verification → Pending Approval →
Admin Review → Approval/Rejection → Dashboard Access
```

### **POS Transaction**
```
Product Search → Add to Cart → Adjust Quantities →
Apply Discounts/Coupons → Customer Info (optional) →
Select Payment Method → Process Payment → Generate Receipt →
Auto Stock Update → Transaction Saved
```

### **Stock Addition**
```
Select Product → Enter Quantity → Enter Cost →
Select Supplier (optional) → Add Reference →
Save → Stock Updated → WAC Calculated →
Transaction Logged
```

### **Stock Reconciliation**
```
Create Draft → Add Products → Record Physical Counts →
System Calculates Discrepancies → Add Reasons →
Estimate Impact → Submit for Approval →
Admin Reviews → Approve/Reject →
Stock Updated (if approved) → Transactions Logged
```

### **Expense Recording**
```
Manager Creates Expense → Select Type → Enter Details →
Add Vendor Info → Save (Status: PENDING) →
Admin Reviews → Approve/Reject →
Included in Reports (if approved)
```

---

## **5. API ARCHITECTURE**

**Total Endpoints: 108**

### **Key API Groups:**

**Authentication** (`/api/auth`)
- Register, Login, Verify Email, Forgot Password, Reset Password, Session Refresh

**User Management** (`/api/users`)
- CRUD operations, Profile management, Password change

**Admin** (`/api/admin`)
- User approval/rejection/suspension, Activity logs, Settings, Email testing

**Products** (`/api/products`)
- CRUD, Archival, Image management, Barcode lookup

**Inventory** (`/api/inventory`)
- Overview, Statistics, Snapshot, Recent activity, Charts, Reports

**Stock Management**
- Stock additions, Reconciliations, Adjustments

**POS** (`/api/pos`)
- Transactions, Product search, Barcode lookup, Receipt printing

**Customers** (`/api/pos/customers`)
- CRUD, Purchase history, Uniqueness check

**Coupons** (`/api/pos/coupons`)
- CRUD, Validation, Toggle active status

**Analytics** (`/api/pos/analytics`)
- Daily orders, Product analytics, Category analytics, Customer analytics

**Suppliers** (`/api/suppliers`)
- CRUD operations

**Backup** (`/api/admin/google-drive`, `/api/cron/backup`)
- OAuth authorization, Backup triggers, Status monitoring

### **API Patterns:**

**Request Validation:**
- Zod schemas for all input
- Type-safe validation
- Field-level error messages

**Response Format:**
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string,
  "details": ValidationError[],
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number,
    "hasNext": boolean,
    "hasPrev": boolean
  }
}
```

**Middleware Stack:**
1. Security headers
2. Authentication (JWT)
3. Authorization (role/permission)
4. Rate limiting
5. CSRF protection
6. Request validation (Zod)
7. Error handling
8. Audit logging

---

## **6. BUSINESS LOGIC**

### **Inventory Valuation**

**Weighted Average Cost (WAC):**
```
WAC = (Existing Value + New Value) / Total Quantity

Example:
Existing: 10 units @ ₦100 = ₦1,000
New: 5 units @ ₦150 = ₦750
Total: 15 units = ₦1,750
WAC: ₦1,750 / 15 = ₦116.67
```

**COGS Calculation:**
```
COGS = Quantity Sold × Weighted Average Cost
```

### **Pricing Rules**
- Selling price must be ≥ purchase price
- Price override allowed in POS (requires reason)
- Discounts: 0-100% for percentage, cannot exceed total for fixed
- Coupon restrictions: minimum amount, usage limits, validity periods

### **Stock Management Rules**
- Automatic stock reduction on sale
- Cannot sell more than available stock
- Stock additions increase inventory
- Adjustments require Manager approval
- Reconciliations require Admin approval
- Stock cannot go negative (except approved adjustments)

### **Financial Rules**
- Manager creates, Admin approves
- Sales transactions auto-approved
- Payment validation before processing
- Split payments must sum to total
- Rejection requires reason

### **Role Hierarchy & Permissions**
```
ADMIN (Level 3) - All permissions
  ↓
MANAGER (Level 2) - Operational permissions
  ↓
STAFF (Level 1) - Basic permissions
```

**Data Visibility:**
- **Admin:** All data
- **Manager:** All except financial analytics, cost prices, revenue
- **STAFF:** Product names/prices, own transactions, basic inventory

---

## **7. SECURITY & AUDIT**

### **Security Features**

**Authentication:**
- bcrypt password hashing (10 rounds)
- Secure password policy (8+ chars, complexity)
- Password reset tokens (256-bit, 24-hour expiration)
- Email verification tokens (256-bit, 24-hour expiration)
- Account lockout (failed attempts)
- IP-based rate limiting
- Session timeout (24 hours)
- Automatic session refresh (5-15 minutes)

**Authorization:**
- JWT-based sessions
- HTTP-only cookies
- Secure cookies (production)
- SameSite: lax
- Session blacklisting
- Activity tracking

**Data Protection:**
- SQL injection prevention (Prisma ORM)
- XSS prevention (React escape)
- CSRF protection tokens
- Secure HTTP headers (CSP, X-Frame-Options, etc.)
- Input validation (Zod schemas)
- Output sanitization

**API Security:**
- Rate limiting per IP
- Request size limits
- Timeout enforcement
- Error message sanitization

### **Audit System**

**Audit Log Tracking:**
- User actions (login, logout, password changes)
- Data operations (create, update, delete)
- Financial transactions
- Stock changes
- Failed authentication attempts
- Permission violations

**Audit Log Contents:**
- User ID and name
- Action type
- Table and record ID
- Old/new values (JSON diff)
- IP address and user agent
- Timestamp
- Success/failure status

**Audit Features:**
- Searchable and filterable
- Date range queries
- User/action/table-specific logs
- Export capabilities
- Indefinite retention

### **Security Score: 7.5/10**

**High-Priority Fixes Needed:**
1. Update dependencies (9 packages with vulnerabilities)
2. Implement server-side CSRF token validation
3. Migrate to Redis-backed rate limiting for production

---

## **8. BACKUP SYSTEM**

### **Google Drive Integration**

**OAuth 2.0 Authentication:**
- Secure token storage
- Automatic token refresh
- Connection status monitoring

**Backup Types:**
- Scheduled (cron-triggered)
- Manual (admin-triggered)
- API (programmatic)

**Backup Process:**
1. Check for concurrent backups (prevent overlaps)
2. Create backup log (IN_PROGRESS)
3. Export all 26 tables (cursor-based pagination)
4. Compress data (gzip)
5. Upload to Google Drive
6. Update backup log with results
7. Clean up old backups (90-day retention)

**Backup Contents:**
- Metadata (version, timestamp, table counts)
- All 26 tables in JSON format
- BigInt handling (converted to strings)
- Compression for efficiency

**Backup Features:**
- Chunked export (1000 records default)
- Retry logic (3 attempts)
- Error handling
- Partial backup support
- Status tracking (PENDING, IN_PROGRESS, COMPLETED, FAILED, PARTIAL)
- File size tracking
- Web view links

---

## **9. TECHNICAL STACK**

### **Frontend**
- **Next.js 15** (App Router, Server Components)
- **React 19** (Functional components, Hooks)
- **TypeScript 5** (Strict mode)
- **Tailwind CSS 4** (Utility-first styling)
- **shadcn/ui** (Component library with Radix UI)

### **State Management**
- **React Hook Form** (Form state + Zod validation)
- **TanStack Query** (Server state, caching)
- **NextAuth Session** (Auth state)

### **Backend**
- **Next.js API Routes** (Serverless endpoints)
- **PostgreSQL** (via Supabase)
- **Prisma ORM** (Type-safe queries)
- **NextAuth.js v5** (Authentication)
- **bcryptjs** (Password hashing)

### **External Services**
- **Resend** (Transactional emails)
- **Nodemailer** (SMTP fallback)
- **Supabase Storage** (Image uploads)
- **Google Drive** (Backups)

### **Development Tools**
- **ESLint** (Linting)
- **Prettier** (Code formatting)
- **Jest + React Testing Library** (Unit/integration testing)
- **Playwright** (E2E testing)

### **Infrastructure**
- **Vercel** (Hosting and deployment)
- **Supabase** (PostgreSQL hosting)
- **Node.js 22** (Runtime)

---

## **10. UI/UX STRUCTURE**

### **Component Library**
- **shadcn/ui components:** Button, Card, Dialog, Sheet, Drawer, Form, Input, Select, Table, Pagination, Alert, Toast, Badge, Tabs, Dropdown, Tooltip, Progress, Skeleton

### **Custom Components**
- ProductGrid, ShoppingCart, PaymentInterface, ReceiptPrinter, BarcodeScanner, DataTable, ResponsiveTable, MobileFilters, ErrorBoundary, OfflineIndicator

### **Page Structure**

**Public Pages:**
- `/login`, `/register`, `/forgot-password`, `/reset-password`, `/check-email`, `/verify-email`, `/pending-approval`, `/unauthorized`

**Dashboard Pages:**
- `/dashboard` (Main dashboard)
- `/inventory/*` (Products, categories, brands, suppliers, stock history, reconciliations, reports)
- `/pos/*` (POS interface, history, customers, coupons, analytics)
- `/finance/*` (Dashboard, transactions, income, expenses, reports)
- `/admin` (Admin dashboard, user management)
- `/audit-logs` (Audit log viewer)
- `/account` (User profile)

### **Mobile Optimization**
- Mobile-first responsive design
- Touch-optimized buttons (min 44px)
- Swipeable cards
- Bottom sheets for actions
- Drawer navigation
- Mobile-optimized tables (card view)
- Virtual scrolling

### **PWA Features**
- Offline capability
- Service worker caching
- IndexedDB for local data
- Background sync
- Add to home screen

---

## **11. PERFORMANCE OPTIMIZATIONS**

### **Frontend**
- Server Components (default rendering)
- Dynamic imports (code splitting)
- Image optimization (Next.js Image)
- Font optimization (next/font)
- Lazy loading components
- Virtual scrolling for long lists
- React Query caching (5-minute stale time)
- Route preloading

### **Backend**
- Prisma query optimization
- Indexed database queries (50+ indexes)
- Connection pooling (PgBouncer)
- Response compression
- API caching
- Batch operations
- Cursor-based pagination (memory efficient)

---

## **12. DEPLOYMENT**

### **Environments**
- **Development:** Local (localhost:3000)
- **Preview:** Vercel preview (per-PR)
- **Production:** Vercel production (main branch)

### **CI/CD**
- Automatic deployment on push
- Build checks (TypeScript, ESLint)
- Test execution
- Environment variable management

---

## **SUMMARY**

This is a **comprehensive, production-ready inventory and POS system** designed for retail operations with:

✅ **Enterprise-grade security** (multi-tier auth, RBAC, audit logging)
✅ **Complete inventory management** (weighted average costing, reconciliation workflows)
✅ **Full-featured POS** (offline capability, multi-payment, debt tracking)
✅ **Financial tracking** (income/expense with approval workflows)
✅ **Automated backups** (Google Drive integration)
✅ **108 API endpoints** covering all business operations
✅ **Mobile-optimized PWA** with offline support
✅ **Type-safe codebase** (TypeScript + Prisma + Zod)
✅ **26 database models** with comprehensive relationships
✅ **72 granular permissions** across 3 user roles

**Next Steps for Production:**
1. Fix dependency vulnerabilities (`npm audit fix`)
2. Implement server-side CSRF validation
3. Migrate to Redis-backed rate limiting
4. Complete E2E testing suite
5. Configure production backups schedule

---

This reverse PRD provides complete specifications to rebuild the application without seeing the original codebase. All architectural patterns, business logic, workflows, and technical decisions are documented.
