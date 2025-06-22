import { supabase } from "./supabase";

/**
 * Test Supabase connection
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const { data, error } = await supabase
      .from("_test_connection")
      .select("*")
      .limit(1);

    if (error && error.code !== "PGRST116") {
      // PGRST116 = relation does not exist (expected)
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
      };
    }

    return {
      success: true,
      message: "Supabase connection successful",
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
    };
  }
}

/**
 * Check if Supabase environment variables are configured
 */
export function validateSupabaseConfig(): {
  valid: boolean;
  missing: string[];
} {
  const required = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  ];

  const missing = required.filter((key) => !process.env[key]);

  return {
    valid: missing.length === 0,
    missing,
  };
}
