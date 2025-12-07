import { NextRequest, NextResponse } from "next/server";
import { getStorage, StorageError } from "@/lib/storage";
import { boardService } from "@/lib/services/board";

interface RouteParams {
  params: Promise<{ boardId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { boardId } = await params;

    const board = await boardService.findById(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const allowedMimeTypes = board.uploadMimeTypes
      .split(",")
      .map((t) => t.trim());

    const storage = getStorage();
    const result = await storage.upload(buffer, file.name, file.type, {
      maxSizeBytes: board.uploadMaxSize,
      allowedMimeTypes,
      folder: `boards/${boardId}`,
    });

    return NextResponse.json({
      url: result.url,
      key: result.key,
      size: result.size,
      mimeType: result.mimeType,
    });
  } catch (error) {
    if (error instanceof StorageError) {
      const statusMap: Record<string, number> = {
        FILE_TOO_LARGE: 413,
        INVALID_MIME_TYPE: 415,
        NOT_CONFIGURED: 503,
        UPLOAD_FAILED: 500,
      };
      return NextResponse.json(
        { error: error.message },
        { status: statusMap[error.code] || 500 }
      );
    }
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { boardId } = await params;

    const board = await boardService.findById(boardId);
    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    // Verify the key belongs to this board
    if (!key.startsWith(`boards/${boardId}/`)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const storage = getStorage();
    await storage.delete(key);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof StorageError) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
