import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import fs from "fs/promises";
import path from "path";

// Load env file from --env option or default to .env
const envIndex = process.argv.indexOf("--env");
const envFile = envIndex !== -1 && process.argv[envIndex + 1] ? process.argv[envIndex + 1] : ".env";
dotenv.config({ path: envFile });

// Constants
const CONCURRENT_UPLOADS = 20;
const CONCURRENT_THREADS = 10;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;
const DEFAULT_PASSWORD = "import";

// CLI arguments
interface CliArgs {
  exportDir: string;
  boardIds: string[];
  skipExisting: boolean;
  dryRun: boolean;
  noAttachments: boolean;
  threads: number;
}

// Export data types
interface ExportThread {
  id: number;
  title: string | null;
  username: string | null;
  ended: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  top: boolean;
}

interface ExportResponse {
  seq: number;
  username: string;
  userId: string; // chamchijs authorId
  ip: string;
  content: string;
  attachment: string | null; // UUID.ext filename
  visible: boolean;
  deleted: boolean;
  createdAt: string;
}

// Result types
interface ImportResult {
  boardId: string;
  threadsImported: number;
  threadsSkipped: number;
  responsesImported: number;
  attachmentsUploaded: number;
  attachmentsSkipped: number;
  attachmentsFailed: number;
  errors: string[];
}

// Mime type mapping
const MIME_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  pdf: "application/pdf",
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  return MIME_TYPES[ext] || "application/octet-stream";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function processWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
  onComplete: (result: R, item: T, completed: number) => void
): Promise<void> {
  let index = 0;
  let running = 0;
  let completed = 0;
  let resolveAll: () => void;

  const promise = new Promise<void>((resolve) => {
    resolveAll = resolve;
  });

  function runNext() {
    while (running < limit && index < items.length) {
      const currentIndex = index++;
      const item = items[currentIndex];
      running++;

      fn(item).then((result) => {
        running--;
        completed++;
        onComplete(result, item, completed);

        if (index < items.length) {
          runNext();
        } else if (running === 0) {
          resolveAll();
        }
      });
    }

    if (items.length === 0 || (index >= items.length && running === 0)) {
      resolveAll();
    }
  }

  runNext();
  return promise;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = {
    exportDir: "",
    boardIds: [],
    skipExisting: false,
    dryRun: false,
    noAttachments: false,
    threads: CONCURRENT_THREADS,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--skip-existing") {
      result.skipExisting = true;
    } else if (arg === "--dry-run") {
      result.dryRun = true;
    } else if (arg === "--no-attachments") {
      result.noAttachments = true;
    } else if (arg === "--threads" && args[i + 1]) {
      result.threads = parseInt(args[++i], 10) || CONCURRENT_THREADS;
    } else if (arg === "--env") {
      i++; // Skip next arg (env file path)
    } else if (!arg.startsWith("-")) {
      if (!result.exportDir) {
        result.exportDir = arg;
      } else {
        result.boardIds.push(arg);
      }
    }
  }

  return result;
}

function printUsage(): void {
  console.log(`
Usage: npx tsx scripts/import.ts <exportDir> <boardId...> [options]

Arguments:
  exportDir     Path to the chamchijs export directory
  boardId       Board ID(s) to import (space-separated)

Options:
  --env <file>       Environment file to load (default: .env)
  --skip-existing    Skip threads that already exist in the database
  --dry-run          Test run without making changes
  --no-attachments   Skip uploading attachments to Supabase
  --threads <n>      Number of concurrent threads to process (default: ${CONCURRENT_THREADS})

Examples:
  npx tsx scripts/import.ts /path/to/export tuna --dry-run
  npx tsx scripts/import.ts /path/to/export anchor situplay tuna --threads 5
`);
}

async function fileExists(filepath: string): Promise<boolean> {
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

async function uploadWithRetry(
  supabase: SupabaseClient,
  bucket: string,
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<"uploaded" | "exists" | "failed"> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const { error } = await supabase.storage.from(bucket).upload(key, buffer, {
      contentType: mimeType,
      upsert: false,
    });

    if (!error) {
      return "uploaded";
    }

    // Already exists - skip
    if (error.message?.includes("already exists") || error.message?.includes("Duplicate")) {
      return "exists";
    }

    if (attempt < MAX_RETRIES) {
      console.log(
        `\x1b[33m  Retry ${attempt}/${MAX_RETRIES}: ${error.message}\x1b[0m`
      );
      await sleep(RETRY_DELAY);
    } else {
      console.error(`\x1b[31m  Upload failed after ${MAX_RETRIES} attempts: ${error.message}\x1b[0m`);
    }
  }
  return "failed";
}

interface UploadTask {
  localPath: string;
  key: string;
  filename: string;
}

async function uploadAttachments(
  supabase: SupabaseClient,
  bucket: string,
  tasks: UploadTask[],
  dryRun: boolean
): Promise<{ uploaded: number; skipped: number; failed: number; urls: Map<string, string> }> {
  const result = { uploaded: 0, skipped: 0, failed: 0, urls: new Map<string, string>() };

  for (let i = 0; i < tasks.length; i += CONCURRENT_UPLOADS) {
    const batch = tasks.slice(i, i + CONCURRENT_UPLOADS);
    const promises = batch.map(async (task) => {
      if (dryRun) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(task.key);
        result.urls.set(task.filename, data.publicUrl);
        result.uploaded++;
        return;
      }

      try {
        const buffer = await fs.readFile(task.localPath);
        const mimeType = getMimeType(task.filename);
        const status = await uploadWithRetry(
          supabase,
          bucket,
          task.key,
          buffer,
          mimeType
        );

        const { data } = supabase.storage.from(bucket).getPublicUrl(task.key);
        result.urls.set(task.filename, data.publicUrl);

        if (status === "uploaded") {
          result.uploaded++;
        } else if (status === "exists") {
          result.skipped++;
        } else {
          result.failed++;
        }
      } catch (e) {
        console.error(
          `\x1b[31m  Failed to read ${task.localPath}: ${e instanceof Error ? e.message : "Unknown error"}\x1b[0m`
        );
        result.failed++;
      }
    });

    await Promise.all(promises);
  }

  return result;
}

async function importThread(
  prisma: PrismaClient,
  supabase: SupabaseClient | null,
  bucket: string,
  exportDir: string,
  boardId: string,
  threadId: string,
  args: CliArgs
): Promise<{
  imported: boolean;
  skipped: boolean;
  responseCount: number;
  attachmentsUploaded: number;
  attachmentsSkipped: number;
  attachmentsFailed: number;
  error?: string;
}> {
  const threadDir = path.join(exportDir, boardId, threadId);
  const threadPath = path.join(threadDir, "thread.json");
  const responsesPath = path.join(threadDir, "responses.json");

  // Read thread.json
  let threadData: ExportThread;
  try {
    const threadJson = await fs.readFile(threadPath, "utf-8");
    threadData = JSON.parse(threadJson);
  } catch (e) {
    return {
      imported: false,
      skipped: false,
      responseCount: 0,
      attachmentsUploaded: 0,
      attachmentsSkipped: 0,
      attachmentsFailed: 0,
      error: `Failed to read thread.json: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }

  // Read responses.json
  let responsesData: ExportResponse[];
  try {
    const responsesJson = await fs.readFile(responsesPath, "utf-8");
    responsesData = JSON.parse(responsesJson);
  } catch (e) {
    return {
      imported: false,
      skipped: false,
      responseCount: 0,
      attachmentsUploaded: 0,
      attachmentsSkipped: 0,
      attachmentsFailed: 0,
      error: `Failed to read responses.json: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }

  // Check if thread already exists
  if (args.skipExisting) {
    const existing = await prisma.thread.findUnique({
      where: { id: threadData.id },
      select: { id: true },
    });
    if (existing) {
      return {
        imported: false,
        skipped: true,
        responseCount: 0,
        attachmentsUploaded: 0,
        attachmentsSkipped: 0,
        attachmentsFailed: 0,
      };
    }
  }

  // Collect attachment upload tasks
  const uploadTasks: UploadTask[] = [];
  if (!args.noAttachments && supabase) {
    for (const resp of responsesData) {
      if (resp.attachment) {
        const localPath = path.join(threadDir, "attachments", resp.attachment);
        if (await fileExists(localPath)) {
          uploadTasks.push({
            localPath,
            key: `${boardId}/${resp.attachment}`,
            filename: resp.attachment,
          });
        }
      }
    }
  }

  // Upload attachments
  let attachmentUrls = new Map<string, string>();
  let attachmentsUploaded = 0;
  let attachmentsSkipped = 0;
  let attachmentsFailed = 0;

  if (uploadTasks.length > 0 && supabase) {
    const uploadResult = await uploadAttachments(
      supabase,
      bucket,
      uploadTasks,
      args.dryRun
    );
    attachmentUrls = uploadResult.urls;
    attachmentsUploaded = uploadResult.uploaded;
    attachmentsSkipped = uploadResult.skipped;
    attachmentsFailed = uploadResult.failed;
  }

  // Prepare thread data
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // Prepare responses data
  const responses = responsesData.map((resp) => {
    let attachmentUrl: string | null = null;
    if (resp.attachment) {
      attachmentUrl = attachmentUrls.get(resp.attachment) || null;
    }

    return {
      id: uuidv4(),
      seq: resp.seq,
      username: resp.username,
      authorId: resp.userId, // chamchijs userId → authorId
      userId: null as string | null,
      ip: resp.ip,
      content: resp.content,
      attachment: attachmentUrl,
      visible: resp.visible,
      deleted: resp.deleted,
      createdAt: new Date(resp.createdAt),
    };
  });

  if (args.dryRun) {
    console.log(`  [DRY RUN] Would create thread ${threadData.id} with ${responses.length} responses`);
    return {
      imported: true,
      skipped: false,
      responseCount: responses.length,
      attachmentsUploaded,
      attachmentsSkipped,
      attachmentsFailed,
    };
  }

  // Create thread and responses in transaction
  try {
    await prisma.$transaction(
      async (tx) => {
        // Delete existing thread if any (for re-import)
        await tx.response.deleteMany({ where: { threadId: threadData.id } });
        await tx.thread.deleteMany({ where: { id: threadData.id } });

        // Create thread with specific ID
        await tx.thread.create({
          data: {
            id: threadData.id,
            boardId,
            title: threadData.title || "",
            username: threadData.username || "",
            password: hashedPassword,
            userId: null,
            ended: threadData.ended,
            deleted: threadData.deleted,
            published: true,
            top: threadData.top,
            responseCount: responses.length,
            createdAt: new Date(threadData.createdAt),
            updatedAt: new Date(threadData.updatedAt),
          },
        });

        // Create responses
        if (responses.length > 0) {
          await tx.response.createMany({
            data: responses.map((r) => ({
              ...r,
              threadId: threadData.id,
              boardId,
            })),
          });
        }
      },
      { timeout: 30000 }
    );

    return {
      imported: true,
      skipped: false,
      responseCount: responses.length,
      attachmentsUploaded,
      attachmentsSkipped,
      attachmentsFailed,
    };
  } catch (e) {
    return {
      imported: false,
      skipped: false,
      responseCount: 0,
      attachmentsUploaded: 0,
      attachmentsSkipped: 0,
      attachmentsFailed: 0,
      error: `Transaction failed: ${e instanceof Error ? e.message : "Unknown error"}`,
    };
  }
}

async function importBoard(
  prisma: PrismaClient,
  supabase: SupabaseClient | null,
  bucket: string,
  exportDir: string,
  boardId: string,
  args: CliArgs
): Promise<ImportResult> {
  const result: ImportResult = {
    boardId,
    threadsImported: 0,
    threadsSkipped: 0,
    responsesImported: 0,
    attachmentsUploaded: 0,
    attachmentsSkipped: 0,
    attachmentsFailed: 0,
    errors: [],
  };

  // Check if board exists
  const board = await prisma.board.findUnique({
    where: { id: boardId },
    select: { id: true, name: true },
  });

  if (!board) {
    result.errors.push(`Board "${boardId}" not found in database`);
    return result;
  }

  console.log(`\n=== Importing board: ${boardId} (${board.name}) ===`);

  // Get thread directories
  const boardDir = path.join(exportDir, boardId);
  if (!(await fileExists(boardDir))) {
    result.errors.push(`Export directory not found: ${boardDir}`);
    return result;
  }

  const entries = await fs.readdir(boardDir, { withFileTypes: true });
  const threadDirs = entries
    .filter((e) => e.isDirectory() && /^\d+$/.test(e.name))
    .map((e) => e.name)
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`Found ${threadDirs.length} threads to import`);

  if (threadDirs.length === 0) {
    return result;
  }

  // Process threads concurrently
  await processWithConcurrency(
    threadDirs,
    args.threads,
    (threadId) => importThread(prisma, supabase, bucket, exportDir, boardId, threadId, args),
    (threadResult, threadId, processed) => {
      if (threadResult.error) {
        result.errors.push(`Thread ${threadId}: ${threadResult.error}`);
        console.error(`\x1b[31m[${processed}/${threadDirs.length}] Thread ${threadId}: ${threadResult.error}\x1b[0m`);
      } else if (threadResult.skipped) {
        result.threadsSkipped++;
      } else if (threadResult.imported) {
        result.threadsImported++;
        result.responsesImported += threadResult.responseCount;
        result.attachmentsUploaded += threadResult.attachmentsUploaded;
        result.attachmentsSkipped += threadResult.attachmentsSkipped;
        result.attachmentsFailed += threadResult.attachmentsFailed;

        let logLine = `[${processed}/${threadDirs.length}] Thread ${threadId}: ${threadResult.responseCount} responses`;
        if (threadResult.attachmentsUploaded > 0 || threadResult.attachmentsSkipped > 0 || threadResult.attachmentsFailed > 0) {
          logLine += ` (attachments: ${threadResult.attachmentsUploaded} uploaded, ${threadResult.attachmentsSkipped} skipped, ${threadResult.attachmentsFailed} failed)`;
        }
        console.log(logLine);
      }
    }
  );

  // Update board thread count
  if (!args.dryRun && result.threadsImported > 0) {
    const threadCount = await prisma.thread.count({
      where: {
        boardId,
        published: true,
        deleted: false,
      },
    });

    await prisma.board.update({
      where: { id: boardId },
      data: { threadCount },
    });

    console.log(`Updated board threadCount: ${threadCount}`);

    // Update Thread ID sequence to max value
    await prisma.$executeRawUnsafe(
      `SELECT setval('"Thread_id_seq"', (SELECT COALESCE(MAX(id), 1) FROM "Thread"))`
    );
    console.log(`Updated Thread ID sequence`);
  }

  return result;
}

async function main(): Promise<void> {
  const startTime = Date.now();
  const args = parseArgs();

  if (!args.exportDir || args.boardIds.length === 0) {
    printUsage();
    process.exit(1);
  }

  console.log("=== OpenChamchiJS Data Import ===");
  console.log(`Env file: ${envFile}`);
  console.log(`Export directory: ${args.exportDir}`);
  console.log(`Boards: ${args.boardIds.join(", ")}`);
  if (args.skipExisting) console.log("Option: --skip-existing");
  if (args.dryRun) console.log("Option: --dry-run");
  if (args.noAttachments) console.log("Option: --no-attachments");
  console.log(`Concurrent threads: ${args.threads}`);

  // Initialize Prisma (use DIRECT_URL for full permissions if available)
  const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  // Initialize Supabase (optional)
  let supabase: SupabaseClient | null = null;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";

  if (!args.noAttachments) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseKey) {
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log(`Supabase storage: ${bucket}`);
    } else {
      console.log("\x1b[33mWarning: Supabase not configured, attachments will be skipped\x1b[0m");
    }
  }

  // Process each board
  const results: ImportResult[] = [];
  for (const boardId of args.boardIds) {
    const result = await importBoard(
      prisma,
      supabase,
      bucket,
      args.exportDir,
      boardId,
      args
    );
    results.push(result);
  }

  // Print summary
  console.log("\n=== Import Summary ===");
  let totalThreads = 0;
  let totalSkipped = 0;
  let totalResponses = 0;
  let totalAttachmentsUploaded = 0;
  let totalAttachmentsSkipped = 0;
  let totalAttachmentsFailed = 0;
  let totalErrors = 0;

  for (const result of results) {
    console.log(`\nBoard: ${result.boardId}`);
    console.log(`  Threads imported: ${result.threadsImported}`);
    console.log(`  Threads skipped: ${result.threadsSkipped}`);
    console.log(`  Responses imported: ${result.responsesImported}`);
    console.log(`  Attachments uploaded: ${result.attachmentsUploaded}`);
    console.log(`  Attachments skipped: ${result.attachmentsSkipped}`);
    console.log(`  Attachments failed: ${result.attachmentsFailed}`);
    if (result.errors.length > 0) {
      console.log(`  Errors: ${result.errors.length}`);
    }

    totalThreads += result.threadsImported;
    totalSkipped += result.threadsSkipped;
    totalResponses += result.responsesImported;
    totalAttachmentsUploaded += result.attachmentsUploaded;
    totalAttachmentsSkipped += result.attachmentsSkipped;
    totalAttachmentsFailed += result.attachmentsFailed;
    totalErrors += result.errors.length;
  }

  console.log(`\nTotal:`);
  console.log(`  Threads imported: ${totalThreads}`);
  console.log(`  Threads skipped: ${totalSkipped}`);
  console.log(`  Responses imported: ${totalResponses}`);
  console.log(`  Attachments uploaded: ${totalAttachmentsUploaded}`);
  console.log(`  Attachments skipped: ${totalAttachmentsSkipped}`);
  console.log(`  Attachments failed: ${totalAttachmentsFailed}`);
  console.log(`  Errors: ${totalErrors}`);

  const elapsed = Date.now() - startTime;
  const seconds = Math.floor(elapsed / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  console.log(`\nTime: ${minutes}m ${remainingSeconds}s (${elapsed}ms)`);

  await prisma.$disconnect();

  if (totalErrors > 0) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
