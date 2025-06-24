import { seedTestUsers } from "../utils/seed-users";

async function main() {
  try {
    console.log("Seeding test users...");
    await seedTestUsers();
    console.log("Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding users:", error);
    process.exit(1);
  }
}

main();
