# Finance Manager Implementation - Step-by-Step Guide

## 🎯 **Implementation Overview**

This guide provides detailed step-by-step instructions for implementing the Finance Manager feature for BaaWA Accessories, following the existing app's template patterns and unified theme for seamless integration.

## 📋 **Prerequisites**

- Existing BaaWA Inventory POS system
- Prisma database setup
- Authentication system (Auth.js)
- Role-based access control
- Basic understanding of Next.js 15 and TypeScript

## 🎨 **Template Consistency Rules**

**CRITICAL: Follow existing BaaWA patterns exactly**

- **Page Structure**: ProductsPage → ProductList → InventoryPageLayout pattern
- **Forms**: Sectioned forms like AddProductForm with component sections
- **Navigation**: Integrate into existing sidebar with collapsible submenus
- **Components**: Follow ProductList table patterns with column customization
- **Hooks**: Match useProducts, useBrands pattern with TanStack Query
- **Validation**: Extend existing Zod schemas in `/lib/validations/`
- **Authorization**: Use existing auth patterns with role checks
- **UI**: Match existing button styles, status badges, table layouts
- **Icons**: Use Tabler Icons (primary) and Lucide React (secondary)
- **Error Handling**: Use existing ErrorHandlers.mutation pattern

## 🚀 **Phase 1: Database & Core Infrastructure**

### **Step 1.1: Update Prisma Schema**

**File**: `prisma/schema.prisma`

Add the following models to your existing schema:

```prisma
// Financial Categories
model FinancialCategory {
  id          Int                @id @default(autoincrement())
  name        String             @db.VarChar(100)
  type        FinancialType      @db.VarChar(20)
  description String?
  isActive    Boolean            @default(true) @map("is_active")
  parentId    Int?               @map("parent_id")
  createdAt   DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime           @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  parent      FinancialCategory? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    FinancialCategory[] @relation("CategoryHierarchy")
  transactions FinancialTransaction[]
  budgets     Budget[]

  @@index([type], map: "idx_financial_categories_type")
  @@index([isActive], map: "idx_financial_categories_active")
  @@map("financial_categories")
}

// Financial Transactions
model FinancialTransaction {
  id                Int                    @id @default(autoincrement())
  transactionNumber String                 @unique @map("transaction_number") @db.VarChar(50)
  type              FinancialType          @db.VarChar(20)
  categoryId        Int                    @map("category_id")
  amount            Decimal                @db.Decimal(15, 2)
  currency          String                 @default("NGN") @db.VarChar(3)
  description       String?
  transactionDate   DateTime               @map("transaction_date") @db.Date
  paymentMethod     String?                @map("payment_method") @db.VarChar(50)
  referenceNumber   String?                @map("reference_number") @db.VarChar(100)
  status            FinancialStatus        @default(COMPLETED) @db.VarChar(20)
  approvedBy        Int?                   @map("approved_by")
  approvedAt        DateTime?              @map("approved_at") @db.Timestamptz(6)
  createdBy         Int                    @map("created_by")
  createdAt         DateTime               @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt         DateTime               @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  category          FinancialCategory      @relation(fields: [categoryId], references: [id])
  approvedByUser    User?                  @relation("TransactionApprover", fields: [approvedBy], references: [id])
  createdByUser     User                   @relation("TransactionCreator", fields: [createdBy], references: [id])
  expenseDetails    ExpenseDetail?
  incomeDetails     IncomeDetail?

  @@index([type], map: "idx_financial_transactions_type")
  @@index([transactionDate], map: "idx_financial_transactions_date")
  @@index([status], map: "idx_financial_transactions_status")
  @@index([categoryId], map: "idx_financial_transactions_category")
  @@index([createdBy], map: "idx_financial_transactions_created_by")
  @@map("financial_transactions")
}

// Expense Details
model ExpenseDetail {
  id            Int                 @id @default(autoincrement())
  transactionId Int                 @unique @map("transaction_id")
  expenseType   String              @map("expense_type") @db.VarChar(50)
  vendorName    String?             @map("vendor_name") @db.VarChar(255)
  vendorContact String?             @map("vendor_contact") @db.VarChar(255)
  taxAmount     Decimal             @default(0) @map("tax_amount") @db.Decimal(10, 2)
  taxRate       Decimal             @default(0) @map("tax_rate") @db.Decimal(5, 2)
  receiptUrl    String?             @map("receipt_url") @db.VarChar(500)
  notes         String?
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)

  transaction   FinancialTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@map("expense_details")
}

// Income Details
model IncomeDetail {
  id            Int                 @id @default(autoincrement())
  transactionId Int                 @unique @map("transaction_id")
  incomeSource  String              @map("income_source") @db.VarChar(100)
  payerName     String?             @map("payer_name") @db.VarChar(255)
  payerContact  String?             @map("payer_contact") @db.VarChar(255)
  taxWithheld   Decimal             @default(0) @map("tax_withheld") @db.Decimal(10, 2)
  taxRate       Decimal             @default(0) @map("tax_rate") @db.Decimal(5, 2)
  receiptUrl    String?             @map("receipt_url") @db.VarChar(500)
  notes         String?
  createdAt     DateTime            @default(now()) @map("created_at") @db.Timestamptz(6)

  transaction   FinancialTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)

  @@map("income_details")
}

// Budgets
model Budget {
  id         Int                @id @default(autoincrement())
  name       String             @db.VarChar(255)
  categoryId Int?               @map("category_id")
  amount     Decimal            @db.Decimal(15, 2)
  periodType BudgetPeriodType   @map("period_type") @db.VarChar(20)
  startDate  DateTime           @map("start_date") @db.Date
  endDate    DateTime           @map("end_date") @db.Date
  createdBy  Int                @map("created_by")
  createdAt  DateTime           @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt  DateTime           @default(now()) @updatedAt @map("updated_at") @db.Timestamptz(6)

  category   FinancialCategory? @relation(fields: [categoryId], references: [id])
  createdByUser User            @relation("BudgetCreator", fields: [createdBy], references: [id])

  @@index([categoryId], map: "idx_budgets_category")
  @@index([periodType], map: "idx_budgets_period_type")
  @@index([startDate], map: "idx_budgets_start_date")
  @@index([createdBy], map: "idx_budgets_created_by")
  @@map("budgets")
}

// Financial Reports
model FinancialReport {
  id          Int       @id @default(autoincrement())
  reportType  String    @map("report_type") @db.VarChar(50)
  reportName  String    @map("report_name") @db.VarChar(255)
  periodStart DateTime  @map("period_start") @db.Date
  periodEnd   DateTime  @map("period_end") @db.Date
  reportData  Json      @map("report_data")
  generatedBy Int       @map("generated_by")
  generatedAt DateTime  @default(now()) @map("generated_at") @db.Timestamptz(6)
  fileUrl     String?   @map("file_url") @db.VarChar(500)

  generatedByUser User  @relation("ReportGenerator", fields: [generatedBy], references: [id])

  @@index([reportType], map: "idx_financial_reports_type")
  @@index([periodStart], map: "idx_financial_reports_period_start")
  @@index([generatedBy], map: "idx_financial_reports_generated_by")
  @@map("financial_reports")
}

// Add to existing User model
model User {
  // ... existing fields ...

  // Add these relations
  createdTransactions FinancialTransaction[] @relation("TransactionCreator")
  approvedTransactions FinancialTransaction[] @relation("TransactionApprover")
  createdBudgets       Budget[]              @relation("BudgetCreator")
  generatedReports     FinancialReport[]     @relation("ReportGenerator")
}
```

Add these enums:

```prisma
enum FinancialType {
  EXPENSE
  INCOME
}

enum FinancialStatus {
  PENDING
  COMPLETED
  CANCELLED
  APPROVED
  REJECTED
}

enum BudgetPeriodType {
  MONTHLY
  QUARTERLY
  YEARLY
}
```

### **Step 1.2: Generate and Run Migration**

```bash
# Generate migration
npx prisma migrate dev --name add_finance_manager_tables

# Apply migration
npx prisma generate
```

### **Step 1.3: Update Constants**

**File**: `src/lib/constants.ts`

Add these constants:

```typescript
// Financial Types
export const FINANCIAL_TYPES = {
  EXPENSE: "EXPENSE",
  INCOME: "INCOME",
} as const;

export type FinancialType =
  (typeof FINANCIAL_TYPES)[keyof typeof FINANCIAL_TYPES];

// Financial Status
export const FINANCIAL_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type FinancialStatus =
  (typeof FINANCIAL_STATUS)[keyof typeof FINANCIAL_STATUS];

// Budget Period Types
export const BUDGET_PERIOD_TYPES = {
  MONTHLY: "MONTHLY",
  QUARTERLY: "QUARTERLY",
  YEARLY: "YEARLY",
} as const;

export type BudgetPeriodType =
  (typeof BUDGET_PERIOD_TYPES)[keyof typeof BUDGET_PERIOD_TYPES];

// Default Financial Categories
export const DEFAULT_FINANCIAL_CATEGORIES = {
  EXPENSE: [
    { name: "Salary Payments", type: "EXPENSE" },
    { name: "Transport Fees", type: "EXPENSE" },
    { name: "Utility Bills", type: "EXPENSE" },
    { name: "Service Charges", type: "EXPENSE" },
    { name: "Rent & Lease", type: "EXPENSE" },
    { name: "Marketing & Advertising", type: "EXPENSE" },
    { name: "Office Supplies", type: "EXPENSE" },
    { name: "Miscellaneous", type: "EXPENSE" },
  ],
  INCOME: [
    { name: "Sales Revenue", type: "INCOME" },
    { name: "Personal Investment", type: "INCOME" },
    { name: "Business Loans", type: "INCOME" },
    { name: "Investment Income", type: "INCOME" },
    { name: "Other Income", type: "INCOME" },
    { name: "Grants & Subsidies", type: "INCOME" },
  ],
} as const;
```

### **Step 1.4: Create Validation Schemas**

**File**: `src/lib/validations/finance.ts`

```typescript
import { z } from "zod";
import {
  FINANCIAL_TYPES,
  FINANCIAL_STATUS,
  BUDGET_PERIOD_TYPES,
} from "@/lib/constants";

// Financial Category Schema
export const financialCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  type: z.enum([FINANCIAL_TYPES.EXPENSE, FINANCIAL_TYPES.INCOME]),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  parentId: z.number().optional(),
});

// Financial Transaction Schema
export const financialTransactionSchema = z.object({
  type: z.enum([FINANCIAL_TYPES.EXPENSE, FINANCIAL_TYPES.INCOME]),
  categoryId: z.number().min(1, "Category is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  currency: z.string().default("NGN"),
  description: z.string().optional(),
  transactionDate: z.string().transform((val) => new Date(val)),
  paymentMethod: z.string().optional(),
  referenceNumber: z.string().optional(),
  status: z
    .enum(Object.values(FINANCIAL_STATUS) as [string, ...string[]])
    .default(FINANCIAL_STATUS.COMPLETED),
});

// Expense Detail Schema
export const expenseDetailSchema = z.object({
  expenseType: z.string().min(1, "Expense type is required"),
  vendorName: z.string().optional(),
  vendorContact: z.string().optional(),
  taxAmount: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// Income Detail Schema
export const incomeDetailSchema = z.object({
  incomeSource: z.string().min(1, "Income source is required"),
  payerName: z.string().optional(),
  payerContact: z.string().optional(),
  taxWithheld: z.number().min(0).default(0),
  taxRate: z.number().min(0).max(100).default(0),
  receiptUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

// Budget Schema
export const budgetSchema = z.object({
  name: z.string().min(1, "Budget name is required"),
  categoryId: z.number().optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  periodType: z.enum(
    Object.values(BUDGET_PERIOD_TYPES) as [string, ...string[]]
  ),
  startDate: z.string().transform((val) => new Date(val)),
  endDate: z.string().transform((val) => new Date(val)),
});

// Report Generation Schema
export const reportGenerationSchema = z.object({
  reportType: z.string().min(1, "Report type is required"),
  periodStart: z.string().transform((val) => new Date(val)),
  periodEnd: z.string().transform((val) => new Date(val)),
});
```

## 🚀 **Phase 2: API Endpoints**

### **Step 2.1: Financial Categories API**

**File**: `src/app/api/finance/categories/route.ts`

```typescript
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-auth-middleware";
import { prisma } from "@/lib/db";
import { financialCategorySchema } from "@/lib/validations/finance";
import { createAuditLog, AuditLogAction } from "@/lib/audit-log";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    const where: any = {};
    if (type) where.type = type;
    if (isActive !== null) where.isActive = isActive === "true";

    const categories = await prisma.financialCategory.findMany({
      where,
      include: {
        children: true,
        parent: true,
      },
      orderBy: { name: "asc" },
    });

    return Response.json({ categories });
  } catch (error) {
    console.error("Error fetching financial categories:", error);
    return Response.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = financialCategorySchema.parse(body);

      const category = await prisma.financialCategory.create({
        data: validatedData,
        include: {
          children: true,
          parent: true,
        },
      });

      await createAuditLog({
        action: AuditLogAction.CREATE,
        tableName: "financial_categories",
        recordId: category.id,
        newValues: category,
      });

      return Response.json({ category }, { status: 201 });
    } catch (error) {
      console.error("Error creating financial category:", error);
      return Response.json(
        { error: "Failed to create category" },
        { status: 500 }
      );
    }
  },
  {
    roles: ["ADMIN", "MANAGER"],
    permission: "FINANCE_MANAGEMENT",
  }
);
```

**File**: `src/app/api/finance/categories/[id]/route.ts`

```typescript
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-auth-middleware";
import { prisma } from "@/lib/db";
import { financialCategorySchema } from "@/lib/validations/finance";
import { createAuditLog, AuditLogAction } from "@/lib/audit-log";

export const GET = withAuth(async (request: NextRequest, { params }) => {
  try {
    const id = parseInt(params.id);
    const category = await prisma.financialCategory.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        transactions: true,
      },
    });

    if (!category) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json({ category });
  } catch (error) {
    console.error("Error fetching financial category:", error);
    return Response.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(
  async (request: NextRequest, { params }) => {
    try {
      const id = parseInt(params.id);
      const body = await request.json();
      const validatedData = financialCategorySchema.parse(body);

      const oldCategory = await prisma.financialCategory.findUnique({
        where: { id },
      });

      const category = await prisma.financialCategory.update({
        where: { id },
        data: validatedData,
        include: {
          children: true,
          parent: true,
        },
      });

      await createAuditLog({
        action: AuditLogAction.UPDATE,
        tableName: "financial_categories",
        recordId: category.id,
        oldValues: oldCategory,
        newValues: category,
      });

      return Response.json({ category });
    } catch (error) {
      console.error("Error updating financial category:", error);
      return Response.json(
        { error: "Failed to update category" },
        { status: 500 }
      );
    }
  },
  {
    roles: ["ADMIN", "MANAGER"],
    permission: "FINANCE_MANAGEMENT",
  }
);

export const DELETE = withAuth(
  async (request: NextRequest, { params }) => {
    try {
      const id = parseInt(params.id);

      // Check if category has transactions
      const transactionCount = await prisma.financialTransaction.count({
        where: { categoryId: id },
      });

      if (transactionCount > 0) {
        return Response.json(
          { error: "Cannot delete category with existing transactions" },
          { status: 400 }
        );
      }

      const category = await prisma.financialCategory.delete({
        where: { id },
      });

      await createAuditLog({
        action: AuditLogAction.DELETE,
        tableName: "financial_categories",
        recordId: category.id,
        oldValues: category,
      });

      return Response.json({ message: "Category deleted successfully" });
    } catch (error) {
      console.error("Error deleting financial category:", error);
      return Response.json(
        { error: "Failed to delete category" },
        { status: 500 }
      );
    }
  },
  {
    roles: ["ADMIN"],
    permission: "FINANCE_MANAGEMENT",
  }
);
```

### **Step 2.2: Financial Transactions API**

**File**: `src/app/api/finance/transactions/route.ts`

```typescript
import { NextRequest } from "next/server";
import { withAuth } from "@/lib/api-auth-middleware";
import { prisma } from "@/lib/db";
import { financialTransactionSchema } from "@/lib/validations/finance";
import { createAuditLog, AuditLogAction } from "@/lib/audit-log";
import { generateTransactionNumber } from "@/lib/utils/finance";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const categoryId = searchParams.get("categoryId");
    const status = searchParams.get("status");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};
    if (type) where.type = type;
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (status) where.status = status;
    if (startDate && endDate) {
      where.transactionDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        include: {
          category: true,
          createdByUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          approvedByUser: {
            select: { firstName: true, lastName: true, email: true },
          },
          expenseDetails: true,
          incomeDetails: true,
        },
        orderBy: { transactionDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    return Response.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching financial transactions:", error);
    return Response.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
});

export const POST = withAuth(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = financialTransactionSchema.parse(body);

      const transactionNumber = await generateTransactionNumber();

      const transaction = await prisma.financialTransaction.create({
        data: {
          ...validatedData,
          transactionNumber,
          createdBy: request.user.id,
        },
        include: {
          category: true,
          createdByUser: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
      });

      await createAuditLog({
        action: AuditLogAction.CREATE,
        tableName: "financial_transactions",
        recordId: transaction.id,
        newValues: transaction,
      });

      return Response.json({ transaction }, { status: 201 });
    } catch (error) {
      console.error("Error creating financial transaction:", error);
      return Response.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      );
    }
  },
  {
    roles: ["ADMIN", "MANAGER", "STAFF"],
    permission: "FINANCE_TRANSACTIONS",
  }
);
```

### **Step 2.3: Create Utility Functions**

**File**: `src/lib/utils/finance.ts`

```typescript
import { prisma } from "@/lib/db";

export async function generateTransactionNumber(): Promise<string> {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const prefix = `FIN-${year}${month}${day}`;

  const lastTransaction = await prisma.financialTransaction.findFirst({
    where: {
      transactionNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      transactionNumber: "desc",
    },
  });

  let sequence = 1;
  if (lastTransaction) {
    const lastSequence = parseInt(lastTransaction.transactionNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `${prefix}-${String(sequence).padStart(4, "0")}`;
}

export function calculateNetAmount(
  amount: number,
  taxAmount: number = 0
): number {
  return amount - taxAmount;
}

export function calculateTaxAmount(amount: number, taxRate: number): number {
  return (amount * taxRate) / 100;
}

export function formatCurrency(
  amount: number,
  currency: string = "NGN"
): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function getFinancialSummary(transactions: any[]) {
  const summary = {
    totalIncome: 0,
    totalExpense: 0,
    netAmount: 0,
    transactionCount: transactions.length,
  };

  transactions.forEach((transaction) => {
    if (transaction.type === "INCOME") {
      summary.totalIncome += Number(transaction.amount);
    } else {
      summary.totalExpense += Number(transaction.amount);
    }
  });

  summary.netAmount = summary.totalIncome - summary.totalExpense;
  return summary;
}
```

## 🚀 **Phase 3: Frontend Pages & Components**

### **Step 3.1: Finance Dashboard Page (Following ProductsPage Pattern)**

**File**: `src/app/(dashboard)/finance/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { FinanceDashboard } from "@/components/finance/FinanceDashboard";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Finance Manager - BaaWA Inventory POS",
  description: "Manage business finances, track income and expenses",
};

export default async function FinancePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Check role permissions - only admin and manager can access finance
  if (
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
    ])
  ) {
    redirect("/unauthorized");
  }

  return <FinanceDashboard user={session.user} />;
}
```

### **Step 3.2: Transactions List Page (Following ProductsPage Pattern)**

**File**: `src/app/(dashboard)/finance/transactions/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "../../../../../auth";
import { TransactionList } from "@/components/finance/TransactionList";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Financial Transactions - BaaWA Inventory POS",
  description: "Manage income and expense transactions",
};

export default async function TransactionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  return <TransactionList user={session.user} />;
}
```

### **Step 3.3: Add Transaction Page**

**File**: `src/app/(dashboard)/finance/transactions/add/page.tsx`

```typescript
import { redirect } from "next/navigation";
import { auth } from "../../../../../../auth";
import { AddTransactionForm } from "@/components/finance/AddTransactionForm";
import { USER_ROLES, hasRole } from "@/lib/auth/roles";

export const metadata = {
  title: "Add Transaction - BaaWA Inventory POS",
  description: "Create a new financial transaction",
};

export default async function AddTransactionPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (
    !hasRole(session.user.role, [
      USER_ROLES.ADMIN,
      USER_ROLES.MANAGER,
      USER_ROLES.STAFF,
    ])
  ) {
    redirect("/unauthorized");
  }

  return <AddTransactionForm user={session.user} />;
}
```

### **Step 3.4: TransactionList Component (Following ProductList Pattern)**

**File**: `src/components/finance/TransactionList.tsx`

```typescript
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";

// Hooks
import { useDebounce } from "@/hooks/useDebounce";
import { useTransactions } from "@/hooks/api/useTransactions";
import { useFinancialCategories } from "@/hooks/api/useFinancialCategories";

// Constants
import { ALL_ROLES } from "@/lib/auth/roles";

// UI Components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Custom Components
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { InventoryPageLayout } from "@/components/inventory/InventoryPageLayout";
import { TransactionDetailModal } from "@/components/finance/TransactionDetailModal";

// Icons
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconDownload,
  IconTrendingUp,
  IconTrendingDown,
} from "@tabler/icons-react";

// Utils and Types
import { formatCurrency } from "@/lib/utils";
import { ErrorHandlers } from "@/lib/utils/error-handling";
import { FilterConfig, SortOption, PaginationState } from "@/types/inventory";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role: string;
  status: string;
  isEmailVerified: boolean;
}

interface TransactionListProps {
  user: User;
}

interface TransactionFilters {
  search: string;
  categoryId: string;
  type: string;
  status: string;
  dateRange: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS: SortOption[] = [
  { value: "transactionDate-desc", label: "Newest First" },
  { value: "transactionDate-asc", label: "Oldest First" },
  { value: "amount-desc", label: "Amount (High to Low)" },
  { value: "amount-asc", label: "Amount (Low to High)" },
  { value: "description-asc", label: "Description (A-Z)" },
  { value: "description-desc", label: "Description (Z-A)" },
];

const TransactionList = ({ user }: TransactionListProps) => {
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0,
  });
  
  const [filters, setFilters] = useState<TransactionFilters>({
    search: "",
    categoryId: "",
    type: "",
    status: "",
    dateRange: "",
    sortBy: "transactionDate",
    sortOrder: "desc",
  });
  
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const debouncedSearch = useDebounce(filters.search, 500);

  // Data fetching
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useTransactions({
    page: pagination.page,
    limit: pagination.limit,
    search: debouncedSearch,
    type: filters.type,
    categoryId: filters.categoryId ? parseInt(filters.categoryId) : undefined,
    status: filters.status,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const { data: categoriesData } = useFinancialCategories();

  // Filter configurations
  const filterConfigs: FilterConfig[] = [
    {
      key: "type",
      label: "Type",
      type: "select",
      options: [
        { value: "", label: "All Types" },
        { value: "INCOME", label: "Income" },
        { value: "EXPENSE", label: "Expense" },
      ],
    },
    {
      key: "categoryId",
      label: "Category",
      type: "select",
      options: [
        { value: "", label: "All Categories" },
        ...(categoriesData?.categories || []).map((cat: any) => ({
          value: cat.id.toString(),
          label: cat.name,
        })),
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: [
        { value: "", label: "All Status" },
        { value: "COMPLETED", label: "Completed" },
        { value: "PENDING", label: "Pending" },
        { value: "CANCELLED", label: "Cancelled" },
      ],
    },
  ];

  // Status badge component
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Type badge component
  const getTypeBadge = (type: string) => {
    return type === "INCOME" ? (
      <Badge className="bg-green-100 text-green-800">
        <IconTrendingUp className="h-3 w-3 mr-1" />
        Income
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <IconTrendingDown className="h-3 w-3 mr-1" />
        Expense
      </Badge>
    );
  };

  // Handle transaction actions
  const handleViewTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDetailModal(true);
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    // Implementation for delete
    toast.success("Transaction deleted successfully");
  };

  // Table columns
  const columns = [
    {
      key: "date",
      label: "Date",
      render: (transaction: any) => (
        <div className="font-medium">
          {new Date(transaction.transactionDate).toLocaleDateString()}
        </div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (transaction: any) => (
        <div>
          <div className="font-medium">{transaction.description || "No description"}</div>
          <div className="text-sm text-muted-foreground">{transaction.category?.name}</div>
        </div>
      ),
    },
    {
      key: "type",
      label: "Type",
      render: (transaction: any) => getTypeBadge(transaction.type),
    },
    {
      key: "amount",
      label: "Amount",
      render: (transaction: any) => (
        <div className={`font-medium ${
          transaction.type === "INCOME" ? "text-green-600" : "text-red-600"
        }`}>
          {transaction.type === "INCOME" ? "+" : "-"}{formatCurrency(Number(transaction.amount))}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (transaction: any) => getStatusBadge(transaction.status),
    },
    {
      key: "actions",
      label: "Actions",
      render: (transaction: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <IconDots className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleViewTransaction(transaction)}>
              <IconEye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/finance/transactions/${transaction.id}/edit`}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDeleteTransaction(transaction.id)}
              className="text-red-600"
            >
              <IconTrash className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const pageActions = (
    <div className="flex flex-row items-center gap-2">
      <Button variant="outline">
        <IconDownload className="h-4 w-4 mr-2" />
        Export
      </Button>
      <Button asChild>
        <Link href="/finance/transactions/add">
          <IconPlus className="h-4 w-4 mr-2" />
          Add Transaction
        </Link>
      </Button>
    </div>
  );

  return (
    <ErrorBoundary>
      <InventoryPageLayout
        title="Financial Transactions"
        description="Manage your income and expense transactions"
        pageActions={pageActions}
        data={transactionsData?.transactions || []}
        columns={columns}
        isLoading={transactionsLoading}
        error={transactionsError}
        pagination={pagination}
        setPagination={setPagination}
        filters={filters}
        setFilters={setFilters}
        filterConfigs={filterConfigs}
        sortOptions={SORT_OPTIONS}
        searchPlaceholder="Search transactions..."
        onRefresh={refetchTransactions}
      />

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />
    </ErrorBoundary>
  );
};

export default TransactionList;
```

## 🚀 **Phase 4: Custom Hooks (Following Existing Patterns)**

### **Step 4.1: Transactions Hook (Following useProducts Pattern)**

**File**: `src/hooks/api/useTransactions.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorHandlers } from "@/lib/utils/error-handling";

interface TransactionFilters {
  search?: string;
  type?: string;
  categoryId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface Transaction {
  id: number;
  transactionNumber: string;
  type: "INCOME" | "EXPENSE";
  categoryId: number;
  amount: number;
  currency: string;
  description: string | null;
  transactionDate: Date;
  paymentMethod: string | null;
  referenceNumber: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "APPROVED" | "REJECTED";
  approvedBy: number | null;
  approvedAt: Date | null;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: number;
    name: string;
    type: string;
  };
  createdByUser: {
    firstName: string;
    lastName: string;
    email: string;
  };
  approvedByUser?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  expenseDetails?: any;
  incomeDetails?: any;
}

export function useTransactions(filters: TransactionFilters = {}) {
  const queryKey = ["transactions", filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/transactions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      return response.json();
    },
  });
}

export function useTransaction(id: number) {
  return useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const response = await fetch(`/api/finance/transactions/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transaction");
      }
      return response.json();
    },
    enabled: !!id,
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionData: any) => {
      const response = await fetch("/api/finance/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transactionData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast.success("Transaction created successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update transaction");
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["transaction", id] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast.success("Transaction updated successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/finance/transactions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete transaction");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      toast.success("Transaction deleted successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}
```

### **Step 4.2: Financial Categories Hook (Following useBrands Pattern)**

**File**: `src/hooks/api/useFinancialCategories.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ErrorHandlers } from "@/lib/utils/error-handling";

export interface FinancialCategory {
  id: number;
  name: string;
  type: "INCOME" | "EXPENSE";
  description: string | null;
  isActive: boolean;
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
  parent?: FinancialCategory;
  children?: FinancialCategory[];
  transactions?: any[];
}

interface CategoryFilters {
  type?: string;
  isActive?: boolean;
}

export function useFinancialCategories(filters: CategoryFilters = {}) {
  const queryKey = ["financial-categories", filters];

  return useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/finance/categories?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch financial categories");
      }
      return response.json();
    },
  });
}

export function useCreateFinancialCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: any) => {
      const response = await fetch("/api/finance/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(categoryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create category");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-categories"] });
      toast.success("Category created successfully");
    },
    onError: ErrorHandlers.mutation,
  });
}

### **Step 4.3: Financial Summary Hook**

**File**: `src/hooks/api/useFinanceSummary.ts`

```typescript
import { useQuery } from "@tanstack/react-query";

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["finance-summary"],
    queryFn: async () => {
      const response = await fetch("/api/finance/summary");
      if (!response.ok) {
        throw new Error("Failed to fetch financial summary");
      }
      return response.json();
    },
  });
}
```

## 🧭 **Navigation Integration**

### **Step 5.1: Update Sidebar Navigation**

**File**: `src/components/app-sidebar.tsx`

Add the finance navigation section:

```typescript
// Add to imports
import { IconCash } from "@tabler/icons-react";

// Add to the navigation data
const data = {
  user: {
    // ... existing user data
  },
  navMain: [
    // ... existing nav items
    {
      title: "Finance Manager",
      url: "/finance",
      icon: IconCash,
      items: [
        {
          title: "Dashboard",
          url: "/finance",
        },
        {
          title: "All Transactions",
          url: "/finance/transactions",
        },
        {
          title: "Add Transaction",
          url: "/finance/transactions/add",
        },
        {
          title: "Financial Reports",
          url: "/finance/reports",
        },
        {
          title: "Budget Planning",
          url: "/finance/budgets",
        },
        {
          title: "Finance Settings",
          url: "/finance/settings",
        },
      ],
    },
    // ... rest of nav items
  ],
  // ... rest of data
};
```

## 🚀 **Phase 5: Testing**

### **Step 5.1: Unit Tests**

**File**: `tests/finance/unit/financial-calculations.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  calculateNetAmount,
  calculateTaxAmount,
  formatCurrency,
  getFinancialSummary,
} from "@/lib/utils/finance";

describe("Financial Calculations", () => {
  describe("calculateNetAmount", () => {
    it("should calculate net amount correctly", () => {
      expect(calculateNetAmount(1000, 100)).toBe(900);
      expect(calculateNetAmount(1000, 0)).toBe(1000);
      expect(calculateNetAmount(1000)).toBe(1000);
    });
  });

  describe("calculateTaxAmount", () => {
    it("should calculate tax amount correctly", () => {
      expect(calculateTaxAmount(1000, 10)).toBe(100);
      expect(calculateTaxAmount(1000, 0)).toBe(0);
      expect(calculateTaxAmount(0, 10)).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("should format currency correctly", () => {
      expect(formatCurrency(1000)).toBe("₦1,000.00");
      expect(formatCurrency(1000.5)).toBe("₦1,000.50");
      expect(formatCurrency(0)).toBe("₦0.00");
    });
  });

  describe("getFinancialSummary", () => {
    it("should calculate summary correctly", () => {
      const transactions = [
        { type: "INCOME", amount: 1000 },
        { type: "INCOME", amount: 500 },
        { type: "EXPENSE", amount: 300 },
        { type: "EXPENSE", amount: 200 },
      ];

      const summary = getFinancialSummary(transactions);

      expect(summary.totalIncome).toBe(1500);
      expect(summary.totalExpense).toBe(500);
      expect(summary.netAmount).toBe(1000);
      expect(summary.transactionCount).toBe(4);
    });
  });
});
```

## 🚀 **Phase 6: Deployment**

### **Step 6.1: Database Migration**

```bash
# Generate migration
npx prisma migrate dev --name add_finance_manager_tables

# Apply to production
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### **Step 6.2: Environment Variables**

Add to your `.env` file:

```env
# Finance Manager Settings
FINANCE_APPROVAL_LIMIT=100000
FINANCE_CURRENCY=NGN
FINANCE_TAX_RATE=7.5
```

### **Step 6.3: Seed Data**

**File**: `scripts/seed-financial-categories.js`

```javascript
const { PrismaClient } = require("@prisma/client");
const { DEFAULT_FINANCIAL_CATEGORIES } = require("../src/lib/constants");

const prisma = new PrismaClient();

async function seedFinancialCategories() {
  console.log("Seeding financial categories...");

  for (const category of DEFAULT_FINANCIAL_CATEGORIES.EXPENSE) {
    await prisma.financialCategory.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }

  for (const category of DEFAULT_FINANCIAL_CATEGORIES.INCOME) {
    await prisma.financialCategory.upsert({
      where: { name_type: { name: category.name, type: category.type } },
      update: {},
      create: category,
    });
  }

  console.log("Financial categories seeded successfully!");
}

seedFinancialCategories()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run the seed script:

```bash
node scripts/seed-financial-categories.js
```

## 🎯 **Next Steps After Implementation**

1. **User Training**: Create user guides and training materials
2. **Data Migration**: Import existing financial data if available
3. **Integration Testing**: Test with real business scenarios
4. **Performance Optimization**: Monitor and optimize database queries
5. **Security Audit**: Review and enhance security measures
6. **Backup Strategy**: Implement automated backups for financial data

## 📊 **Success Metrics**

- **Functionality**: All core features working correctly
- **Performance**: Page load times under 2 seconds
- **Security**: No unauthorized access to financial data
- **Usability**: Intuitive interface for all user roles
- **Reliability**: 99.9% uptime for financial operations

---

**This implementation provides a solid foundation for the Finance Manager feature. Each phase builds upon the previous one, ensuring a systematic and reliable development process.**
