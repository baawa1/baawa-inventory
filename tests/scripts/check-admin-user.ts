import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

async function checkAdminUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("email", "admin@baawa.com")
    .single();

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log("Admin user:", {
    id: data.id,
    email: data.email,
    hasPassword: !!data.password_hash,
  });
}

checkAdminUser();
