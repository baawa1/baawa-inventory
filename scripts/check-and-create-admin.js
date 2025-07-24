const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function checkAndCreateAdmin() {
  try {
    console.log("🔍 Checking for existing users...");

    // Check if any users exist
    const existingUsers = await prisma.user.findMany({
      take: 1,
    });

    if (existingUsers.length > 0) {
      console.log("✅ Users found in database");
      console.log(`👤 Found ${existingUsers.length} user(s)`);

      // Show admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      if (adminUsers.length > 0) {
        console.log("👑 Admin users found:");
        adminUsers.forEach((user) => {
          console.log(
            `   - ${user.firstName} ${user.lastName} (${user.email})`
          );
        });
      } else {
        console.log("⚠️  No admin users found");
      }

      return existingUsers[0]; // Return first user for use in other scripts
    }

    console.log("❌ No users found. Creating admin user...");

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 12);

    const adminUser = await prisma.user.create({
      data: {
        firstName: "Admin",
        lastName: "User",
        email: "admin@baawa.com",
        password: hashedPassword,
        role: "ADMIN",
        userStatus: "APPROVED",
        emailVerified: true,
        isActive: true,
      },
    });

    console.log("✅ Admin user created successfully!");
    console.log(
      `👤 Admin: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`
    );
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the password after first login!");

    return adminUser;
  } catch (error) {
    console.error("❌ Error checking/creating admin user:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkAndCreateAdmin();
