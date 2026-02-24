import { NextRequest, NextResponse } from 'next/server';
import { auth } from '#root/auth';
import { prisma } from '@/lib/db';
import { USER_ROLES, hasRole } from '@/lib/auth/roles';
import { getPhoneSearchPatterns } from '@/lib/utils/phone-utils';

const RESULT_LIMIT = 5;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view customer data
    if (
      !hasRole(session.user.role, [
        USER_ROLES.ADMIN,
        USER_ROLES.MANAGER,
        USER_ROLES.STAFF,
      ])
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, phone } = await request.json();
    const trimmedEmail = email ? email.trim().toLowerCase() : '';
    const trimmedPhone = phone ? phone.trim() : '';
    const phoneDigits = trimmedPhone.replace(/\D/g, '');
    const phonePatterns = trimmedPhone
      ? getPhoneSearchPatterns(trimmedPhone)
      : [];
    const hasEmail = trimmedEmail.length > 0;
    const hasPhone = trimmedPhone.length > 0;

    // Validate input
    if (!hasEmail && !hasPhone) {
      return NextResponse.json(
        { error: 'Email or phone number is required' },
        { status: 400 }
      );
    }

    const allResults: Array<{
      id: string;
      name: string;
      email: string;
      phone: string;
      type: 'customer' | 'user';
      role?: string;
    }> = [];
    let exactMatches = 0;
    let partialMatches = 0;

    // 1. Check Customer table
    if (hasEmail || hasPhone) {
      const whereClause: any = {
        OR: [],
        isActive: true,
      };

      if (hasEmail) {
        const cleanEmail = trimmedEmail;
        whereClause.OR.push(
          {
            email: {
              equals: cleanEmail,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: cleanEmail,
              mode: 'insensitive',
            },
          }
        );
      }

      if (hasPhone) {
        const cleanPhone = trimmedPhone;
        const digitsOnly = phoneDigits;
        whereClause.OR.push(
          {
            phone: {
              equals: cleanPhone,
            },
          },
          ...(digitsOnly.length > 0
            ? [
                {
                  phone: {
                    contains: digitsOnly,
                  },
                },
              ]
            : [])
        );
      }

      // Check for existing customers
      const existingCustomers = await prisma.customer.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
        take: RESULT_LIMIT,
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform the results
      const customers = existingCustomers.map(customer => ({
        id: `customer-${customer.id}`,
        name: customer.name || 'Unknown',
        email: customer.email || '',
        phone: customer.phone || '',
        type: 'customer' as const,
      }));

      allResults.push(...customers);
    }

    // 2. Check users table (staff/employees)
    if (hasEmail || hasPhone) {
      const userWhereClause: any = {
        OR: [],
        isActive: true, // Only active users
      };

      if (hasEmail) {
        const cleanEmail = trimmedEmail;
        userWhereClause.OR.push(
          {
            email: {
              equals: cleanEmail,
              mode: 'insensitive',
            },
          },
          {
            email: {
              contains: cleanEmail,
              mode: 'insensitive',
            },
          }
        );
      }

      if (hasPhone) {
        const cleanPhone = trimmedPhone;
        const digitsOnly = phoneDigits;
        userWhereClause.OR.push(
          {
            phone: {
              equals: cleanPhone,
              mode: 'insensitive',
            },
          },
          ...(digitsOnly.length > 0
            ? [
                {
                  phone: {
                    contains: digitsOnly,
                    mode: 'insensitive',
                  },
                },
              ]
            : [])
        );
      }

      const users = await prisma.user.findMany({
        where: userWhereClause,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
        },
        take: RESULT_LIMIT,
      });

      // Transform user data
      const userResults = users.map(user => ({
        id: `user-${user.id}`,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
        phone: user.phone || '',
        type: 'user' as const,
        role: user.role,
      }));

      allResults.push(...userResults);
    }

    // Count exact and partial matches across both customers and users
    if (hasEmail) {
      const cleanEmail = trimmedEmail;
      const [customerExact, userExact, customerPartial, userPartial] =
        await Promise.all([
          prisma.customer.count({
            where: {
              isActive: true,
              email: {
                equals: cleanEmail,
                mode: 'insensitive',
              },
            },
          }),
          prisma.user.count({
            where: {
              isActive: true,
              email: {
                equals: cleanEmail,
                mode: 'insensitive',
              },
            },
          }),
          prisma.customer.count({
            where: {
              isActive: true,
              email: {
                contains: cleanEmail,
                mode: 'insensitive',
              },
              NOT: {
                email: {
                  equals: cleanEmail,
                  mode: 'insensitive',
                },
              },
            },
          }),
          prisma.user.count({
            where: {
              isActive: true,
              email: {
                contains: cleanEmail,
                mode: 'insensitive',
              },
              NOT: {
                email: {
                  equals: cleanEmail,
                  mode: 'insensitive',
                },
              },
            },
          }),
        ]);

      exactMatches += customerExact + userExact;
      partialMatches += customerPartial + userPartial;
    }

    if (hasPhone) {
      const hasPhoneDigits = phoneDigits.length > 0;
      const [customerExact, userExact, customerPartial, userPartial] =
        await Promise.all([
          prisma.customer.count({
            where: {
              isActive: true,
              phone: {
                in: phonePatterns.length > 0 ? phonePatterns : [trimmedPhone],
              },
            },
          }),
          prisma.user.count({
            where: {
              isActive: true,
              phone: {
                in: phonePatterns.length > 0 ? phonePatterns : [trimmedPhone],
              },
            },
          }),
          hasPhoneDigits
            ? prisma.customer.count({
                where: {
                  isActive: true,
                  phone: {
                    contains: phoneDigits,
                  },
                  NOT: {
                    phone: {
                      in:
                        phonePatterns.length > 0
                          ? phonePatterns
                          : [trimmedPhone],
                    },
                  },
                },
              })
            : Promise.resolve(0),
          hasPhoneDigits
            ? prisma.user.count({
                where: {
                  isActive: true,
                  phone: {
                    contains: phoneDigits,
                  },
                  NOT: {
                    phone: {
                      in:
                        phonePatterns.length > 0
                          ? phonePatterns
                          : [trimmedPhone],
                    },
                  },
                },
              })
            : Promise.resolve(0),
        ]);

      exactMatches += customerExact + userExact;
      partialMatches += customerPartial + userPartial;
    }

    const hasExactMatch = exactMatches > 0;
    const hasPartialMatch = partialMatches > 0;

    // Generate appropriate message
    let message = 'Customer information is unique';
    if (hasExactMatch) {
      message = `Customer with this ${hasEmail ? 'email' : 'phone'} already exists`;
    } else if (hasPartialMatch) {
      message = `Found similar customer information. Please review before proceeding.`;
    }

    return NextResponse.json({
      exists: hasExactMatch,
      hasPartialMatches: hasPartialMatch,
      customers: allResults.slice(0, RESULT_LIMIT),
      message: message,
      exactMatches: exactMatches,
      partialMatches: partialMatches,
    });
  } catch (error) {
    console.error('Error checking customer uniqueness:', error);
    return NextResponse.json(
      { error: 'Failed to check customer uniqueness' },
      { status: 500 }
    );
  }
}
