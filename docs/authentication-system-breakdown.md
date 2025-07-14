# Authentication System Comprehensive Breakdown

**Project**: BaaWA Inventory POS  
**Date**: January 2025  
**Target Audience**: Junior Developers  
**Purpose**: Complete understanding of authentication flow, components, and relationships

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Database Schema](#database-schema)
4. [Core Authentication Files](#core-authentication-files)
5. [User Flow Breakdown](#user-flow-breakdown)
6. [Security Features](#security-features)
7. [Role-Based Access Control](#role-based-access-control)
8. [File Relationships](#file-relationships)
9. [Common Patterns](#common-patterns)
10. [Troubleshooting Guide](#troubleshooting-guide)

---

## System Overview

Your authentication system is built on **NextAuth.js v5** with a custom credentials provider, using **Prisma ORM** for database operations and **PostgreSQL** as the database. It implements a multi-step user onboarding process with email verification and admin approval.

### Tech Stack

- **NextAuth.js v5**: Authentication framework
- **Prisma ORM**: Database operations
- **PostgreSQL**: Database
- **bcrypt**: Password hashing
- **Zod**: Input validation
- **Resend**: Email service
- **TypeScript**: Type safety

---

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Middleware    │    │   Backend       │
│   Components    │    │   (Route Guard) │    │   API Routes    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   NextAuth.js   │    │   Session/JWT   │    │   Prisma ORM    │
│   Configuration │    │   Management    │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Credentials   │    │   Security      │    │   PostgreSQL    │
│   Provider      │    │   Features      │    │   Database      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Account       │    │   Audit         │    │   Email         │
│   Lockout       │    │   Logging       │    │   Service       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Database Schema

### User Model (Core Authentication Table)

```sql
-- Key fields for authentication
id: Int (Primary Key)
email: String (Unique)
password: String (Hashed with bcrypt)
firstName: String
lastName: String
role: UserRole (ADMIN, MANAGER, STAFF)
userStatus: UserStatus (PENDING, VERIFIED, APPROVED, REJECTED, SUSPENDED)

-- Email verification
emailVerified: Boolean
emailVerifiedAt: DateTime
emailVerificationToken: String
emailVerificationExpires: DateTime

-- Account status
isActive: Boolean
lastLogin: DateTime
lastActivity: DateTime
lastLogout: DateTime

-- Admin approval
approvedBy: Int (User ID)
approvedAt: DateTime
rejectionReason: String
```

### User Status Flow

```
PENDING → VERIFIED → APPROVED
   ↓         ↓         ↓
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Email   │ │ Admin   │ │ Full    │
│ Not     │ │ Needs   │ │ Access  │
│ Verified│ │ Approval│ │ Granted │
└─────────┘ └─────────┘ └─────────┘
```

### User Roles Hierarchy

```
ADMIN (Level 3)
├── Full system access
├── User management
├── System configuration
└── Audit logs

MANAGER (Level 2)
├── Inventory management
├── Reports access
├── POS access
└── Reconciliation approval

STAFF (Level 1)
├── POS access
├── Inventory view
└── Sales creation
```

---

## Core Authentication Files

### 1. `auth.ts` (Root Configuration)

**Purpose**: Main NextAuth.js configuration file

**Key Components**:

```typescript
// Credentials Provider Configuration
CredentialsProvider({
  name: "credentials",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" },
  },
  async authorize(credentials, req) {
    // 1. Check account lockout
    // 2. Validate credentials
    // 3. Return user object
  },
});
```

**What Happens Here**:

1. **Account Lockout Check**: Prevents brute force attacks
2. **User Lookup**: Finds user by email in database
3. **Password Validation**: Compares with bcrypt hash
4. **User Object Return**: Returns user data for session

**Session Configuration**:

```typescript
session: {
  strategy: "jwt",
  maxAge: 24 * 60 * 60, // 24 hours
  updateAge: 2 * 60 * 60, // Update every 2 hours
}
```

**JWT Callbacks**:

```typescript
async jwt({ token, user, trigger, session }) {
  // Store user data in JWT token
  if (user) {
    token.role = user.role;
    token.status = user.status;
    token.isEmailVerified = user.isEmailVerified;
  }
  return token;
}
```

### 2. `src/middleware.ts` (Route Protection)

**Purpose**: Protects routes and handles user status redirects

**Flow Logic**:

```typescript
// 1. Check if route is public
if (publicRoutes.includes(pathname)) {
  return NextResponse.next();
}

// 2. Check if user is authenticated
if (!token?.user) {
  return NextResponse.redirect(new URL("/login", req.url));
}

// 3. Check email verification
if (!isEmailVerified) {
  return safeRedirect("/verify-email", "Email not verified");
}

// 4. Check user status
if (userStatus === "PENDING" || userStatus === "VERIFIED") {
  return safeRedirect("/pending-approval", "Needs admin approval");
}

// 5. Check role-based access
const isAuthorized = authorizeUserForRoute(pathname, userRole);
if (!isAuthorized) {
  return safeRedirect("/unauthorized", "Insufficient permissions");
}
```

**Public Routes**:

- `/`, `/login`, `/register`, `/forgot-password`
- `/check-email`, `/verify-email`, `/pending-approval`

### 3. `src/lib/auth/roles.ts` (Role Management)

**Purpose**: Central role and permission management

**Key Functions**:

```typescript
// Role constants
export const USER_ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  STAFF: "STAFF",
} as const;

// Permission groups
export const ROLE_PERMISSIONS = {
  INVENTORY_READ: [ADMIN, MANAGER, STAFF],
  INVENTORY_WRITE: [ADMIN, MANAGER],
  USER_MANAGEMENT: [ADMIN],
  POS_ACCESS: [ADMIN, MANAGER, STAFF],
} as const;

// Helper functions
export const hasRole = (userRole: string, allowedRoles: UserRole[]): boolean
export const hasPermission = (userRole: string, permission: string): boolean
export const authorizeUserForRoute = (userRole: string, route: string): boolean
```

### 4. `src/app/api/auth/register/route.ts` (Registration API)

**Purpose**: Handles user registration with email verification

**Process Flow**:

```typescript
// 1. Validate input data
const validation = registerSchema.safeParse(body);

// 2. Check if user exists
const existingUser = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
});

// 3. Hash password
const hashedPassword = await bcrypt.hash(password, 12);

// 4. Generate verification token
const verificationToken = randomBytes(32).toString("hex");

// 5. Create user
const user = await prisma.user.create({
  data: {
    firstName,
    lastName,
    email,
    password: hashedPassword,
    emailVerificationToken: verificationToken,
    userStatus: "PENDING",
    role: "STAFF",
  },
});

// 6. Send verification email
await emailService.sendVerificationEmail(email, {
  firstName,
  verificationLink: `${baseUrl}/verify-email?token=${verificationToken}`,
});
```

### 5. `src/app/api/auth/verify-email/route.ts` (Email Verification)

**Purpose**: Verifies email tokens and updates user status

**POST Method** (Verify Token):

```typescript
// 1. Find user by token
const user = await prisma.user.findFirst({
  where: {
    emailVerificationToken: token,
    emailVerificationExpires: { gt: new Date() },
  },
});

// 2. Update user status
await prisma.user.update({
  where: { id: user.id },
  data: {
    emailVerified: true,
    emailVerifiedAt: new Date(),
    emailVerificationToken: null,
    userStatus: "VERIFIED", // Now needs admin approval
  },
});
```

**PUT Method** (Resend Token):

```typescript
// Generate new verification token
const verificationToken = randomBytes(32).toString("hex");
const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

// Update user and send new email
await prisma.user.update({
  where: { id: user.id },
  data: {
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  },
});
```

---

## User Flow Breakdown

### 1. Registration Flow

```
User fills form → Validation → Check existing user → Hash password →
Create user (PENDING) → Generate token → Send email → Redirect to check-email
```

**Files Involved**:

- `src/components/auth/RegisterForm.tsx` (Frontend form)
- `src/app/api/auth/register/route.ts` (Backend API)
- `src/lib/email/service.ts` (Email service)
- `src/app/check-email/page.tsx` (Email check page)

### 2. Email Verification Flow

```
User clicks email link → Verify token → Update user (VERIFIED) →
Redirect to pending-approval → Wait for admin approval
```

**Files Involved**:

- `src/app/verify-email/page.tsx` (Verification page)
- `src/app/api/auth/verify-email/route.ts` (Verification API)
- `src/app/pending-approval/page.tsx` (Pending approval page)

### 3. Login Flow

```
User submits credentials → Check lockout → Validate password →
Create session → Middleware checks → Redirect based on status
```

**Files Involved**:

- `src/components/auth/LoginForm.tsx` (Frontend form)
- `auth.ts` (NextAuth configuration)
- `src/middleware.ts` (Route protection)
- `src/lib/utils/account-lockout.ts` (Security)

### 4. Admin Approval Flow

```
Admin reviews user → Approves/rejects → Update user status →
Send notification email → User can now login
```

**Files Involved**:

- `src/components/admin/UserManagement.tsx` (Admin interface)
- `src/app/api/admin/users/[id]/route.ts` (Approval API)
- `src/lib/email/service.ts` (Notification emails)

---

## Security Features

### 1. Account Lockout System (`src/lib/utils/account-lockout.ts`)

**Progressive Lockout Thresholds**:

```typescript
LOCKOUT_THRESHOLDS = [
  { attempts: 3, delayMinutes: 5 }, // 3 attempts: 5 min lockout
  { attempts: 5, delayMinutes: 15 }, // 5 attempts: 15 min lockout
  { attempts: 7, delayMinutes: 60 }, // 7 attempts: 1 hour lockout
  { attempts: 10, delayMinutes: 240 }, // 10 attempts: 4 hours lockout
  { attempts: 15, delayMinutes: 1440 }, // 15+ attempts: 24 hours lockout
];
```

**Dual Lockout Types**:

- **Email-based**: Locks specific email addresses
- **IP-based**: Locks IP addresses to prevent distributed attacks

### 2. Audit Logging (`src/lib/utils/audit-logger.ts`)

**Tracked Events**:

```typescript
type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILED"
  | "LOGOUT"
  | "REGISTRATION"
  | "EMAIL_VERIFICATION"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  | "ADMIN_USER_APPROVED"
  | "ADMIN_USER_REJECTED"
  | "ROLE_CHANGED"
  | "ACCOUNT_SUSPENDED"
  | "SESSION_EXPIRED"
  | "SUSPICIOUS_ACTIVITY";
```

**Logged Information**:

- User ID, email, IP address
- User agent, timestamp
- Success/failure status
- Error messages
- Security context

### 3. Rate Limiting

**Registration Rate Limit**:

```typescript
withRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 requests per hour
  keyGenerator: (request) => `register:${ip}`,
});
```

### 4. Password Security

**Hashing**:

- Uses bcrypt with 12 rounds
- Secure password validation
- No plain text storage

**Validation**:

```typescript
passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character"
  );
```

---

## Role-Based Access Control

### Permission System

**Permission Groups**:

```typescript
ROLE_PERMISSIONS = {
  // Inventory permissions
  INVENTORY_READ: [ADMIN, MANAGER, STAFF],
  INVENTORY_WRITE: [ADMIN, MANAGER],
  INVENTORY_DELETE: [ADMIN],

  // User management
  USER_MANAGEMENT: [ADMIN],
  USER_APPROVAL: [ADMIN],

  // Sales and POS
  SALES_READ: [ADMIN, MANAGER, STAFF],
  SALES_WRITE: [ADMIN, MANAGER, STAFF],
  POS_ACCESS: [ADMIN, MANAGER, STAFF],

  // Reports
  REPORTS_READ: [ADMIN, MANAGER],
  REPORTS_ADVANCED: [ADMIN, MANAGER],
};
```

### Route Protection

**Middleware Protection**:

```typescript
// Check role-based access for protected routes
const isAuthorized = authorizeUserForRoute(pathname, userRole);
if (!isAuthorized) {
  return safeRedirect("/unauthorized", "Insufficient permissions");
}
```

**API Route Protection**:

```typescript
// Using withPermission wrapper
export const POST = withPermission(
  ["ADMIN"], // Required roles
  async function (request: AuthenticatedRequest) {
    // Handler logic
  }
);
```

---

## File Relationships

### Authentication Flow Files

```
auth.ts (Root config)
├── src/middleware.ts (Route protection)
├── src/app/api/auth/[...nextauth]/route.ts (NextAuth API)
├── src/lib/auth/roles.ts (Role management)
└── src/lib/api-auth-middleware.ts (API protection)

Registration Flow:
src/components/auth/RegisterForm.tsx
├── src/app/api/auth/register/route.ts
├── src/lib/email/service.ts
└── src/app/check-email/page.tsx

Login Flow:
src/components/auth/LoginForm.tsx
├── auth.ts (NextAuth authorize)
├── src/lib/utils/account-lockout.ts
└── src/lib/utils/audit-logger.ts

Email Verification:
src/app/verify-email/page.tsx
├── src/app/api/auth/verify-email/route.ts
└── src/app/pending-approval/page.tsx
```

### Database Relationships

```
User Model (Core)
├── AuditLog (One-to-Many)
├── SalesTransaction (One-to-Many)
├── StockAddition (One-to-Many)
└── User (Self-referencing for approval)

AuditLog Model
├── User (Many-to-One)
└── RateLimit (Related security)

SessionBlacklist Model
└── User (Many-to-One)
```

---

## Common Patterns

### 1. API Route Pattern

```typescript
// Standard API route structure
export async function POST(request: NextRequest) {
  try {
    // 1. Parse and validate input
    const body = await request.json();
    const validation = schema.safeParse(body);

    // 2. Business logic
    const result = await businessLogic(validation.data);

    // 3. Return response
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // 4. Error handling
    console.error("Error:", error);
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
```

### 2. Form Component Pattern

```typescript
// Standard form structure
export function SomeForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/endpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      // Handle success
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
}
```

### 3. Middleware Protection Pattern

```typescript
// Route protection wrapper
export const withPermission = (
  allowedRoles: UserRole[],
  handler: (request: AuthenticatedRequest) => Promise<Response>
) => {
  return async (request: NextRequest) => {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!allowedRoles.includes(session.user.role as UserRole)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(request as AuthenticatedRequest);
  };
};
```

---

## Troubleshooting Guide

### Common Issues

#### 1. "Invalid email or password" Error

**Possible Causes**:

- User doesn't exist
- Password is incorrect
- Account is locked
- User is inactive

**Debug Steps**:

```typescript
// Check auth.ts authorize function logs
console.log("Authentication error:", error);

// Check account lockout status
const lockoutStatus = await AccountLockout.checkLockoutStatus(email, "email");

// Check user status in database
const user = await prisma.user.findUnique({
  where: { email: email.toLowerCase() },
  select: { isActive: true, userStatus: true },
});
```

#### 2. "Email not verified" Redirect Loop

**Possible Causes**:

- Email verification token expired
- User status not updated properly
- Session not refreshed after verification

**Debug Steps**:

```typescript
// Check user verification status
const user = await prisma.user.findUnique({
  where: { email: userEmail },
  select: {
    emailVerified: true,
    userStatus: true,
    emailVerificationToken: true,
    emailVerificationExpires: true,
  },
});

// Check middleware token data
console.log("🔍 Middleware Debug:", {
  pathname,
  userRole,
  userStatus,
  isEmailVerified,
  hasToken: !!token,
});
```

#### 3. "Insufficient permissions" Error

**Possible Causes**:

- User role doesn't match required permissions
- Route not properly configured in roles.ts
- Session role data corrupted

**Debug Steps**:

```typescript
// Check user role in session
console.log("User role:", session.user.role);

// Check route authorization
const isAuthorized = authorizeUserForRoute(pathname, userRole);
console.log("Route authorization:", { pathname, userRole, isAuthorized });

// Check permission function
const hasPermission = hasPermission(userRole, "REQUIRED_PERMISSION");
console.log("Permission check:", { userRole, hasPermission });
```

#### 4. Registration Email Not Sent

**Possible Causes**:

- Email service configuration issue
- Rate limiting
- Email template error

**Debug Steps**:

```typescript
// Check email service logs
try {
  await emailService.sendVerificationEmail(email, data);
} catch (emailError) {
  console.error("Failed to send verification email:", emailError);
}

// Check rate limiting
const rateLimitStatus = await checkRateLimit("register", ipAddress);

// Check email service configuration
console.log("Email service config:", {
  provider: process.env.EMAIL_PROVIDER,
  apiKey: process.env.EMAIL_API_KEY ? "SET" : "NOT_SET",
});
```

### Debug Endpoints

#### Session Debug

```bash
GET /api/debug/session
```

Returns current session information for debugging.

#### Auth Status Check

```bash
GET /api/debug/auth-status
```

Returns authentication status and user information.

---

## Best Practices Summary

### 1. Security

- Always validate input with Zod schemas
- Use bcrypt for password hashing (12 rounds)
- Implement progressive account lockout
- Log all authentication events
- Use HTTPS in production

### 2. User Experience

- Provide clear error messages
- Implement proper loading states
- Use consistent redirect patterns
- Handle edge cases gracefully

### 3. Code Organization

- Keep authentication logic centralized
- Use TypeScript for type safety
- Follow consistent naming conventions
- Document complex logic

### 4. Database

- Use Prisma field names (camelCase)
- Implement proper indexes
- Use transactions for critical operations
- Handle database errors gracefully

---

## Next Steps for Learning

1. **Study the Middleware Flow**: Understand how `src/middleware.ts` protects routes
2. **Practice with Forms**: Build simple forms using the patterns shown
3. **Explore Security Features**: Test account lockout and audit logging
4. **Understand Role System**: Experiment with different user roles and permissions
5. **Debug Real Issues**: Use the troubleshooting guide to solve problems

---

_This document provides a comprehensive overview of your authentication system. Use it as a reference when working with authentication-related code or debugging issues._
