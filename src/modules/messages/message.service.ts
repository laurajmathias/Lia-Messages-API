import { AppError } from "../../errors/app-error.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateMessageInput } from "./message.schema.js";

export async function createMessage(input: CreateMessageInput) {
  try {
    return await prisma.message.create({ data: input });
  } catch (error) {
    // P2002 = violação de chave única: o messageId já existe.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(
        409,
        "MESSAGE_ALREADY_EXISTS",
        `Já existe uma mensagem com o messageId "${input.messageId}"`,
      );
    }
    throw error;
  }
}
