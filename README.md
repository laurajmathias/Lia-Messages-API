# Lia Messages API

API de mensagens para a Lia, assistente de vendas no WhatsApp.

## Sobre o projeto
_Em construção._

## Como instalar e rodar

Requisitos: Node.js 22+, npm e Docker (com Docker Compose).

    cp .env.example .env
    npm install
    npm run db:up
    npx prisma migrate deploy
    npm run dev

A API sobe em http://localhost:3000. Verifique com `curl http://localhost:3000/health`.

Para parar o banco: `npm run db:down`.

## Como usar
_Em construção._

## Banco de Dados

O MySQL 8.4 roda em um container Docker, definido no `docker-compose.yml`. Os dados ficam em um volume (`mysql_data`) e sobrevivem a um `npm run db:down`.

O banco fica exposto na porta **3307** (e não na 3306) para não conflitar com um MySQL já instalado na máquina. As credenciais de desenvolvimento estão em `.env.example`.

O schema é gerenciado pelo Prisma (`prisma/schema.prisma`) e as migrations ficam versionadas em `prisma/migrations`. A tabela `messages` guarda `messageId`, `storeId`, `phone`, `text` e `timestamp`, além de `createdAt` e `updatedAt`.

## Decisões

- **Express + TypeScript**: simples e conhecido; o foco do teste é a API.
- **MySQL em Docker Compose**: qualquer pessoa sobe o banco com um comando.
- **Prisma 7**: schema tipado e migrations versionadas no repositório.
- **`messageId` como chave primária**: o ID do WhatsApp é único, então reenvios do mesmo evento não geram duplicatas.
- **Índice em `(phone, timestamp)`**: consulta rápida das mensagens de um cliente em ordem cronológica.

## O que eu faria com mais tempo
_Em construção._
