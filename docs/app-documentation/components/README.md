# UI Components Documentation

## Overview

The application uses a component-based architecture built with React, TypeScript, and shadcn/ui, featuring reusable components, consistent design patterns, and robust form handling.

## Component Architecture

### Component Organization

```
src/components/
├── ui/                 # Base UI components (shadcn/ui)
├── layouts/            # Layout components
├── common/             # Shared components
├── auth/              # Authentication components
├── admin/             # Admin-specific components
├── inventory/         # Inventory management components
├── pos/              # Point of sale components
├── finance/          # Financial components
└── providers/        # Context providers
```

### Design System Foundation

The application is built on shadcn/ui components, providing:

- **Consistent styling** with Tailwind CSS
- **Accessibility** with Radix UI primitives
- **Type safety** with TypeScript
- **Theme support** with CSS variables

## Base UI Components

### Form Components

#### Form System (`src/components/ui/form.tsx`)

Based on React Hook Form with Zod validation:

```typescript
const Form = FormProvider;

const FormField = <TFieldValues, TName>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  
  const fieldState = getFieldState(fieldContext.name, formState);
  
  return {
    id: itemContext.id,
    name: fieldContext.name,
    formItemId: `${itemContext.id}-form-item`,
    formDescriptionId: `${itemContext.id}-form-item-description`,
    formMessageId: `${itemContext.id}-form-item-message`,
    ...fieldState,
  };
};
```

**Usage Pattern:**
```typescript
function MyForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: ''
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

### Card Components

Consistent card-based layouts:

```typescript
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

### Data Display Components

#### Table Component
Built on TanStack Table with sorting, filtering, and pagination:

```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchKey?: string
  searchPlaceholder?: string
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  searchPlaceholder = "Search..."
}: DataTableProps<TData, TValue>) {
  // Table implementation
}
```

## Feature-Specific Components

### Inventory Management Components

#### AddProductForm (`src/components/inventory/AddProductForm.tsx`)

Multi-section form for product creation:

```typescript
export default function AddProductForm() {
  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: defaultFormValues,
  });

  const { onSubmit } = useProductSubmit(form, setIsSubmitting, setSubmitError);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <BasicInfoSection />
          <CategoryBrandSection />
          <PricingInventorySection />
          <ProductSpecificationsSection />
          <AdditionalInfoSection />
          <FormActions />
        </form>
      </Form>
    </div>
  );
}
```

**Form Sections:**

1. **BasicInfoSection** - Name, SKU, description, barcode
2. **CategoryBrandSection** - Category, brand, supplier selection
3. **PricingInventorySection** - Pricing and stock information
4. **ProductSpecificationsSection** - Physical attributes
5. **AdditionalInfoSection** - Tags and additional data
6. **FormActions** - Submit and cancel buttons

**Features:**
- Modular section architecture
- Real-time validation with Zod
- Loading states and error handling
- Auto-generated SKUs
- Dependent field logic

### Point of Sale Components

#### POSInterface (`src/components/pos/POSInterface.tsx`)

Complete POS transaction interface:

```typescript
export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  category?: string;
  brand?: string;
}

export function POSInterface() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentStep, setCurrentStep] = useState<'search' | 'payment' | 'receipt'>('search');
  const [discount, setDiscount] = useState(0);
  const [fees, setFees] = useState<Array<FeeType>>([]);
  const [customerInfo, setCustomerInfo] = useState(defaultCustomerInfo);

  // Calculate totals using consistent utility
  const { subtotal, total: baseTotal } = calculateOrderTotals(cart, discount);
  const feesTotal = fees.reduce((sum, fee) => sum + fee.amount, 0);
  const total = baseTotal + feesTotal;

  return (
    <POSErrorBoundary>
      <div className="grid h-screen grid-cols-1 lg:grid-cols-12">
        {/* Product selection area */}
        <div className="lg:col-span-7">
          <ProductGrid onAddToCart={addToCart} />
        </div>
        
        {/* Cart and checkout area */}
        <div className="lg:col-span-5">
          <ShoppingCart
            items={cart}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            discount={discount}
            fees={fees}
          />
          
          {/* Payment interface */}
          <SlidingPaymentInterface
            isOpen={currentStep === 'payment'}
            cart={cart}
            subtotal={subtotal}
            discount={discount}
            fees={fees}
            total={validatedTotal}
            customerInfo={customerInfo}
            onClose={() => setCurrentStep('search')}
            onPaymentComplete={handlePaymentComplete}
          />
        </div>
      </div>
    </POSErrorBoundary>
  );
}
```

**Key Features:**
- **ProductGrid**: Product search and selection
- **ShoppingCart**: Cart management and item editing
- **SlidingPaymentInterface**: Payment processing workflow
- **BarcodeScanner**: Barcode scanning integration
- **OfflineStatusIndicator**: Offline mode support
- **POSErrorBoundary**: Error handling and recovery

#### Payment Flow Components

Multi-step payment process:

1. **CustomerInfoStep** - Customer data collection
2. **DiscountStep** - Discount application
3. **CustomFeesStep** - Additional fees
4. **PaymentMethodStep** - Payment method selection
5. **OrderSummaryStep** - Final review and confirmation

### Authentication Components

#### LoginForm (`src/components/auth/LoginForm.tsx`)

Secure login with validation:

```typescript
export function LoginForm() {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button type="submit" className="w-full mt-6">
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**Features:**
- Email/password validation
- Loading states
- Error handling
- Social login buttons
- Password strength indicator

### Admin Components

#### UserManagement (`src/components/admin/UserManagement.tsx`)

User administration interface:

```typescript
export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="User Management"
          description="Manage user accounts and permissions"
        />
        <Button onClick={() => setShowDialog(true)}>
          Add User
        </Button>
      </div>
      
      <DataTable
        columns={userColumns}
        data={users}
        searchKey="email"
        searchPlaceholder="Search users..."
      />
      
      <UserDialog
        user={selectedUser}
        open={showDialog}
        onOpenChange={setShowDialog}
        onUserUpdated={handleUserUpdate}
      />
    </div>
  );
}
```

## Layout Components

### DashboardPageLayout

Standard layout for dashboard pages:

```typescript
interface DashboardPageLayoutProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardPageLayout({
  title,
  description,
  action,
  children
}: DashboardPageLayoutProps) {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <PageHeader title={title} description={description} />
        {action}
      </div>
      {children}
    </div>
  );
}
```

### Navigation Components

#### AppSidebar

Main application navigation:

```typescript
export function AppSidebar() {
  const { user } = useAuth();
  
  return (
    <Sidebar>
      <SidebarHeader>
        <Logo />
      </SidebarHeader>
      
      <SidebarContent>
        <NavMain items={mainNavItems} />
        <NavInventory />
        <NavPOS />
        <NavFinance />
        {user.role === 'ADMIN' && <NavAdmin />}
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
```

## Specialized Components

### Data Visualization

#### Charts (`src/components/ui/chart.tsx`)

Recharts integration with consistent styling:

```typescript
export function InventoryChart({ data }: ChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="hsl(var(--primary))" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### File Upload

#### ImageUpload (`src/components/ui/image-upload.tsx`)

File upload with preview:

```typescript
interface ImageUploadProps {
  onUpload: (files: File[]) => void;
  multiple?: boolean;
  accept?: string;
  maxSize?: number;
}

export function ImageUpload({
  onUpload,
  multiple = false,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024 // 5MB
}: ImageUploadProps) {
  // Drag and drop implementation
  // File validation
  // Preview generation
}
```

## Component Patterns

### Compound Components

For complex UI elements:

```typescript
// Usage
<DataTable>
  <DataTable.Header>
    <DataTable.HeaderRow>
      <DataTable.HeaderCell>Name</DataTable.HeaderCell>
      <DataTable.HeaderCell>Price</DataTable.HeaderCell>
    </DataTable.HeaderRow>
  </DataTable.Header>
  <DataTable.Body>
    {data.map(item => (
      <DataTable.Row key={item.id}>
        <DataTable.Cell>{item.name}</DataTable.Cell>
        <DataTable.Cell>{item.price}</DataTable.Cell>
      </DataTable.Row>
    ))}
  </DataTable.Body>
</DataTable>
```

### Render Props

For flexible component APIs:

```typescript
<AsyncData
  fetch={() => fetchProducts()}
  render={({ data, loading, error }) => (
    <>
      {loading && <Spinner />}
      {error && <ErrorMessage error={error} />}
      {data && <ProductList products={data} />}
    </>
  )}
/>
```

### Custom Hooks Integration

Components heavily use custom hooks for logic:

```typescript
export function ProductList() {
  const { products, loading, error, refetch } = useProducts();
  const { hasPermission } = useAuth();
  const { addToCart } = useCart();

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid gap-4">
      {products.map(product => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={hasPermission('pos:write') ? addToCart : undefined}
        />
      ))}
    </div>
  );
}
```

## Error Handling

### Error Boundaries

Component-level error handling:

```typescript
export class ComponentErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">Something went wrong with this component.</p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### Component Testing

```typescript
// Example test for ProductCard component
describe('ProductCard', () => {
  it('renders product information correctly', () => {
    const mockProduct = {
      id: 1,
      name: 'Test Product',
      price: 29.99,
      stock: 10
    };

    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('10 in stock')).toBeInTheDocument();
  });

  it('handles add to cart action', () => {
    const mockAddToCart = jest.fn();
    const mockProduct = { id: 1, name: 'Test', price: 10, stock: 5 };

    render(<ProductCard product={mockProduct} onAddToCart={mockAddToCart} />);
    
    fireEvent.click(screen.getByText('Add to Cart'));
    expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
  });
});
```

## Performance Optimization

### Code Splitting

Dynamic imports for large components:

```typescript
const AdminDashboard = lazy(() => import('./AdminDashboard'));
const POSInterface = lazy(() => import('./pos/POSInterface'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/pos" element={<POSInterface />} />
      </Routes>
    </Suspense>
  );
}
```

### Memoization

Strategic use of React.memo and useMemo:

```typescript
const ProductCard = memo(function ProductCard({ product, onAddToCart }) {
  const formattedPrice = useMemo(
    () => formatCurrency(product.price),
    [product.price]
  );

  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product);
  }, [onAddToCart, product]);

  return (
    <Card>
      <CardContent>
        <h3>{product.name}</h3>
        <p>{formattedPrice}</p>
        <Button onClick={handleAddToCart}>Add to Cart</Button>
      </CardContent>
    </Card>
  );
});
```

---

This component system provides a robust, scalable foundation for building complex business applications with consistent user experience and maintainable code.