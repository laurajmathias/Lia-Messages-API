import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/prisma/client.js";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL não definida. Copie .env.example para .env.");
}

// Lê host, usuário, senha e banco da própria DATABASE_URL,
// para ter uma única fonte de verdade para a conexão.
const url = new URL(databaseUrl);

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: Number(url.port || 3306),
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.slice(1),
  connectionLimit: 5,
  // Necessário para autenticar no MySQL 8 sem TLS. Aceitável em dev local;
  // em produção, usar TLS.
  allowPublicKeyRetrieval: true,
});

export const prisma = new PrismaClient({ adapter });
