const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log("👨‍💻 Creating test user...\n");

    const email = "baawapay+test5@gmail.com";
    const password = "Test123!";
    const hashedPassword = await bcrypt.hash(password, 12);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email },
    });

    if (existingUser) {
      console.log(`✅ User already exists: ${email}`);
      console.log(`🔑 Try logging in with password: ${password}`);
      return;
    }

    // Create test user (simplified - no foreign key references)
    const user = await prisma.user.create({
      data: {
        email: email,
        password: hashedPassword,
        firstName: "Test",
        lastName: "User",
        role: "MANAGER",
        userStatus: "APPROVED",
        emailVerified: true,
        emailVerifiedAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Removed approvedBy and approvedAt to avoid foreign key issues
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
    console.log(`\n🔗 Go to: http://localhost:3000/login`);
  } catch (error) {
    console.error("❌ Error creating test user:", error.message);
    console.log(
      "\n📝 Database schema might need adjustment. Let's check what fields are required..."
    );
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
