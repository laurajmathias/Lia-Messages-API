import { z } from "zod";

const messageIdSchema = z.string().trim().min(1).max(128);
const storeIdSchema = z.string().trim().min(1).max(64);
const phoneSchema = z
  .string()
  .regex(/^\d{10,15}$/, "phone deve ter de 10 a 15 dígitos, apenas números, com DDI e DDD");

export const createMessageSchema = z.object({
  messageId: messageIdSchema,
  storeId: storeIdSchema,
  phone: phoneSchema,
  text: z.string().min(1).max(4096),
  timestamp: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});

export const messageIdParamSchema = z.object({
  messageId: messageIdSchema,
});

export const listMessagesQuerySchema = z.object({
  phone: phoneSchema,
  storeId: storeIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const updateMessageSchema = z.object({
  text: z.string().min(1).max(4096),
});


export type CreateMessageInput = z.infer<typeof createMessageSchema>;
export type ListMessagesQuery = z.infer<typeof listMessagesQuerySchema>;
export type UpdateMessageInput = z.infer<typeof updateMessageSchema>;
