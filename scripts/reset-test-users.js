#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const TEST_USERS = [
  {
    email: 'baawapays+test-unverified@gmail.com',
    firstName: 'Unverified',
    lastName: 'User',
    password: 'SecurePassword123!',
    role: 'STAFF',
    userStatus: 'PENDING',
    emailVerified: false,
    isActive: true,
  },
  {
    email: 'baawapays+test-verified-unapproved@gmail.com',
    firstName: 'Verified',
    lastName: 'Unapproved',
    password: 'SecurePassword123!',
    role: 'STAFF',
    userStatus: 'VERIFIED',
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'baawapays+test-admin@gmail.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'SecurePassword123!',
    role: 'ADMIN',
    userStatus: 'APPROVED',
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'baawapays+test-manager@gmail.com',
    firstName: 'Manager',
    lastName: 'User',
    password: 'SecurePassword123!',
    role: 'MANAGER',
    userStatus: 'APPROVED',
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'baawapays+test-staff@gmail.com',
    firstName: 'Staff',
    lastName: 'User',
    password: 'SecurePassword123!',
    role: 'STAFF',
    userStatus: 'APPROVED',
    emailVerified: true,
    isActive: true,
  },
  {
    email: 'baawapays+test-rejected@gmail.com',
    firstName: 'Rejected',
    lastName: 'User',
    password: 'SecurePassword123!',
    role: 'STAFF',
    userStatus: 'REJECTED',
    emailVerified: true,
    isActive: false,
  },
  {
    email: 'baawapays+test-suspended@gmail.com',
    firstName: 'Suspended',
    lastName: 'User',
    password: 'SecurePassword123!',
    role: 'STAFF',
    userStatus: 'SUSPENDED',
    emailVerified: true,
    isActive: false,
  },
];

const getUserData = async user => {
  const hashedPassword = await bcrypt.hash(user.password, 10);

  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    password: hashedPassword,
    role: user.role,
    userStatus: user.userStatus,
    emailVerified: user.emailVerified,
    emailVerifiedAt: user.emailVerified ? new Date() : null,
    approvedAt: user.userStatus === 'APPROVED' ? new Date() : null,
    isActive: user.isActive,
    permissions: [],
  };
};

const resetUsers = async () => {
  for (const user of TEST_USERS) {
    const data = await getUserData(user);

    await prisma.user.upsert({
      where: { email: user.email },
      update: data,
      create: data,
    });
  }
};

const cleanupUsers = async () => {
  await prisma.user.deleteMany({
    where: { email: { in: TEST_USERS.map(user => user.email) } },
  });
};

const main = async () => {
  const action = process.argv[2];

  if (!action || !['reset', 'cleanup'].includes(action)) {
    console.error('Usage: node scripts/reset-test-users.js <reset|cleanup>');
    process.exit(1);
  }

  try {
    if (action === 'reset') {
      console.log('🔄 Resetting test users...');
      await resetUsers();
      console.log('✅ Test users reset successfully');
    } else {
      console.log('🧹 Cleaning up test users...');
      await cleanupUsers();
      console.log('✅ Test users cleaned up successfully');
    }
  } catch (error) {
    console.error('❌ Failed to manage test users:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

main();
