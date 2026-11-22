import { Router } from "express";
import { createMessageSchema } from "./message.schema.js";
import { createMessage } from "./message.service.js";

export const messagesRouter = Router();

messagesRouter.post("/", async (req, res) => {
  const input = createMessageSchema.parse(req.body);
  const message = await createMessage(input);
  res.status(201).json(message);
});
