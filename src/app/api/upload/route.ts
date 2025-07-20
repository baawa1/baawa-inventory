import { auth } from "../../../../auth";
import { NextRequest, NextResponse } from "next/server";
import { withPermission, AuthenticatedRequest } from "@/lib/api-middleware";
import { USER_ROLES } from "@/lib/auth/roles";
import { supabaseStorageServer } from "@/lib/upload/supabase-storage";
import { logger } from "@/lib/logger";
import { createSecureResponse } from "@/lib/security-headers";
import { withRateLimit, RATE_LIMIT_CONFIGS } from "@/lib/rate-limiting";
import { IMAGE_CONSTANTS } from "@/types/product-images";
import { isAllowedFileType, isFileSizeValid } from "@/lib/utils/image-utils";

export const POST = withRateLimit(RATE_LIMIT_CONFIGS.UPLOAD)(async (
  request: NextRequest
) => {
  let session;
  try {
    session = await auth();
    if (!session?.user) {
      return createSecureResponse({ error: "Unauthorized" }, 401);
    }

    // Check permissions - only ADMIN and MANAGER can upload
    if (!["ADMIN", "MANAGER"].includes(session.user.role)) {
      return createSecureResponse({ error: "Insufficient permissions" }, 403);
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "products";
    const quality =
      parseInt(formData.get("quality") as string) ||
      IMAGE_CONSTANTS.DEFAULT_QUALITY;

    if (!file) {
      return createSecureResponse({ error: "No file provided" }, 400);
    }

    // Validate file type
    if (!isAllowedFileType(file.type)) {
      return createSecureResponse(
        {
          error: `File type ${file.type} is not allowed. Allowed types: ${IMAGE_CONSTANTS.ALLOWED_TYPES.join(", ")}`,
        },
        400
      );
    }

    // Validate file size
    if (!isFileSizeValid(file.size)) {
      return createSecureResponse(
        {
          error: `File size ${file.size} exceeds maximum allowed size ${IMAGE_CONSTANTS.MAX_FILE_SIZE}`,
        },
        400
      );
    }

    // Ensure bucket exists
    await supabaseStorageServer.ensureBucketExists();

    // Upload file to Supabase Storage
    const uploadResult = await supabaseStorageServer.uploadFile(file, {
      folder,
      quality,
      allowedTypes: [...IMAGE_CONSTANTS.ALLOWED_TYPES],
      maxSize: IMAGE_CONSTANTS.MAX_FILE_SIZE,
    });

    logger.upload("File uploaded successfully", {
      filename: uploadResult.filename,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      folder,
      userId: session.user.id,
    });

    return createSecureResponse({
      url: uploadResult.url,
      filename: uploadResult.filename,
      size: uploadResult.size,
      mimeType: uploadResult.mimeType,
      storagePath: uploadResult.storagePath,
      publicId: uploadResult.publicId,
      message: "File uploaded successfully",
    });
  } catch (error) {
    logger.error("Upload error", {
      error: error instanceof Error ? error.message : "Unknown error",
      userId: session?.user?.id || "unknown",
    });
    return createSecureResponse(
      {
        error: error instanceof Error ? error.message : "Failed to upload file",
      },
      500
    );
  }
});

export const DELETE = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async (request: AuthenticatedRequest) => {
    try {

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
);
