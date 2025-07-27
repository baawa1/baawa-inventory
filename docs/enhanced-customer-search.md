# Enhanced Customer Search & Duplicate Prevention

## Overview

The POS system now includes enhanced customer search functionality that automatically detects potential duplicate customers and prevents data duplication across both **customers** (from sales transactions) and **users** (staff/employees). This feature helps maintain clean customer data and improves the user experience during sales transactions.

## Key Features

### 1. Proactive Search Triggers

#### Phone Number Search
- **Trigger**: Automatically searches when 7+ digits are entered
- **Logic**: Extracts digits only from phone input (ignores formatting)
- **Examples**:
  - `08012345678` → Triggers search
  - `080-123-4567` → Triggers search (7+ digits)
  - `080123` → No search (less than 7 digits)

#### Email Search
- **Trigger**: Automatically searches when email has 5+ characters and contains '@'
- **Logic**: Validates basic email format before searching
- **Examples**:
  - `john@example.com` → Triggers search
  - `john@` → No search (less than 5 characters)
  - `john` → No search (no '@' symbol)

### 2. Smart Search Algorithm

#### Dual Table Search
- **Customers Table**: Searches sales transactions for customer information
- **Users Table**: Searches staff/employee accounts for email/phone
- **Combined Results**: Merges and prioritizes results from both tables

#### Phone Number Matching
- **Exact Match**: Compares full phone numbers (with/without formatting)
- **Partial Match**: Searches for phone numbers containing the entered digits
- **Digit Extraction**: Removes all non-digit characters for comparison

#### Email Matching
- **Exact Match**: Case-insensitive exact email match
- **Partial Match**: Searches for emails containing the entered text
- **Normalization**: Converts to lowercase for comparison

### 3. Visual Feedback System

#### Auto-Search Results
- **Orange Warning Box**: Appears when potential matches are found
- **Exact Match Highlighting**: Red background for exact duplicates
- **"Exact Match" Badge**: Clear visual indicator for duplicates
- **"Staff" Badge**: Blue badge for staff/employee matches
- **Continue as New Customer**: Option to proceed despite matches

#### Form Validation
- **Real-time Checking**: Validates as user types
- **Warning Messages**: Clear warnings for exact duplicates
- **Loading Indicators**: Shows when checking for duplicates
- **Color-coded Inputs**: Red border for duplicate fields

## API Endpoints

### 1. Customer Search API
```
GET /api/pos/customers?search={query}&limit={number}
```

**Features**:
- Smart query detection (phone vs email vs general)
- Searches both customers and users tables
- Prioritizes exact matches in results
- Configurable result limit
- Case-insensitive search

**Response**:
```json
[
  {
    "id": "customer-email-or-phone",
    "name": "Customer Name",
    "email": "customer@example.com",
    "phone": "08012345678",
    "totalSpent": 50000,
    "totalOrders": 5,
    "lastPurchase": "2024-01-15T10:30:00Z",
    "averageOrderValue": 10000,
    "rank": 1,
    "type": "customer"
  },
  {
    "id": "user-123",
    "name": "Staff Member",
    "email": "staff@company.com",
    "phone": "09012345678",
    "totalSpent": 0,
    "totalOrders": 0,
    "lastPurchase": "2024-01-15T10:30:00Z",
    "averageOrderValue": 0,
    "rank": 2,
    "type": "user",
    "role": "STAFF"
  }
]
```

### 2. Uniqueness Check API
```
POST /api/pos/customers/check-unique
```

**Request Body**:
```json
{
  "email": "customer@example.com",
  "phone": "08012345678"
}
```

**Response**:
```json
{
  "exists": true,
  "hasPartialMatches": false,
  "customers": [
    {
      "id": "user-123",
      "name": "Staff Member",
      "email": "customer@example.com",
      "phone": "08012345678",
      "type": "user",
      "role": "STAFF"
    }
  ],
  "message": "Customer with this email already exists",
  "exactMatches": 1,
  "partialMatches": 0
}
```

## User Experience Flow

### 1. Normal Customer Entry
1. User starts typing customer information
2. System waits for sufficient input (7+ digits for phone, 5+ chars + @ for email)
3. Auto-search triggers and searches both customers and users tables
4. Results show both customers and staff members with clear indicators
5. User can select existing customer/staff or continue as new

### 2. Duplicate Detection
1. User enters information that matches existing customer or staff
2. System shows orange warning box with matches
3. Exact matches are highlighted in red with "Exact Match" badge
4. Staff members are marked with blue "Staff" badge
5. User must explicitly choose to continue as new customer

### 3. Manual Search
1. User clicks "Search Existing Customers" button
2. Search interface opens with input field
3. User can search by name, email, or phone
4. Results show both customer history and staff information
5. Clear visual distinction between customers and staff

## Implementation Details

### Frontend Components

#### Helper Functions
```typescript
// Check if phone search should trigger
const shouldSearchPhone = (phone: string): boolean => {
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7;
};

// Check if email search should trigger
const shouldSearchEmail = (email: string): boolean => {
  return email.length >= 5 && email.includes('@');
};
```

#### Auto-Search Functions
```typescript
// Auto-search for phone numbers
const autoSearchPhone = async (phone: string) => {
  if (!shouldSearchPhone(phone)) return;
  
  const response = await fetch(`/api/pos/customers?search=${encodeURIComponent(phone)}`);
  const results = await response.json();
  setAutoSearchResults(results);
  setShowAutoSearch(results.length > 0);
};
```

### Backend Logic

#### Dual Table Search
```typescript
// Search both customers and users tables
const results = [];

// 1. Search sales transactions (customers)
const customers = await prisma.salesTransaction.groupBy({
  by: ['customer_email', 'customer_name', 'customer_phone'],
  where: { OR: searchConditions },
  // ... aggregation
});

// 2. Search users table (staff)
const users = await prisma.user.findMany({
  where: { 
    OR: userSearchConditions,
    isActive: true 
  },
  select: { /* user fields */ }
});

// Combine and sort results
results.push(...customerData, ...userData);
```

#### Result Prioritization
```typescript
// Sort results with exact matches first, then by type
.sort((a, b) => {
  // Prioritize exact matches
  if (isPhoneSearch) {
    const aExactMatch = a.phone === searchQuery || a.phone?.replace(/\D/g, '') === digitsOnly;
    const bExactMatch = b.phone === searchQuery || b.phone?.replace(/\D/g, '') === digitsOnly;
    
    if (aExactMatch && !bExactMatch) return -1;
    if (!aExactMatch && bExactMatch) return 1;
  }
  
  // Then prioritize users (staff) over customers
  if (a.type === 'user' && b.type === 'customer') return -1;
  if (a.type === 'customer' && b.type === 'user') return 1;
  
  // Then sort by rank
  return a.rank - b.rank;
})
```

## Benefits

### 1. Data Quality
- **Prevents Duplicates**: Automatic detection across customers and staff
- **Clean Database**: Reduces data redundancy in both tables
- **Consistent Records**: Maintains single profiles for both customers and staff

### 2. User Experience
- **Proactive Detection**: Finds matches before form submission
- **Clear Feedback**: Visual indicators for customers vs staff
- **Flexible Options**: Users can still create new customers when needed
- **Staff Recognition**: Clear identification of staff members

### 3. Business Intelligence
- **Customer History**: Shows order history and spending patterns
- **Staff Information**: Displays staff roles and contact information
- **Better Analytics**: Accurate data for reporting
- **Loyalty Tracking**: Proper customer relationship management

## Testing

Run the test script to verify functionality:
```bash
node scripts/test-enhanced-search.js
```

The test script validates:
- Phone number search across both tables
- Email search across both tables
- API endpoint responses
- Uniqueness checking
- Partial match detection
- Staff vs customer identification

## Future Enhancements

### Potential Improvements
1. **Fuzzy Matching**: Handle typos and variations in names
2. **Phone Format Normalization**: Standardize phone number formats
3. **Bulk Import Validation**: Check for duplicates during data imports
4. **Customer Merge**: Tools to merge duplicate customer records
5. **Advanced Search**: Search by address, company, or other fields
6. **Role-based Filtering**: Filter results by user roles

### Performance Optimizations
1. **Debouncing**: Reduce API calls during rapid typing
2. **Caching**: Cache search results for better performance
3. **Indexing**: Database indexes for faster searches
4. **Pagination**: Handle large customer databases efficiently
5. **Parallel Queries**: Execute customer and user searches in parallel 