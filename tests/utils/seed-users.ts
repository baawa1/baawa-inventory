import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function seedTestUsers() {
  const testUsers = [
    {
      email: "admin@baawa.com",
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      isActive: true,
      passwordHash: await bcrypt.hash("admin123", 10),
    },
    {
      email: "manager@baawa.com",
      firstName: "Manager",
      lastName: "User",
      role: "MANAGER",
      isActive: true,
      passwordHash: await bcrypt.hash("manager123", 10),
    },
    {
      email: "employee@baawa.com",
      firstName: "Employee",
      lastName: "User",
      role: "EMPLOYEE",
      isActive: true,
      passwordHash: await bcrypt.hash("employee123", 10),
    },
  ];

  try {
    const { data, error } = await supabaseAdmin
      .from("users")
      .upsert(testUsers, { onConflict: "email" });

    if (error) {
      console.error("Error seeding test users:", error);
      throw error;
    }

    console.log("Test users seeded successfully:", data);
    return data;
  } catch (error) {
    console.error("Failed to seed test users:", error);
    throw error;
  }
}

export async function cleanupTestUsers() {
  try {
    const { error } = await supabaseAdmin
      .from("users")
      .delete()
      .in("email", [
        "admin@baawa.com",
        "manager@baawa.com",
        "employee@baawa.com",
      ]);

    if (error) {
      console.error("Error cleaning up test users:", error);
      throw error;
    }

    console.log("Test users cleaned up successfully");
  } catch (error) {
    console.error("Failed to cleanup test users:", error);
    throw error;
  }
}
