import { AppError } from "../../errors/app-error.js";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import type { CreateMessageInput, ListMessagesQuery } from "./message.schema.js";

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

export async function getMessage(messageId: string) {
  const message = await prisma.message.findUnique({ where: { messageId } });

  if (!message) {
    throw new AppError(404, "MESSAGE_NOT_FOUND", `Mensagem "${messageId}" não encontrada`);
  }

  return message;
}

export async function listMessages({ phone, storeId, limit, offset }: ListMessagesQuery) {
  // storeId undefined = o Prisma ignora o filtro.
  const where = { phone, storeId };

  const [data, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: [{ timestamp: "asc" }, { messageId: "asc" }],
      take: limit,
      skip: offset,
    }),
    prisma.message.count({ where }),
  ]);

  return { data, pagination: { limit, offset, total } };
}
