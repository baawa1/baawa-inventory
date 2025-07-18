const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database status...");

    // Check if there are any users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);

    if (userCount === 0) {
      console.log(
        "⚠️  No users found in database. Creating test admin user..."
      );

      // Create a test admin user
      const hashedPassword = await bcrypt.hash("admin123", 12);

      const testUser = await prisma.user.create({
        data: {
          firstName: "Admin",
          lastName: "User",
          email: "admin@example.com",
          password: hashedPassword,
          role: "ADMIN",
          userStatus: "APPROVED",
          emailVerified: true,
          emailVerifiedAt: new Date(),
          isActive: true,
        },
      });

      console.log("✅ Test admin user created:", {
        id: testUser.id,
        email: testUser.email,
        role: testUser.role,
        status: testUser.userStatus,
      });

      console.log("🔑 Login credentials:");
      console.log("   Email: admin@example.com");
      console.log("   Password: admin123");
    } else {
      // List existing users
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          userStatus: true,
          isActive: true,
        },
      });

      console.log("👥 Existing users:");
      users.forEach((user) => {
        console.log(
          `   ${user.id}: ${user.email} (${user.role}, ${user.userStatus})`
        );
      });
    }

    // Check categories and brands
    const categoryCount = await prisma.category.count();
    const brandCount = await prisma.brand.count();

    console.log(`📁 Categories: ${categoryCount}`);
    console.log(`🏷️  Brands: ${brandCount}`);
  } catch (error) {
    console.error("❌ Error checking database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
