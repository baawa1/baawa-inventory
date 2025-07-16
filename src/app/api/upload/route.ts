import { auth } from "../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { supabaseStorageServer } from "@/lib/upload/supabase-storage";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only ADMIN and MANAGER can upload
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";
    const quality = parseInt(formData.get("quality") as string) || 85;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Ensure bucket exists
    await supabaseStorageServer.ensureBucketExists();

    // Upload file to Supabase Storage
    const uploadResult = await supabaseStorageServer.uploadFile(file, {
      folder,
      quality,
      allowedTypes: ["image/jpeg", "image/png", "image/webp"],
      maxSize: 5 * 1024 * 1024, // 5MB
    });

    return NextResponse.json({
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      storagePath: uploadResult.storagePath,
      publicId: uploadResult.publicId,
      message: "File uploaded successfully",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storagePath = searchParams.get("publicId");

    if (!storagePath) {
      return NextResponse.json(
        { error: "Storage path is required" },
        { status: 400 }
      );
    }

    // Delete from Supabase Storage
    await supabaseStorageServer.deleteFile(storagePath);

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete file",
      },
      { status: 500 }
    );
  }
}
