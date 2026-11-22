import { z } from "zod";

export const createMessageSchema = z.object({
  messageId: z.string().trim().min(1).max(128),
  storeId: z.string().trim().min(1).max(64),
  phone: z
    .string()
    .regex(/^\d{10,15}$/, "phone deve ter de 10 a 15 dígitos, apenas números, com DDI e DDD"),
  text: z.string().min(1).max(4096),
  timestamp: z.iso.datetime({ offset: true }).transform((value) => new Date(value)),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;
