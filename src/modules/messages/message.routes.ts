import { Router } from "express";
import {
  createMessageSchema,
  listMessagesQuerySchema,
  messageIdParamSchema,
} from "./message.schema.js";
import { createMessage, getMessage, listMessages } from "./message.service.js";

export const messagesRouter = Router();

messagesRouter.post("/", async (req, res) => {
  const input = createMessageSchema.parse(req.body);
  const message = await createMessage(input);
  res.status(201).json(message);
});

messagesRouter.get("/", async (req, res) => {
  const query = listMessagesQuerySchema.parse(req.query);
  res.json(await listMessages(query));
});

messagesRouter.get("/:messageId", async (req, res) => {
  const { messageId } = messageIdParamSchema.parse(req.params);
  res.json(await getMessage(messageId));
});
