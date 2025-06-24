import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: ".env.local" });

async function checkDatabase() {
  try {
    console.log("Checking database connection...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Missing Supabase environment variables");
      console.log("URL:", supabaseUrl ? "Set" : "Missing");
      console.log("Key:", supabaseAnonKey ? "Set" : "Missing");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: users, error } = await supabase
      .from("users")
      .select("id, email, role, user_status, email_verified")
      .limit(5);

    if (error) {
      console.error("Database error:", error);
      return;
    }

    console.log("Users in database:", users);
    console.log("Total users found:", users?.length || 0);

    // Check for admin users
    const adminUsers = users?.filter((user) => user.role === "ADMIN");
    console.log("Admin users:", adminUsers?.length || 0);
  } catch (error) {
    console.error("Error:", error);
  }
}

checkDatabase();
