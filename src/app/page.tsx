import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/ui/logo';
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Shield,
  Zap,
  ArrowRight,
  CheckCircle,
  Watch,
  Glasses,
  Gift,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <Logo variant="brand" size="md" />
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              BaaWA Accessories
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" prefetch={true}>
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register" prefetch={true}>
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex justify-center">
            <Logo variant="brand" size="xl" showText />
          </div>
          <Badge variant="secondary" className="mb-4">
            <Zap className="mr-1 h-3 w-3" />
            Internal Business System
          </Badge>
          <h1 className="mb-6 text-5xl font-bold text-slate-900 md:text-6xl dark:text-white">
            BaaWA Accessories
            <span className="text-blue-600 dark:text-blue-400">
              {' '}
              Management System
            </span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-slate-600 dark:text-slate-300">
            Complete inventory management and point-of-sale system for
            wristwatches, shades, and accessories. Streamline your business
            operations with our integrated solution.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login" prefetch={true}>
              <Button size="lg" className="px-8 py-6 text-lg">
                Access System
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register" prefetch={true}>
              <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
            Our Product Categories
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Comprehensive management for all your accessory categories
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <Card className="border-0 text-center shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <Watch className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Wristwatches</CardTitle>
              <CardDescription>
                Premium timepieces from luxury brands
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 text-center shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <Glasses className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Shades</CardTitle>
              <CardDescription>Designer sunglasses and eyewear</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 text-center shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Gift className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Accessories</CardTitle>
              <CardDescription>
                Complete range of fashion accessories
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-slate-900 md:text-4xl dark:text-white">
            Business Management Features
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-slate-600 dark:text-slate-300">
            Everything you need to manage your accessory business efficiently
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track stock levels, set alerts, and manage products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Real-time stock tracking
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Low stock alerts
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Product categorization
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <ShoppingCart className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Point of Sale</CardTitle>
              <CardDescription>
                Fast and reliable POS system for sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Quick checkout process
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Multiple payment methods
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Receipt generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>
                Track performance and business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Sales performance metrics
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Inventory turnover analysis
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Custom report generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900">
                <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Role-based access for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Multi-user support
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Role-based permissions
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Activity tracking
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                <Shield className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Data Security</CardTitle>
              <CardDescription>
                Secure handling of business data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Data encryption
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Audit trails
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Secure access control
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg transition-shadow hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Offline Capability</CardTitle>
              <CardDescription>
                Continue operations without internet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Offline POS transactions
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Automatic data sync
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Reliable backup system
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20 dark:bg-blue-700">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to Streamline Your Business?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-xl text-blue-100">
            Access your BaaWA Accessories management system to start managing
            inventory and sales efficiently.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="px-8 py-6 text-lg"
              >
                Sign In to System
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white px-8 py-6 text-lg text-white hover:bg-white hover:text-blue-600"
              >
                Create New Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                  <ShoppingCart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  BaaWA Accessories
                </span>
              </div>
              <p className="text-sm">
                Internal business management system for inventory and
                point-of-sale operations.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-white">System Access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/login"
                    className="transition-colors hover:text-white"
                    prefetch={true}
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="transition-colors hover:text-white"
                    prefetch={true}
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forgot-password"
                    className="transition-colors hover:text-white"
                    prefetch={true}
                  >
                    Reset Password
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-white">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    System Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    Contact Admin
                  </a>
                </li>
                <li>
                  <a href="#" className="transition-colors hover:text-white">
                    System Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2024 BaaWA Accessories. Internal Business System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
