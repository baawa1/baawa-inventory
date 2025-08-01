'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Calendar,
  CheckCircle,
  Clock,
  Mail,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import type { SessionUser } from '@/types/user';

interface AccountInfoProps {
  user: SessionUser;
}

export function AccountInfo({ user }: AccountInfoProps) {
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'Not available';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'VERIFIED':
        return 'bg-blue-100 text-blue-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'SUSPENDED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800';
      case 'STAFF':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Full Name
              </label>
              <p className="text-sm">
                {user.firstName} {user.lastName}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Email
              </label>
              <p className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {user.email}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Role
              </label>
              <div className="mt-1">
                <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
              </div>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Status
              </label>
              <div className="mt-1">
                <Badge className={getStatusColor(user.status)}>
                  {user.status}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-muted-foreground text-sm font-medium">
              Email Verification
            </label>
            <div className="mt-1 flex items-center gap-2">
              {user.isEmailVerified ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Verified</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-red-600">Not Verified</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Dates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Account Dates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Account Created
              </label>
              <p className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <label className="text-muted-foreground text-sm font-medium">
                Last Login
              </label>
              <p className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                {formatDate(user.lastLogin)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
