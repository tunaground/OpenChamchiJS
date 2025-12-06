import { z } from "zod";

// Board schemas
export const createBoardSchema = z.object({
  id: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  defaultUsername: z.string().min(1).max(50).default("noname"),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultUsername: z.string().min(1).max(50).optional(),
  deleted: z.boolean().optional(),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
});

export const configBoardSchema = z.object({
  defaultUsername: z.string().min(1).max(50).optional(),
  maxResponsesPerThread: z.number().int().positive().optional(),
  blockForeignIp: z.boolean().optional(),
  responsesPerPage: z.number().int().positive().optional(),
  showUserCount: z.boolean().optional(),
  threadsPerPage: z.number().int().positive().optional(),
});

// Thread schemas
export const createThreadSchema = z.object({
  title: z.string().min(1).max(200),
  password: z.string().min(1).max(100),
  username: z.string().max(50).optional(),
});

export const updateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  ended: z.boolean().optional(),
  top: z.boolean().optional(),
  deleted: z.boolean().optional(),
});

// Response schemas
export const createResponseSchema = z.object({
  username: z.string().max(50).optional(),
  content: z.string().min(1),
  attachment: z.string().optional(),
});

export const updateResponseSchema = z.object({
  content: z.string().min(1).optional(),
  attachment: z.string().optional(),
  visible: z.boolean().optional(),
  deleted: z.boolean().optional(),
  password: z.string().optional(),
});

export const deleteResponseSchema = z.object({
  password: z.string().optional(),
});

// Notice schemas
export const createNoticeSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  pinned: z.boolean().optional(),
});

export const updateNoticeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).optional(),
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
