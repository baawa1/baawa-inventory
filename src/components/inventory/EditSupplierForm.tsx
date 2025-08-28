'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/ui/page-header';
import { FormLoading } from '@/components/ui/form-loading';

import { toast } from 'sonner';
import { useSupplier, useUpdateSupplier } from '@/hooks/api/suppliers';
import { logger } from '@/lib/logger';

interface EditSupplierFormProps {
  supplierId: number;
}

const updateSupplierSchema = z.object({
  name: z
    .string()
    .min(1, 'Supplier name is required')
    .max(100, 'Supplier name must be 100 characters or less')
    .trim(),
  contactPerson: z
    .string()
    .max(100, 'Contact person must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone number must be 20 characters or less')
    .optional()
    .or(z.literal('')),
  address: z
    .string()
    .max(500, 'Address must be 500 characters or less')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .max(100, 'City must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  state: z
    .string()
    .max(100, 'State must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  country: z
    .string()
    .max(100, 'Country must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  postalCode: z
    .string()
    .max(20, 'Postal code must be 20 characters or less')
    .optional()
    .or(z.literal('')),
  website: z
    .string()
    .url('Please enter a valid website URL')
    .max(255, 'Website must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  taxNumber: z
    .string()
    .max(100, 'Tax number must be 100 characters or less')
    .optional()
    .or(z.literal('')),
  paymentTerms: z
    .string()
    .max(255, 'Payment terms must be 255 characters or less')
    .optional()
    .or(z.literal('')),
  creditLimit: z
    .union([
      z.number().positive('Credit limit must be positive'),
      z.string().transform(val => {
        if (!val || val.trim() === '') return null;
        const parsed = parseFloat(val);
        if (isNaN(parsed) || parsed <= 0) {
          throw new Error('Credit limit must be a positive number');
        }
        return parsed;
      }),
    ])
    .optional()
    .nullable(),
  notes: z
    .string()
    .max(1000, 'Notes must be 1000 characters or less')
    .optional()
    .or(z.literal('')),
  isActive: z.boolean(),
});

type UpdateSupplierFormData = z.infer<typeof updateSupplierSchema>;

export default function EditSupplierForm({
  supplierId,
}: EditSupplierFormProps) {
  const router = useRouter();
  const updateSupplierMutation = useUpdateSupplier();
  const [error, setError] = useState<string | null>(null);

  const { data: supplier, isLoading, error: fetchError } = useSupplier(supplierId);

  const form = useForm<UpdateSupplierFormData>({
    resolver: zodResolver(updateSupplierSchema) as any,
    values: supplier as any,
  });

  const onSubmit = async (data: UpdateSupplierFormData) => {
    setError(null);

    try {
      // Clean up empty string fields to undefined for proper handling
      const cleanedData = {
        name: data.name,
        contactPerson: data.contactPerson || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        website: data.website || undefined,
        notes: data.notes || undefined,
      };

      updateSupplierMutation.mutate(
        { id: supplierId, data: cleanedData },
        {
          onSuccess: () => {
            toast.success('Supplier updated successfully!');
            router.push('/inventory/suppliers');
          },
          onError: error => {
            logger.error('Failed to update supplier', {
              supplierId,
              supplierName: data.name,
              error: error instanceof Error ? error.message : String(error),
            });
            const errorMessage =
              error instanceof Error
                ? error.message
                : 'Failed to update supplier';
            setError(errorMessage);
            toast.error(errorMessage);
          },
        }
      );
    } catch (error) {
      logger.error('Failed to update supplier', {
        supplierId,
        supplierName: data.name,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error('Failed to update supplier');
    }
  };

  const handleCancel = () => {
    router.push('/inventory/suppliers');
  };

  // Show loading state
  if (isLoading) {
    return (
      <FormLoading
        title="Edit Supplier"
        description="Loading supplier information"
        backLabel="Back to Suppliers"
        onBack={handleCancel}
        backUrl="/inventory/suppliers"
      />
    );
  }

  // Show error state
  if (fetchError) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 px-4 lg:px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load supplier information. Please try again.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show not found state
  if (!supplier) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleCancel}
            className="mb-4 px-4 lg:px-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Supplier not found. It may have been deleted or you don't have permission to view it.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={handleCancel}
          className="mb-4 px-4 lg:px-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Suppliers
        </Button>
        <PageHeader
          title="Edit Supplier"
          description={`Update the details for "${supplier.name}" supplier`}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier Information</CardTitle>
          <CardDescription>
            Update the details for this supplier. Required fields are marked
            with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                {/* Supplier Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Supplier Name
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., ABC Electronics, XYZ Supplies"
                          {...field}
                          className={
                            form.formState.errors.name ? 'border-red-500' : ''
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contact Person */}
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Primary contact person name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="supplier@example.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., +1 (555) 123-4567"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Address Information</h3>
                
                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Complete address including street, building number"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* State */}
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State/Province</FormLabel>
                        <FormControl>
                          <Input placeholder="State or province" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                </div>
              </div>

              {/* Business Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Business Information</h3>

                {/* Website */}
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          type="url"
                          placeholder="https://supplier-website.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />


              </div>

              {/* Additional Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Information</h3>

                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes about this supplier"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 border-t pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={updateSupplierMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateSupplierMutation.isPending}
                  className="flex items-center gap-2"
                >
                  {updateSupplierMutation.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {updateSupplierMutation.isPending
                    ? 'Updating...'
                    : 'Update Supplier'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
