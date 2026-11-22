import { Router } from "express";
import {
  createMessageSchema,
  listMessagesQuerySchema,
  messageIdParamSchema,
  updateMessageSchema,

} from "./message.schema.js";
import { createMessage, deleteMessage, getMessage, listMessages, updateMessage} from "./message.service.js";


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

messagesRouter.patch("/:messageId", async (req, res) => {
  const { messageId } = messageIdParamSchema.parse(req.params);
  const input = updateMessageSchema.parse(req.body);
  res.json(await updateMessage(messageId, input));
});

messagesRouter.delete("/:messageId", async (req, res) => {
  const { messageId } = messageIdParamSchema.parse(req.params);
  await deleteMessage(messageId);
  res.status(204).send();
});
