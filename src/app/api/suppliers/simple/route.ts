import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canViewLowStock } from "@/lib/roles";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has required permissions
    if (!canViewLowStock(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: suppliers, error } = await supabase
      .from("suppliers")
      .select("id, name")
      .eq("is_archived", false)
      .order("name");

    if (error) {
      console.error("Error fetching suppliers:", error);
      return NextResponse.json(
        { error: "Failed to fetch suppliers" },
        { status: 500 }
      );
    }

    return NextResponse.json(suppliers || []);
  } catch (error) {
    console.error("Error in suppliers API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
