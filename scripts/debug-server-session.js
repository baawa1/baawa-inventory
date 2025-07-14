const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugServerSession() {
  try {
    console.log("🔍 Debugging Server-Side Session...\n");

    // Get admin user from database
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        userStatus: true,
        emailVerified: true,
        isActive: true,
      },
    });

    if (!adminUser) {
      console.log("❌ No admin user found!");
      return;
    }

    console.log("📊 Database User Data:");
    console.log(`  ID: ${adminUser.id}`);
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log(`  Status: ${adminUser.userStatus}`);
    console.log(`  Email Verified: ${adminUser.emailVerified}`);
    console.log(`  Is Active: ${adminUser.isActive}`);

    // Simulate what the JWT callback should return
    console.log("\n🔄 What JWT Callback Should Return:");
    const expectedToken = {
      sub: adminUser.id.toString(),
      email: adminUser.email,
      role: adminUser.role,
      status: adminUser.userStatus || "PENDING",
      isEmailVerified: Boolean(adminUser.emailVerified),
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    };
    console.log("Expected Token:", JSON.stringify(expectedToken, null, 2));

    // Simulate what the session callback should return
    console.log("\n🔄 What Session Callback Should Return:");
    const expectedSession = {
      user: {
        id: expectedToken.sub,
        email: expectedToken.email,
        name: `${expectedToken.firstName} ${expectedToken.lastName}`,
        role: expectedToken.role,
        status: expectedToken.status,
        isEmailVerified: expectedToken.isEmailVerified,
        firstName: expectedToken.firstName,
        lastName: expectedToken.lastName,
      },
    };
    console.log("Expected Session:", JSON.stringify(expectedSession, null, 2));

    console.log("\n🔍 Potential Issues:");
    console.log(
      "1. JWT token might be stale and not reflecting database changes"
    );
    console.log("2. Server-side auth() might be using cached session data");
    console.log(
      "3. JWT callback might not be fetching fresh data on server-side"
    );
    console.log("4. Session might need to be invalidated/refreshed");

    console.log("\n💡 Solutions to Try:");
    console.log("1. Log out and log back in to get a fresh JWT token");
    console.log("2. Clear browser cookies and cache");
    console.log("3. Check if JWT callback is working on server-side");
    console.log("4. Force a session refresh on the client side");
  } catch (error) {
    console.error("Error debugging server session:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugServerSession();
