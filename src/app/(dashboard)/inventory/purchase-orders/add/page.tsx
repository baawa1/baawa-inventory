import { auth } from "../../../../../../auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconArrowLeft, IconPlus } from "@tabler/icons-react";
import Link from "next/link";

export const metadata = {
  title: "Create Purchase Order - BaaWA Inventory POS",
  description: "Create a new purchase order",
};

export default async function AddPurchaseOrderPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.status !== "APPROVED") {
    redirect("/pending-approval");
  }

  // Check permissions
  if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/inventory/purchase-orders">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Purchase Orders
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Purchase Order</h1>
          <p className="text-muted-foreground">
            Create a new purchase order for suppliers
          </p>
        </div>
      </div>

      {/* Placeholder Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPlus className="h-5 w-5" />
            Purchase Order Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <IconPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              Purchase Order Creation
            </h3>
            <p className="text-muted-foreground mb-6">
              The purchase order creation form is currently under development.
            </p>
            <Button asChild>
              <Link href="/inventory/purchase-orders">
                Back to Purchase Orders
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
