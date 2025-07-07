/**
 * Instructions for testing the POS access fix
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createTestInstructions() {
  console.log("🎯 POS Access Test Instructions\n");

  try {
    // Check if admin user exists and get/set password
    let adminUser = await prisma.user.findUnique({
      where: { email: "admin@baawa.com" },
    });

    if (!adminUser) {
      console.log("❌ Admin user not found. Creating admin user...");

      const hashedPassword = await bcrypt.hash("password123", 10);

      adminUser = await prisma.user.create({
        data: {
          firstName: "Admin",
          lastName: "User",
          email: "admin@baawa.com",
          password: hashedPassword,
          role: "ADMIN",
          userStatus: "APPROVED",
          isActive: true,
          emailVerified: true,
        },
      });

      console.log("✅ Admin user created successfully");
    }

    // Ensure admin user has correct password
    const testPassword = "password123";
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await prisma.user.update({
      where: { email: "admin@baawa.com" },
      data: { password: hashedPassword },
    });

    console.log("📋 Test Steps:");
    console.log("1. Go to http://localhost:3000/login");
    console.log("2. Login with:");
    console.log("   Email: admin@baawa.com");
    console.log("   Password: password123");
    console.log("3. After login, go to http://localhost:3000/pos");
    console.log("4. You should see the POS interface (not a redirect)");

    console.log("\n✅ Expected Result:");
    console.log("   - Login should be successful");
    console.log("   - POS page should load without redirecting");
    console.log("   - You should see the Point of Sale interface");

    console.log("\n🔍 If still redirecting, check:");
    console.log("   - Browser developer tools Network tab");
    console.log(
      "   - Check session with: curl -b cookies.txt http://localhost:3000/api/debug/session"
    );
    console.log("   - Look for console errors in browser");

    console.log("\n📊 Available test users:");

    const testUsers = await prisma.user.findMany({
      where: {
        userStatus: "APPROVED",
        isActive: true,
        role: { in: ["ADMIN", "MANAGER", "STAFF"] },
      },
      select: {
        email: true,
        role: true,
        userStatus: true,
        emailVerified: true,
      },
      take: 5,
    });

    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.role})`);
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestInstructions();
