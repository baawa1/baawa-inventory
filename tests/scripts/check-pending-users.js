#!/usr/bin/env node

/**
 * Check pending users in the database
 * This script helps debug the user approval workflow
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPendingUsers() {
  try {
    console.log("🔍 Checking users in database...\n");

    // Get all users
    const { data: allUsers, error: allError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (allError) {
      console.error("Error fetching all users:", allError);
      return;
    }

    console.log(`📊 Total users: ${allUsers.length}\n`);

    // Group users by status
    const usersByStatus = allUsers.reduce((acc, user) => {
      const status = user.user_status || "UNKNOWN";
      if (!acc[status]) acc[status] = [];
      acc[status].push(user);
      return acc;
    }, {});

    console.log("👥 Users by status:");
    Object.entries(usersByStatus).forEach(([status, users]) => {
      console.log(`  ${status}: ${users.length} users`);
      users.forEach((user) => {
        console.log(
          `    - ${user.first_name} ${user.last_name} (${user.email}) - Role: ${user.role}`
        );
        console.log(
          `      Email Verified: ${user.email_verified}, Active: ${user.is_active}`
        );
        console.log(
          `      Created: ${new Date(user.created_at).toLocaleDateString()}`
        );
        if (user.approved_at) {
          console.log(
            `      Approved: ${new Date(user.approved_at).toLocaleDateString()}`
          );
        }
        console.log("");
      });
    });

    // Check for pending/verified users specifically
    const needsAction = allUsers.filter(
      (user) =>
        user.user_status === "PENDING" || user.user_status === "VERIFIED"
    );

    if (needsAction.length > 0) {
      console.log(`🔔 ${needsAction.length} users need admin action:`);
      needsAction.forEach((user) => {
        console.log(`  - ${user.first_name} ${user.last_name} (${user.email})`);
        console.log(
          `    Status: ${user.user_status}, Email Verified: ${user.email_verified}`
        );
      });
    } else {
      console.log("✅ No users currently need admin action");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

checkPendingUsers();
