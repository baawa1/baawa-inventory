# API Documentation

## Overview

The application provides a comprehensive REST API built with Next.js App Router API routes, featuring authentication, authorization, validation, and error handling.

## API Architecture

### Base URL Structure
```
/api/
├── auth/           # Authentication endpoints
├── admin/          # Admin-only endpoints  
├── inventory/      # Inventory management
├── products/       # Product operations
├── pos/            # Point of sale operations
├── finance/        # Financial operations
├── users/          # User management
└── health/         # System health check
```

### Response Format

All API responses follow a consistent format:

#### Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { /* response data */ },
  "pagination": { /* for paginated responses */ }
}
```

#### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [ /* validation errors */ ],
  "code": "ERROR_CODE"
}
```

## Authentication & Authorization

### Authentication Flow

All protected endpoints require a valid session token:

```typescript
// Authentication middleware
export const withAuth = (handler: AuthHandler) => {
  return async (request: AuthenticatedRequest) => {
    const session = await getSession(request)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    
    request.user = session.user
    return handler(request)
  }
}
```

### Permission System

Role-based permissions are enforced at the API level:

```typescript
export const withPermission = (requiredRoles: UserRole[], handler: AuthHandler) => {
  return withAuth(async (request: AuthenticatedRequest) => {
    if (!requiredRoles.includes(request.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }
    
    return handler(request)
  })
}
```

### Rate Limiting

API endpoints include rate limiting for security:

```typescript
export const POST = withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
  keyGenerator: request => `register:${getClientIP(request)}`
})(registrationHandler)
```

## Authentication Endpoints

### POST /api/auth/register
Register a new user account

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email to verify your account.",
  "user": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe", 
    "email": "john@example.com",
    "status": "PENDING",
    "role": "STAFF"
  },
  "requiresVerification": true,
  "redirectTo": "/check-email"
}
```

**Features:**
- Password validation with strength requirements
- Email verification token generation
- Automatic admin notification
- Rate limiting (5 requests/hour per IP)
- Duplicate email handling

### POST /api/auth/login
Authenticate user credentials

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### POST /api/auth/forgot-password
Request password reset

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /api/auth/reset-password
Reset password with token

**Request Body:**
```json
{
  "token": "reset-token",
  "newPassword": "NewPassword123!"
}
```

### POST /api/auth/verify-email
Verify email address

**Request Body:**
```json
{
  "token": "verification-token"
}
```

## Product Management API

### GET /api/products
List products with filtering and pagination

**Query Parameters:**
```typescript
{
  page?: number           // Page number (default: 1)
  limit?: number          // Items per page (default: 10)
  search?: string         // Search term (name, SKU, barcode)
  categoryId?: number     // Filter by category
  brandId?: number        // Filter by brand
  supplierId?: number     // Filter by supplier
  lowStock?: boolean      // Show only low stock items
  status?: ProductStatus  // Filter by status
  sortBy?: string         // Sort field (name, price, stock, etc.)
  sortOrder?: 'asc'|'desc' // Sort direction
  includeSync?: boolean   // Include sync data
}
```

**Response:**
```json
{
  "success": true,
  "message": "Retrieved 25 products",
  "data": [
    {
      "id": 1,
      "name": "Sample Product",
      "sku": "SPL-001",
      "barcode": "123456789",
      "price": 29.99,
      "cost": 15.00,
      "stock": 100,
      "minStock": 10,
      "status": "ACTIVE",
      "category": {
        "id": 1,
        "name": "Electronics"
      },
      "brand": {
        "id": 1,
        "name": "Brand Name"
      },
      "supplier": {
        "id": 1,
        "name": "Supplier Name"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

**Features:**
- Advanced filtering and searching
- Role-based field visibility (cost field restricted)
- Pagination with metadata
- Sorting by multiple fields
- Low stock detection

### POST /api/products
Create new product

**Required Permissions:** ADMIN, MANAGER

**Request Body:**
```json
{
  "name": "New Product",
  "sku": "NP-001", // Optional - auto-generated if not provided
  "barcode": "987654321",
  "description": "Product description",
  "sellingPrice": 49.99,
  "purchasePrice": 25.00, // Requires cost permission
  "currentStock": 50,
  "minimumStock": 5,
  "maximumStock": 200,
  "unit": "piece",
  "status": "ACTIVE",
  "categoryId": 1,
  "brandId": 1,
  "supplierId": 1,
  "tags": ["tag1", "tag2"],
  "weight": 1.5,
  "dimensions": "10x10x5",
  "color": "Blue",
  "size": "Medium",
  "material": "Plastic"
}
```

**Features:**
- Automatic SKU generation
- Duplicate checking (SKU, barcode)
- Validation of relationships (category, brand, supplier)
- Permission-based price field access

## Point of Sale API

### POST /api/pos/create-sale
Process a POS sale transaction

**Request Body:**
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "price": 29.99,
      "total": 59.98,
      "couponId": 1 // Optional
    }
  ],
  "subtotal": 59.98,
  "discount": 5.00,
  "fees": [
    {
      "feeType": "SERVICE_FEE",
      "description": "Service charge",
      "amount": 2.50
    }
  ],
  "total": 57.48,
  "paymentMethod": "CASH",
  "amountPaid": 60.00,
  "customerInfo": {
    "name": "John Customer",
    "email": "john@customer.com",
    "phone": "+234-123-456-7890",
    "billingAddress": "123 Main St",
    "city": "Lagos",
    "state": "Lagos",
    "country": "Nigeria",
    "customerType": "individual"
  },
  "notes": "Customer notes",
  "splitPayments": [ // For split payment method
    {
      "id": "pay1",
      "amount": 30.00,
      "method": "CASH"
    },
    {
      "id": "pay2", 
      "amount": 27.48,
      "method": "CARD"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "saleId": 123,
  "transactionNumber": "TXN-1641234567-ABC123XYZ",
  "message": "Sale created successfully",
  "emailSent": true
}
```

**Features:**
- Complex validation with total verification
- Automatic stock deduction
- Customer creation/update
- Coupon application and usage tracking
- Split payment support
- Transaction fees handling
- Automatic email receipts
- Comprehensive error handling

### GET /api/pos/barcode-lookup
Look up product by barcode for POS scanning

**Query Parameters:**
```
?barcode=123456789
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": 1,
    "name": "Product Name",
    "sku": "PRD-001",
    "price": 29.99,
    "stock": 100,
    "minStock": 10,
    "image": "product-image.jpg"
  }
}
```

## Financial Management API

### GET /api/finance/transactions
List financial transactions

**Query Parameters:**
- `page`, `limit` - Pagination
- `type` - INCOME or EXPENSE
- `status` - Transaction status
- `startDate`, `endDate` - Date range
- `search` - Search description

### POST /api/finance/transactions
Create financial transaction

**Request Body:**
```json
{
  "type": "EXPENSE",
  "amount": 500.00,
  "description": "Office supplies purchase",
  "transactionDate": "2024-01-15",
  "paymentMethod": "BANK_TRANSFER",
  "expenseDetails": {
    "vendorName": "Office Supply Co",
    "expenseType": "OFFICE_SUPPLIES"
  }
}
```

## Inventory Management API

### GET /api/inventory/charts
Get inventory analytics data

**Response:**
```json
{
  "success": true,
  "data": {
    "totalProducts": 150,
    "totalValue": 45000.00,
    "lowStockCount": 12,
    "outOfStockCount": 3,
    "categories": [
      {
        "name": "Electronics",
        "value": 25000.00,
        "count": 45
      }
    ],
    "stockMovement": [
      {
        "date": "2024-01-01",
        "additions": 50,
        "sales": 30
      }
    ]
  }
}
```

### POST /api/stock-additions
Add stock to products

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 100,
  "costPerUnit": 15.00,
  "totalCost": 1500.00,
  "supplierId": 1,
  "referenceNo": "PO-001",
  "notes": "Restocking popular item"
}
```

## Admin Management API

### GET /api/admin/activity
Get system activity logs (Admin only)

### POST /api/admin/approve-user
Approve pending user (Admin only)

**Request Body:**
```json
{
  "userId": 123
}
```

### POST /api/admin/reject-user
Reject pending user (Admin only)

**Request Body:**
```json
{
  "userId": 123,
  "reason": "Invalid documentation"
}
```

## Error Handling

### Validation Errors

Zod validation errors are formatted consistently:

```json
{
  "success": false,
  "error": "Validation error",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    },
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    }
  ]
}
```

### Database Errors

Prisma database errors are handled gracefully:

```typescript
// Handle unique constraint violations
if (error.code === 'P2002') {
  return NextResponse.json(
    { error: 'Resource already exists' },
    { status: 409 }
  )
}

// Handle not found errors
if (error.code === 'P2025') {
  return NextResponse.json(
    { error: 'Resource not found' },
    { status: 404 }
  )
}
```

### Security Errors

Authentication and authorization errors:

```json
// Authentication required
{
  "success": false,
  "error": "Authentication required"
}

// Insufficient permissions
{
  "success": false,
  "error": "Insufficient permissions"
}

// Account not activated
{
  "success": false,
  "error": "Account not fully activated"
}
```

## Security Features

### Request Validation

All endpoints use Zod schemas for comprehensive validation:

```typescript
const requestSchema = z.object({
  email: z.string().email('Invalid email format'),
  amount: z.number().positive('Amount must be positive'),
  items: z.array(itemSchema).min(1, 'At least one item required')
})
```

### SQL Injection Prevention

Prisma ORM provides automatic protection against SQL injection attacks.

### Rate Limiting

Different rate limits based on endpoint sensitivity:

- **Authentication**: 5 requests/hour
- **Registration**: 3 requests/hour  
- **Password Reset**: 3 requests/hour
- **General API**: 1000 requests/hour

### Security Headers

All responses include security headers:

```typescript
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### Audit Logging

All sensitive operations are logged:

```typescript
await AuditLogger.logAuthEvent({
  action: 'USER_LOGIN',
  userEmail: email,
  success: true,
  ipAddress: request.ip
}, request)
```

## Caching Strategy

### Response Caching

Appropriate caching headers for different data types:

- **Static data**: Long-term caching
- **User data**: Short-term caching  
- **Real-time data**: No caching

### Database Query Optimization

- Efficient indexes on frequently queried fields
- Selective field loading with Prisma `select`
- Pagination to limit result sets
- Connection pooling for performance

---

This API provides a complete backend system for the inventory POS application with enterprise-grade security, validation, and error handling.