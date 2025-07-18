import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              BaaWA Accessories
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Register</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-3 h-3 mr-1" />
            Internal Business System
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            BaaWA Accessories
            <span className="text-blue-600 dark:text-blue-400">
              {" "}
              Management System
            </span>
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
            Complete inventory management and point-of-sale system for
            wristwatches, shades, and accessories. Streamline your business
            operations with our integrated solution.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button size="lg" className="text-lg px-8 py-6">
                Access System
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Our Product Categories
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300">
            Comprehensive management for all your accessory categories
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Watch className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Wristwatches</CardTitle>
              <CardDescription>
                Premium timepieces from luxury brands
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Glasses className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Shades</CardTitle>
              <CardDescription>Designer sunglasses and eyewear</CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-purple-600 dark:text-purple-400" />
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
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
            Business Management Features
          </h2>
          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
            Everything you need to manage your accessory business efficiently
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Track stock levels, set alerts, and manage products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Real-time stock tracking
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Low stock alerts
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Product categorization
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
                <ShoppingCart className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle>Point of Sale</CardTitle>
              <CardDescription>
                Fast and reliable POS system for sales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Quick checkout process
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Multiple payment methods
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Receipt generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>
                Track performance and business insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Sales performance metrics
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Inventory turnover analysis
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Custom report generation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>Role-based access for your team</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Multi-user support
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Role-based permissions
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Activity tracking
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle>Data Security</CardTitle>
              <CardDescription>
                Secure handling of business data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Data encryption
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Audit trails
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Secure access control
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle>Offline Capability</CardTitle>
              <CardDescription>
                Continue operations without internet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Offline POS transactions
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Automatic data sync
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  Reliable backup system
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-700 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Streamline Your Business?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Access your BaaWA Accessories management system to start managing
            inventory and sales efficiently.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-6"
              >
                Sign In to System
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600"
              >
                Create New Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-white" />
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
              <h3 className="font-semibold text-white mb-4">System Access</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-white transition-colors"
                  >
                    Register
                  </Link>
                </li>
                <li>
                  <Link
                    href="/forgot-password"
                    className="hover:text-white transition-colors"
                  >
                    Reset Password
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    System Guide
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact Admin
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    System Status
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2024 BaaWA Accessories. Internal Business System.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
