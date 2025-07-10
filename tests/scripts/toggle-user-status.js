const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://test.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "your_supabase_service_role_key_here"
);

async function toggleUserStatus() {
  const testEmail = "baawapay+verified-test@gmail.com";

  try {
    // Get current status
    const { data: user } = await supabase
      .from("users")
      .select("user_status, first_name, last_name")
      .eq("email", testEmail)
      .single();

    console.log(`Current user: ${user.first_name} ${user.last_name}`);
    console.log(`Current status: ${user.user_status}`);

    // Toggle between VERIFIED and APPROVED
    const newStatus = user.user_status === "VERIFIED" ? "APPROVED" : "VERIFIED";

    const { error } = await supabase
      .from("users")
      .update({ user_status: newStatus })
      .eq("email", testEmail);

    if (error) {
      console.error("❌ Error:", error);
    } else {
      console.log(`✅ Updated status to: ${newStatus}`);
      console.log("");
      console.log("Login behavior:");
      if (newStatus === "VERIFIED") {
        console.log("📍 User can login → redirected to /pending-approval");
        console.log('📝 User will see: "Account Pending Approval" page');
      } else {
        console.log("📍 User can login → access dashboard");
        console.log("📝 User will see: Main dashboard interface");
      }
      console.log("");
      console.log("🧪 Test by logging in at: http://localhost:3000/login");
      console.log(`📧 Email: ${testEmail}`);
      console.log("🔑 Password: password123");
    }
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

toggleUserStatus();
