import { z } from "zod";

// Utility functions for input sanitization
export function removeControlCharacters(input: string): string {
  return input.replace(/[\u202E\u202D\u202C\u200E\u200F\u200B\u200C\u200D]/g, "");
}

// Custom Zod transformers
const sanitizedString = z.string().transform(removeControlCharacters);

const trimmedString = z.string().transform((s) => s.trim());

const sanitizedTrimmedString = z
  .string()
  .transform((s) => removeControlCharacters(s).trim());

// Board ID: alphanumeric and hyphens only
const boardIdSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-zA-Z0-9-]+$/, "Board ID must contain only letters, numbers, and hyphens")
  .transform(removeControlCharacters);

// Username: max 60 chars, trim whitespace, remove control chars
const usernameSchema = z
  .string()
  .max(60)
  .transform((s) => removeControlCharacters(s).trim())
  .optional();

// Content: max 20000 chars, remove control chars
const contentSchema = z
  .string()
  .min(1)
  .max(20000)
  .transform(removeControlCharacters);

// Attachment: URL format validation
const attachmentSchema = z
  .string()
  .url("Invalid attachment URL")
  .transform(removeControlCharacters)
  .optional();

// Board schemas
export const createBoardSchema = z.object({
  id: boardIdSchema,
  name: sanitizedTrimmedString.pipe(z.string().min(1).max(100)),
  defaultUsername: sanitizedTrimmedString.pipe(z.string().min(1).max(60)).default("noname"),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
});

export const updateBoardSchema = z.object({
  name: sanitizedTrimmedString.pipe(z.string().min(1).max(100)).optional(),
  defaultUsername: sanitizedTrimmedString.pipe(z.string().min(1).max(60)).optional(),
  deleted: z.boolean().optional(),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
  uploadMaxSize: z.number().int().positive().optional(),
  uploadMimeTypes: trimmedString.pipe(z.string().max(500)).optional(),
});

export const configBoardSchema = z.object({
  defaultUsername: sanitizedTrimmedString.pipe(z.string().min(1).max(60)).optional(),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
});

// Thread schemas
export const createThreadSchema = z.object({
  title: sanitizedTrimmedString.pipe(z.string().min(1).max(50)),
  password: z.string().min(1).max(256),
  username: usernameSchema,
});

export const updateThreadSchema = z.object({
  title: sanitizedTrimmedString.pipe(z.string().min(1).max(50)).optional(),
  ended: z.boolean().optional(),
  top: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

// Response schemas
export const createResponseSchema = z.object({
  username: usernameSchema,
  content: contentSchema,
  attachment: attachmentSchema,
  noup: z.boolean().optional(),
});

export const updateResponseSchema = z.object({
  content: contentSchema.optional(),
  attachment: attachmentSchema,
  visible: z.boolean().optional(),
  deleted: z.boolean().optional(),
  password: z.string().max(256).optional(),
});

export const deleteResponseSchema = z.object({
  password: z.string().max(256).optional(),
});

// Notice schemas
export const createNoticeSchema = z.object({
  title: sanitizedTrimmedString.pipe(z.string().min(1).max(200)),
  content: contentSchema,
  pinned: z.boolean().optional(),
});

export const updateNoticeSchema = z.object({
  title: sanitizedTrimmedString.pipe(z.string().min(1).max(200)).optional(),
  content: contentSchema.optional(),
  pinned: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

// Type exports
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
export type ConfigBoardInput = z.infer<typeof configBoardSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type UpdateThreadInput = z.infer<typeof updateThreadSchema>;
export type CreateResponseInput = z.infer<typeof createResponseSchema>;
export type UpdateResponseInput = z.infer<typeof updateResponseSchema>;
export type DeleteResponseInput = z.infer<typeof deleteResponseSchema>;
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;

// Settings schemas
export const updateSettingsSchema = z.object({
  countryCode: z.string().length(2).toUpperCase().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
