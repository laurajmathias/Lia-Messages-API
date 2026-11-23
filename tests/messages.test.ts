import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";

const app = createApp();

const validMessage = {
  messageId: "wamid.HBgM123",
  storeId: "loja-42",
  phone: "5511999998888",
  text: "vocês têm tênis preto tamanho 42?",
  timestamp: "2026-11-05T14:32:10Z",
};

async function seed(
  overrides: Partial<{
    messageId: string;
    storeId: string;
    phone: string;
    text: string;
    timestamp: Date;
  }> = {},
) {
  return prisma.message.create({
    data: { ...validMessage, timestamp: new Date(validMessage.timestamp), ...overrides },
  });
}

beforeAll(() => {
  // Trava de segurança: nunca apagar dados fora do banco de teste.
  if (!process.env.DATABASE_URL?.includes("lia_messages_test")) {
    throw new Error("Os testes só podem rodar no banco lia_messages_test.");
  }
});

beforeEach(async () => {
  await prisma.message.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
}); 

describe("rotas gerais", () => {
  it("GET /health responde 200", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("rota inexistente responde 404 NOT_FOUND", async () => {
    const res = await request(app).get("/rota-que-nao-existe");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("POST /messages", () => {
  it("cria uma mensagem e responde 201", async () => {
    const res = await request(app).post("/messages").send(validMessage);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      messageId: "wamid.HBgM123",
      text: "vocês têm tênis preto tamanho 42?",
      timestamp: "2026-11-05T14:32:10.000Z",
    });
  });

  it("responde 409 quando o messageId já existe", async () => {
    await seed();

    const res = await request(app).post("/messages").send(validMessage);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("MESSAGE_ALREADY_EXISTS");
  });

  it("responde 400 listando os campos inválidos", async () => {
    const res = await request(app)
      .post("/messages")
      .send({ messageId: "", phone: "abc", text: "oi" });

    const campos = res.body.error.details.map((d: { field: string }) => d.field);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(campos).toEqual(expect.arrayContaining(["messageId", "storeId", "phone", "timestamp"]));
  });

  it("responde 400 INVALID_JSON quando o corpo não é um JSON válido", async () => {
    const res = await request(app)
      .post("/messages")
      .set("Content-Type", "application/json")
      .send("{quebrado");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_JSON");
  });
});

describe("GET /messages/:messageId", () => {
  it("retorna a mensagem pedida", async () => {
    await seed();

    const res = await request(app).get("/messages/wamid.HBgM123");

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("vocês têm tênis preto tamanho 42?");
  });

  it("responde 404 quando a mensagem não existe", async () => {
    const res = await request(app).get("/messages/naoexiste");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MESSAGE_NOT_FOUND");
  });
});

describe("GET /messages?phone=...", () => {
  it("lista só as mensagens do cliente, em ordem cronológica", async () => {
    // Criadas fora de ordem de propósito, para provar que a API ordena.
    await seed({ messageId: "m2", timestamp: new Date("2026-11-05T15:00:00Z") });
    await seed({ messageId: "m1", timestamp: new Date("2026-11-05T14:00:00Z") });
    await seed({ messageId: "m3", phone: "5521988887777" });

    const res = await request(app).get("/messages").query({ phone: "5511999998888" });

    const ids = res.body.data.map((m: { messageId: string }) => m.messageId);

    expect(res.status).toBe(200);
    expect(ids).toEqual(["m1", "m2"]);
    expect(res.body.pagination.total).toBe(2);
  });

  it("filtra por loja com storeId", async () => {
    await seed({ messageId: "m1", storeId: "loja-42" });
    await seed({ messageId: "m2", storeId: "loja-7" });

    const res = await request(app)
      .get("/messages")
      .query({ phone: "5511999998888", storeId: "loja-7" });

    const ids = res.body.data.map((m: { messageId: string }) => m.messageId);

    expect(ids).toEqual(["m2"]);
  });

  it("pagina com limit e offset", async () => {
    await seed({ messageId: "m1", timestamp: new Date("2026-11-05T14:00:00Z") });
    await seed({ messageId: "m2", timestamp: new Date("2026-11-05T15:00:00Z") });
    await seed({ messageId: "m3", timestamp: new Date("2026-11-05T16:00:00Z") });

    const res = await request(app)
      .get("/messages")
      .query({ phone: "5511999998888", limit: 1, offset: 1 });

    const ids = res.body.data.map((m: { messageId: string }) => m.messageId);

    expect(ids).toEqual(["m2"]);
    expect(res.body.pagination).toEqual({ limit: 1, offset: 1, total: 3 });
  });

  it("responde 400 quando falta o phone", async () => {
    const res = await request(app).get("/messages");

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("responde 400 quando o limit passa do máximo", async () => {
    const res = await request(app)
      .get("/messages")
      .query({ phone: "5511999998888", limit: 1000 });

    expect(res.status).toBe(400);
  });
});

describe("PATCH /messages/:messageId", () => {
  it("edita só o texto e preserva os outros campos", async () => {
    const original = await seed();

    const res = await request(app)
      .patch("/messages/wamid.HBgM123")
      .send({ text: "vocês têm tênis preto tamanho 42 em estoque?" });

    expect(res.status).toBe(200);
    expect(res.body.text).toBe("vocês têm tênis preto tamanho 42 em estoque?");
    expect(res.body.phone).toBe(original.phone);
    expect(res.body.createdAt).toBe(original.createdAt.toISOString());
    expect(new Date(res.body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      original.updatedAt.getTime(),
    );
  });

  it("responde 404 quando a mensagem não existe", async () => {
    const res = await request(app).patch("/messages/naoexiste").send({ text: "oi" });

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MESSAGE_NOT_FOUND");
  });

  it("recusa campos extras e não altera nada", async () => {
    await seed();

    const res = await request(app)
      .patch("/messages/wamid.HBgM123")
      .send({ text: "oi", phone: "5511000000000" });

    const noBanco = await prisma.message.findUnique({ where: { messageId: "wamid.HBgM123" } });

    expect(res.status).toBe(400);
    expect(noBanco?.text).toBe("vocês têm tênis preto tamanho 42?");
    expect(noBanco?.phone).toBe("5511999998888");
  });

  it("responde 400 quando o texto está vazio", async () => {
    await seed();

    const res = await request(app).patch("/messages/wamid.HBgM123").send({ text: "" });

    expect(res.status).toBe(400);
  });
});

describe("DELETE /messages/:messageId", () => {
  it("apaga a mensagem e responde 204 sem corpo", async () => {
    await seed();

    const res = await request(app).delete("/messages/wamid.HBgM123");
    const depois = await request(app).get("/messages/wamid.HBgM123");

    expect(res.status).toBe(204);
    expect(res.text).toBe("");
    expect(depois.status).toBe(404);
  });

  it("responde 404 quando a mensagem não existe", async () => {
    const res = await request(app).delete("/messages/naoexiste");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("MESSAGE_NOT_FOUND");
  });

  it("responde 404 ao apagar a mesma mensagem duas vezes", async () => {
    await seed();

    await request(app).delete("/messages/wamid.HBgM123");
    const segunda = await request(app).delete("/messages/wamid.HBgM123");

    expect(segunda.status).toBe(404);
  });
});

