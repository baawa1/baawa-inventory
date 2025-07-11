const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("👨‍💻 Creating test user...\n");

    const email = "baawapay+test5@gmail.com";
    const password = "Test123!"; // Test password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email },
    });

    if (existingUser) {
      console.log(`✅ User already exists: ${email}`);
      return;
    }

    // Create test user
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        role: "MANAGER", // Or "ADMIN" if you want admin access
        userStatus: "APPROVED",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        approvedAt: new Date(),
        approvedBy: 1, // Self-approved for test
      },
    });

    console.log("✅ Test user created successfully!");
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Password: ${password}`);
    console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
    console.log(`   🎭 Role: ${user.role}`);
    console.log(`   ✅ Status: ${user.userStatus}`);
    console.log(`   📞 ID: ${user.id}`);

    console.log("\n🎉 You can now log in with these credentials!");
  } catch (error) {
    console.error("❌ Error creating test user:", error.message);

    if (error.message.includes("approvedBy")) {
      console.log("\n💡 Trying without approvedBy reference...");

      try {
        const user = await prisma.user.create({
          data: {
            email: "baawapay+test5@gmail.com",
            password: await bcrypt.hash("Test123!", 12),
            firstName: "Test",
            lastName: "User",
            role: "MANAGER",
            userStatus: "APPROVED",
            emailVerified: true,
            emailVerifiedAt: new Date(),
            isActive: true,
            approvedAt: new Date(),
            // Remove approvedBy to avoid foreign key issues
          },
        });

        console.log("✅ Test user created (alternative method)!");
        console.log(`   📧 Email: baawapay+test5@gmail.com`);
        console.log(`   🔑 Password: Test123!`);
        console.log(`   👤 Name: ${user.firstName} ${user.lastName}`);
        console.log(`   🎭 Role: ${user.role}`);
      } catch (altError) {
        console.error("❌ Alternative method failed:", altError.message);
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
