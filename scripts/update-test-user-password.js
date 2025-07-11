const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const prisma = new PrismaClient();

async function updateTestUserPassword() {
  try {
    console.log("🔐 Updating test user password to meet new requirements...\n");

    const email = "baawapay+test5@gmail.com";
    const newPassword = "SecurePassword123!"; // Meets new 12-char requirement with uppercase, lowercase, numbers, and special chars
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: { email: email },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!existingUser) {
      console.log(`❌ Test user not found: ${email}`);
      console.log("💡 Run 'node scripts/create-test-user-simple.js' first");
      return;
    }

    // Update the user's password
    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Test user password updated successfully!");
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 New Password: ${newPassword}`);
    console.log(
      `   👤 Name: ${existingUser.firstName} ${existingUser.lastName}`
    );
    console.log(`   📞 ID: ${existingUser.id}`);

    console.log("\n🎉 You can now log in with the updated credentials!");
    console.log(`\n🔗 Go to: http://localhost:3000/login`);

    console.log("\n📋 Password Requirements Met:");
    console.log("   ✅ 12+ characters");
    console.log("   ✅ Uppercase letter (S, P)");
    console.log("   ✅ Lowercase letters (ecure, assword)");
    console.log("   ✅ Number (1, 2, 3)");
    console.log("   ✅ Special character (!)");
  } catch (error) {
    console.error("❌ Error updating test user password:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateTestUserPassword();
