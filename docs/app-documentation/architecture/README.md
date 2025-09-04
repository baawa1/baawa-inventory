# Application Architecture

## System Overview

The Inventory POS application is a comprehensive business management system built with modern web technologies, designed for scalability, security, and maintainability.

### Tech Stack

#### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: React Hook Form + Zod validation
- **Data Fetching**: TanStack Query (React Query)
- **Authentication**: NextAuth.js v5

#### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma
- **Email**: Resend/Nodemailer
- **File Storage**: Supabase Storage
- **Caching**: Redis (optional)

#### Development Tools
- **Testing**: Jest + React Testing Library + Playwright
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Package Manager**: npm

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── admin/         # Admin management
│   │   ├── inventory/     # Inventory management
│   │   ├── pos/           # Point of sale
│   │   ├── finance/       # Financial tracking
│   │   └── dashboard/     # Main dashboard
│   ├── api/               # API routes
│   └── (auth)/            # Authentication pages
├── components/            # React components
│   ├── ui/               # Base UI components (shadcn/ui)
│   ├── auth/             # Authentication components
│   ├── admin/            # Admin-specific components
│   ├── inventory/        # Inventory components
│   ├── pos/              # POS components
│   ├── finance/          # Finance components
│   └── layouts/          # Layout components
├── lib/                  # Utility libraries
│   ├── auth/             # Authentication utilities
│   ├── utils/            # Helper functions
│   ├── validations/      # Zod schemas
│   ├── email/            # Email services
│   └── upload/           # File upload utilities
├── hooks/                # Custom React hooks
│   └── api/              # API-specific hooks
└── types/                # TypeScript type definitions
```

## Architecture Patterns

### 1. Feature-Based Organization

Components are organized by feature/domain rather than technical type:

```
components/
├── inventory/
│   ├── AddProductForm.tsx
│   ├── ProductList.tsx
│   ├── StockReconciliation/
│   └── supplier/
├── pos/
│   ├── POSInterface.tsx
│   ├── ShoppingCart.tsx
│   └── payment/
```

### 2. Layer Architecture

**Presentation Layer** (Components)
- React components
- Form handling
- User interactions
- State management

**Business Logic Layer** (Hooks/Lib)
- Custom hooks
- Data transformation
- Validation logic
- Business rules

**Data Access Layer** (API/Prisma)
- API routes
- Database operations
- External service integrations

**Database Layer** (PostgreSQL/Prisma)
- Data persistence
- Relationships
- Constraints

### 3. Component Composition Patterns

#### Container/Presenter Pattern
```typescript
// Container component handles logic
function ProductListContainer() {
  const { data, loading } = useProducts()
  return <ProductList data={data} loading={loading} />
}

// Presenter component handles UI
function ProductList({ data, loading }: Props) {
  // Pure UI rendering
}
```

#### Compound Components
```typescript
// Compound component pattern for complex UI
<DataTable>
  <DataTable.Header />
  <DataTable.Body />
  <DataTable.Footer />
</DataTable>
```

### 4. Form Architecture

All forms use a consistent pattern:

```typescript
// 1. Zod schema for validation
const schema = z.object({
  name: z.string().min(1),
  email: z.string().email()
})

// 2. React Hook Form integration
function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema)
  })
  
  // 3. Submission with error handling
  const onSubmit = async (data: FormData) => {
    // Handle submission
  }
}
```

## Design Patterns

### 1. Repository Pattern
```typescript
// Database operations abstracted
class ProductRepository {
  async findMany(filters: ProductFilters) {
    return prisma.product.findMany({
      where: this.buildWhereClause(filters)
    })
  }
}
```

### 2. Factory Pattern
```typescript
// Email provider factory
export class EmailProviderFactory {
  static create(): EmailProvider {
    return process.env.EMAIL_PROVIDER === 'resend' 
      ? new ResendProvider() 
      : new NodemailerProvider()
  }
}
```

### 3. Builder Pattern
```typescript
// Query builder for complex searches
const query = new ProductQueryBuilder()
  .withCategory('electronics')
  .withPriceRange(100, 500)
  .withStock(true)
  .build()
```

### 4. Observer Pattern
```typescript
// Event-driven updates
eventEmitter.on('stock:update', (product) => {
  // Update related systems
  updateInventoryMetrics(product)
  notifyLowStock(product)
})
```

## Security Architecture

### 1. Authentication Flow
```
User Registration → Email Verification → Admin Approval → Access Granted
```

### 2. Authorization Layers
- **Route-level**: Middleware protection
- **Component-level**: Role-based rendering
- **API-level**: Permission validation
- **Database-level**: RLS policies

### 3. Security Measures
- CSRF protection
- Rate limiting
- Input sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection
- Secure headers

## Performance Optimizations

### 1. Database
- Comprehensive indexing strategy
- Connection pooling
- Query optimization
- Proper relationships

### 2. Frontend
- Server-side rendering (SSR)
- Client-side caching (React Query)
- Code splitting
- Image optimization
- Bundle analysis

### 3. API
- Response caching
- Database query optimization
- Efficient pagination
- Background processing

## Error Handling Strategy

### 1. Frontend Error Boundaries
```typescript
<ErrorBoundary fallback={<ErrorUI />}>
  <MyComponent />
</ErrorBoundary>
```

### 2. API Error Handling
```typescript
// Centralized error handling
export async function handleApiError(error: unknown) {
  if (error instanceof ValidationError) {
    return formatValidationError(error)
  }
  // Handle other error types
}
```

### 3. Database Error Handling
- Transaction rollbacks
- Constraint violation handling
- Connection error recovery

## Scalability Considerations

### 1. Horizontal Scaling
- Stateless API design
- Database connection pooling
- CDN for static assets
- Load balancer ready

### 2. Vertical Scaling
- Efficient algorithms
- Memory optimization
- Database indexing
- Caching strategies

### 3. Microservices Ready
- Modular architecture
- Service boundaries
- API-first design
- Event-driven communication

---

*This architecture documentation provides the foundation for understanding how the application is structured and the principles that guide its development.*