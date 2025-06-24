import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function checkColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  console.log("Testing each column individually...");

  const testColumns = [
    "id, first_name, last_name, email, role",
    "is_active",
    "user_status",
    "email_verified",
    "created_at",
    "last_login",
    "approved_by",
    "approved_at",
    "rejection_reason",
  ];

  for (const column of testColumns) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select(column)
        .limit(1);

      if (error) {
        console.log(`❌ Column '${column}' failed:`, error.message);
      } else {
        console.log(`✅ Column '${column}' works`);
      }
    } catch (err) {
      console.log(`❌ Column '${column}' failed:`, (err as any).message);
    }
  }

  // Test the full query
  console.log("\nTesting full query...");
  try {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, first_name, last_name, email, role, is_active, user_status, email_verified, created_at, last_login, approved_by, approved_at, rejection_reason"
      )
      .limit(1);

    if (error) {
      console.log("❌ Full query failed:", error.message);
    } else {
      console.log("✅ Full query works:", data?.length, "results");
    }
  } catch (err) {
    console.log("❌ Full query failed:", (err as any).message);
  }
}

checkColumns();
