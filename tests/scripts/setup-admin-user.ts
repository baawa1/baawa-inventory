import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

async function setupAdminUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Check current admin user
  const { data: adminUser, error } = await supabase
    .from("users")
    .select("id, email, password_hash, role, user_status")
    .eq("email", "admin@baawa.com")
    .single();

  if (error) {
    console.error("Error fetching admin user:", error);
    return;
  }

  console.log("Current admin user:", {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    status: adminUser.user_status,
    hasPassword: !!adminUser.password_hash,
  });

  // If no password, set a default one
  if (!adminUser.password_hash) {
    console.log("Setting password for admin user...");
    const defaultPassword = "admin123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash: hashedPassword })
      .eq("id", adminUser.id);

    if (updateError) {
      console.error("Error setting password:", updateError);
    } else {
      console.log(
        `✅ Password set for admin user. Default password: ${defaultPassword}`
      );
    }
  } else {
    console.log("✅ Admin user already has a password");
  }
}

setupAdminUser();
